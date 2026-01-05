from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.dialects.postgresql import JSON
import datetime

db = SQLAlchemy()

class Task(db.Model):
    __tablename__ = "task"
    __table_args__ = {"schema": "public"}

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(255))
    done = db.Column(db.Boolean, default=False)
    priority = db.Column(db.String(10), default="low")
    status = db.Column(db.String(20), default="todo")  # новое поле: todo, in-progress, done
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    due_date = db.Column(db.DateTime, nullable=True)
    sub_tasks = db.Column(JSON, default=[])




