import winston from 'winston';
import path from 'path';

// Определяем уровни логирования
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Цвета для разных уровней
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// Определяем уровень логирования в зависимости от окружения
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Форматы для разных транспортов
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

// Создаем транспорты
const transports = [
  // Console transport для development
  new winston.transports.Console({
    format: consoleFormat,
  }),
];

// File transports для production
if (process.env.NODE_ENV === 'production') {
  const logDir = process.env.LOG_FILE_PATH ? path.dirname(process.env.LOG_FILE_PATH) : '/var/log/crm';
  
  transports.push(
    // Общий лог файл
    new winston.transports.File({
      filename: path.join(logDir, 'app.log'),
      format: fileFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),
    
    // Отдельный файл для ошибок
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),
    
    // HTTP запросы
    new winston.transports.File({
      filename: path.join(logDir, 'http.log'),
      level: 'http',
      format: fileFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 3,
    }),
  );
}

// Создаем основной логгер
const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
  // Обработка необработанных исключений
  exceptionHandlers: [
    new winston.transports.File({
      filename: process.env.NODE_ENV === 'production' 
        ? '/var/log/crm/exceptions.log' 
        : './logs/exceptions.log'
    })
  ],
  // Обработка необработанных промисов
  rejectionHandlers: [
    new winston.transports.File({
      filename: process.env.NODE_ENV === 'production' 
        ? '/var/log/crm/rejections.log' 
        : './logs/rejections.log'
    })
  ],
});

// Middleware для логирования HTTP запросов
export const httpLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent') || '',
      userId: req.user?.id || null,
    };
    
    if (res.statusCode >= 400) {
      logger.warn('HTTP Request', logData);
    } else {
      logger.http('HTTP Request', logData);
    }
  });
  
  next();
};

// Специализированные логгеры
export const securityLogger = {
  loginAttempt: (ip: string, email: string, success: boolean) => {
    logger.info('Login attempt', { ip, email, success, type: 'security' });
  },
  
  rateLimitExceeded: (ip: string, endpoint: string) => {
    logger.warn('Rate limit exceeded', { ip, endpoint, type: 'security' });
  },
  
  suspiciousActivity: (ip: string, activity: string, details?: any) => {
    logger.warn('Suspicious activity', { ip, activity, details, type: 'security' });
  },
};

export const businessLogger = {
  orderCreated: (orderId: number, userId: number) => {
    logger.info('Order created', { orderId, userId, type: 'business' });
  },
  
  orderStatusChanged: (orderId: number, oldStatus: string, newStatus: string, userId: number) => {
    logger.info('Order status changed', { orderId, oldStatus, newStatus, userId, type: 'business' });
  },
  
  masterAssigned: (orderId: number, masterId: number, userId: number) => {
    logger.info('Master assigned', { orderId, masterId, userId, type: 'business' });
  },
  
  paymentProcessed: (orderId: number, amount: number, userId: number) => {
    logger.info('Payment processed', { orderId, amount, userId, type: 'business' });
  },
};

export const performanceLogger = {
  slowQuery: (query: string, duration: number) => {
    logger.warn('Slow database query', { query, duration, type: 'performance' });
  },
  
  highMemoryUsage: (usage: number) => {
    logger.warn('High memory usage', { usage, type: 'performance' });
  },
  
  s3UploadTime: (filename: string, size: number, duration: number) => {
    logger.info('S3 upload completed', { filename, size, duration, type: 'performance' });
  },
};

export default logger;
