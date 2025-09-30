import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'

export const getMasters = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, city, status_work } = req.query
    
    const skip = (Number(page) - 1) * Number(limit)
    
    const where: any = {}
    
    if (city) {
      where.cities = {
        has: city
      }
    }
    
    if (status_work) {
      where.statusWork = status_work
    }

    const [masters, total] = await Promise.all([
      prisma.master.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          orders: {
            select: {
              id: true,
              statusOrder: true,
              result: true,
              dateMeeting: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.master.count({ where })
    ])

    console.log('📦 Данные мастеров с сервера:', masters.map(m => ({ 
      id: m.id, 
      name: m.name, 
      cities: m.cities 
    })))

    res.json({
      masters,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    console.error('Ошибка получения мастеров:', error)
    res.status(500).json({ message: 'Внутренняя ошибка сервера' })
  }
}

export const getMasterById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const master = await prisma.master.findUnique({
      where: { id: Number(id) },
        include: {
          orders: {
            select: {
              id: true,
              rk: true,
              clientName: true,
              statusOrder: true,
              result: true,
              dateMeeting: true,
              createdAt: true
            },
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
    })

    if (!master) {
      return res.status(404).json({ message: 'Мастер не найден' })
    }

    res.json(master)
  } catch (error) {
    console.error('Ошибка получения мастера:', error)
    res.status(500).json({ message: 'Внутренняя ошибка сервера' })
  }
}

export const createMaster = async (req: Request, res: Response) => {
  try {
    const { city, cities, name, passportDoc, contractDoc, statusWork, note, tgId, chatId } = req.body

    if (!name || !statusWork) {
      return res.status(400).json({
        message: 'Имя и статус работы обязательны'
      })
    }

    // Обрабатываем города - получаем массив городов
    let masterCities: string[] = []
    
    if (cities && Array.isArray(cities) && cities.length > 0) {
      masterCities = cities
    } else if (city && Array.isArray(city)) {
      masterCities = city
    } else if (city) {
      masterCities = [city]
    } else {
      return res.status(400).json({
        message: 'Необходимо указать хотя бы один город'
      })
    }

    const master = await prisma.master.create({
      data: {
        cities: masterCities,
        name,
        passportDoc,
        contractDoc,
        statusWork,
        note,
        tgId,
        chatId
      }
    })

    res.status(201).json({
      message: 'Мастер успешно создан',
      master
    })
  } catch (error) {
    console.error('Ошибка создания мастера:', error)
    res.status(500).json({ message: 'Внутренняя ошибка сервера' })
  }
}

export const updateMaster = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const updateData = req.body

    console.log('🔄 Обновление мастера:', { id, updateData })

    // Удаляем поля, которые нельзя обновлять напрямую
    delete updateData.id
    delete updateData.createdAt
    delete updateData.updatedAt
    delete updateData.orders // Исключаем связанные заказы
    
    // Очищаем от undefined значений
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key]
      }
    })

    // Обрабатываем города при обновлении
    if (updateData.city && Array.isArray(updateData.city)) {
      // Если city - это массив, сохраняем в cities
      updateData.cities = updateData.city
      delete updateData.city // Удаляем старое поле
    }

    // Валидация обязательных полей
    if (!updateData.name || !updateData.statusWork) {
      return res.status(400).json({
        message: 'Имя и статус работы обязательны'
      })
    }

    const master = await prisma.master.update({
      where: { id: Number(id) },
      data: updateData
    })

    console.log('✅ Мастер обновлен:', master)

    res.json({
      message: 'Мастер успешно обновлен',
      master
    })
  } catch (error) {
    console.error('❌ Ошибка обновления мастера:', error)
    console.error('Детали ошибки:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    })
    res.status(500).json({ 
      message: 'Внутренняя ошибка сервера',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

export const deleteMaster = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // Проверяем, есть ли у мастера активные заказы
    const activeOrders = await prisma.order.count({
      where: {
        masterId: Number(id),
        statusOrder: {
          in: ['новый', 'в работе']
        }
      }
    })

    if (activeOrders > 0) {
      return res.status(400).json({ 
        message: 'Нельзя удалить мастера с активными заказами' 
      })
    }

    await prisma.master.delete({
      where: { id: Number(id) }
    })

    res.json({ message: 'Мастер успешно удален' })
  } catch (error) {
    console.error('Ошибка удаления мастера:', error)
    res.status(500).json({ message: 'Внутренняя ошибка сервера' })
  }
}

export const getMasterStats = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const master = await prisma.master.findUnique({
      where: { id: Number(id) },
      include: {
        orders: {
          where: {
            statusOrder: 'завершен'
          },
          select: {
            result: true,
            expenditure: true,
            clean: true,
            dateMeeting: true
          }
        }
      }
    })

    if (!master) {
      return res.status(404).json({ message: 'Мастер не найден' })
    }

    const completedOrders = master.orders
    const totalOrders = completedOrders.length
    const totalRevenue = completedOrders.reduce((sum, order) => sum + (order.result || 0), 0)
    const totalExpenditure = completedOrders.reduce((sum, order) => sum + (order.expenditure || 0), 0)
    const totalClean = completedOrders.reduce((sum, order) => sum + (order.clean || 0), 0)
    const averageCheck = totalOrders > 0 ? totalRevenue / totalOrders : 0

    res.json({
      master: {
        id: master.id,
        name: master.name,
        cities: master.cities,
        status_work: master.status_work
      },
      stats: {
        totalOrders,
        totalRevenue,
        totalExpenditure,
        totalClean,
        averageCheck,
        salary: totalClean // Зарплата = чистый доход
      }
    })
  } catch (error) {
    console.error('Ошибка получения статистики мастера:', error)
    res.status(500).json({ message: 'Внутренняя ошибка сервера' })
  }
}
