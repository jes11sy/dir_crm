# CRM Project Makefile

.PHONY: help install build start stop restart logs clean deploy backup restore test

# Цвета для вывода
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
NC := \033[0m

help: ## Показать справку
	@echo "$(BLUE)CRM Project Commands:$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

# Development commands
install: ## Установить зависимости для всех проектов
	@echo "$(BLUE)Установка зависимостей...$(NC)"
	cd backend && npm install
	cd frontend && npm install

dev-backend: ## Запустить backend в режиме разработки
	@echo "$(BLUE)Запуск backend в dev режиме...$(NC)"
	cd backend && npm run dev

dev-frontend: ## Запустить frontend в режиме разработки
	@echo "$(BLUE)Запуск frontend в dev режиме...$(NC)"
	cd frontend && npm run dev

dev: ## Запустить оба сервиса в режиме разработки
	@echo "$(BLUE)Запуск в dev режиме...$(NC)"
	make -j2 dev-backend dev-frontend

# Docker commands
build: ## Собрать Docker образы
	@echo "$(BLUE)Сборка Docker образов...$(NC)"
	docker build -t crm-backend:latest ./backend
	docker build -t crm-frontend:latest ./frontend

start: ## Запустить production окружение
	@echo "$(BLUE)Запуск production окружения...$(NC)"
	docker-compose -f docker-compose.prod.yml up -d

stop: ## Остановить все сервисы
	@echo "$(BLUE)Остановка сервисов...$(NC)"
	docker-compose -f docker-compose.prod.yml down

restart: ## Перезапустить все сервисы
	@echo "$(BLUE)Перезапуск сервисов...$(NC)"
	make stop
	make start

logs: ## Показать логи всех сервисов
	docker-compose -f docker-compose.prod.yml logs -f

logs-backend: ## Показать логи backend
	docker-compose -f docker-compose.prod.yml logs -f backend

logs-frontend: ## Показать логи frontend
	docker-compose -f docker-compose.prod.yml logs -f frontend

logs-nginx: ## Показать логи nginx
	docker-compose -f docker-compose.prod.yml logs -f nginx

# Database commands
migrate: ## Запустить миграции базы данных
	@echo "$(BLUE)Запуск миграций...$(NC)"
	docker-compose -f docker-compose.prod.yml run --rm backend npm run migrate:deploy

migrate-dev: ## Запустить миграции в dev режиме
	@echo "$(BLUE)Запуск dev миграций...$(NC)"
	cd backend && npm run migrate:dev

seed: ## Заполнить базу данных тестовыми данными
	@echo "$(BLUE)Заполнение БД тестовыми данными...$(NC)"
	docker-compose -f docker-compose.prod.yml run --rm backend npm run seed

# Backup and restore
backup: ## Создать бэкап базы данных
	@echo "$(BLUE)Создание бэкапа...$(NC)"
	chmod +x scripts/backup.sh
	./scripts/backup.sh

restore: ## Восстановить базу данных из бэкапа
	@echo "$(YELLOW)Использование: make restore BACKUP=path/to/backup.sql.gz$(NC)"
	@if [ -z "$(BACKUP)" ]; then \
		echo "$(YELLOW)Укажите файл бэкапа: make restore BACKUP=./backups/backup.sql.gz$(NC)"; \
		exit 1; \
	fi
	chmod +x scripts/restore.sh
	./scripts/restore.sh $(BACKUP)

# Deployment
deploy: ## Деплой в production
	@echo "$(BLUE)Деплой в production...$(NC)"
	chmod +x scripts/deploy.sh
	./scripts/deploy.sh production

deploy-staging: ## Деплой в staging
	@echo "$(BLUE)Деплой в staging...$(NC)"
	chmod +x scripts/deploy.sh
	./scripts/deploy.sh staging

# Testing
test: ## Запустить тесты
	@echo "$(BLUE)Запуск тестов...$(NC)"
	cd backend && npm test
	cd frontend && npm test

test-backend: ## Запустить тесты backend
	cd backend && npm test

test-frontend: ## Запустить тесты frontend
	cd frontend && npm test

# Maintenance
clean: ## Очистить Docker ресурсы
	@echo "$(BLUE)Очистка Docker ресурсов...$(NC)"
	docker system prune -f
	docker volume prune -f
	docker image prune -f

clean-all: ## Полная очистка Docker (ОСТОРОЖНО!)
	@echo "$(YELLOW)ВНИМАНИЕ: Это удалит ВСЕ Docker данные!$(NC)"
	@read -p "Продолжить? (y/N): " confirm && [ "$$confirm" = "y" ]
	docker system prune -a -f --volumes

status: ## Показать статус всех сервисов
	@echo "$(BLUE)Статус сервисов:$(NC)"
	docker-compose -f docker-compose.prod.yml ps

health: ## Проверить здоровье сервисов
	@echo "$(BLUE)Проверка здоровья сервисов...$(NC)"
	@echo "Backend Health:"
	@curl -s http://localhost:3002/api/health || echo "Backend недоступен"
	@echo ""
	@echo "Frontend Health:"
	@curl -s http://localhost:3000 > /dev/null && echo "Frontend работает" || echo "Frontend недоступен"

# SSL
ssl-cert: ## Создать самоподписанный SSL сертификат для разработки
	@echo "$(BLUE)Создание SSL сертификата...$(NC)"
	mkdir -p nginx/ssl
	openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
		-keyout nginx/ssl/private.key \
		-out nginx/ssl/cert.pem \
		-subj "/C=RU/ST=Moscow/L=Moscow/O=CRM/CN=localhost"

# Environment setup
setup-env: ## Настроить файлы окружения
	@echo "$(BLUE)Настройка окружения...$(NC)"
	@if [ ! -f .env.production ]; then \
		cp backend/env.production.example .env.production; \
		echo "$(GREEN)Создан .env.production из шаблона$(NC)"; \
		echo "$(YELLOW)Не забудьте отредактировать переменные окружения!$(NC)"; \
	fi
	@if [ ! -f .env.staging ]; then \
		cp backend/env.production.example .env.staging; \
		echo "$(GREEN)Создан .env.staging из шаблона$(NC)"; \
	fi

# Quick start
quick-start: setup-env ssl-cert build start ## Быстрый старт (настройка + сборка + запуск)
	@echo "$(GREEN)🎉 CRM запущен!$(NC)"
	@echo "$(BLUE)Frontend: http://localhost:3000$(NC)"
	@echo "$(BLUE)Backend API: http://localhost:3002$(NC)"
	@echo "$(YELLOW)Не забудьте настроить переменные окружения в .env.production$(NC)"
