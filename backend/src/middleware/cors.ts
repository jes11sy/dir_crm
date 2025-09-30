import { Request, Response, NextFunction } from 'express'

interface CorsOptions {
  origin?: string | string[] | boolean | ((origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void)
  methods?: string | string[]
  allowedHeaders?: string | string[]
  exposedHeaders?: string | string[]
  credentials?: boolean
  maxAge?: number
  preflightContinue?: boolean
  optionsSuccessStatus?: number
}

const defaultOptions: CorsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://lead-schem.ru', 'https://www.lead-schem.ru'] 
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset'
  ],
  credentials: true,
  maxAge: 86400, // 24 часа
  optionsSuccessStatus: 200
}

export function createCorsMiddleware(options: CorsOptions = {}) {
  const config = { ...defaultOptions, ...options }

  return (req: Request, res: Response, next: NextFunction) => {
    const origin = req.get('Origin')
    
    // Проверяем origin
    if (config.origin) {
      if (typeof config.origin === 'boolean') {
        if (config.origin) {
          res.set('Access-Control-Allow-Origin', origin || '*')
        }
      } else if (Array.isArray(config.origin)) {
        if (origin && config.origin.includes(origin)) {
          res.set('Access-Control-Allow-Origin', origin)
        }
      } else if (typeof config.origin === 'string') {
        res.set('Access-Control-Allow-Origin', config.origin)
      } else if (typeof config.origin === 'function') {
        config.origin(origin, (err, allow) => {
          if (err || !allow) {
            return res.status(403).json({ error: 'CORS policy violation' })
          }
          res.set('Access-Control-Allow-Origin', origin || '*')
        })
      }
    }

    // Устанавливаем методы
    if (config.methods) {
      const methods = Array.isArray(config.methods) ? config.methods.join(', ') : config.methods
      res.set('Access-Control-Allow-Methods', methods)
    }

    // Устанавливаем заголовки
    if (config.allowedHeaders) {
      const headers = Array.isArray(config.allowedHeaders) ? config.allowedHeaders.join(', ') : config.allowedHeaders
      res.set('Access-Control-Allow-Headers', headers)
    }

    // Устанавливаем exposed headers
    if (config.exposedHeaders) {
      const headers = Array.isArray(config.exposedHeaders) ? config.exposedHeaders.join(', ') : config.exposedHeaders
      res.set('Access-Control-Expose-Headers', headers)
    }

    // Устанавливаем credentials
    if (config.credentials) {
      res.set('Access-Control-Allow-Credentials', 'true')
    }

    // Устанавливаем max age
    if (config.maxAge) {
      res.set('Access-Control-Max-Age', config.maxAge.toString())
    }

    // Обрабатываем preflight запросы
    if (req.method === 'OPTIONS') {
      if (config.preflightContinue) {
        return next()
      } else {
        return res.status(config.optionsSuccessStatus || 200).end()
      }
    }

    next()
  }
}

// Предустановленные CORS конфигурации
export const defaultCors = createCorsMiddleware()

export const strictCors = createCorsMiddleware({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://lead-schem.ru'] 
    : ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
})

export const publicCors = createCorsMiddleware({
  origin: true,
  credentials: false
})

// Middleware для логирования CORS запросов
export function corsLogger(req: Request, res: Response, next: NextFunction) {
  const origin = req.get('Origin')
  
  if (origin) {
    console.log(`CORS request from origin: ${origin} to ${req.path}`)
  }
  
  next()
}

// Middleware для проверки CORS в production
export function corsSecurity(req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV === 'production') {
    const origin = req.get('Origin')
    const allowedOrigins = [
      'https://lead-schem.ru',
      'https://www.lead-schem.ru'
    ]
    
    if (origin && !allowedOrigins.includes(origin)) {
      console.warn(`Blocked CORS request from unauthorized origin: ${origin}`)
      return res.status(403).json({ 
        error: 'CORS policy violation',
        message: 'Request from unauthorized origin'
      })
    }
  }
  
  next()
}
