# 🛠️ Устранение неполадок

## Ошибка: "address already in use" (порт 80 занят)

### Проблема
При деплое возникает ошибка:
```
failed to bind host port for 0.0.0.0:80: address already in use
```

### Причина
Старый контейнер nginx всё ещё работает и держит порт 80.

### ✅ Автоматическое решение

**С версии от 01.10.2025 эта проблема решается автоматически!**

CI/CD пайплайн теперь автоматически:
- ✅ Останавливает старые контейнеры
- ✅ Удаляет остановленные контейнеры
- ✅ Освобождает порты 80 и 443
- ✅ Очищает Docker кэш
- ✅ Запускает новые контейнеры

**Просто сделайте git push и всё произойдёт автоматически!**

### Ручное решение (если автоматика не сработала)

#### Вариант 1: Быстрый скрипт

На сервере выполните:
```bash
cd /root/crm
./scripts/fix-port-conflict.sh
```

Скрипт автоматически очистит всё и покажет инструкции для перезапуска.

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

