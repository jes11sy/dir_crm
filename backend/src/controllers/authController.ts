import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma'

export const login = async (req: Request, res: Response) => {
  try {
    const { login, password } = req.body

    if (!login || !password) {
      return res.status(400).json({ message: 'Логин и пароль обязательны' })
    }

    // Находим директора по логину
    const director = await prisma.director.findUnique({
      where: { login }
    })

    if (!director) {
      return res.status(401).json({ message: 'Неверный логин или пароль' })
    }

    // Проверяем пароль
    const isValidPassword = await bcrypt.compare(password, director.password)

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Неверный логин или пароль' })
    }

    // Создаем JWT токен
    const token = jwt.sign(
      { 
        id: director.id, 
        login: director.login,
        cities: director.cities,
        name: director.name
      },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    )

    res.json({
      message: 'Успешный вход',
      token,
      user: {
        id: director.id,
        login: director.login,
        cities: director.cities,
        name: director.name
      }
    })
  } catch (error) {
    console.error('Ошибка входа:', error)
    res.status(500).json({ message: 'Внутренняя ошибка сервера' })
  }
}

export const register = async (req: Request, res: Response) => {
  try {
    const { city, cities, name, login, password, contract_doc, passport_doc, note } = req.body

    // Поддерживаем и старый формат city и новый cities
    const directorCities = cities || (city ? [city] : [])

    if (directorCities.length === 0 || !name || !login || !password) {
      return res.status(400).json({ 
        message: 'Города, имя, логин и пароль обязательны' 
      })
    }

    // Проверяем, существует ли директор с таким логином
    const existingDirector = await prisma.director.findUnique({
      where: { login }
    })

    if (existingDirector) {
      return res.status(400).json({ message: 'Директор с таким логином уже существует' })
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10)

    // Создаем директора
    const director = await prisma.director.create({
      data: {
        cities: directorCities,
        name,
        login,
        password: hashedPassword,
        contractDoc: contract_doc,
        passportDoc: passport_doc,
        note
      }
    })

    // Создаем JWT токен
    const token = jwt.sign(
      { 
        id: director.id, 
        login: director.login,
        cities: director.cities,
        name: director.name
      },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    )

    res.status(201).json({
      message: 'Директор успешно создан',
      token,
      user: {
        id: director.id,
        login: director.login,
        cities: director.cities,
        name: director.name
      }
    })
  } catch (error) {
    console.error('Ошибка регистрации:', error)
    res.status(500).json({ message: 'Внутренняя ошибка сервера' })
  }
}

export const getProfile = async (req: any, res: Response) => {
  try {
    const director = await prisma.director.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        cities: true,
        name: true,
        login: true,
        contractDoc: true,
        passportDoc: true,
        dateCreate: true,
        note: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!director) {
      return res.status(404).json({ message: 'Директор не найден' })
    }

    res.json({
      user: director
    })
  } catch (error) {
    console.error('Ошибка получения профиля:', error)
    res.status(500).json({ message: 'Внутренняя ошибка сервера' })
  }
}
