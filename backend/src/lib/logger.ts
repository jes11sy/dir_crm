// Простой логгер без внешних зависимостей
class SimpleLogger {
  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = this.getTimestamp();
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    return `${timestamp} [${level.toUpperCase()}]: ${message}${dataStr}`;
  }

  info(message: string, data?: any): void {
    console.log(this.formatMessage('info', message, data));
  }

  warn(message: string, data?: any): void {
    console.warn(this.formatMessage('warn', message, data));
  }

  error(message: string, data?: any): void {
    console.error(this.formatMessage('error', message, data));
  }

  debug(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('debug', message, data));
    }
  }

  http(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(this.formatMessage('http', message, data));
    }
  }
}

const logger = new SimpleLogger();

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
