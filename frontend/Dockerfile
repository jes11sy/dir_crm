# Multi-stage build для Next.js
FROM node:18-alpine AS base

# Установка зависимостей для сборки
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Копирование файлов зависимостей
COPY package*.json ./
RUN npm ci && npm cache clean --force

# Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Build args для Next.js
ARG NEXT_PUBLIC_API_URL=https://api.lead-schem.ru
ARG NEXT_PUBLIC_APP_URL=https://lead-schem.ru
ARG NEXT_PUBLIC_ENVIRONMENT=production
ARG NEXT_PUBLIC_ENABLE_ANALYTICS=true
ARG NEXT_PUBLIC_ENABLE_ERROR_REPORTING=true

# Устанавливаем как ENV чтобы Next.js их подхватил
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_ENVIRONMENT=$NEXT_PUBLIC_ENVIRONMENT
ENV NEXT_PUBLIC_ENABLE_ANALYTICS=$NEXT_PUBLIC_ENABLE_ANALYTICS
ENV NEXT_PUBLIC_ENABLE_ERROR_REPORTING=$NEXT_PUBLIC_ENABLE_ERROR_REPORTING

# Копирование зависимостей
COPY --from=base /app/node_modules ./node_modules
COPY . .

# Отключение телеметрии Next.js
ENV NEXT_TELEMETRY_DISABLED=1

# Сборка приложения
RUN npm run build

# Удаление dev зависимостей после сборки
RUN npm prune --production

# Production stage
FROM node:18-alpine AS production

# Установка wget и curl для health checks
RUN apk add --no-cache wget curl

# Создание пользователя для безопасности
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

WORKDIR /app

# Отключение телеметрии Next.js
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Копирование необходимых файлов
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Переключение на пользователя nextjs
USER nextjs

# Открытие порта
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Запуск приложения
CMD ["node", "server.js"]
