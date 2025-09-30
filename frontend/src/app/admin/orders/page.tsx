"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminHeader } from "@/components/layout/admin-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Package, Search, Filter, Download, Shield, CheckCircle, Clock, XCircle } from "lucide-react"
import { config } from "@/lib/config"

interface AdminUser {
  id: number
  login: string
  note?: string
}

export default function AdminOrdersPage() {
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
        console.error('Ошибка проверки токена:', error)
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
                Управление заказами
              </h2>
              <p className="text-gray-600">
                Полный контроль над всеми заказами в системе
              </p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" className="border-gray-300">
                <Download className="w-4 h-4 mr-2" />
                Экспорт
              </Button>
              <Button className="bg-gray-700 hover:bg-gray-800 text-white">
                <Filter className="w-4 h-4 mr-2" />
                Настроить фильтры
              </Button>
            </div>
          </div>
        </div>

        {/* Поиск и фильтры */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Поиск заказов по номеру, клиенту, телефону..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
              </div>
              <select className="border border-gray-200 rounded-lg px-3 py-2 bg-white">
                <option value="">Все статусы</option>
                <option value="новый">Новый</option>
                <option value="в работе">В работе</option>
                <option value="выполнен">Выполнен</option>
                <option value="отменен">Отменен</option>
              </select>
              <select className="border border-gray-200 rounded-lg px-3 py-2 bg-white">
                <option value="">Все города</option>
                <option value="Москва">Москва</option>
                <option value="Спб">Санкт-Петербург</option>
                <option value="Екатеринбург">Екатеринбург</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Статистика заказов */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Всего заказов</p>
                  <p className="text-2xl font-bold text-gray-900">1,234</p>
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
                  <p className="text-gray-500 text-sm">Выполнено</p>
                  <p className="text-2xl font-bold text-gray-900">987</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">В работе</p>
                  <p className="text-2xl font-bold text-gray-900">156</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Отменено</p>
                  <p className="text-2xl font-bold text-gray-900">91</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Таблица заказов */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Список заказов</CardTitle>
                <CardDescription>
                  Все заказы с возможностью детального просмотра и управления
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  10 на странице
                </Button>
                <Button variant="outline" size="sm">
                  Обновить
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Таблица заказов
              </h3>
              <p className="text-gray-500 mb-4">
                Здесь будет отображаться список всех заказов с возможностью:
              </p>
              <div className="text-sm text-gray-500 space-y-1">
                <p>• Просмотр деталей заказа</p>
                <p>• Изменение статуса</p>
                <p>• Назначение мастера</p>
                <p>• Редактирование информации</p>
                <p>• Экспорт данных</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
