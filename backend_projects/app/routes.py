import os
import datetime
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from flask_cors import CORS
from .models import db, Task

load_dotenv()

def create_app():
    app = Flask(__name__)

    # 🔥 CORS — разрешаем Angular
    CORS(app, resources={r"/*": {"origins": "*"}})

    # PostgreSQL
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)

    with app.app_context():
        print("CREATING TABLES...")
        db.create_all()
        print("TABLES CREATED")

    # -----------------------------
    # GET все задачи
    @app.route("/tasks", methods=["GET"])
    def get_tasks():
        tasks = Task.query.all()
        return jsonify([{
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "done": t.done,
            "priority": t.priority,
            "status": t.status,  # добавляем статус
            "createdAt": t.created_at.isoformat(),
            "dueDate": t.due_date.isoformat() if t.due_date else None,
            "subTasks": t.sub_tasks or []
        } for t in tasks])

    # -----------------------------
    # POST новая задача
    @app.route("/tasks", methods=["POST"])
    def add_task():
        data = request.get_json()
        task = Task(
            title=data["title"],
            description=data.get("description", ""),
            done=data.get("done", False),
            priority=data.get("priority", "low"),
            status=data.get("status", "todo"),  # новое поле
            due_date=datetime.datetime.fromisoformat(data["dueDate"]) if data.get("dueDate") else None,
            sub_tasks=data.get("subTasks", [])
        )
        db.session.add(task)
        db.session.commit()
        return jsonify({"message": "Task created", "id": task.id}), 201

    # -----------------------------
    # PUT обновление задачи
    @app.route("/tasks/<int:task_id>", methods=["PUT"])
    def update_task(task_id):
        data = request.get_json()
        task = Task.query.get_or_404(task_id)

        if "title" in data:
            task.title = data["title"]
        if "description" in data:
            task.description = data["description"]
        if "done" in data:
            task.done = data["done"]
        if "priority" in data:
            task.priority = data["priority"]
        if "status" in data:
            task.status = data["status"]  # обновляем статус
        if "dueDate" in data:
            task.due_date = datetime.datetime.fromisoformat(data["dueDate"]) if data["dueDate"] else None
        if "subTasks" in data:
            task.sub_tasks = data["subTasks"]

        db.session.commit()
        return jsonify({"message": "Task updated"})

    # -----------------------------
    # DELETE задача
    @app.route("/tasks/<int:task_id>", methods=["DELETE"])
    def delete_task(task_id):
        task = Task.query.get_or_404(task_id)
        db.session.delete(task)
        db.session.commit()
        return jsonify({"message": "Task deleted"})

    return app

