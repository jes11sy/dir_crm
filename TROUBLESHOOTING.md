# 🛠️ Устранение неполадок

## Ошибка: "address already in use" (порт 80 занят)

### Проблема
При деплое возникает ошибка:
```
failed to bind host port for 0.0.0.0:80: address already in use
```

### Причина
Старый контейнер nginx всё ещё работает и держит порт 80.

### Решение

#### Вариант 1: Автоматический скрипт (рекомендуется)

На сервере выполните:
```bash
cd /root/crm
chmod +x scripts/fix-port-conflict.sh
./scripts/fix-port-conflict.sh
```

Затем запустите деплой заново через CI/CD или вручную:
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

#### Вариант 2: Ручная очистка

1. **Остановите все контейнеры:**
   ```bash
   cd /root/crm
   docker-compose -f docker-compose.prod.yml down
   ```

2. **Проверьте, что занимает порты:**
   ```bash
   sudo lsof -i :80
   sudo lsof -i :443
   ```

3. **Удалите старые контейнеры:**
   ```bash
   docker container prune -f
   ```

4. **Очистите неиспользуемые образы:**
   ```bash
   docker image prune -f
   ```

5. **Очистите неиспользуемые сети:**
   ```bash
   docker network prune -f
   ```

6. **Перезапустите контейнеры:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

#### Вариант 3: Экстренный (если ничего не помогает)

Если порт 80 занят не Docker-контейнером, найдите процесс:
```bash
sudo lsof -i :80
```

Остановите процесс (замените PID на ID процесса из вывода):
```bash
sudo kill -9 PID
```

### Проверка статуса

После исправления проверьте статус:
```bash
docker ps
docker-compose -f docker-compose.prod.yml logs -f
```

Сайт должен быть доступен на https://lead-schem.ru

---

## Другие частые проблемы

### База данных не подключается

**Проверьте переменные окружения:**
```bash
cat backend/.env | grep DATABASE
```

**Проверьте логи PostgreSQL:**
```bash
docker logs crm-postgres
```

### Frontend не собирается

**Проверьте логи:**
```bash
docker logs crm-frontend
```

**Пересоберите образ:**
```bash
docker-compose -f docker-compose.prod.yml build --no-cache frontend
docker-compose -f docker-compose.prod.yml up -d frontend
```

### Redis не работает

**Проверьте статус:**
```bash
docker ps | grep redis
```

**Перезапустите Redis:**
```bash
docker-compose -f docker-compose.prod.yml restart redis
```

### SSL сертификаты не работают

**Проверьте сертификаты Certbot:**
```bash
sudo certbot certificates
```

**Обновите сертификаты:**
```bash
sudo certbot renew --dry-run
```

---

## Контакты поддержки

Если проблема не решается, проверьте:
- GitHub Issues: https://github.com/jes11sy/dir_crm/issues
- Логи CI/CD: https://github.com/jes11sy/dir_crm/actions

