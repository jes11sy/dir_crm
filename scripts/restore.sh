#!/bin/bash

# CRM Database Restore Script
# Использование: ./scripts/restore.sh <backup_file> [database_name]

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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
if [[ $# -lt 1 ]]; then
    log_error "Использование: $0 <backup_file> [database_name]"
    log_info "Пример: $0 ./backups/dir_crm_prod_backup_20241201_120000.sql.gz"
    exit 1
fi

BACKUP_FILE=$1
DB_NAME=${2:-dir_crm_prod}

# Проверка существования файла бэкапа
if [[ ! -f "$BACKUP_FILE" ]]; then
    log_error "Файл бэкапа не найден: $BACKUP_FILE"
    exit 1
fi

log_warning "⚠️  ВНИМАНИЕ: Восстановление базы данных удалит все текущие данные!"
log_warning "База данных: $DB_NAME"
log_warning "Файл бэкапа: $BACKUP_FILE"
echo
read -p "Вы уверены, что хотите продолжить? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    log_info "Восстановление отменено"
    exit 0
fi

# Проверка, запущен ли контейнер с PostgreSQL
if ! docker-compose -f docker-compose.prod.yml ps postgres | grep -q "Up"; then
    log_error "Контейнер PostgreSQL не запущен"
    log_info "Запустите: docker-compose -f docker-compose.prod.yml up -d postgres"
    exit 1
fi

# Остановка backend для предотвращения подключений к БД
log_info "🛑 Остановка backend сервиса..."
docker-compose -f docker-compose.prod.yml stop backend || true

# Создание бэкапа текущей БД перед восстановлением
log_info "💾 Создание бэкапа текущей БД перед восстановлением..."
CURRENT_BACKUP="./backups/${DB_NAME}_before_restore_$(date +%Y%m%d_%H%M%S).sql"
docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U crm_user "$DB_NAME" > "$CURRENT_BACKUP" || true
gzip "$CURRENT_BACKUP" || true
log_success "Текущая БД сохранена в: ${CURRENT_BACKUP}.gz"

# Завершение активных подключений к БД
log_info "🔌 Завершение активных подключений к БД..."
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U crm_user -d postgres -c "
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();"

# Удаление и пересоздание базы данных
log_info "🗑️ Пересоздание базы данных..."
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U crm_user -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U crm_user -d postgres -c "CREATE DATABASE $DB_NAME;"

# Восстановление из бэкапа
log_info "📥 Восстановление из бэкапа..."

if [[ "$BACKUP_FILE" == *.gz ]]; then
    # Если файл сжат
    gunzip -c "$BACKUP_FILE" | docker-compose -f docker-compose.prod.yml exec -T postgres psql -U crm_user -d "$DB_NAME"
else
    # Если файл не сжат
    docker-compose -f docker-compose.prod.yml exec -T postgres psql -U crm_user -d "$DB_NAME" < "$BACKUP_FILE"
fi

# Запуск миграций Prisma для обновления схемы
log_info "🔄 Применение миграций Prisma..."
docker-compose -f docker-compose.prod.yml run --rm backend npx prisma migrate deploy

# Перезапуск backend сервиса
log_info "▶️ Запуск backend сервиса..."
docker-compose -f docker-compose.prod.yml up -d backend

# Проверка здоровья
log_info "🏥 Проверка здоровья сервиса..."
sleep 10

if curl -f -s http://localhost:3002/api/health > /dev/null; then
    log_success "✅ Восстановление завершено успешно!"
    log_success "Backend сервис работает корректно"
else
    log_error "❌ Backend сервис не отвечает"
    log_info "Проверьте логи: docker-compose -f docker-compose.prod.yml logs backend"
    exit 1
fi

log_info "📊 Информация о восстановлении:"
log_info "  - База данных: $DB_NAME"
log_info "  - Файл бэкапа: $BACKUP_FILE"
log_info "  - Бэкап текущей БД: ${CURRENT_BACKUP}.gz"
log_info "  - Время восстановления: $(date)"
