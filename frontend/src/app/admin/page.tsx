"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, Users, Settings, Database, Activity } from "lucide-react"
import { AdminHeader } from "@/components/layout/admin-header"
import { config } from "@/lib/config"

interface AdminUser {
  id: number
  login: string
  note?: string
}

export default function AdminDashboard() {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Проверяем токен при загрузке страницы
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
          // Токен недействителен
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
          <p className="text-gray-600">Загрузка панели администратора...</p>
        </div>
      </div>
    )
  }

  if (!adminUser) {
    return null // Перенаправление происходит в useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Навигация */}
      <AdminHeader 
        adminLogin={adminUser.login}
        onLogout={handleLogout}
      />

      {/* Основной контент */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Приветствие */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Добро пожаловать в административную панель
          </h2>
          <p className="text-gray-600">
            Управляйте системой и контролируйте все процессы из единого центра
          </p>
        </div>

        {/* Статистические карточки */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Пользователи</p>
                  <p className="text-2xl font-bold text-gray-900">150</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Заказы</p>
                  <p className="text-2xl font-bold text-gray-900">1,234</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Мастера</p>
                  <p className="text-2xl font-bold text-gray-900">45</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Settings className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">База данных</p>
                  <p className="text-2xl font-bold text-gray-900">99%</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Database className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Основные функции */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900">
                <Users className="w-5 h-5 mr-2 text-blue-600" />
                Управление пользователями
              </CardTitle>
              <CardDescription>
                Просмотр, создание и редактирование учетных записей пользователей
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-gray-700 hover:bg-gray-800 text-white">
                Открыть
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900">
                <Settings className="w-5 h-5 mr-2 text-purple-600" />
                Настройки системы
              </CardTitle>
              <CardDescription>
                Конфигурация параметров системы и безопасности
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-gray-700 hover:bg-gray-800 text-white">
                Открыть
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900">
                <Database className="w-5 h-5 mr-2 text-green-600" />
                База данных
              </CardTitle>
              <CardDescription>
                Управление базой данных, резервное копирование
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-gray-700 hover:bg-gray-800 text-white">
                Открыть
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900">
                <Activity className="w-5 h-5 mr-2 text-red-600" />
                Мониторинг
              </CardTitle>
              <CardDescription>
                Отслеживание активности и производительности системы
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-gray-700 hover:bg-gray-800 text-white">
                Открыть
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900">
                <Shield className="w-5 h-5 mr-2 text-orange-600" />
                Безопасность
              </CardTitle>
              <CardDescription>
                Управление правами доступа и аудит безопасности
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-gray-700 hover:bg-gray-800 text-white">
                Открыть
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900">
                <Users className="w-5 h-5 mr-2 text-indigo-600" />
                Администраторы
              </CardTitle>
              <CardDescription>
                Управление учетными записями администраторов
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-gray-700 hover:bg-gray-800 text-white">
                Открыть
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
