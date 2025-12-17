from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()  # обязательно создаём объект db перед моделями

class Task(db.Model):
    __tablename__ = "task"
    __table_args__ = {"schema": "public"}  # явно указываем схему

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(255))
    done = db.Column(db.Boolean, default=False)


