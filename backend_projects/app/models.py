from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.dialects.postgresql import JSON
import datetime

db = SQLAlchemy()

# 🔗 Ассоциативная таблица many-to-many: Task <-> Contact
task_assignee = db.Table(
    "task_assignee",
    db.Column(
        "task_id",
        db.Integer,
        db.ForeignKey("public.task.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    db.Column(
        "contact_id",
        db.Integer,
        db.ForeignKey("public.contact.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    schema="public",
)


class User(db.Model):
    __tablename__ = "users"
    __table_args__ = {"schema": "public"}

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, nullable=False)

    tasks = db.relationship("Task", back_populates="user", cascade="all, delete-orphan")
    contacts = db.relationship("Contact", back_populates="user", cascade="all, delete-orphan")
    notes = db.relationship("Note", back_populates="user", cascade="all, delete-orphan")


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

    # JSON с подзадачами
    sub_tasks = db.Column(JSON, default=list, nullable=False)

    # 🔗 Many-to-many: Task.assignees -> список Contact
    assignees = db.relationship(
        "Contact",
        secondary=task_assignee,
        back_populates="tasks",
        lazy="joined",  # можно убрать, если не нужен eager-load
    )


class Contact(db.Model):
    __tablename__ = "contact"
    __table_args__ = {"schema": "public"}

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(db.Integer, db.ForeignKey("public.users.id"), nullable=False, index=True)
    user = db.relationship("User", back_populates="contacts")

    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(50), nullable=True)

    company = db.Column(db.String(255), nullable=True)
    position = db.Column(db.String(255), nullable=True)

    avatar_color = db.Column(db.String(50), nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow,
        nullable=False,
    )

    # 🔗 Many-to-many: Contact.tasks -> список Task
    tasks = db.relationship(
        "Task",
        secondary=task_assignee,
        back_populates="assignees",
    )

class Note(db.Model):
    __tablename__ = "note"
    __table_args__ = {"schema": "public"}

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("public.users.id"),
        nullable=False,
        index=True,
    )
    user = db.relationship("User", back_populates="notes")

    title = db.Column(db.String(200), nullable=False, default="")
    content = db.Column(db.Text, nullable=False, default="")

    created_at = db.Column(
        db.DateTime,
        default=datetime.datetime.utcnow,
        nullable=False,
    )
    updated_at = db.Column(
        db.DateTime,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow,
        nullable=False,
    )

