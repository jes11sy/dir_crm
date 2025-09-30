import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'

export const getCashOperations = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, type, date_from, date_to } = req.query
    
    console.log('🔍 Запрос операций кассы:', { page, limit, type, date_from, date_to })
    
    const skip = (Number(page) - 1) * Number(limit)
    
    const where: any = {}
    
    if (type && type !== 'all') {
      where.name = type
    }
    
    if (date_from || date_to) {
      where.dateCreate = {}
      if (date_from) {
        where.dateCreate.gte = new Date(date_from as string)
      }
      if (date_to) {
        where.dateCreate.lte = new Date(date_to as string)
      }
    }

    console.log('🔍 Условия поиска:', where)

    const [operations, total] = await Promise.all([
      prisma.cash.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: {
          dateCreate: 'desc'
        }
      }),
      prisma.cash.count({ where })
    ])

    console.log('📊 Найдено операций:', operations.length, 'из', total)

    // Преобразуем Decimal в обычные числа для фронтенда
    const formattedOperations = operations.map(op => ({
      ...op,
      amount: Number(op.amount)
    }))

    res.json({
      operations: formattedOperations,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    console.error('Ошибка получения операций кассы:', error)
    res.status(500).json({ message: 'Внутренняя ошибка сервера' })
  }
}

export const getCashOperationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const operation = await prisma.cash.findUnique({
      where: { id: Number(id) }
    })

    if (!operation) {
      return res.status(404).json({ message: 'Операция не найдена' })
    }

    res.json(operation)
  } catch (error) {
    console.error('Ошибка получения операции:', error)
    res.status(500).json({ message: 'Внутренняя ошибка сервера' })
  }
}

export const createCashOperation = async (req: Request, res: Response) => {
  try {
    const { name, amount, note, receiptDoc, receipt_doc, name_create, nameCreate, city, paymentPurpose } = req.body
    
    console.log('🔍 Данные запроса на создание операции:', req.body)
    console.log('🔍 Поля:', { name, amount, note, receiptDoc, receipt_doc, name_create, nameCreate, city, paymentPurpose })

    // Используем nameCreate если name_create не передан
    const creatorName = name_create || nameCreate

    if (!name || !amount || !creatorName) {
      return res.status(400).json({ 
        message: 'Тип операции, сумма и создатель обязательны' 
      })
    }

    if (name !== 'приход' && name !== 'расход') {
      return res.status(400).json({ 
        message: 'Тип операции должен быть "приход" или "расход"' 
      })
    }

    if (amount <= 0) {
      return res.status(400).json({ 
        message: 'Сумма должна быть больше 0' 
      })
    }

    // Используем receiptDoc или receipt_doc (для совместимости)
    const documentUrl = receiptDoc || receipt_doc

    console.log('🔍 Создаем запись в БД с данными:', {
      name,
      amount,
      note,
      receiptDoc: documentUrl,
      name_create: creatorName,
      city,
      paymentPurpose
    })

    const operation = await prisma.cash.create({
      data: {
        name,
        amount: Number(amount), // Убеждаемся, что это число
        note,
        receiptDoc: documentUrl,
        nameCreate: creatorName,
        city,
        paymentPurpose
      }
    })

    console.log('✅ Запись создана успешно:', operation)

    res.status(201).json({
      message: 'Операция успешно создана',
      operation
    })
  } catch (error) {
    console.error('❌ Ошибка создания операции:', error)
    console.error('❌ Детали ошибки:', (error as Error).message)
    res.status(500).json({ 
      message: 'Внутренняя ошибка сервера',
      error: (error as Error).message 
    })
  }
}

export const updateCashOperation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const updateData = req.body

    // Удаляем поля, которые нельзя обновлять напрямую
    delete updateData.id
    delete updateData.createdAt
    delete updateData.updatedAt

    if (updateData.name && updateData.name !== 'приход' && updateData.name !== 'расход') {
      return res.status(400).json({ 
        message: 'Тип операции должен быть "приход" или "расход"' 
      })
    }

    if (updateData.amount && updateData.amount <= 0) {
      return res.status(400).json({ 
        message: 'Сумма должна быть больше 0' 
      })
    }

    const operation = await prisma.cash.update({
      where: { id: Number(id) },
      data: updateData
    })

    res.json({
      message: 'Операция успешно обновлена',
      operation
    })
  } catch (error) {
    console.error('Ошибка обновления операции:', error)
    res.status(500).json({ message: 'Внутренняя ошибка сервера' })
  }
}

export const deleteCashOperation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    await prisma.cash.delete({
      where: { id: Number(id) }
    })

    res.json({ message: 'Операция успешно удалена' })
  } catch (error) {
    console.error('Ошибка удаления операции:', error)
    res.status(500).json({ message: 'Внутренняя ошибка сервера' })
  }
}

export const getCashStats = async (req: Request, res: Response) => {
  try {
    const { date_from, date_to } = req.query
    
    const where: any = {}
    
    if (date_from || date_to) {
      where.dateCreate = {}
      if (date_from) {
        where.dateCreate.gte = new Date(date_from as string)
      }
      if (date_to) {
        where.dateCreate.lte = new Date(date_to as string)
      }
    }

    const [income, expenses] = await Promise.all([
      prisma.cash.aggregate({
        where: {
          ...where,
          name: 'приход'
        },
        _sum: {
          amount: true
        },
        _count: true
      }),
      prisma.cash.aggregate({
        where: {
          ...where,
          name: 'расход'
        },
        _sum: {
          amount: true
        },
        _count: true
      })
    ])

    const totalIncome = Number(income._sum.amount) || 0
    const totalExpenses = Number(expenses._sum.amount) || 0
    const netIncome = totalIncome - totalExpenses

    res.json({
      stats: {
        totalIncome,
        totalExpenses,
        netIncome,
        incomeCount: income._count,
        expenseCount: expenses._count
      }
    })
  } catch (error) {
    console.error('Ошибка получения статистики кассы:', error)
    res.status(500).json({ message: 'Внутренняя ошибка сервера' })
  }
}
