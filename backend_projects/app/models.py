from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.dialects.postgresql import JSON
import datetime

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = "users"
    __table_args__ = {"schema": "public"}

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, nullable=False)

    tasks = db.relationship("Task", back_populates="user", cascade="all, delete-orphan")


class Task(db.Model):
    __tablename__ = "task"
    __table_args__ = {"schema": "public"}

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(db.Integer, db.ForeignKey("public.users.id"), nullable=False, index=True)
    user = db.relationship("User", back_populates="tasks")

    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(255))
    done = db.Column(db.Boolean, default=False, nullable=False)
    priority = db.Column(db.String(10), default="low", nullable=False)
    status = db.Column(db.String(20), default="todo", nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, nullable=False)
    due_date = db.Column(db.DateTime, nullable=True)

    # ВАЖНО: default=list, а не []
    sub_tasks = db.Column(JSON, default=list, nullable=False)





