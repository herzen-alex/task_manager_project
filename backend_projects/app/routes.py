import os
import datetime
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from .models import db, Task, User, Contact

load_dotenv()


def create_app():
    app = Flask(__name__)

    # -----------------------------
    # CORS — разрешаем Angular
    CORS(app, resources={r"/*": {"origins": "*"}})

    # -----------------------------
    # PostgreSQL
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)

    with app.app_context():
        print("CREATING TABLES...")
        db.create_all()
        print("TABLES CREATED")

    # -----------------------------
    # Helpers

    def _get_user_id():
        """
        Учебный режим: берем пользователя из заголовка.
        На фронте ты ставишь X-User-Id после логина.
        """
        uid = request.headers.get("X-User-Id")
        if not uid:
            return None
        try:
            return int(uid)
        except ValueError:
            return None

    def _serialize_task(t: Task):
        return {
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "done": t.done,
            "priority": t.priority,
            "status": t.status,
            "createdAt": t.created_at.isoformat() if t.created_at else None,
            "dueDate": t.due_date.isoformat() if t.due_date else None,
            "subTasks": t.sub_tasks or [],
            "userId": t.user_id,
            "user": {
                "id": t.user.id,
                "name": t.user.name,
                "email": t.user.email,
            } if t.user else None,
            # many-to-many: список исполнителей
            "assignedContacts": [
                {
                    "id": c.id,
                    "name": c.name,
                    "email": c.email,
                    "avatarColor": c.avatar_color,
                }
                for c in (t.assignees or [])
            ],
        }

    def _serialize_contact(c: Contact):
        return {
            "id": c.id,
            "name": c.name,
            "email": c.email,
            "phone": c.phone,
            "company": c.company,
            "position": c.position,
            "avatarColor": c.avatar_color,
            "createdAt": c.created_at.isoformat() if c.created_at else None,
            "updatedAt": c.updated_at.isoformat() if c.updated_at else None,
            "userId": c.user_id,
            "user": {
                "id": c.user.id,
                "name": c.user.name,
                "email": c.user.email,
            } if c.user else None,
        }

    def _parse_due_date(value):
        if not value:
            return None
        try:
            return datetime.datetime.fromisoformat(value)
        except ValueError:
            if value.endswith("Z"):
                return (
                    datetime.datetime
                    .fromisoformat(value.replace("Z", "+00:00"))
                    .replace(tzinfo=None)
                )
            raise

    # -----------------------------
    # HEALTH CHECK (для CI / Docker)
    @app.route("/health", methods=["GET"])
    def health():
        return jsonify({"status": "ok"}), 200

    # -----------------------------
    # AUTH: REGISTER
    @app.route("/auth/register", methods=["POST"])
    def register():
        data = request.get_json() or {}

        name = (data.get("name") or "").strip()
        email = (data.get("email") or "").strip().lower()
        password = data.get("password") or ""

        if not name or not email or not password:
            return jsonify({"message": "Missing fields"}), 400

        if User.query.filter_by(email=email).first():
            return jsonify({"message": "Email already exists"}), 409

        user = User(
            name=name,
            email=email,
            password_hash=generate_password_hash(password),
        )

        db.session.add(user)
        db.session.commit()

        return jsonify({
            "id": user.id,
            "name": user.name,
            "email": user.email,
        }), 201

    # -----------------------------
    # AUTH: LOGIN
    @app.route("/auth/login", methods=["POST"])
    def login():
        data = request.get_json() or {}

        email = (data.get("email") or "").strip().lower()
        password = data.get("password") or ""

        if not email or not password:
            return jsonify({"message": "Missing fields"}), 400

        user = User.query.filter_by(email=email).first()
        if not user or not check_password_hash(user.password_hash, password):
            return jsonify({"message": "Invalid credentials"}), 401

        return jsonify({
            "id": user.id,
            "name": user.name,
            "email": user.email,
        }), 200

    # -----------------------------
    # TASKS: GET — все задачи (пока общая доска)
    @app.route("/tasks", methods=["GET"])
    def get_tasks():
        tasks = Task.query.order_by(Task.created_at.desc()).all()
        return jsonify([_serialize_task(t) for t in tasks]), 200

    # -----------------------------
    # TASKS: POST — создать задачу (нужен X-User-Id)
    @app.route("/tasks", methods=["POST"])
    def add_task():
        user_id = _get_user_id()
        if not user_id:
            return jsonify({"message": "Missing or invalid X-User-Id header"}), 401

        data = request.get_json() or {}

        title = (data.get("title") or "").strip()
        if not title:
            return jsonify({"message": "Missing title"}), 400

        task = Task(
            user_id=user_id,
            title=title,
            description=(data.get("description") or "").strip(),
            done=bool(data.get("done", False)),
            priority=data.get("priority", "low"),
            status=data.get("status", "todo"),
            due_date=_parse_due_date(data.get("dueDate")),
            sub_tasks=data.get("subTasks") or [],
        )

        db.session.add(task)
        db.session.flush()  # чтобы получить task.id до коммита

        # many-to-many: привязка исполнителей (без фильтра по user_id)
        contact_ids = data.get("assignedContactIds") or []
        if isinstance(contact_ids, list) and contact_ids:
            contacts = Contact.query.filter(
                Contact.id.in_(contact_ids)
            ).all()
            task.assignees = contacts

        db.session.commit()

        task = Task.query.get(task.id)
        return jsonify(_serialize_task(task)), 201

    # -----------------------------
    # TASKS: PUT — обновить задачу
    @app.route("/tasks/<int:task_id>", methods=["PUT"])
    def update_task(task_id):
        user_id = _get_user_id()
        if not user_id:
            return jsonify({"message": "Missing or invalid X-User-Id header"}), 401

        data = request.get_json() or {}
        task = Task.query.get_or_404(task_id)

        if "title" in data:
            title = (data["title"] or "").strip()
            if not title:
                return jsonify({"message": "Title cannot be empty"}), 400
            task.title = title

        if "description" in data:
            task.description = (data["description"] or "").strip()

        if "done" in data:
            task.done = bool(data["done"])

        if "priority" in data:
            task.priority = data["priority"] or "low"

        if "status" in data:
            task.status = data["status"] or "todo"

        if "dueDate" in data:
            task.due_date = _parse_due_date(data.get("dueDate"))

        if "subTasks" in data:
            task.sub_tasks = data.get("subTasks") or []

        # обновление исполнителей (без фильтра по user_id)
        if "assignedContactIds" in data:
            contact_ids = data.get("assignedContactIds") or []
            if contact_ids:
                contacts = Contact.query.filter(
                    Contact.id.in_(contact_ids)
                ).all()
                task.assignees = contacts
            else:
                task.assignees = []

        db.session.commit()

        task = Task.query.get(task.id)
        return jsonify(_serialize_task(task)), 200

    # -----------------------------
    # TASKS: DELETE — удалить задачу
    @app.route("/tasks/<int:task_id>", methods=["DELETE"])
    def delete_task(task_id):
        user_id = _get_user_id()
        if not user_id:
            return jsonify({"message": "Missing or invalid X-User-Id header"}), 401

        task = Task.query.get_or_404(task_id)
        db.session.delete(task)
        db.session.commit()

        return jsonify({"message": "Task deleted"}), 200

    # -----------------------------
    # CONTACTS: GET — список контактов
    @app.route("/contacts", methods=["GET"])
    def get_contacts():
        # пока без фильтра по пользователю, общая адресная книга
        contacts = Contact.query.order_by(Contact.name.asc()).all()
        return jsonify([_serialize_contact(c) for c in contacts]), 200

    # -----------------------------
    # CONTACTS: GET — один контакт по id
    @app.route("/contacts/<int:contact_id>", methods=["GET"])
    def get_contact(contact_id):
        contact = Contact.query.get_or_404(contact_id)
        return jsonify(_serialize_contact(contact)), 200

    # -----------------------------
    # CONTACTS: POST — создать контакт (нужен X-User-Id)
    @app.route("/contacts", methods=["POST"])
    def create_contact():
        user_id = _get_user_id()
        if not user_id:
            return jsonify({"message": "Missing or invalid X-User-Id header"}), 401

        data = request.get_json() or {}

        name = (data.get("name") or "").strip()
        email = (data.get("email") or "").strip()

        if not name or not email:
            return jsonify({"message": "Name and email are required"}), 400

        contact = Contact(
            user_id=user_id,
            name=name,
            email=email,
            phone=(data.get("phone") or "").strip() or None,
            company=(data.get("company") or "").strip() or None,
            position=(data.get("position") or "").strip() or None,
            avatar_color=data.get("avatarColor") or None,
        )

        db.session.add(contact)
        db.session.commit()

        contact = Contact.query.get(contact.id)
        return jsonify(_serialize_contact(contact)), 201

    # -----------------------------
    # CONTACTS: PUT — обновить контакт
    @app.route("/contacts/<int:contact_id>", methods=["PUT"])
    def update_contact(contact_id):
        user_id = _get_user_id()
        if not user_id:
            return jsonify({"message": "Missing or invalid X-User-Id header"}), 401

        contact = Contact.query.get_or_404(contact_id)
        data = request.get_json() or {}

        if "name" in data:
            new_name = (data.get("name") or "").strip()
            if not new_name:
                return jsonify({"message": "Name cannot be empty"}), 400
            contact.name = new_name

        if "email" in data:
            new_email = (data.get("email") or "").strip()
            if not new_email:
                return jsonify({"message": "Email cannot be empty"}), 400
            contact.email = new_email

        if "phone" in data:
            contact.phone = (data.get("phone") or "").strip() or None

        if "company" in data:
            contact.company = (data.get("company") or "").strip() or None

        if "position" in data:
            contact.position = (data.get("position") or "").strip() or None

        if "avatarColor" in data:
            contact.avatar_color = data.get("avatarColor") or None

        db.session.commit()

        contact = Contact.query.get(contact.id)
        return jsonify(_serialize_contact(contact)), 200

    # -----------------------------
    # CONTACTS: DELETE — удалить контакт
    @app.route("/contacts/<int:contact_id>", methods=["DELETE"])
    def delete_contact(contact_id):
        user_id = _get_user_id()
        if not user_id:
            return jsonify({"message": "Missing or invalid X-User-Id header"}), 401

        contact = Contact.query.get_or_404(contact_id)
        db.session.delete(contact)
        db.session.commit()

        return jsonify({"message": "Contact deleted"}), 200

    return app


