"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Navigation } from "@/components/layout/navigation"
import { OrdersTable } from "@/components/tables/orders-table"
import OrderEditModal from "@/components/modals/order-edit-modal"
import { OrderViewModal } from "@/components/modals/order-view-modal"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface Order {
  id: number
  rk: string
  city: string
  avitoName: string
  phone: string
  typeOrder: string
  clientName: string
  address: string
  dateMeeting: string
  typeEquipment: string
  problem: string
  statusOrder: string
  masterId: number | null
  master?: {
    id: number
    name: string
    city: string
  }
  result: number | null
  expenditure: number | null
  clean: number | null
  masterChange: number | null
}

interface Master {
  id: number
  name: string
  city: string
  status_work: string
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [masters, setMasters] = useState<Master[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  const [filterOptions, setFilterOptions] = useState({
    statuses: [],
    cities: [],
    masters: []
  })
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    city: 'all',
    master: 'all'
  })

  // Загрузка данных
  useEffect(() => {
    loadOrders()
    loadMasters()
    loadFilterOptions()
  }, [])

  const loadOrders = async (page: number = 1) => {
    try {
      console.log('🔄 Загружаем заказы...')
      
      // Строим URL с параметрами фильтрации
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      })
      
      if (filters.search) params.append('search', filters.search)
      if (filters.status !== 'all') params.append('status', filters.status)
      if (filters.city !== 'all') params.append('city', filters.city)
      if (filters.master !== 'all') params.append('master', filters.master)
      
      const response = await fetch(`http://localhost:3002/api/orders?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      console.log('📡 Ответ сервера:', response.status, response.statusText)
      
      if (!response.ok) {
        throw new Error(`Ошибка загрузки заказов: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('📦 Данные заказов:', data)
      setOrders(data.orders || [])
      setPagination(data.pagination || { page: 1, limit: 10, total: 0, pages: 0 })
    } catch (error) {
      console.error("❌ Ошибка загрузки заказов:", error)
      // Fallback к тестовым данным
      const mockOrders: Order[] = [
        {
          id: 1,
          rk: "RK001",
          city: "Москва",
          avitoName: "Иван Петров",
          phone: "+7 (999) 123-45-67",
          typeOrder: "ремонт",
          clientName: "Иван Петров",
          address: "ул. Тверская, д. 1, кв. 10",
          dateMeeting: "2024-01-15T10:00:00Z",
          typeEquipment: "стиральная машина",
          problem: "Не включается, не крутится барабан",
          statusOrder: "новый",
          masterId: null,
          result: null
        },
        {
          id: 2,
          rk: "RK002",
          city: "СПб",
          avitoName: "Мария Сидорова",
          phone: "+7 (999) 234-56-78",
          typeOrder: "диагностика",
          clientName: "Мария Сидорова",
          address: "пр. Невский, д. 50, кв. 25",
          dateMeeting: "2024-01-16T14:00:00Z",
          typeEquipment: "холодильник",
          problem: "Не морозит, странные звуки",
          statusOrder: "в работе",
          masterId: 1,
          master: {
            id: 1,
            name: "Алексей Мастеров",
            city: "СПб"
          },
          result: null
        }
      ]
      console.log('🔄 Используем тестовые данные')
      setOrders(mockOrders)
    } finally {
      setLoading(false)
    }
  }

  const loadMasters = async () => {
    try {
      console.log('🔄 Загружаем мастеров...')
      const response = await fetch('http://localhost:3002/api/masters', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      console.log('📡 Ответ сервера (мастера):', response.status, response.statusText)
      
      if (!response.ok) {
        throw new Error(`Ошибка загрузки мастеров: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('📦 Данные мастеров:', data)
      setMasters(data.masters || [])
    } catch (error) {
      console.error("❌ Ошибка загрузки мастеров:", error)
      // Fallback к тестовым данным
      const mockMasters: Master[] = [
        {
          id: 1,
          name: "Алексей Мастеров",
          city: "СПб",
          status_work: "работает"
        },
        {
          id: 2,
          name: "Петр Ремонтников",
          city: "Москва",
          status_work: "работает"
        }
      ]
      console.log('🔄 Используем тестовые данные мастеров')
      setMasters(mockMasters)
    }
  }

  const loadFilterOptions = async () => {
    try {
      console.log('🔄 Загружаем опции фильтров...')
      const response = await fetch('http://localhost:3002/api/orders/filter-options', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('📦 Опции фильтров:', data)
        setFilterOptions(data)
      } else {
        console.log('⚠️ API фильтров недоступен, используем данные из текущей страницы')
      }
    } catch (error) {
      console.error("❌ Ошибка загрузки опций фильтров:", error)
    }
  }

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order)
    setIsEditModalOpen(true)
  }

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order)
    setIsViewModalOpen(true)
  }

  const handleDeleteOrder = async (orderId: number) => {
    if (confirm("Вы уверены, что хотите удалить этот заказ?")) {
      try {
        // Здесь будет API запрос на удаление
        setOrders(orders.filter(order => order.id !== orderId))
        console.log("Заказ удален:", orderId)
      } catch (error) {
        console.error("Ошибка удаления заказа:", error)
      }
    }
  }

  const handleSaveOrder = async (updatedOrder: Order) => {
    try {
        console.log("📤 Отправляем данные заказа:", JSON.stringify(updatedOrder, null, 2))
        
        const response = await fetch(`http://localhost:3002/api/orders/${updatedOrder.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updatedOrder)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ Ошибка ${response.status}:`, errorText)
        throw new Error(`Ошибка сохранения заказа: ${response.status}`)
      }

      const data = await response.json()
      setOrders(orders.map(order =>
        order.id === updatedOrder.id ? data.order : order
      ))
      console.log("✅ Заказ сохранен:", data.order)
    } catch (error) {
      console.error("❌ Ошибка сохранения заказа:", error)
      // Fallback к локальному обновлению
      setOrders(orders.map(order =>
        order.id === updatedOrder.id ? updatedOrder : order
      ))
    }
  }

  const handleNewOrder = () => {
    // Здесь будет логика создания нового заказа
    console.log("Создание нового заказа")
  }

  const handlePageChange = (page: number) => {
    setLoading(true)
    loadOrders(page)
  }

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters)
    setLoading(true)
    
    // Для поиска добавляем небольшую задержку
    if (newFilters.search !== filters.search) {
      setTimeout(() => {
        loadOrders(1)
      }, 500)
    } else {
      loadOrders(1) // Сбрасываем на первую страницу при изменении фильтров
    }
  }

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
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navigation />
        
        <main className="flex-1 p-4 lg:p-6">
          <div className="w-full">
            <OrdersTable
              orders={orders}
              onEdit={handleEditOrder}
              onView={handleViewOrder}
              onDelete={handleDeleteOrder}
              pagination={pagination}
              onPageChange={handlePageChange}
              filterOptions={filterOptions}
              filters={filters}
              onFilterChange={handleFilterChange}
            />
          </div>
        </main>

        {/* Модальные окна */}
        <OrderEditModal
          order={selectedOrder}
          masters={masters}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveOrder}
        />

        <OrderViewModal
          order={selectedOrder}
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          onEdit={handleEditOrder}
          onDelete={handleDeleteOrder}
        />
      </div>
    </ProtectedRoute>
  )
}