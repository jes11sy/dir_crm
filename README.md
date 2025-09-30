# CRM Система для Директора

Система управления заявками, мастерами, кассой и отчетностью для директора по работе с заявками.

## 🚀 Технологии

### Frontend
- **Next.js 14** - React фреймворк
- **TypeScript** - типизация
- **Tailwind CSS** - стилизация
- **shadcn/ui** - UI компоненты
- **Lucide React** - иконки

### Backend
- **Node.js** - серверная платформа
- **Express.js** - веб-фреймворк
- **TypeScript** - типизация
- **Prisma** - ORM для работы с БД
- **PostgreSQL** - основная база данных
- **Redis** - кэширование и rate limiting
- **JWT** - аутентификация

## 📋 Функциональность

### ✅ Реализовано
- [x] Система аутентификации
- [x] Управление заказами
- [x] Управление мастерами
- [x] Касса (приходы/расходы)
- [x] Отчеты по городам и мастерам
- [x] Загрузка файлов
- [x] Responsive дизайн
- [x] Loading состояния
- [x] Error handling
- [x] Анимации и переходы
- [x] Валидация форм
- [x] Rate limiting
- [x] CORS настройка
- [x] Логирование действий
- [x] Backup стратегия

## 🛠 Установка и запуск

### Предварительные требования

- Node.js 18+ 
- PostgreSQL 13+
- Redis 6+
- npm или yarn

### 1. Клонирование репозитория

```bash
git clone <repository-url>
cd dir_crm
```

### 2. Установка зависимостей

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Настройка базы данных

#### PostgreSQL
```bash
# Создание базы данных
createdb crm_database

# Или через psql
psql -U postgres
CREATE DATABASE crm_database;
```

#### Redis
```bash
# Запуск Redis (Ubuntu/Debian)
sudo systemctl start redis-server

# Запуск Redis (macOS)
brew services start redis

# Запуск Redis (Windows)
redis-server
```

### 4. Настройка переменных окружения

#### Backend (.env)
```bash
cd backend
cp env.example .env
```

Отредактируйте `.env`:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/crm_database"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Server
PORT=3001
NODE_ENV=development

# Backup
BACKUP_DIR=./backups
BACKUP_RETENTION_DAYS=30
```

#### Frontend (.env.local)
```bash
cd frontend
touch .env.local
```

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 5. Инициализация базы данных

```bash
cd backend

# Генерация Prisma клиента
npx prisma generate

# Применение миграций
npx prisma migrate deploy

# Заполнение тестовыми данными
npx prisma db seed
```

### 6. Запуск приложения

#### Development режим

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

#### Production режим

```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
npm start
```

### 7. Доступ к приложению

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001/api
- **API Docs:** http://localhost:3001/docs

## 🔐 Тестовые данные

### Пользователи для входа:
- **Администратор:** `admin` / `admin123`
- **Директор СПб:** `director_spb` / `spb123`

## 📁 Структура проекта

```
dir_crm/
├── backend/                 # Backend приложение
│   ├── src/
│   │   ├── controllers/     # Контроллеры API
│   │   ├── middleware/      # Middleware (auth, cors, rate limiting)
│   │   ├── routes/          # API маршруты
│   │   ├── lib/             # Утилиты (Prisma, Redis)
│   │   └── utils/            # Дополнительные утилиты
│   ├── prisma/              # Схема БД и миграции
│   └── docs/                # API документация
├── frontend/                # Frontend приложение
│   ├── src/
│   │   ├── app/             # Next.js app router
│   │   ├── components/      # React компоненты
│   │   └── lib/             # Утилиты и типы
│   └── public/              # Статические файлы
└── README.md
```

## 🗄 База данных

### Основные таблицы:

- **Director** - директора
- **Master** - мастера
- **Order** - заказы
- **Cash** - кассовые операции
- **CallcentreOperator** - операторы колл-центра
- **Call** - звонки
- **Avito** - настройки Avito
- **Phone** - телефоны
- **Mango** - данные Mango
- **EmailSettings** - настройки email

### Связи:
- Director → Master (один ко многим)
- Master → Order (один ко многим)
- Order → Cash (один ко многим)

## 🔧 API Endpoints

### Аутентификация
- `POST /auth/login` - вход в систему
- `POST /auth/logout` - выход из системы

### Заказы
- `GET /orders` - список заказов
- `GET /orders/:id` - заказ по ID
- `PUT /orders/:id` - обновить заказ

### Мастера
- `GET /masters` - список мастеров
- `POST /masters` - создать мастера
- `PUT /masters/:id` - обновить мастера
- `DELETE /masters/:id` - удалить мастера

### Касса
- `GET /cash` - история операций
- `POST /cash` - создать операцию

### Отчеты
- `GET /reports/city` - отчет по городам
- `GET /reports/masters` - отчет по мастерам

### Файлы
- `POST /upload` - загрузить файл

## 🛡 Безопасность

### Реализованные меры:
- JWT аутентификация
- Rate limiting (Redis)
- CORS настройка
- Валидация входных данных
- Санитизация данных
- Логирование действий пользователей
- Backup стратегия

### Rate Limiting:
- Аутентификация: 5 попыток в 15 минут
- API запросы: 100 запросов в 15 минут
- Загрузка файлов: 10 загрузок в час

## 📊 Мониторинг и логирование

### Логирование:
- Действия пользователей
- Ошибки приложения
- Превышения rate limit
- CORS нарушения
- Backup операции

### Мониторинг:
- Статус базы данных
- Статус Redis
- Использование памяти
- Время ответа API

## 🔄 Backup и восстановление

### Автоматические бэкапы:
- Ежедневно в 2:00
- Сжатие (gzip)
- Шифрование (опционально)
- Очистка старых бэкапов (30 дней)

### Ручное управление:
```bash
# Создание бэкапа
curl -X POST http://localhost:3001/api/backup

# Список бэкапов
curl -X GET http://localhost:3001/api/backups

# Восстановление
curl -X POST http://localhost:3001/api/backup/restore/backup_2024-01-15.sql
```

## 🚀 Деплой в production

### 1. Подготовка сервера

```bash
# Установка Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Установка PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Установка Redis
sudo apt-get install redis-server

# Установка PM2
npm install -g pm2
```

### 2. Настройка production

```bash
# Backend
cd backend
npm run build
pm2 start ecosystem.config.js

# Frontend
cd frontend
npm run build
pm2 start ecosystem.config.js
```

### 3. Nginx конфигурация

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🐛 Отладка

### Логи приложения:
```bash
# Backend логи
pm2 logs backend

# Frontend логи
pm2 logs frontend

# Все логи
pm2 logs
```

### Проверка статуса:
```bash
# Статус процессов
pm2 status

# Перезапуск
pm2 restart all

# Остановка
pm2 stop all
```

## 📞 Поддержка

При возникновении проблем:

1. Проверьте логи приложения
2. Убедитесь, что все сервисы запущены
3. Проверьте подключение к БД и Redis
4. Обратитесь к документации API

## 📄 Лицензия

Этот проект создан для внутреннего использования компании.
