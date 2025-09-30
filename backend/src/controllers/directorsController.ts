import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'

/**
 * Получение списка всех директоров
 */
export const getDirectors = async (req: Request, res: Response) => {
  try {
    const directors = await prisma.director.findMany({
      select: {
        id: true,
        name: true,
        login: true,
        cities: true,
        contractDoc: true,
        passportDoc: true,
        dateCreate: true,
        note: true,
        tgId: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    res.json({
      success: true,
      directors
    })

  } catch (error) {
    console.error('Ошибка получения списка директоров:', error)
    res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера'
    })
  }
}

/**
 * Получение директора по ID
 */
export const getDirectorById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const director = await prisma.director.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        name: true,
        login: true,
        cities: true,
        contractDoc: true,
        passportDoc: true,
        dateCreate: true,
        note: true,
        tgId: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!director) {
      return res.status(404).json({
        success: false,
        message: 'Директор не найден'
      })
    }

    res.json({
      success: true,
      director
    })

  } catch (error) {
    console.error('Ошибка получения директора:', error)
    res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера'
    })
  }
}

/**
 * Создание нового директора
 */
export const createDirector = async (req: Request, res: Response) => {
  try {
    const { name, login, password, cities, note, tgId } = req.body

    // Валидация обязательных полей
    if (!name || !login || !password) {
      return res.status(400).json({
        success: false,
        message: 'Имя, логин и пароль обязательны'
      })
    }

    if (!cities || !Array.isArray(cities) || cities.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо указать хотя бы один город'
      })
    }

    // Проверка на существование директора с таким логином
    const existingDirector = await prisma.director.findUnique({
      where: { login }
    })

    if (existingDirector) {
      return res.status(400).json({
        success: false,
        message: 'Директор с таким логином уже существует'
      })
    }

    // Хеширование пароля
    const hashedPassword = await bcrypt.hash(password, 12)

    // Создание директора
    const newDirector = await prisma.director.create({
      data: {
        name,
        login,
        password: hashedPassword,
        cities,
        note: note || null,
        tgId: tgId || null
      },
      select: {
        id: true,
        name: true,
        login: true,
        cities: true,
        note: true,
        tgId: true,
        dateCreate: true,
        createdAt: true
      }
    })

    res.status(201).json({
      success: true,
      message: 'Директор создан успешно',
      director: newDirector
    })

  } catch (error) {
    console.error('Ошибка создания директора:', error)
    res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера'
    })
  }
}

/**
 * Обновление директора
 */
export const updateDirector = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { name, cities, note, tgId, password } = req.body

    // Проверка существования директора
    const existingDirector = await prisma.director.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingDirector) {
      return res.status(404).json({
        success: false,
        message: 'Директор не найден'
      })
    }

    // Подготовка данных для обновления
    const updateData: any = {
      name: name || existingDirector.name,
      cities: cities || existingDirector.cities,
      note: note !== undefined ? note : existingDirector.note,
      tgId: tgId !== undefined ? tgId : existingDirector.tgId
    }

    // Обновление пароля если передан
    if (password) {
      updateData.password = await bcrypt.hash(password, 12)
    }

    const updatedDirector = await prisma.director.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true,
        name: true,
        login: true,
        cities: true,
        note: true,
        tgId: true,
        dateCreate: true,
        updatedAt: true
      }
    })

    res.json({
      success: true,
      message: 'Директор обновлен успешно',
      director: updatedDirector
    })

  } catch (error) {
    console.error('Ошибка обновления директора:', error)
    res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера'
    })
  }
}

/**
 * Удаление директора
 */
export const deleteDirector = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // Проверка существования директора
    const existingDirector = await prisma.director.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingDirector) {
      return res.status(404).json({
        success: false,
        message: 'Директор не найден'
      })
    }

    await prisma.director.delete({
      where: { id: parseInt(id) }
    })

    res.json({
      success: true,
      message: 'Директор удален успешно'
    })

  } catch (error) {
    console.error('Ошибка удаления директора:', error)
    res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера'
    })
  }
}
