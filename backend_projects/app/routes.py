import os
import datetime
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from .models import db, Task, User

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
    # GET: все задачи (пока общая доска)
    @app.route("/tasks", methods=["GET"])
    def get_tasks():
        tasks = Task.query.order_by(Task.created_at.desc()).all()
        return jsonify([_serialize_task(t) for t in tasks]), 200

    # -----------------------------
    # POST: создать задачу (нужен X-User-Id)
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
        db.session.commit()

        task = Task.query.get(task.id)
        return jsonify(_serialize_task(task)), 201

    # -----------------------------
    # PUT: обновить задачу
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

        db.session.commit()

        task = Task.query.get(task.id)
        return jsonify(_serialize_task(task)), 200

    # -----------------------------
    # DELETE: удалить задачу
    @app.route("/tasks/<int:task_id>", methods=["DELETE"])
    def delete_task(task_id):
        user_id = _get_user_id()
        if not user_id:
            return jsonify({"message": "Missing or invalid X-User-Id header"}), 401

        task = Task.query.get_or_404(task_id)
        db.session.delete(task)
        db.session.commit()

        return jsonify({"message": "Task deleted"}), 200

    return app
