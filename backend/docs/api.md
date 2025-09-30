# CRM API Документация

## Обзор

CRM API предоставляет RESTful интерфейс для управления заявками, мастерами, кассой и отчетностью.

**Базовый URL:** `http://localhost:3001/api`

## Аутентификация

Все защищенные endpoints требуют JWT токен в заголовке `Authorization`:

```
Authorization: Bearer <jwt_token>
```

## Endpoints

### Аутентификация

#### POST /auth/login
Вход в систему

**Запрос:**
```json
{
  "login": "admin",
  "password": "admin123"
}
```

**Ответ:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Администратор",
    "city": "Москва"
  }
}
```

#### POST /auth/logout
Выход из системы

**Ответ:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Заказы

#### GET /orders
Получить список заказов

**Параметры запроса:**
- `page` (number, optional) - номер страницы
- `limit` (number, optional) - количество записей на странице
- `status` (string, optional) - фильтр по статусу
- `city` (string, optional) - фильтр по городу
- `master_id` (number, optional) - фильтр по мастеру

**Ответ:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "rk": "РК-2024-001",
      "city": "Москва",
      "avitoName": "Иван Петров",
      "phone": "+79001234567",
      "typeOrder": "first_time",
      "clientName": "Иван Петров",
      "address": "ул. Ленина, 1",
      "dateMeeting": "2024-01-15T10:00:00Z",
      "typeEquipment": "kp",
      "problem": "Не работает холодильник",
      "statusOrder": "pending",
      "masterId": null,
      "result": null,
      "master": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

#### GET /orders/:id
Получить заказ по ID

**Ответ:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "rk": "РК-2024-001",
    "city": "Москва",
    "avitoName": "Иван Петров",
    "phone": "+79001234567",
    "typeOrder": "first_time",
    "clientName": "Иван Петров",
    "address": "ул. Ленина, 1",
    "dateMeeting": "2024-01-15T10:00:00Z",
    "typeEquipment": "kp",
    "problem": "Не работает холодильник",
    "statusOrder": "pending",
    "masterId": null,
    "result": null,
    "master": null
  }
}
```

#### PUT /orders/:id
Обновить заказ

**Запрос:**
```json
{
  "statusOrder": "in_work",
  "masterId": 1,
  "result": 5000
}
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "statusOrder": "in_work",
    "masterId": 1,
    "result": 5000
  }
}
```

### Мастера

#### GET /masters
Получить список мастеров

**Ответ:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Петр Иванов",
      "city": "Москва",
      "statusWork": "работает",
      "dateCreate": "2024-01-01T00:00:00Z",
      "note": "Опытный мастер"
    }
  ]
}
```

#### POST /masters
Создать нового мастера

**Запрос:**
```json
{
  "name": "Петр Иванов",
  "city": "Москва",
  "statusWork": "работает",
  "note": "Опытный мастер"
}
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Петр Иванов",
    "city": "Москва",
    "statusWork": "работает",
    "dateCreate": "2024-01-01T00:00:00Z",
    "note": "Опытный мастер"
  }
}
```

#### PUT /masters/:id
Обновить мастера

**Запрос:**
```json
{
  "name": "Петр Иванов",
  "statusWork": "уволен"
}
```

#### DELETE /masters/:id
Удалить мастера

**Ответ:**
```json
{
  "success": true,
  "message": "Master deleted successfully"
}
```

### Касса

#### GET /cash
Получить историю операций

**Параметры запроса:**
- `type` (string, optional) - фильтр по типу (приход/расход)
- `date_from` (string, optional) - дата начала
- `date_to` (string, optional) - дата окончания

**Ответ:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "приход",
      "amount": 5000,
      "note": "Оплата за заказ РК-2024-001",
      "receiptDoc": "receipt_001.pdf",
      "dateCreate": "2024-01-15T10:00:00Z",
      "nameCreate": "Администратор"
    }
  ]
}
```

#### POST /cash
Создать операцию

**Запрос:**
```json
{
  "name": "расход",
  "amount": 1000,
  "note": "Покупка запчастей",
  "nameCreate": "Администратор"
}
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "расход",
    "amount": 1000,
    "note": "Покупка запчастей",
    "dateCreate": "2024-01-15T10:00:00Z",
    "nameCreate": "Администратор"
  }
}
```

### Отчеты

#### GET /reports/city
Отчет по городам

**Параметры запроса:**
- `date_from` (string, optional) - дата начала
- `date_to` (string, optional) - дата окончания

**Ответ:**
```json
{
  "success": true,
  "data": [
    {
      "city": "Москва",
      "ordersCount": 50,
      "averageCheck": 4500,
      "totalRevenue": 225000,
      "companyIncome": 112500
    }
  ]
}
```

#### GET /reports/masters
Отчет по мастерам

**Параметры запроса:**
- `date_from` (string, optional) - дата начала
- `date_to` (string, optional) - дата окончания

**Ответ:**
```json
{
  "success": true,
  "data": [
    {
      "masterId": 1,
      "masterName": "Петр Иванов",
      "ordersCount": 25,
      "totalRevenue": 125000,
      "averageCheck": 5000,
      "salary": 25000
    }
  ]
}
```

### Загрузка файлов

#### POST /upload
Загрузить файл

**Запрос:**
```
Content-Type: multipart/form-data

document: <file>
```

**Ответ:**
```json
{
  "success": true,
  "filename": "document_1234567890.pdf",
  "url": "/uploads/documents/document_1234567890.pdf"
}
```

## Коды ошибок

### 400 Bad Request
Некорректные данные запроса

```json
{
  "success": false,
  "error": "Validation error",
  "details": {
    "field": "Поле обязательно для заполнения"
  }
}
```

### 401 Unauthorized
Не авторизован

```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Invalid or missing token"
}
```

### 403 Forbidden
Доступ запрещен

```json
{
  "success": false,
  "error": "Forbidden",
  "message": "Insufficient permissions"
}
```

### 404 Not Found
Ресурс не найден

```json
{
  "success": false,
  "error": "Not Found",
  "message": "Resource not found"
}
```

### 429 Too Many Requests
Превышен лимит запросов

```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "message": "Too many requests, try again later",
  "rateLimitInfo": {
    "limit": 100,
    "remaining": 0,
    "reset": 1640995200
  }
}
```

### 500 Internal Server Error
Внутренняя ошибка сервера

```json
{
  "success": false,
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

## Rate Limiting

API использует rate limiting для защиты от злоупотреблений:

- **Аутентификация:** 5 попыток в 15 минут
- **API запросы:** 100 запросов в 15 минут
- **Загрузка файлов:** 10 загрузок в час

Заголовки ответа содержат информацию о лимитах:
- `X-RateLimit-Limit` - максимальное количество запросов
- `X-RateLimit-Remaining` - оставшееся количество запросов
- `X-RateLimit-Reset` - время сброса лимита (Unix timestamp)

## CORS

API поддерживает CORS для cross-origin запросов:

- **Разрешенные origins:** `http://localhost:3000` (development), `https://yourdomain.com` (production)
- **Разрешенные методы:** GET, POST, PUT, DELETE, PATCH, OPTIONS
- **Разрешенные заголовки:** Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma
- **Credentials:** поддерживаются

## Примеры использования

### JavaScript (Fetch API)

```javascript
// Вход в систему
const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    login: 'admin',
    password: 'admin123'
  })
});

const loginData = await loginResponse.json();
const token = loginData.token;

// Получение заказов
const ordersResponse = await fetch('http://localhost:3001/api/orders', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const ordersData = await ordersResponse.json();
```

### cURL

```bash
# Вход в систему
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"login":"admin","password":"admin123"}'

# Получение заказов
curl -X GET http://localhost:3001/api/orders \
  -H "Authorization: Bearer <token>"
```

## Webhooks

API поддерживает webhooks для уведомлений о событиях:

### Настройка webhook

```json
{
  "url": "https://yourdomain.com/webhook",
  "events": ["order.created", "order.updated", "order.completed"],
  "secret": "your-webhook-secret"
}
```

### Структура webhook payload

```json
{
  "event": "order.created",
  "timestamp": "2024-01-15T10:00:00Z",
  "data": {
    "id": 1,
    "rk": "РК-2024-001",
    "status": "pending"
  },
  "signature": "sha256=..."
}
```
