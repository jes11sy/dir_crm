# Multi-stage build для оптимизации размера образа
FROM node:18-alpine AS base

# Установка зависимостей для сборки
RUN apk add --no-cache libc6-compat

# Создание рабочей директории
WORKDIR /app

# Копирование файлов зависимостей
COPY package*.json ./
COPY prisma ./prisma/

# Установка всех зависимостей (включая dev для сборки)
RUN npm ci && npm cache clean --force

# Генерация Prisma клиента
RUN npx prisma generate

# Production stage
FROM node:18-alpine AS production

# Создание пользователя для безопасности
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 crm

# Установка рабочей директории
WORKDIR /app

# Копирование зависимостей из base stage
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package*.json ./

# Копирование исходного кода
COPY --chown=crm:nodejs . .

# Компиляция TypeScript
RUN npm run build

# Удаление dev зависимостей после сборки
RUN npm prune --production

# Создание директорий для логов и uploads
RUN mkdir -p /var/log/crm /app/uploads && \
    chown -R crm:nodejs /var/log/crm /app/uploads

# Переключение на пользователя crm
USER crm

# Открытие порта
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3002/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Запуск приложения
CMD ["npm", "start"]
