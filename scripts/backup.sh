#!/bin/bash

# CRM Database Backup Script
# Использование: ./scripts/backup.sh [database_name]

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

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Параметры
DB_NAME=${1:-dir_crm_prod}
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_backup_$DATE.sql"

# Создание директории для бэкапов
mkdir -p "$BACKUP_DIR"

log_info "💾 Создание бэкапа базы данных: $DB_NAME"

# Проверка, запущен ли контейнер с PostgreSQL
if ! docker-compose -f docker-compose.prod.yml ps postgres | grep -q "Up"; then
    log_error "Контейнер PostgreSQL не запущен"
    exit 1
fi

# Создание бэкапа
log_info "Создание бэкапа в файл: $BACKUP_FILE"
docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U crm_user "$DB_NAME" > "$BACKUP_FILE"

# Сжатие бэкапа
log_info "Сжатие бэкапа..."
gzip "$BACKUP_FILE"
COMPRESSED_FILE="${BACKUP_FILE}.gz"

# Проверка размера файла
FILE_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
log_success "Бэкап создан: $COMPRESSED_FILE (размер: $FILE_SIZE)"

# Очистка старых бэкапов (старше 30 дней)
log_info "Очистка старых бэкапов..."
find "$BACKUP_DIR" -name "${DB_NAME}_backup_*.sql.gz" -mtime +30 -delete 2>/dev/null || true

# Список всех бэкапов
log_info "Доступные бэкапы:"
ls -lh "$BACKUP_DIR"/${DB_NAME}_backup_*.sql.gz 2>/dev/null || log_info "Нет доступных бэкапов"

log_success "Бэкап завершен успешно!"
