import { Request, Response, NextFunction } from 'express';
import os from 'os';
import logger, { performanceLogger } from '../lib/logger';

// Интерфейс для метрик
interface Metrics {
  requests: {
    total: number;
    success: number;
    errors: number;
    avgResponseTime: number;
  };
  system: {
    cpuUsage: number;
    memoryUsage: number;
    uptime: number;
  };
  endpoints: Map<string, {
    count: number;
    totalTime: number;
    errors: number;
  }>;
}

// Глобальные метрики
const metrics: Metrics = {
  requests: {
    total: 0,
    success: 0,
    errors: 0,
    avgResponseTime: 0,
  },
  system: {
    cpuUsage: 0,
    memoryUsage: 0,
    uptime: 0,
  },
  endpoints: new Map(),
};

let totalResponseTime = 0;

// Middleware для сбора метрик производительности
export function performanceMonitoring(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const endpoint = `${req.method} ${req.route?.path || req.path}`;

  // Увеличиваем счетчик запросов
  metrics.requests.total++;

  // Обработчик завершения запроса
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    
    // Обновляем общие метрики
    totalResponseTime += responseTime;
    metrics.requests.avgResponseTime = totalResponseTime / metrics.requests.total;

    if (res.statusCode >= 400) {
      metrics.requests.errors++;
    } else {
      metrics.requests.success++;
    }

    // Обновляем метрики для конкретного endpoint
    const endpointStats = metrics.endpoints.get(endpoint) || {
      count: 0,
      totalTime: 0,
      errors: 0,
    };

    endpointStats.count++;
    endpointStats.totalTime += responseTime;
    
    if (res.statusCode >= 400) {
      endpointStats.errors++;
    }

    metrics.endpoints.set(endpoint, endpointStats);

    // Логируем медленные запросы
    if (responseTime > 1000) {
      performanceLogger.slowQuery(endpoint, responseTime);
    }
  });

  next();
}

// Middleware для мониторинга системных ресурсов
export function systemMonitoring() {
  setInterval(() => {
    // CPU Usage
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - ~~(100 * idle / total);

    metrics.system.cpuUsage = usage;

    // Memory Usage
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsagePercent = (usedMem / totalMem) * 100;

    metrics.system.memoryUsage = memUsagePercent;
    metrics.system.uptime = process.uptime();

    // Предупреждения о высоком использовании ресурсов
    if (memUsagePercent > 85) {
      performanceLogger.highMemoryUsage(memUsagePercent);
    }

    if (usage > 90) {
      logger.warn('High CPU usage detected', { cpuUsage: usage });
    }

  }, 30000); // Каждые 30 секунд
}

// Endpoint для получения метрик
export function getMetrics(req: Request, res: Response) {
  const endpointStats: any = {};
  
  metrics.endpoints.forEach((stats, endpoint) => {
    endpointStats[endpoint] = {
      ...stats,
      avgResponseTime: stats.totalTime / stats.count,
      errorRate: (stats.errors / stats.count) * 100,
    };
  });

  const response = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    requests: metrics.requests,
    system: {
      ...metrics.system,
      nodeVersion: process.version,
      platform: os.platform(),
      arch: os.arch(),
      loadAverage: os.loadavg(),
    },
    endpoints: endpointStats,
    memory: process.memoryUsage(),
  };

  res.json(response);
}

// Health check endpoint
export function healthCheck(req: Request, res: Response) {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    checks: {
      database: 'healthy', // Здесь можно добавить проверку БД
      redis: 'healthy',    // Здесь можно добавить проверку Redis
      s3: 'healthy',       // Здесь можно добавить проверку S3
    },
  };

  // Проверяем критические показатели
  if (metrics.system.memoryUsage > 95) {
    health.status = 'unhealthy';
    health.checks.database = 'critical_memory';
  }

  if (metrics.system.cpuUsage > 95) {
    health.status = 'unhealthy';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
}

// Middleware для отслеживания активных пользователей
const activeSessions = new Map<string, { lastActivity: Date; userId?: number }>();

export function trackActiveUsers(req: Request, res: Response, next: NextFunction) {
  const sessionId = (req as any).sessionID || req.ip;
  const userId = (req as any).user?.id;

  activeSessions.set(sessionId, {
    lastActivity: new Date(),
    userId,
  });

  // Очищаем неактивные сессии (старше 30 минут)
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  for (const [id, session] of activeSessions.entries()) {
    if (session.lastActivity < thirtyMinutesAgo) {
      activeSessions.delete(id);
    }
  }

  next();
}

// Получить количество активных пользователей
export function getActiveUsers(req: Request, res: Response) {
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

  let activeIn5Min = 0;
  let activeIn15Min = 0;
  const uniqueUsers = new Set<number>();

  for (const session of activeSessions.values()) {
    if (session.lastActivity > fiveMinutesAgo) {
      activeIn5Min++;
    }
    if (session.lastActivity > fifteenMinutesAgo) {
      activeIn15Min++;
    }
    if (session.userId) {
      uniqueUsers.add(session.userId);
    }
  }

  res.json({
    total: activeSessions.size,
    activeIn5Minutes: activeIn5Min,
    activeIn15Minutes: activeIn15Min,
    uniqueUsers: uniqueUsers.size,
    timestamp: now.toISOString(),
  });
}

// Экспорт метрик для внешнего мониторинга
export { metrics };
