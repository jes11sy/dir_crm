/**
 * CRM Backend Server
 * 
 * Основной сервер приложения для управления заявками, мастерами и кассой.
 * Использует Express.js с TypeScript, Prisma ORM и PostgreSQL.
 * 
 * @author CRM Development Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Import API routes
import authRoutes from './routes/auth';
import adminAuthRoutes from './routes/adminAuth';
import directorsRoutes from './routes/directors';
import ordersRoutes from './routes/orders';
import mastersRoutes from './routes/masters';
import cashRoutes from './routes/cash';
import uploadRoutes from './routes/upload';
import reportsRoutes from './routes/reports';
import callsRoutes from './routes/calls';
import recordingsRoutes from './routes/recordings';

// Import middleware for security and monitoring
import { defaultCors, corsSecurity } from './middleware/cors';
import { apiRateLimiter, authRateLimiter, uploadRateLimiter, audioRateLimiter } from './middleware/rateLimiter';
import { dataAuditLogger, securityAuditLogger } from './middleware/auditLogger';

// Import backup utilities
import { setupAutomaticBackups } from './utils/backup';

// Import Redis (temporarily disabled for development)
// import { getRedisClient, closeRedisConnection } from './lib/redis';

// Load environment variables from .env file
dotenv.config();

// Initialize Express application
const app = express();
const PORT = process.env.PORT || 3001;

/**
 * Security and CORS Middleware
 * Настройка безопасности и CORS для защиты от атак
 */
// Enhanced security configuration
const helmetConfig = process.env.NODE_ENV === 'production' ? {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", process.env.S3_ENDPOINT || ""],
      connectSrc: ["'self'", process.env.S3_ENDPOINT || ""],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", process.env.S3_ENDPOINT || ""],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
} : {
  contentSecurityPolicy: false, // Отключаем CSP в development
  crossOriginEmbedderPolicy: false
};

app.use(helmet(helmetConfig));

// CORS configuration for cross-origin requests
app.use(defaultCors);
app.use(corsSecurity);

// Body parsing middleware
app.use(express.json({ limit: '10mb' })); // Limit JSON payload size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * Rate Limiting Middleware
 * Ограничение количества запросов для защиты от DDoS
 */
app.use('/api/auth', authRateLimiter);
app.use('/api/upload', uploadRateLimiter);
app.use('/api/recordings', audioRateLimiter);
app.use('/api', apiRateLimiter);

/**
 * Audit Logging Middleware
 * Логирование действий пользователей для аудита
 */
app.use('/api', dataAuditLogger);
app.use('/api/auth', securityAuditLogger);

/**
 * Static File Serving
 * Раздача статических файлов (загруженные документы)
 */
app.use('/uploads', express.static('uploads'));

// CORS middleware для recordings ПЕРЕД роутами
app.use('/api/recordings', (req, res, next) => {
  const origin = req.get('Origin');
  const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? ['https://lead-schem.ru', 'https://www.lead-schem.ru']
    : ['http://localhost:3000', 'http://127.0.0.1:3000'];
  
  console.log(`🌐 CORS запрос от origin: ${origin} к ${req.path}`);
  
  // Разрешаем запросы от разрешенных доменов
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  } else if (!origin) {
    // Разрешаем запросы без Origin (например, прямые запросы)
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Credentials', 'false');
  } else {
    // Для неразрешенных доменов
    console.warn(`⚠️ Неразрешенный origin: ${origin}`);
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS, HEAD');
  res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type, Cache-Control, Pragma, Range, Accept');
  res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Type, Content-Range, Accept-Ranges');
  
  if (req.method === 'OPTIONS') {
    console.log('✅ Обработка OPTIONS запроса');
    return res.status(200).end();
  }
  
  next();
});

/**
 * Health Check Endpoint
 * Проверка состояния сервера и подключений
 */
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'CRM Backend is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

/**
 * API Routes Configuration
 * Настройка маршрутов API с соответствующими middleware
 */
app.use('/api/auth', authRoutes);           // Аутентификация и авторизация
app.use('/api/admin/auth', adminAuthRoutes); // Админская авторизация
app.use('/api/admin/directors', directorsRoutes); // Управление директорами (админка)
app.use('/api/orders', ordersRoutes);       // Управление заказами
app.use('/api/masters', mastersRoutes);     // Управление мастерами
app.use('/api/cash', cashRoutes);           // Кассовые операции
app.use('/api/upload', uploadRoutes);       // Загрузка файлов
app.use('/api/reports', reportsRoutes);     // Отчеты и аналитика
app.use('/api/calls', callsRoutes);         // Записи звонков
app.use('/api/recordings', recordingsRoutes); // Аудиофайлы записей звонков

/**
 * Error Handling Middleware
 * Обработка ошибок и 404 маршрутов
 */
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Маршрут не найден',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('🚨 Server Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  res.status(500).json({ 
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Внутренняя ошибка сервера' 
      : err.message,
    timestamp: new Date().toISOString()
  });
});

/**
 * Server Startup
 * Запуск сервера с инициализацией всех сервисов
 */
app.listen(PORT, async () => {
  console.log('🚀 CRM Backend Server Started');
  console.log('='.repeat(50));
  console.log(`📡 Server running on port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log('='.repeat(50));
  console.log('🔗 Available API Endpoints:');
  console.log(`   🔐 Auth API: http://localhost:${PORT}/api/auth`);
  console.log(`   👑 Admin Auth API: http://localhost:${PORT}/api/admin/auth`);
  console.log(`   📦 Orders API: http://localhost:${PORT}/api/orders`);
  console.log(`   👥 Masters API: http://localhost:${PORT}/api/masters`);
  console.log(`   💰 Cash API: http://localhost:${PORT}/api/cash`);
  console.log(`   📤 Upload API: http://localhost:${PORT}/api/upload`);
  console.log(`   📊 Reports API: http://localhost:${PORT}/api/reports`);
  console.log('='.repeat(50));
  
  // Initialize automatic backups
  setupAutomaticBackups();
  console.log('💾 Automatic backups configured');
  
  // Redis status
  console.log('⚠️  Redis: Disabled (development mode)');
  console.log('✅ Server ready to accept connections');
});

/**
 * Graceful Shutdown Handlers
 * Корректное завершение работы сервера
 */
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT signal, shutting down gracefully...');
  console.log('📝 Finalizing operations...');
  
  // Close database connections
  // await closeRedisConnection(); // Redis disabled
  
  console.log('✅ Server shutdown completed');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM signal, shutting down gracefully...');
  console.log('📝 Finalizing operations...');
  
  // Close database connections
  // await closeRedisConnection(); // Redis disabled
  
  console.log('✅ Server shutdown completed');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default app;
