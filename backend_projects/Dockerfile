
FROM python:3.11-slim

WORKDIR /app

# Системные зависимости
RUN apt-get update && apt-get install -y \
    libpq-dev gcc netcat-openbsd && \
    rm -rf /var/lib/apt/lists/*

# Копируем только requirements, обновляем pip/ setuptools один раз при сборке
COPY requirements.txt .
RUN pip install --upgrade pip setuptools wheel \
    && pip install --no-cache-dir -r requirements.txt

# Код будет монтироваться через volume, поэтому его копирование не нужно
ENV FLASK_APP=run.py
ENV FLASK_ENV=development

EXPOSE 5000
