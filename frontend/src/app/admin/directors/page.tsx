"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminHeader } from "@/components/layout/admin-header"
import { DirectorAddModal } from "@/components/modals/director-add-modal"
import { DirectorEditModal } from "@/components/modals/director-edit-modal"
import { DirectorDeleteModal } from "@/components/modals/director-delete-modal"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Plus, Search, Shield, Edit, Trash2 } from "lucide-react"
import { formatDateForDisplay } from "@/lib/utils"
import { config } from "@/lib/config"

interface AdminUser {
  id: number
  login: string
  note?: string
}

interface Director {
  id: number
  name: string
  login: string
  cities: string[]
  note?: string
  tgId?: string
  dateCreate: string
  createdAt: string
  updatedAt: string
}

export default function AdminDirectorsPage() {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedDirector, setSelectedDirector] = useState<Director | null>(null)
  const [directors, setDirectors] = useState<Director[]>([])
  const [directorsLoading, setDirectorsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const verifyAdminToken = async () => {
      const token = localStorage.getItem('adminToken')
      
      if (!token) {
        router.push('/adlogin')
        return
      }

      try {
        const response = await fetch('${config.apiUrl}/api/admin/auth/verify', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const result = await response.json()
          setAdminUser(result.admin)
          // Загружаем директоров после успешной авторизации
          loadDirectors()
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

  const loadDirectors = async () => {
    setDirectorsLoading(true)
    try {
      const token = localStorage.getItem('adminToken')
      
      const response = await fetch('${config.apiUrl}/api/admin/directors', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        setDirectors(result.directors || [])
      } else {
        console.error('Ошибка загрузки директоров')
      }
    } catch (error) {
      console.error('Ошибка загрузки директоров:', error)
    } finally {
      setDirectorsLoading(false)
    }
  }

  const handleDirectorAdded = () => {
    loadDirectors() // Обновляем список директоров
    console.log('Директор добавлен успешно')
  }

  const handleEditDirector = (director: Director) => {
    setSelectedDirector(director)
    setIsEditModalOpen(true)
  }

  const handleDeleteDirector = (director: Director) => {
    setSelectedDirector(director)
    setIsDeleteModalOpen(true)
  }

  const handleDirectorUpdated = () => {
    loadDirectors() // Обновляем список директоров
    setSelectedDirector(null)
    console.log('Директор обновлен успешно')
  }

  const handleDirectorDeleted = () => {
    loadDirectors() // Обновляем список директоров
    setSelectedDirector(null)
    console.log('Директор удален успешно')
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
                Управление директорами
              </h2>
              <p className="text-gray-600">
                Просмотр и управление учетными записями директоров по городам
              </p>
            </div>
            <Button 
              className="bg-gray-700 hover:bg-gray-800 text-white"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Добавить директора
            </Button>
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
                  placeholder="Поиск директоров..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
              </div>
              <Button variant="outline" className="border-gray-300">
                Фильтры
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Всего директоров</p>
                  <p className="text-2xl font-bold text-gray-900">{directors.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Активных</p>
                  <p className="text-2xl font-bold text-gray-900">{directors.length}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Городов</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {new Set(directors.flatMap(d => d.cities)).size}
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
                  <p className="text-gray-500 text-sm">Новых за месяц</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {directors.filter(d => {
                      const created = new Date(d.createdAt)
                      const monthAgo = new Date()
                      monthAgo.setMonth(monthAgo.getMonth() - 1)
                      return created > monthAgo
                    }).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Таблица директоров */}
        <Card>
          <CardHeader>
            <CardTitle>Список директоров</CardTitle>
            <CardDescription>
              Все зарегистрированные директора и их статус
            </CardDescription>
          </CardHeader>
          <CardContent>
            {directorsLoading ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
                <p className="text-gray-500">Загрузка директоров...</p>
              </div>
            ) : directors.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Нет директоров
                </h3>
                <p className="text-gray-500 mb-4">
                  Пока не добавлено ни одного директора
                </p>
                <Button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-gray-700 hover:bg-gray-800 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить первого директора
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Директор
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Логин
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Города
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Telegram
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Дата создания
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {directors.map((director) => (
                      <tr key={director.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {director.name}
                            </div>
                            {director.note && (
                              <div className="text-sm text-gray-500">
                                {director.note}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{director.login}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {director.cities.map((city, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {city}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {director.tgId || '—'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDateForDisplay(director.createdAt, { includeTime: false })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mr-2"
                            onClick={() => handleEditDirector(director)}
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Редактировать
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteDirector(director)}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Удалить
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Модальные окна */}
      <DirectorAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleDirectorAdded}
      />

      <DirectorEditModal
        isOpen={isEditModalOpen}
        director={selectedDirector}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedDirector(null)
        }}
        onSuccess={handleDirectorUpdated}
      />

      <DirectorDeleteModal
        isOpen={isDeleteModalOpen}
        director={selectedDirector}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setSelectedDirector(null)
        }}
        onSuccess={handleDirectorDeleted}
      />
    </div>
  )
}
