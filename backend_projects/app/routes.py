import os
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from flask_cors import CORS
from .models import db, Task

load_dotenv()

def create_app():
    app = Flask(__name__)

    # 🔥 Включаем CORS
    CORS(app)

    # Подключаем PostgreSQL
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)

    with app.app_context():
        print("CREATING TABLES...")
        db.create_all()
        print("TABLES CREATED")

    @app.route("/tasks", methods=["GET"])
    def get_tasks():
        tasks = Task.query.all()
        return jsonify([
            {
                "id": t.id,
                "title": t.title,
                "description": t.description,
                "done": t.done
            } for t in tasks
        ])

    @app.route("/tasks", methods=["POST"])
    def add_task():
        data = request.get_json()
        task = Task(
            title=data["title"],
            description=data.get("description", "")
        )
        db.session.add(task)
        db.session.commit()
        return jsonify({"message": "Task created"}), 201
    

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

        db.session.commit()
        return jsonify({"message": "Task updated"})
    
    @app.route("/tasks/<int:task_id>", methods=["DELETE"])
    def delete_task(task_id):
     task = Task.query.get_or_404(task_id)

     db.session.delete(task)
     db.session.commit()

     return jsonify({"message": "Task deleted"})



    return app
