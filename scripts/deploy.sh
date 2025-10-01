#!/bin/bash

# CRM Production Deployment Script
# Использование: ./scripts/deploy.sh [environment]

set -e  # Выход при любой ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функции для вывода
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Проверка аргументов
ENVIRONMENT=${1:-production}
if [[ "$ENVIRONMENT" != "production" && "$ENVIRONMENT" != "staging" ]]; then
    log_error "Неподдерживаемое окружение: $ENVIRONMENT"
    log_info "Использование: $0 [production|staging]"
    exit 1
fi

log_info "🚀 Начинаем деплой в окружение: $ENVIRONMENT"

# Проверка наличия необходимых файлов
check_requirements() {
    log_info "📋 Проверка требований..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker не установлен"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose не установлен"
        exit 1
    fi
    
    if [[ ! -f ".env.$ENVIRONMENT" ]]; then
        log_error "Файл .env.$ENVIRONMENT не найден"
        exit 1
    fi
    
    log_success "Все требования выполнены"
}

# Создание бэкапа базы данных
backup_database() {
    log_info "💾 Создание бэкапа базы данных..."
    
    BACKUP_DIR="./backups"
    mkdir -p "$BACKUP_DIR"
    
    BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"
    
    if docker-compose -f docker-compose.prod.yml ps postgres | grep -q "Up"; then
        docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U crm_user dir_crm_prod > "$BACKUP_FILE"
        log_success "Бэкап создан: $BACKUP_FILE"
    else
        log_warning "База данных не запущена, пропускаем бэкап"
    fi
}

# Остановка сервисов
stop_services() {
    log_info "🛑 Остановка сервисов..."
    
    # Останавливаем через docker-compose
    docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
    docker compose -f docker-compose.prod.yml down 2>/dev/null || true
    
    # Принудительная остановка контейнеров
    log_info "🛑 Принудительная остановка CRM контейнеров..."
    docker stop crm-nginx crm-backend crm-frontend crm-redis 2>/dev/null || true
    docker rm crm-nginx crm-backend crm-frontend crm-redis 2>/dev/null || true
    
    # Очистка контейнеров
    log_info "🧹 Очистка старых контейнеров..."
    docker container prune -f
    docker network prune -f
    
    # Проверка и освобождение портов
    log_info "🔍 Проверка портов 80 и 443..."
    if command -v lsof &> /dev/null; then
        if lsof -Pi :80 -sTCP:LISTEN -t >/dev/null 2>&1; then
            log_warning "Порт 80 занят, освобождаем..."
            fuser -k 80/tcp 2>/dev/null || true
        fi
        if lsof -Pi :443 -sTCP:LISTEN -t >/dev/null 2>&1; then
            log_warning "Порт 443 занят, освобождаем..."
            fuser -k 443/tcp 2>/dev/null || true
        fi
    fi
    
    log_success "Сервисы остановлены и порты освобождены"
}

# Сборка образов
build_images() {
    log_info "🔨 Сборка Docker образов..."
    
    # Сборка backend
    log_info "Сборка backend..."
    docker build -t crm-backend:latest ./backend
    
    # Сборка frontend
    log_info "Сборка frontend..."
    docker build -t crm-frontend:latest ./frontend
    
    log_success "Образы собраны"
}

# Запуск миграций базы данных
run_migrations() {
    log_info "🗄️ Запуск миграций базы данных..."
    
    # Запускаем только базу данных
    docker-compose -f docker-compose.prod.yml up -d postgres redis
    
    # Ждем готовности базы данных
    log_info "Ожидание готовности базы данных..."
    sleep 10
    
    # Запускаем миграции
    docker-compose -f docker-compose.prod.yml run --rm backend npm run migrate:deploy
    
    log_success "Миграции выполнены"
}

# Запуск сервисов
start_services() {
    log_info "▶️ Запуск сервисов..."
    
    # Копируем переменные окружения
    cp ".env.$ENVIRONMENT" .env
    
    # Запускаем все сервисы
    docker-compose -f docker-compose.prod.yml up -d
    
    log_success "Сервисы запущены"
}

# Проверка здоровья сервисов
health_check() {
    log_info "🏥 Проверка здоровья сервисов..."
    
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        log_info "Попытка $attempt/$max_attempts..."
        
        # Проверка backend
        if curl -f -s http://localhost:3002/api/health > /dev/null; then
            log_success "Backend готов"
            break
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            log_error "Backend не отвечает после $max_attempts попыток"
            exit 1
        fi
        
        sleep 10
        ((attempt++))
    done
    
    # Проверка frontend
    attempt=1
    while [[ $attempt -le $max_attempts ]]; do
        log_info "Проверка frontend, попытка $attempt/$max_attempts..."
        
        if curl -f -s http://localhost:3000 > /dev/null; then
            log_success "Frontend готов"
            break
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            log_error "Frontend не отвечает после $max_attempts попыток"
            exit 1
        fi
        
        sleep 10
        ((attempt++))
    done
    
    log_success "Все сервисы работают корректно"
}

# Настройка автозапуска после перезагрузки сервера
setup_autostart() {
    log_info "🔄 Настройка автозапуска после перезагрузки сервера..."
    
    # Проверка наличия systemd сервиса
    if [[ ! -f /etc/systemd/system/crm-system.service ]]; then
        log_info "📋 Создание systemd сервиса для автозапуска..."
        
        # Включаем Docker autostart
        sudo systemctl enable docker 2>/dev/null || true
        
        # Создаём systemd сервис для CRM
        sudo bash -c 'cat > /etc/systemd/system/crm-system.service' << 'EOFSERVICE'
[Unit]
Description=CRM System (Docker Compose)
Requires=docker.service
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/crm-system
ExecStartPre=/bin/sleep 10
ExecStart=/usr/bin/docker compose -f docker-compose.prod.yml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.prod.yml down
TimeoutStartSec=300
Restart=on-failure
RestartSec=10s

[Install]
WantedBy=multi-user.target
EOFSERVICE
        
        # Включаем автозапуск
        sudo systemctl daemon-reload
        sudo systemctl enable crm-system.service
        log_success "Autostart configured! CRM will start automatically after server reboot"
    else
        log_info "✅ Autostart already configured"
    fi
}

# Очистка старых образов
cleanup() {
    log_info "🧹 Очистка старых образов..."
    
    # Удаляем неиспользуемые образы
    docker image prune -f
    
    # Удаляем старые бэкапы (старше 7 дней)
    find ./backups -name "backup_*.sql" -mtime +7 -delete 2>/dev/null || true
    
    log_success "Очистка завершена"
}

# Отправка уведомления (опционально)
send_notification() {
    log_info "📢 Отправка уведомления о деплое..."
    
    # Здесь можно добавить отправку в Slack, Telegram и т.д.
    # Пример для Slack:
    # if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
    #     curl -X POST -H 'Content-type: application/json' \
    #         --data '{"text":"🚀 CRM деплой в '"$ENVIRONMENT"' завершен успешно!"}' \
    #         "$SLACK_WEBHOOK_URL"
    # fi
    
    log_success "Уведомление отправлено"
}

# Основная функция деплоя
main() {
    log_info "🎯 Начинаем деплой CRM в окружение: $ENVIRONMENT"
    
    check_requirements
    backup_database
    stop_services
    build_images
    run_migrations
    start_services
    health_check
    setup_autostart
    cleanup
    send_notification
    
    log_success "🎉 Деплой завершен успешно!"
    log_info "📊 Статус сервисов:"
    docker-compose -f docker-compose.prod.yml ps
}

# Обработка сигналов
trap 'log_error "Деплой прерван"; exit 1' INT TERM

# Запуск основной функции
main "$@"
