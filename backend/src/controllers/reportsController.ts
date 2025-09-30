import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'

export const getMastersReports = async (req: Request, res: Response) => {
  try {
    console.log('📊 Получение отчетов по мастерам...')

    // Получаем город директора из токена или параметров
    const userCity = req.query.city as string
    console.log('🏙️ Город директора:', userCity)

    // Базовые условия для заказов
    const whereConditions: any = {
      statusOrder: 'Готово'
    }

    // Если указан город, фильтруем только по нему
    if (userCity && userCity !== 'all') {
      whereConditions.master = {
        cities: {
          has: userCity
        }
      }
    }

    // Получаем заказы со статусом 'ready' (готово)
    const orders = await prisma.order.findMany({
      where: whereConditions,
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

    console.log(`📋 Найдено ${orders.length} закрытых заказов`)

    // Группируем по мастерам
    const masterStats = new Map()

    orders.forEach(order => {
      if (!order.master) return

      const masterId = order.master.id
      const masterName = order.master.name
      const masterCities = order.master.cities

      if (!masterStats.has(masterId)) {
        masterStats.set(masterId, {
          id: masterId,
          name: masterName,
          cities: masterCities,
          ordersCount: 0,
          totalRevenue: 0,
          totalExpenditure: 0,
          totalClean: 0,
          totalMasterChange: 0,
          orders: []
        })
      }

      const stats = masterStats.get(masterId)
      stats.ordersCount += 1
      stats.totalRevenue += Number(order.result || 0)
      stats.totalExpenditure += Number(order.expenditure || 0)
      stats.totalClean += Number(order.clean || 0)
      stats.totalMasterChange += Number(order.masterChange || 0)
      stats.orders.push(order)
    })

    // Формируем итоговые отчеты
    const reports = Array.from(masterStats.values()).map(stats => {
      const averageCheck = stats.ordersCount > 0 ? stats.totalClean / stats.ordersCount : 0
      const salary = stats.totalMasterChange // Зарплата = сумма всех "сдача мастера"

      return {
        id: stats.id,
        name: stats.name,
        city: stats.cities,
        ordersCount: stats.ordersCount,
        totalRevenue: stats.totalRevenue,
        averageCheck: Math.round(averageCheck),
        salary: salary
      }
    })

    // Сортируем по количеству заказов
    reports.sort((a, b) => b.ordersCount - a.ordersCount)

    console.log(`✅ Сформировано ${reports.length} отчетов по мастерам`)

    res.json(reports)
  } catch (error) {
    console.error('❌ Ошибка получения отчетов по мастерам:', error)
    res.status(500).json({ message: 'Внутренняя ошибка сервера' })
  }
}

export const getCityReports = async (req: Request, res: Response) => {
  try {
    console.log('📊 Получение отчетов по городам...')

    // Получаем параметры из запроса
    const userCity = req.query.city as string
    const dateFrom = req.query.dateFrom as string
    const dateTo = req.query.dateTo as string
    
    console.log('🏙️ Город директора:', userCity)
    console.log('📅 Период:', { dateFrom, dateTo })

    // Базовые условия для заказов
    const whereConditions: any = {
      statusOrder: 'Готово',
      closingData: {
        not: null // Только заказы с датой закрытия
      }
    }

    // Если указан город, фильтруем только по нему
    if (userCity && userCity !== 'all') {
      whereConditions.city = userCity
    }

    // Добавляем фильтр по дате если задан период (по дате закрытия заказа)
    if (dateFrom || dateTo) {
      // Обновляем существующее условие closingData
      if (dateFrom) {
        whereConditions.closingData.gte = new Date(dateFrom)
      }
      if (dateTo) {
        // Добавляем 1 день к dateTo чтобы включить весь день
        const endDate = new Date(dateTo)
        endDate.setDate(endDate.getDate() + 1)
        whereConditions.closingData.lt = endDate
      }
    }

    // Получаем заказы со статусом 'ready' (готово)
    const orders = await prisma.order.findMany({
      where: whereConditions,
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

    console.log(`📋 Найдено ${orders.length} закрытых заказов`)

    // Группируем по городам
    const cityStats = new Map()

    orders.forEach(order => {
      // Используем город заказа, а не города мастера
      const orderCity = order.city
      
      if (!cityStats.has(orderCity)) {
        cityStats.set(orderCity, {
          city: orderCity,
          closedOrders: 0,
          totalRevenue: 0,
          totalExpenditure: 0,
          totalClean: 0,
          totalMasterChange: 0,
          orders: []
        })
      }

      const stats = cityStats.get(orderCity)
      stats.closedOrders += 1
      stats.totalRevenue += Number(order.result || 0)
      stats.totalExpenditure += Number(order.expenditure || 0)
      stats.totalClean += Number(order.clean || 0)
      stats.totalMasterChange += Number(order.masterChange || 0)
      stats.orders.push(order)
    })

    // Получаем операции кассы (приходы и расходы)
    const cashWhereConditions: any = {
      OR: [
        { name: 'расход' },
        { name: 'приход' }
      ]
    }

    // Добавляем фильтр по дате для операций кассы
    if (dateFrom || dateTo) {
      cashWhereConditions.dateCreate = {}
      if (dateFrom) {
        cashWhereConditions.dateCreate.gte = new Date(dateFrom)
      }
      if (dateTo) {
        const endDate = new Date(dateTo)
        endDate.setDate(endDate.getDate() + 1)
        cashWhereConditions.dateCreate.lt = endDate
      }
    }

    const cashOperations = await prisma.cash.findMany({
      where: cashWhereConditions
    })

    console.log(`💰 Найдено ${cashOperations.length} операций кассы`)

    // Группируем операции кассы по городам
    const cityCash = new Map()
    cashOperations.forEach(operation => {
      const city = operation.city || 'Неизвестно'
      
      if (!cityCash.has(city)) {
        cityCash.set(city, {
          income: 0,
          expenses: 0,
          balance: 0
        })
      }

      const cityData = cityCash.get(city)
      if (operation.name === 'приход') {
        cityData.income += Number(operation.amount)
      } else if (operation.name === 'расход') {
        cityData.expenses += Number(operation.amount)
      }
      cityData.balance = cityData.income - cityData.expenses
    })

    // Формируем итоговые отчеты
    const reports = Array.from(cityStats.values()).map(stats => {
      const averageCheck = stats.closedOrders > 0 ? stats.totalRevenue / stats.closedOrders : 0
      const companyIncome = stats.totalMasterChange // Доход компании = сдача мастера
      
      // Получаем данные кассы для города
      const cashData = cityCash.get(stats.city) || { income: 0, expenses: 0, balance: 0 }

      return {
        city: stats.city,
        closedOrders: stats.closedOrders,
        averageCheck: Math.round(averageCheck),
        totalRevenue: stats.totalRevenue,
        companyIncome: companyIncome,
        cashBalance: cashData.balance // Баланс кассы = приходы - расходы
      }
    })

    // Сортируем по количеству заказов
    reports.sort((a, b) => b.closedOrders - a.closedOrders)

    console.log(`✅ Сформировано ${reports.length} отчетов по городам`)

    res.json(reports)
  } catch (error) {
    console.error('❌ Ошибка получения отчетов по городам:', error)
    res.status(500).json({ message: 'Внутренняя ошибка сервера' })
  }
}
