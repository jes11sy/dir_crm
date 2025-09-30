import { Request, Response, NextFunction } from 'express'
import { cacheUtils } from '../lib/redis'

export const cacheMiddleware = (ttl: number = 300) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Создаем ключ кэша на основе URL и query параметров
    const cacheKey = `cache:${req.originalUrl}:${JSON.stringify(req.query)}`
    
    try {
      // Пытаемся получить данные из кэша
      const cachedData = await cacheUtils.get(cacheKey)
      
      if (cachedData) {
        console.log(`📦 Cache HIT: ${cacheKey}`)
        return res.json(cachedData)
      }
      
      // Если данных нет в кэше, перехватываем ответ
      const originalSend = res.json
      res.json = function(data: any) {
        // Сохраняем данные в кэш
        cacheUtils.set(cacheKey, data, ttl).catch(console.error)
        console.log(`💾 Cache SET: ${cacheKey}`)
        
        // Отправляем оригинальный ответ
        return originalSend.call(this, data)
      }
      
      next()
    } catch (error) {
      console.error('Ошибка кэширования:', error)
      next()
    }
  }
}

// Middleware для очистки кэша
export const clearCacheMiddleware = (pattern: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await cacheUtils.clearPattern(pattern)
      console.log(`🗑️ Cache CLEARED: ${pattern}`)
      next()
    } catch (error) {
      console.error('Ошибка очистки кэша:', error)
      next()
    }
  }
}
