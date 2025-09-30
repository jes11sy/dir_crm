import { Request, Response, NextFunction } from 'express'
import Redis from 'ioredis'

// Создаем подключение к Redis только в продакшене
const isProduction = process.env.NODE_ENV === 'production'
let redis: Redis | null = null

if (isProduction) {
  redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
  })
}

interface RateLimitOptions {
  windowMs: number // Время окна в миллисекундах
  max: number // Максимальное количество запросов
  message?: string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

interface RateLimitInfo {
  limit: number
  remaining: number
  reset: number
}

export function createRateLimiter(options: RateLimitOptions) {
  const {
    windowMs,
    max,
    message = 'Слишком много запросов, попробуйте позже',
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = options

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // В режиме разработки просто пропускаем проверку лимитов
      if (!isProduction || !redis) {
        console.log('⚠️ Rate limiting disabled in development mode')
        return next()
      }

      // Получаем IP адрес клиента
      const clientIP = req.ip || req.connection.remoteAddress || 'unknown'
      const key = `rate_limit:${clientIP}:${req.route?.path || req.path}`
      
      // Получаем текущее время
      const now = Date.now()
      const windowStart = now - windowMs

      // Получаем данные из Redis
      const pipeline = redis.pipeline()
      pipeline.zremrangebyscore(key, 0, windowStart) // Удаляем старые записи
      pipeline.zcard(key) // Подсчитываем количество запросов
      pipeline.zadd(key, now, `${now}-${Math.random()}`) // Добавляем текущий запрос
      pipeline.expire(key, Math.ceil(windowMs / 1000)) // Устанавливаем TTL

      const results = await pipeline.exec()
      
      if (!results) {
        console.error('Redis pipeline execution failed')
        return next()
      }

      const currentRequests = results[1][1] as number

      // Проверяем лимит
      if (currentRequests >= max) {
        const resetTime = now + windowMs
        const rateLimitInfo: RateLimitInfo = {
          limit: max,
          remaining: 0,
          reset: resetTime
        }

        res.set({
          'X-RateLimit-Limit': max.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetTime.toString(),
          'Retry-After': Math.ceil(windowMs / 1000).toString()
        })

        return res.status(429).json({
          error: 'Rate limit exceeded',
          message,
          rateLimitInfo
        })
      }

      // Устанавливаем заголовки с информацией о лимите
      const remaining = max - currentRequests - 1
      const resetTime = now + windowMs

      res.set({
        'X-RateLimit-Limit': max.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': resetTime.toString()
      })

      // Сохраняем информацию о лимите в запросе для дальнейшего использования
      req.rateLimit = {
        limit: max,
        remaining,
        reset: resetTime
      }

      next()
    } catch (error) {
      console.error('Rate limiter error:', error)
      // В случае ошибки Redis, пропускаем запрос
      next()
    }
  }
}

// Предустановленные лимитеры для разных типов запросов
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 5, // 5 попыток входа
  message: 'Слишком много попыток входа, попробуйте через 15 минут'
})

export const apiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // 100 запросов
  message: 'Слишком много запросов к API'
})

export const uploadRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 час
  max: 10, // 10 загрузок файлов
  message: 'Превышен лимит загрузки файлов'
})

export const strictRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 минут
  max: 20, // 20 запросов
  message: 'Слишком много запросов, попробуйте позже'
})

export const audioRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 час
  max: isProduction ? 100 : 500, // 100 запросов аудио в час в продакшене
  message: 'Превышен лимит запросов аудиофайлов'
})

// Middleware для логирования превышения лимитов
export function rateLimitLogger(req: Request, res: Response, next: NextFunction) {
  const originalSend = res.send
  
  res.send = function(data) {
    if (res.statusCode === 429) {
      console.warn(`Rate limit exceeded for IP: ${req.ip}, Path: ${req.path}, User-Agent: ${req.get('User-Agent')}`)
    }
    return originalSend.call(this, data)
  }
  
  next()
}

// Утилита для получения информации о лимите
export function getRateLimitInfo(req: Request): RateLimitInfo | null {
  return req.rateLimit || null
}
