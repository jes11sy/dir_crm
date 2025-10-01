import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'
// import { cacheUtils } from '../lib/redis' // Redis disabled

export const getFilterOptions = async (req: Request, res: Response) => {
  try {
    console.log('🔍 Получаем опции фильтров...')
    
    const [statuses, cities, masters] = await Promise.all([
      prisma.order.findMany({
        select: { statusOrder: true },
        distinct: ['statusOrder']
      }),
      prisma.order.findMany({
        select: { city: true },
        distinct: ['city']
      }),
      prisma.master.findMany({
        select: { name: true },
        where: { statusWork: 'работает' }
      })
    ])

    const filterOptions = {
      statuses: statuses.map(s => s.statusOrder).filter(Boolean),
      cities: cities.map(c => c.city).filter(Boolean),
      masters: masters.map(m => m.name).filter(Boolean)
    }

    console.log('📦 Опции фильтров:', filterOptions)
    res.json(filterOptions)
  } catch (error) {
    console.error('❌ Ошибка получения опций фильтров:', error)
    res.status(500).json({ error: 'Ошибка получения опций фильтров' })
  }
}

export const getOrders = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, status, city, master, search } = req.query
    
    console.log('🔍 Параметры фильтрации:', { page, limit, status, city, master, search })
    
    const skip = (Number(page) - 1) * Number(limit)
    
    const where: any = {}
    
    if (status && status !== 'all') {
      where.statusOrder = status
    }
    
    if (city && city !== 'all') {
      where.city = city
    }
    
    if (master && master !== 'all') {
      where.master = {
        name: {
          equals: master
        }
      }
    }
    
    if (search) {
      const searchConditions: any[] = [
        { phone: { contains: search as string } },
        { address: { contains: search as string } }
      ]
      
      // Если search - это число, добавляем поиск по ID
      const searchAsNumber = parseInt(search as string)
      if (!isNaN(searchAsNumber)) {
        searchConditions.push({ id: searchAsNumber })
      }
      
      where.OR = searchConditions
    }
    
    console.log('🔍 Where условие:', JSON.stringify(where, null, 2))

    // Получаем все заказы без пагинации для правильной сортировки
    const allOrders = await prisma.order.findMany({
      where,
      include: {
        master: {
          select: {
            id: true,
            name: true,
            cities: true
          }
        },
        operator: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Кастомная сортировка: сначала "Ожидает" по дате встречи, потом остальные
    const statusPriority: Record<string, number> = {
      'Ожидает': 1,
      'Принял': 2,
      'В работе': 3,
      'Модерн': 4,
      'Готово': 5,
      'Отказ': 6,
      'Незаказ': 7
    }

    const sortedOrders = allOrders.sort((a, b) => {
      const priorityA = statusPriority[a.statusOrder] || 999
      const priorityB = statusPriority[b.statusOrder] || 999
      
      // Сравниваем по приоритету статуса
      if (priorityA !== priorityB) {
        return priorityA - priorityB
      }
      
      // Если статусы одинаковые, сортируем по дате встречи (для "Ожидает" - ближайшие первыми)
      if (a.statusOrder === 'Ожидает' && b.statusOrder === 'Ожидает') {
        return new Date(a.dateMeeting).getTime() - new Date(b.dateMeeting).getTime()
      }
      
      // Для остальных статусов - по дате создания (новые первыми)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    // Применяем пагинацию к отсортированным данным
    const total = sortedOrders.length
    const orders = sortedOrders.slice(skip, skip + Number(limit))

    const result = {
      orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    }

    res.json(result)
  } catch (error) {
    console.error('Ошибка получения заказов:', error)
    res.status(500).json({ message: 'Внутренняя ошибка сервера' })
  }
}

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const order = await prisma.order.findUnique({
      where: { id: Number(id) },
      include: {
        master: {
          select: {
            id: true,
            name: true,
            cities: true,
            statusWork: true
          }
        },
        operator: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!order) {
      return res.status(404).json({ message: 'Заказ не найден' })
    }

    res.json(order)
  } catch (error) {
    console.error('Ошибка получения заказа:', error)
    res.status(500).json({ message: 'Внутренняя ошибка сервера' })
  }
}

export const updateOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const updateData = req.body

    console.log(`📝 Обновление заказа ${id}:`, JSON.stringify(updateData, null, 2))

    // Удаляем поля, которые нельзя обновлять напрямую
    delete updateData.id
    delete updateData.createdAt
    delete updateData.updatedAt
    
    // Временно исключаем проблемные поля связей
    delete updateData.master
    delete updateData.avito
    delete updateData.operator
    
    // Удаляем обязательные поля которые нельзя обновлять
    delete updateData.operatorNameId
    delete updateData.createDate

    // Очищаем null значения для числовых полей, заменяя их на undefined
    if (updateData.result === null) updateData.result = undefined
    if (updateData.expenditure === null) updateData.expenditure = undefined
    if (updateData.clean === null) updateData.clean = undefined
    if (updateData.masterChange === null) updateData.masterChange = undefined
    if (updateData.masterId === null) updateData.masterId = undefined

    // Преобразуем дату если она передана как строка
    if (updateData.dateMeeting && typeof updateData.dateMeeting === 'string') {
      updateData.dateMeeting = new Date(updateData.dateMeeting)
    }

    // Список разрешённых для обновления полей
    const allowedFields = [
      'rk', 'city', 'avitoName', 'phone', 'typeOrder', 'clientName', 
      'address', 'dateMeeting', 'typeEquipment', 'problem', 'callRecord',
      'statusOrder', 'masterId', 'result', 'expenditure', 'clean', 
      'masterChange', 'bsoDoc', 'expenditureDoc', 'avitoChatId', 'callId',
      'closingData'
    ]
    
    // Фильтруем данные, оставляя только разрешённые поля
    const filteredData: any = {}
    for (const field of allowedFields) {
      if (updateData.hasOwnProperty(field)) {
        filteredData[field] = updateData[field]
      }
    }

    console.log(`📝 Очищенные данные:`, JSON.stringify(filteredData, null, 2))

    // Получаем текущий заказ для проверки статуса
    const currentOrder = await prisma.order.findUnique({
      where: { id: Number(id) },
      select: { statusOrder: true, masterChange: true, closingData: true }
    })

    if (!currentOrder) {
      return res.status(404).json({ message: 'Заказ не найден' })
    }

    // Проверяем, изменился ли статус на финальный
    const finalStatuses = ['Готово', 'Отказ', 'Незаказ']
    const isChangingToFinalStatus = filteredData.statusOrder && 
      finalStatuses.includes(filteredData.statusOrder) && 
      currentOrder.statusOrder !== filteredData.statusOrder

    // Если статус меняется на финальный и дата закрытия еще не установлена
    if (isChangingToFinalStatus && !currentOrder.closingData) {
      filteredData.closingData = new Date()
      console.log(`📅 Устанавливаем дату закрытия заказа: ${filteredData.closingData}`)
    }

    const order = await prisma.order.update({
      where: { id: Number(id) },
      data: filteredData,
      include: {
        master: {
          select: {
            id: true,
            name: true,
            cities: true
          }
        }
      }
    })

    // Если статус изменился на "Готово", создаем приход в кассу
    if (filteredData.statusOrder === 'Готово' && 
        currentOrder.statusOrder !== 'Готово' && 
        order.result && 
        Number(order.result) > 0) {
      
      try {
        const masterName = order.master ? order.master.name : 'Неизвестный мастер'
        const noteText = `${masterName} - Итог по заказу: ${order.result}₽`
        
        await prisma.cash.create({
          data: {
            name: 'приход',
            amount: order.result,
            city: order.city,
            note: noteText,
            nameCreate: 'Система',
            paymentPurpose: `Заказ №${order.id}`
          }
        })
        
        console.log(`✅ Создан приход ${order.result}₽ по заказу №${order.id} (мастер: ${masterName})`)
      } catch (cashError) {
        console.error('❌ Ошибка создания прихода:', cashError)
        // Не прерываем выполнение, только логируем ошибку
      }
    }

    res.json({
      message: 'Заказ успешно обновлен',
      order
    })
  } catch (error) {
    console.error('❌ Ошибка обновления заказа:', error)
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'Unknown error')
    res.status(500).json({ 
      message: 'Внутренняя ошибка сервера',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    })
  }
}

export const assignMaster = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { master_id } = req.body

    if (!master_id) {
      return res.status(400).json({ message: 'ID мастера обязателен' })
    }

    // Проверяем, что мастер существует
    const master = await prisma.master.findUnique({
      where: { id: master_id }
    })

    if (!master) {
      return res.status(404).json({ message: 'Мастер не найден' })
    }

    const order = await prisma.order.update({
      where: { id: Number(id) },
      data: { masterId: master_id },
      include: {
        master: {
          select: {
            id: true,
            name: true,
            cities: true
          }
        }
      }
    })

    res.json({
      message: 'Мастер успешно назначен',
      order
    })
  } catch (error) {
    console.error('Ошибка назначения мастера:', error)
    res.status(500).json({ message: 'Внутренняя ошибка сервера' })
  }
}

export const closeOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { result, expenditure, clean, masterChange } = req.body

    const updateData: any = {
      statusOrder: 'ready', // Изменяем на 'ready' вместо 'завершен'
      closingData: new Date()
    }

    if (result !== undefined) updateData.result = result
    if (expenditure !== undefined) updateData.expenditure = expenditure
    if (clean !== undefined) updateData.clean = clean
    if (masterChange !== undefined) updateData.masterChange = masterChange

    const order = await prisma.order.update({
      where: { id: Number(id) },
      data: updateData,
      include: {
        master: {
          select: {
            id: true,
            name: true,
            cities: true
          }
        }
      }
    })

    // Создаем приход при закрытии заказа
    if (order.result && Number(order.result) > 0) {
      try {
        const masterName = order.master ? order.master.name : 'Неизвестный мастер'
        const noteText = `${masterName} - Итог по заказу: ${order.result}₽`
        
        await prisma.cash.create({
          data: {
            name: 'приход',
            amount: order.result,
            city: order.city,
            note: noteText,
            nameCreate: 'Система',
            paymentPurpose: `Заказ №${order.id}`
          }
        })
        
        console.log(`✅ Создан приход ${order.result}₽ по заказу №${order.id} (мастер: ${masterName})`)
      } catch (cashError) {
        console.error('❌ Ошибка создания прихода:', cashError)
        // Не прерываем выполнение, только логируем ошибку
      }
    }

    res.json({
      message: 'Заказ успешно закрыт',
      order
    })
  } catch (error) {
    console.error('Ошибка закрытия заказа:', error)
    res.status(500).json({ message: 'Внутренняя ошибка сервера' })
  }
}
