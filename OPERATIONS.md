# 🔧 Руководство по эксплуатации CRM системы

## 🚀 Быстрые команды

### Основные операции
```bash
# Запуск системы
make start

# Остановка системы
make stop

# Перезапуск
make restart

# Проверка статуса
make status

# Проверка здоровья
make health
```

### Логи
```bash
# Все логи
make logs

# Логи backend
make logs-backend

# Логи frontend  
make logs-frontend

# Логи nginx
make logs-nginx
```

### Бэкапы
```bash
# Создать бэкап
make backup

# Восстановить бэкап
make restore BACKUP=./backups/backup_file.sql.gz
```

## 📊 Мониторинг

### Доступ к системам мониторинга
- **Grafana**: http://server:3001 (admin/password)
- **Prometheus**: http://server:9090
- **Метрики API**: http://server:3002/api/metrics
- **Health Check**: http://server:3002/api/health

### Ключевые метрики для мониторинга
- CPU использование < 80%
- RAM использование < 85%
- Свободное место на диске > 10%
- Время ответа API < 2 сек
- Процент ошибок < 5%
- Активные соединения с БД < 80

## 🚨 Алерты и реагирование

### Критические алерты
1. **Backend Down** - Немедленно перезапустить: `make restart`
2. **Database Down** - Проверить логи БД: `make logs postgres`
3. **High Error Rate** - Проверить логи приложения
4. **Low Disk Space** - Очистить старые логи и бэкапы

### Команды для диагностики
```bash
# Проверка ресурсов
docker stats

# Проверка сети
docker network ls

# Проверка томов
docker volume ls

# Системная информация
df -h
free -h
top
```

## 🔄 Регулярное обслуживание

### Ежедневно
- [ ] Проверка алертов в Grafana
- [ ] Проверка логов на ошибки
- [ ] Мониторинг использования ресурсов

### Еженедельно
- [ ] Проверка бэкапов
- [ ] Очистка старых логов
- [ ] Обновление системных пакетов

### Ежемесячно
- [ ] Анализ производительности
- [ ] Проверка SSL сертификатов
- [ ] Обновление зависимостей

## 🔧 Частые задачи

### Перезапуск отдельного сервиса
```bash
docker-compose -f docker-compose.prod.yml restart backend
docker-compose -f docker-compose.prod.yml restart frontend
docker-compose -f docker-compose.prod.yml restart nginx
```

### Просмотр конфигурации
```bash
docker-compose -f docker-compose.prod.yml config
```

### Масштабирование
```bash
# Увеличить количество экземпляров backend
docker-compose -f docker-compose.prod.yml up -d --scale backend=3
```

### Обновление образов
```bash
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

## 📋 Чек-лист проблем

### Система не отвечает
1. Проверить статус контейнеров: `make status`
2. Проверить логи: `make logs`
3. Проверить ресурсы: `docker stats`
4. Перезапустить: `make restart`

### Медленная работа
1. Проверить метрики в Grafana
2. Проверить использование CPU/RAM
3. Проверить медленные запросы в логах
4. Проверить соединения с БД

### Ошибки в логах
1. Найти источник ошибки
2. Проверить конфигурацию
3. Проверить переменные окружения
4. Перезапустить проблемный сервис

## 📞 Контакты экстренной поддержки

- **Системный администратор**: +7-XXX-XXX-XXXX
- **Разработчик**: developer@company.com
- **Техподдержка**: support@company.com

## 🔗 Полезные ссылки

- [Полное руководство по деплою](DEPLOYMENT.md)
- [Документация API](backend/docs/api.md)
- [Grafana Dashboards](http://server:3001)
- [Prometheus Metrics](http://server:9090)
