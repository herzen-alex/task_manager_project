FROM node:20-alpine

WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Устанавливаем Angular CLI глобально
RUN npm install -g @angular/cli

# Монтируем код через volume для live reload
EXPOSE 4200

# Запуск через ng serve
CMD ["ng", "serve", "--host", "0.0.0.0", "--poll=2000"]


