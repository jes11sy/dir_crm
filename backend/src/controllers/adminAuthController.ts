import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

/**
 * Вход администратора в систему
 */
export const adminLogin = async (req: Request, res: Response) => {
  try {
    const { login, password } = req.body

    // Валидация входных данных
    if (!login || !password) {
      return res.status(400).json({
        success: false,
        message: 'Логин и пароль обязательны'
      })
    }

    // Поиск администратора в базе данных
    const admin = await prisma.callcentreAdmin.findUnique({
      where: { login }
    })

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Неверный логин или пароль'
      })
    }

    // Проверка пароля
    const isPasswordValid = await bcrypt.compare(password, admin.password)
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Неверный логин или пароль'
      })
    }

    // Создание JWT токена
    const token = jwt.sign(
      { 
        id: admin.id, 
        login: admin.login,
        role: 'admin'
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.json({
      success: true,
      message: 'Вход выполнен успешно',
      token,
      admin: {
        id: admin.id,
        login: admin.login,
        note: admin.note
      }
    })

  } catch (error) {
    console.error('Ошибка входа администратора:', error)
    res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера'
    })
  }
}

/**
 * Проверка токена администратора
 */
export const verifyAdminToken = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Токен не предоставлен'
      })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any

    // Проверяем, что это токен администратора
    if (decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Недостаточно прав доступа'
      })
    }

    // Проверяем, что администратор существует
    const admin = await prisma.callcentreAdmin.findUnique({
      where: { id: decoded.id }
    })

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Администратор не найден'
      })
    }

    res.json({
      success: true,
      admin: {
        id: admin.id,
        login: admin.login,
        note: admin.note
      }
    })

  } catch (error) {
    console.error('Ошибка проверки токена администратора:', error)
    res.status(401).json({
      success: false,
      message: 'Недействительный токен'
    })
  }
}

/**
 * Получение списка всех администраторов (только для авторизованных админов)
 */
export const getAdmins = async (req: Request, res: Response) => {
  try {
    const admins = await prisma.callcentreAdmin.findMany({
      select: {
        id: true,
        login: true,
        note: true,
        createdAt: true,
        updatedAt: true
      }
    })

    res.json({
      success: true,
      admins
    })

  } catch (error) {
    console.error('Ошибка получения списка администраторов:', error)
    res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера'
    })
  }
}

/**
 * Создание нового администратора
 */
export const createAdmin = async (req: Request, res: Response) => {
  try {
    const { login, password, note } = req.body

    // Валидация данных
    if (!login || !password) {
      return res.status(400).json({
        success: false,
        message: 'Логин и пароль обязательны'
      })
    }

    // Проверка на существование администратора с таким логином
    const existingAdmin = await prisma.callcentreAdmin.findUnique({
      where: { login }
    })

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Администратор с таким логином уже существует'
      })
    }

    // Хеширование пароля
    const hashedPassword = await bcrypt.hash(password, 12)

    // Создание администратора
    const newAdmin = await prisma.callcentreAdmin.create({
      data: {
        login,
        password: hashedPassword,
        note: note || null
      },
      select: {
        id: true,
        login: true,
        note: true,
        createdAt: true
      }
    })

    res.status(201).json({
      success: true,
      message: 'Администратор создан успешно',
      admin: newAdmin
    })

  } catch (error) {
    console.error('Ошибка создания администратора:', error)
    res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера'
    })
  }
}

/**
 * Обновление пароля администратора
 */
export const updateAdminPassword = async (req: Request, res: Response) => {
  try {
    const { adminId } = req.params
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Текущий и новый пароль обязательны'
      })
    }

    // Поиск администратора
    const admin = await prisma.callcentreAdmin.findUnique({
      where: { id: parseInt(adminId) }
    })

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Администратор не найден'
      })
    }

    // Проверка текущего пароля
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, admin.password)
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Неверный текущий пароль'
      })
    }

    // Хеширование нового пароля
    const hashedNewPassword = await bcrypt.hash(newPassword, 12)

    // Обновление пароля
    await prisma.callcentreAdmin.update({
      where: { id: parseInt(adminId) },
      data: { password: hashedNewPassword }
    })

    res.json({
      success: true,
      message: 'Пароль обновлен успешно'
    })

  } catch (error) {
    console.error('Ошибка обновления пароля администратора:', error)
    res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера'
    })
  }
}
