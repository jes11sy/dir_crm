"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminHeader } from "@/components/layout/admin-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3, TrendingUp, Users, Package, Shield, Calendar } from "lucide-react"
import { config } from "@/lib/config"

interface AdminUser {
  id: number
  login: string
  note?: string
}

export default function AdminStatisticsPage() {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const verifyAdminToken = async () => {
      const token = localStorage.getItem('adminToken')
      
      if (!token) {
        router.push('/adlogin')
        return
      }

      try {
        const response = await fetch(`${config.apiUrl}/api/admin/auth/verify`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const result = await response.json()
          setAdminUser(result.admin)
        } else {
          localStorage.removeItem('adminToken')
          localStorage.removeItem('adminUser')
          router.push('/adlogin')
        }
      } catch (error) {
        router.push('/adlogin')
      } finally {
        setIsLoading(false)
      }
    }

    verifyAdminToken()
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
    router.push('/adlogin')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-gray-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    )
  }

  if (!adminUser) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader 
        adminLogin={adminUser.login}
        onLogout={handleLogout}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Заголовок страницы */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Статистика и аналитика
              </h2>
              <p className="text-gray-600">
                Детальная аналитика работы системы и бизнес-показатели
              </p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" className="border-gray-300">
                <Calendar className="w-4 h-4 mr-2" />
                Выбрать период
              </Button>
              <Button className="bg-gray-700 hover:bg-gray-800 text-white">
                Экспорт отчета
              </Button>
            </div>
          </div>
        </div>

        {/* Основные показатели */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Заказы за месяц</p>
                  <p className="text-2xl font-bold text-gray-900">1,234</p>
                  <p className="text-green-600 text-sm flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +12% к предыдущему месяцу
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Выручка</p>
                  <p className="text-2xl font-bold text-gray-900">₽2.4M</p>
                  <p className="text-green-600 text-sm flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +8% к предыдущему месяцу
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Активных мастеров</p>
                  <p className="text-2xl font-bold text-gray-900">45</p>
                  <p className="text-green-600 text-sm flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +3 новых
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Средний чек</p>
                  <p className="text-2xl font-bold text-gray-900">₽1,950</p>
                  <p className="text-red-600 text-sm flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1 rotate-180" />
                    -2% к предыдущему месяцу
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Графики и отчеты */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Динамика заказов</CardTitle>
              <CardDescription>
                Количество заказов по дням за последний месяц
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">График заказов</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Распределение по городам</CardTitle>
              <CardDescription>
                Процентное соотношение заказов по городам
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Диаграмма городов</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Таблицы с детальной статистикой */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Топ мастеров</CardTitle>
              <CardDescription>
                Рейтинг мастеров по количеству выполненных заказов
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Таблица топ мастеров</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Статистика по городам</CardTitle>
              <CardDescription>
                Детализация показателей по каждому городу
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Таблица по городам</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
