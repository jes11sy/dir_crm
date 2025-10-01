# 🚀 Руководство по деплою CRM системы

## 📋 Содержание

1. [Требования к системе](#требования-к-системе)
2. [Подготовка к деплою](#подготовка-к-деплою)
3. [Настройка окружения](#настройка-окружения)
4. [Деплой с помощью Docker](#деплой-с-помощью-docker)
5. [Настройка SSL](#настройка-ssl)
6. [Мониторинг и логирование](#мониторинг-и-логирование)
7. [Резервное копирование](#резервное-копирование)
8. [Обновление системы](#обновление-системы)
9. [Устранение неполадок](#устранение-неполадок)

## 🖥️ Требования к системе

### Минимальные требования:
- **CPU**: 2 ядра
- **RAM**: 4 GB
- **Диск**: 50 GB SSD
- **ОС**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+

### Рекомендуемые требования:
- **CPU**: 4 ядра
- **RAM**: 8 GB
- **Диск**: 100 GB SSD
- **ОС**: Ubuntu 22.04 LTS

### Необходимое ПО:
- Docker 24.0+
- Docker Compose 2.0+
- Git
- Make (опционально)

## 🔧 Подготовка к деплою

### 1. Установка Docker

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Перезайдите в систему или выполните:
newgrp docker

# Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Клонирование репозитория

```bash
git clone <repository-url> crm-system
cd crm-system
```

### 3. Создание необходимых директорий

```bash
mkdir -p logs nginx/ssl backups
chmod 755 scripts/*.sh
```

## ⚙️ Настройка окружения

### 1. Создание файлов окружения

```bash
# Копируем шаблоны
cp backend/env.production.example .env.production
cp frontend/env.production.example frontend/.env.production

# Или используем Makefile
make setup-env
```

### 2. Настройка переменных окружения

Отредактируйте `.env.production`:

```bash
# Database
DB_USER=crm_user
DB_PASSWORD=your_secure_password_here

# JWT
JWT_SECRET=your_super_secure_jwt_secret_here

# Redis
REDIS_PASSWORD=your_redis_password_here

# S3 Storage
S3_ENDPOINT=https://s3.twcstorage.ru
S3_BUCKET=your-bucket-name
S3_ACCESS_KEY=your_access_key
S3_SECRET_KEY=your_secret_key

# Domain
FRONTEND_URL=https://your-domain.com

# Monitoring
GRAFANA_PASSWORD=your_grafana_password
```

### 3. Настройка доменного имени

Убедитесь, что ваш домен указывает на IP сервера:

```bash
# Проверка DNS
nslookup your-domain.com
dig your-domain.com
```

## 🐳 Деплой с помощью Docker

### Быстрый старт

```bash
# Полная автоматическая настройка и запуск
make quick-start
```

### Пошаговый деплой

```bash
# 1. Настройка окружения
make setup-env

# 2. Создание SSL сертификатов
make ssl-cert

# 3. Сборка образов
make build

# 4. Запуск сервисов
make start

# 5. Проверка статуса
make status
make health
```

### Использование скрипта деплоя

```bash
# Автоматический деплой
./scripts/deploy.sh production

# Деплой в staging
./scripts/deploy.sh staging
```

## 🔄 Настройка автозапуска после перезагрузки сервера

### ✅ Автоматический способ (рекомендуется)

Запустите скрипт настройки автозапуска:

```bash
# На сервере
cd /opt/crm-system
sudo ./scripts/setup-autostart.sh
```

Скрипт автоматически:
- ✅ Настроит Docker для автозапуска при загрузке системы
- ✅ Создаст systemd сервис `crm-system.service`
- ✅ Включит автозапуск CRM системы

### 🔍 Проверка автозапуска

```bash
# Проверить статус systemd сервиса
sudo systemctl status crm-system

# Посмотреть логи автозапуска
sudo journalctl -u crm-system -f

# Протестировать перезагрузку
sudo reboot

# После перезагрузки проверить контейнеры
docker ps
```

### 🛠️ Ручная настройка (если нужно)

Docker Compose уже настроен с `restart: unless-stopped` для всех сервисов, но можно изменить политику:

```yaml
# docker-compose.prod.yml
services:
  nginx:
    restart: always          # Всегда перезапускать
    # restart: unless-stopped  # Не перезапускать, если остановлен вручную (по умолчанию)
    # restart: on-failure      # Перезапускать только при ошибке
    # restart: no              # Никогда не перезапускать
```

### 📋 Полезные команды для управления автозапуском

```bash
# Запустить CRM систему
sudo systemctl start crm-system

# Остановить CRM систему
sudo systemctl stop crm-system

# Перезапустить CRM систему
sudo systemctl restart crm-system

# Включить автозапуск
sudo systemctl enable crm-system

# Отключить автозапуск
sudo systemctl disable crm-system

# Посмотреть статус
sudo systemctl status crm-system
```

## 🔒 Настройка SSL

### Самоподписанный сертификат (для тестирования)

```bash
make ssl-cert
```

### Let's Encrypt (для продакшена)

```bash
# Установка Certbot
sudo apt install certbot

# Получение сертификата
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Копирование сертификатов
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/private.key
sudo chown $USER:$USER nginx/ssl/*

# Перезапуск nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

### Автоматическое обновление сертификатов

```bash
# Добавить в crontab
sudo crontab -e

# Добавить строку:
0 12 * * * /usr/bin/certbot renew --quiet && docker-compose -f /path/to/crm/docker-compose.prod.yml restart nginx
```

## 📊 Мониторинг и логирование

### Запуск системы мониторинга

```bash
# Запуск Prometheus, Grafana, и других инструментов мониторинга
docker-compose -f monitoring/docker-compose.monitoring.yml up -d

# Проверка статуса
docker-compose -f monitoring/docker-compose.monitoring.yml ps
```

### Доступ к инструментам мониторинга

- **Grafana**: http://your-server:3001 (admin/admin123)
- **Prometheus**: http://your-server:9090
- **AlertManager**: http://your-server:9093

### Просмотр логов

```bash
# Все логи
make logs

# Логи конкретного сервиса
make logs-backend
make logs-frontend
make logs-nginx

# Логи в реальном времени
docker-compose -f docker-compose.prod.yml logs -f --tail=100
```

## 💾 Резервное копирование

### Создание бэкапа

```bash
# Автоматический бэкап
make backup

# Ручной бэкап
./scripts/backup.sh

# Бэкап конкретной БД
./scripts/backup.sh custom_db_name
```

### Восстановление из бэкапа

```bash
# Восстановление
make restore BACKUP=./backups/backup_file.sql.gz

# Или напрямую
./scripts/restore.sh ./backups/backup_file.sql.gz
```

### Настройка автоматических бэкапов

```bash
# Добавить в crontab
crontab -e

# Ежедневный бэкап в 2:00
0 2 * * * cd /path/to/crm && ./scripts/backup.sh

# Еженедельная очистка старых бэкапов
0 3 * * 0 find /path/to/crm/backups -name "*.sql.gz" -mtime +30 -delete
```

## 🔄 Обновление системы

### Обновление кода

```bash
# 1. Создание бэкапа
make backup

# 2. Получение обновлений
git pull origin main

# 3. Деплой обновлений
./scripts/deploy.sh production
```

### Обновление зависимостей

```bash
# Backend
cd backend && npm update && npm audit fix

# Frontend  
cd frontend && npm update && npm audit fix

# Пересборка образов
make build
make restart
```

### Миграции базы данных

```bash
# Применение новых миграций
make migrate

# Проверка статуса миграций
docker-compose -f docker-compose.prod.yml run --rm backend npx prisma migrate status
```

## 🚨 Устранение неполадок

### Проверка статуса сервисов

```bash
# Статус всех контейнеров
make status

# Проверка здоровья
make health

# Детальная информация
docker-compose -f docker-compose.prod.yml ps -a
```

### Частые проблемы

#### 1. Контейнер не запускается

```bash
# Проверка логов
docker-compose -f docker-compose.prod.yml logs service_name

# Проверка конфигурации
docker-compose -f docker-compose.prod.yml config

# Пересоздание контейнера
docker-compose -f docker-compose.prod.yml up -d --force-recreate service_name
```

#### 2. База данных недоступна

```bash
# Проверка статуса PostgreSQL
docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U crm_user

# Подключение к БД
docker-compose -f docker-compose.prod.yml exec postgres psql -U crm_user -d dir_crm_prod

# Перезапуск БД
docker-compose -f docker-compose.prod.yml restart postgres
```

#### 3. Проблемы с SSL

```bash
# Проверка сертификатов
openssl x509 -in nginx/ssl/cert.pem -text -noout

# Проверка конфигурации nginx
docker-compose -f docker-compose.prod.yml exec nginx nginx -t

# Перезагрузка nginx
docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

#### 4. Высокое использование ресурсов

```bash
# Мониторинг ресурсов
docker stats

# Очистка неиспользуемых ресурсов
make clean

# Проверка дискового пространства
df -h
docker system df
```

### Логи и отладка

```bash
# Системные логи
journalctl -u docker

# Логи приложения
tail -f logs/app.log
tail -f logs/error.log

# Отладка сети
docker network ls
docker network inspect crm_network
```

## 📞 Поддержка

### Полезные команды

```bash
# Полная перезагрузка системы
make stop && make clean && make build && make start

# Проверка производительности
make health
curl http://localhost:3002/api/metrics

# Экспорт конфигурации
docker-compose -f docker-compose.prod.yml config > current-config.yml
```

### Контакты для поддержки

- **Техническая поддержка**: support@your-company.com
- **Документация**: https://docs.your-company.com
- **Мониторинг**: https://monitoring.your-company.com

---

## 📝 Чек-лист деплоя

- [ ] Сервер соответствует требованиям
- [ ] Docker и Docker Compose установлены
- [ ] Переменные окружения настроены
- [ ] SSL сертификаты созданы
- [ ] Домен настроен и указывает на сервер
- [ ] Файрвол настроен (порты 80, 443, 22)
- [ ] Бэкапы настроены
- [ ] Мониторинг запущен
- [ ] Алерты настроены
- [ ] Документация обновлена

**Успешного деплоя! 🚀**
