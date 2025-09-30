import { Request, Response, NextFunction } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface AuditLogData {
  userId?: number
  action: string
  resource: string
  resourceId?: number
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  timestamp: Date
}

interface AuditLoggerOptions {
  logSuccessfulRequests?: boolean
  logFailedRequests?: boolean
  logSensitiveActions?: boolean
  excludePaths?: string[]
  includeRequestBody?: boolean
  includeResponseBody?: boolean
}

const defaultOptions: AuditLoggerOptions = {
  logSuccessfulRequests: true,
  logFailedRequests: true,
  logSensitiveActions: true,
  excludePaths: ['/health', '/metrics', '/favicon.ico'],
  includeRequestBody: false,
  includeResponseBody: false
}

export function createAuditLogger(options: AuditLoggerOptions = {}) {
  const config = { ...defaultOptions, ...options }

  return async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now()
    const originalSend = res.send
    const originalJson = res.json

    // Пропускаем исключенные пути
    if (config.excludePaths?.some(path => req.path.startsWith(path))) {
      return next()
    }

    // Получаем информацию о пользователе
    const userId = (req as any).user?.id
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown'
    const userAgent = req.get('User-Agent') || 'unknown'

    // Определяем действие и ресурс
    const action = getActionFromMethod(req.method)
    const resource = getResourceFromPath(req.path)
    const resourceId = getResourceIdFromPath(req.path)

    // Собираем детали запроса
    const details: Record<string, any> = {
      method: req.method,
      path: req.path,
      query: req.query,
      params: req.params
    }

    // Добавляем тело запроса если нужно
    if (config.includeRequestBody && req.body) {
      details.requestBody = sanitizeRequestBody(req.body)
    }

    // Перехватываем ответ
    let responseBody: any = null
    let statusCode: number = 200

    res.send = function(data) {
      statusCode = res.statusCode
      if (config.includeResponseBody && data) {
        responseBody = sanitizeResponseBody(data)
      }
      return originalSend.call(this, data)
    }

    res.json = function(data) {
      statusCode = res.statusCode
      if (config.includeResponseBody && data) {
        responseBody = sanitizeResponseBody(data)
      }
      return originalJson.call(this, data)
    }

    // Обрабатываем завершение запроса
    res.on('finish', async () => {
      try {
        const duration = Date.now() - startTime
        const isSuccess = statusCode >= 200 && statusCode < 400

        // Логируем только если нужно
        if ((isSuccess && config.logSuccessfulRequests) || 
            (!isSuccess && config.logFailedRequests)) {
          
          const auditData: AuditLogData = {
            userId,
            action,
            resource,
            resourceId,
            details: {
              ...details,
              statusCode,
              duration,
              responseBody: responseBody ? { size: JSON.stringify(responseBody).length } : null
            },
            ipAddress,
            userAgent,
            timestamp: new Date()
          }

          // Сохраняем в базу данных
          await saveAuditLog(auditData)
        }
      } catch (error) {
        console.error('Audit logging error:', error)
      }
    })

    next()
  }
}

function getActionFromMethod(method: string): string {
  const actionMap: Record<string, string> = {
    'GET': 'READ',
    'POST': 'CREATE',
    'PUT': 'UPDATE',
    'PATCH': 'UPDATE',
    'DELETE': 'DELETE',
    'OPTIONS': 'OPTIONS'
  }
  return actionMap[method] || 'UNKNOWN'
}

function getResourceFromPath(path: string): string {
  // Извлекаем ресурс из пути
  const segments = path.split('/').filter(Boolean)
  if (segments.length === 0) return 'ROOT'
  
  // Убираем ID из пути
  const resource = segments[0]
  return resource.toUpperCase()
}

function getResourceIdFromPath(path: string): number | undefined {
  // Извлекаем ID из пути
  const segments = path.split('/').filter(Boolean)
  const idSegment = segments.find(segment => /^\d+$/.test(segment))
  return idSegment ? parseInt(idSegment) : undefined
}

function sanitizeRequestBody(body: any): any {
  // Удаляем чувствительные данные
  const sensitiveFields = ['password', 'token', 'secret', 'key']
  const sanitized = { ...body }
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]'
    }
  }
  
  return sanitized
}

function sanitizeResponseBody(body: any): any {
  // Ограничиваем размер и удаляем чувствительные данные
  const bodyStr = JSON.stringify(body)
  if (bodyStr.length > 1000) {
    return { message: 'Response too large to log', size: bodyStr.length }
  }
  
  return sanitizeRequestBody(body)
}

async function saveAuditLog(data: AuditLogData): Promise<void> {
  try {
    // Здесь можно сохранить в базу данных или файл
    // Пока просто логируем в консоль
    console.log('AUDIT LOG:', {
      userId: data.userId,
      action: data.action,
      resource: data.resource,
      resourceId: data.resourceId,
      ipAddress: data.ipAddress,
      timestamp: data.timestamp.toISOString()
    })

    // Если есть Prisma, можно сохранить в базу:
    // await prisma.auditLog.create({ data })
  } catch (error) {
    console.error('Failed to save audit log:', error)
  }
}

// Специальные логгеры для разных типов действий
export const authAuditLogger = createAuditLogger({
  logSensitiveActions: true,
  includeRequestBody: true
})

export const dataAuditLogger = createAuditLogger({
  logSuccessfulRequests: true,
  logFailedRequests: true,
  includeRequestBody: true
})

export const securityAuditLogger = createAuditLogger({
  logSensitiveActions: true,
  logFailedRequests: true,
  includeRequestBody: true,
  includeResponseBody: true
})

// Утилиты для ручного логирования
export async function logUserAction(
  userId: number,
  action: string,
  resource: string,
  details?: Record<string, any>
): Promise<void> {
  const auditData: AuditLogData = {
    userId,
    action,
    resource,
    details,
    timestamp: new Date()
  }
  
  await saveAuditLog(auditData)
}

export async function logSecurityEvent(
  action: string,
  details: Record<string, any>,
  ipAddress?: string
): Promise<void> {
  const auditData: AuditLogData = {
    action: `SECURITY_${action}`,
    resource: 'SECURITY',
    details,
    ipAddress,
    timestamp: new Date()
  }
  
  await saveAuditLog(auditData)
}
