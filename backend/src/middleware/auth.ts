import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma'

export interface AuthRequest extends Request {
  user?: {
    id: number
    login: string
    cities: string[]
    name: string
  }
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Токен доступа не предоставлен' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    
    // Проверяем, что директор существует
    const director = await prisma.director.findUnique({
      where: { id: decoded.id }
    })

    if (!director) {
      return res.status(401).json({ message: 'Пользователь не найден' })
    }

    req.user = {
      id: director.id,
      login: director.login,
      cities: director.cities,
      name: director.name
    }

    next()
  } catch (error) {
    return res.status(403).json({ message: 'Недействительный токен' })
  }
}
