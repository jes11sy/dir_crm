# CRM Backend

Backend для CRM системы директора по работе с заявками.

## Настройка

### 1. Установка зависимостей
```bash
npm install
```

### 2. Настройка базы данных

1. Убедитесь, что PostgreSQL запущен
2. Создайте базу данных `dir_crm`
3. Настройте `.env` файл:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/dir_crm"
JWT_SECRET="your-super-secret-jwt-key"
PORT=3001
FRONTEND_URL="http://localhost:3000"
REDIS_URL="redis://localhost:6379"
```

### 3. Запуск миграций
```bash
npm run db:migrate
```

### 4. Заполнение тестовыми данными
```bash
npm run db:seed
```

### 5. Запуск сервера
```bash
npm run dev
```

## API Endpoints

### Аутентификация
- `POST /api/auth/login` - Вход в систему
- `POST /api/auth/register` - Регистрация директора
- `GET /api/auth/profile` - Профиль пользователя

### Заказы
- `GET /api/orders` - Список заказов
- `GET /api/orders/:id` - Заказ по ID
- `PUT /api/orders/:id` - Обновление заказа
- `POST /api/orders/:id/assign-master` - Назначение мастера
- `POST /api/orders/:id/close` - Закрытие заказа

### Мастера
- `GET /api/masters` - Список мастеров
- `GET /api/masters/:id` - Мастер по ID
- `GET /api/masters/:id/stats` - Статистика мастера
- `POST /api/masters` - Создание мастера
- `PUT /api/masters/:id` - Обновление мастера
- `DELETE /api/masters/:id` - Удаление мастера

### Касса
- `GET /api/cash` - Список операций
- `GET /api/cash/stats` - Статистика кассы
- `GET /api/cash/:id` - Операция по ID
- `POST /api/cash` - Создание операции
- `PUT /api/cash/:id` - Обновление операции
- `DELETE /api/cash/:id` - Удаление операции

## Тестовые данные

После запуска `npm run db:seed` будут созданы:

### Директоры
- **admin** / admin123 (Москва)
- **director_spb** / spb123 (Санкт-Петербург)

### Мастера
- Иван Петров (Москва, активен)
- Мария Сидорова (Москва, активен)
- Алексей Козлов (СПб, активен)
- Елена Волкова (СПб, неактивен)

### Кассовые операции
- Приходы: 5000₽ и 3000₽
- Расходы: 500₽ и 200₽

### Заказы (если есть операторы)
- РК-2024-001: Ремонт холодильника (новый)
- РК-2024-002: Ремонт стиральной машины (в работе)
- РК-2024-003: Ремонт компьютера (завершен)
