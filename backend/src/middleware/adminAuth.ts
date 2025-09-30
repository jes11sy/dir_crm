import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

interface AdminJwtPayload {
  id: number
  login: string
  role: string
}

declare global {
  namespace Express {
    interface Request {
      admin?: {
        id: number
        login: string
        note?: string | null
      }
    }
  }
}

/**
 * Middleware для проверки токена администратора
 */
export const adminAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Токен авторизации не предоставлен'
      })
    }

    // Проверяем токен
    const decoded = jwt.verify(token, JWT_SECRET) as AdminJwtPayload

    // Проверяем, что это токен администратора
    if (decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Недостаточно прав доступа'
      })
    }

    // Проверяем, что администратор существует в базе
    const admin = await prisma.callcentreAdmin.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        login: true,
        note: true
      }
    })

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Администратор не найден'
      })
    }

    // Добавляем информацию об администраторе в объект запроса
    req.admin = admin

    next()

  } catch (error) {
    console.error('Ошибка проверки токена администратора:', error)
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: 'Недействительный токен'
      })
    }

    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: 'Токен истек'
      })
    }

    return res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера'
    })
  }
}

/**
 * Middleware для опциональной проверки токена администратора
 * Не блокирует запрос, если токен отсутствует
 */
export const optionalAdminAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      return next()
    }

    const decoded = jwt.verify(token, JWT_SECRET) as AdminJwtPayload

    if (decoded.role === 'admin') {
      const admin = await prisma.callcentreAdmin.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          login: true,
          note: true
        }
      })

      if (admin) {
        req.admin = admin
      }
    }

    next()

  } catch (error) {
    // Игнорируем ошибки и продолжаем без авторизации
    next()
  }
}
