"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Navigation } from "@/components/layout/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  User, 
  Wrench, 
  DollarSign,
  TrendingUp,
  Clock
} from "lucide-react"
import Link from "next/link"

interface Master {
  id: number
  name: string
  city: string
  statusWork: string
}

interface Order {
  id: number
  rk: string
  clientName: string
  address: string
  dateMeeting: string
  statusOrder: string
  result: number | null
  expenditure: number | null
  clean: number | null
  createdAt: string
}

export default function MasterHistoryPage() {
  const params = useParams()
  const masterId = params.id
  const [master, setMaster] = useState<Master | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (masterId) {
      loadMasterData()
    }
  }, [masterId])

  const loadMasterData = async () => {
    try {
      console.log('🔄 Загружаем данные мастера...')
      
      // Загружаем данные мастера
      const masterResponse = await fetch(`${config.apiUrl}/api/masters/${masterId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (masterResponse.ok) {
        const masterData = await masterResponse.json()
        setMaster(masterData)
        setOrders(masterData.orders || [])
      } else {
        throw new Error(`Ошибка загрузки мастера: ${masterResponse.status}`)
      }
    } catch (error) {
      console.error("❌ Ошибка загрузки данных мастера:", error)
      // Fallback к тестовым данным
      const mockMaster: Master = {
        id: Number(masterId),
        name: "Алексей Мастеров",
        city: "СПб",
        statusWork: "работает"
      }
      const mockOrders: Order[] = [
        {
          id: 1,
          rk: "RK001",
          clientName: "Иван Петров",
          address: "ул. Тверская, д. 1, кв. 10",
          dateMeeting: "2024-01-15T10:00:00Z",
          statusOrder: "завершен",
          result: 5000,
          expenditure: 1000,
          clean: 4000,
          createdAt: "2024-01-15T09:00:00Z"
        },
        {
          id: 2,
          rk: "RK002",
          clientName: "Мария Сидорова",
          address: "пр. Невский, д. 50, кв. 25",
          dateMeeting: "2024-01-16T14:00:00Z",
          statusOrder: "завершен",
          result: 3000,
          expenditure: 500,
          clean: 2500,
          createdAt: "2024-01-16T13:00:00Z"
        }
      ]
      setMaster(mockMaster)
      setOrders(mockOrders)
    } finally {
      setLoading(false)
    }
  }

  // Статистика
  const completedOrders = orders.filter(order => order.statusOrder === "завершен")
  const totalRevenue = completedOrders.reduce((sum, order) => sum + (order.result || 0), 0)
  const totalExpenditure = completedOrders.reduce((sum, order) => sum + (order.expenditure || 0), 0)
  const totalClean = completedOrders.reduce((sum, order) => sum + (order.clean || 0), 0)
  const averageCheck = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <Navigation />
          <main className="container mx-auto p-6">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navigation />
        
        <main className="container mx-auto p-6">
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <Link href="/masters">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Назад к мастерам
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold">История работы мастера</h1>
                <p className="text-muted-foreground">
                  {master?.name} - {master?.city}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            {/* Статистика */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Завершенных заказов</CardTitle>
                  <Wrench className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{completedOrders.length}</div>
                  <p className="text-xs text-muted-foreground">из {orders.length} всего</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Общий доход</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">₽{totalRevenue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">за все время</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Средний чек</CardTitle>
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">₽{Math.round(averageCheck).toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">за заказ</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Зарплата</CardTitle>
                  <User className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">₽{totalClean.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">чистый доход</p>
                </CardContent>
              </Card>
            </div>

            {/* История заказов */}
            <Card>
              <CardHeader>
                <CardTitle>История заказов</CardTitle>
                <CardDescription>
                  Все заказы, выполненные мастером {master?.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">
                            {new Date(order.dateMeeting).toLocaleDateString('ru-RU')}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{order.clientName}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{order.address}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="font-medium">₽{order.result?.toLocaleString() || 0}</div>
                          <div className="text-sm text-gray-500">{order.statusOrder}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">РК: {order.rk}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
