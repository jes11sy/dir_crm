import { createClient, RedisClientType } from 'redis'

let redisClient: RedisClientType | null = null

export const getRedisClient = (): RedisClientType => {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    })

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err)
    })

    redisClient.on('connect', () => {
      console.log('✅ Redis подключен')
    })

    redisClient.on('disconnect', () => {
      console.log('❌ Redis отключен')
    })

    // Подключаемся к Redis
    redisClient.connect().catch(console.error)
  }

  return redisClient
}

export const closeRedisConnection = async () => {
  if (redisClient) {
    await redisClient.quit()
    redisClient = null
  }
}

// Утилиты для работы с кэшем
export const cacheUtils = {
  // Кэширование данных
  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    const client = getRedisClient()
    await client.setEx(key, ttl, JSON.stringify(value))
  },

  // Получение данных из кэша
  async get<T>(key: string): Promise<T | null> {
    const client = getRedisClient()
    const value = await client.get(key)
    return value ? JSON.parse(value) : null
  },

  // Удаление из кэша
  async del(key: string): Promise<void> {
    const client = getRedisClient()
    await client.del(key)
  },

  // Очистка кэша по паттерну
  async clearPattern(pattern: string): Promise<void> {
    const client = getRedisClient()
    const keys = await client.keys(pattern)
    if (keys.length > 0) {
      await client.del(keys)
    }
  }
}
