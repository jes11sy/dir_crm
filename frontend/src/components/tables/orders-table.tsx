"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Search, 
  Filter, 
  ChevronUp, 
  ChevronDown, 
  Eye, 
  Edit, 
  User,
  MapPin,
  Calendar,
  Phone,
  Wrench
} from "lucide-react"
import { LoadingOverlay, TableLoadingSkeleton } from "@/components/ui/loading-spinner"
import { ErrorMessage } from "@/components/ui/error-boundary"
import { formatDateForDisplay } from "@/lib/utils"

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

interface OrdersTableProps {
  orders: Order[]
  onEdit?: (order: Order) => void
  onDelete?: (orderId: number) => void
  onView?: (order: Order) => void
  isLoading?: boolean
  error?: string | null
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
  onPageChange?: (page: number) => void
  filterOptions?: {
    statuses: string[]
    cities: string[]
    masters: string[]
  }
  filters?: {
    search: string
    status: string
    city: string
    master: string
  }
  onFilterChange?: (filters: any) => void
}

export function OrdersTable({ orders, onEdit, onDelete, onView, isLoading = false, error, pagination, onPageChange, filterOptions, filters, onFilterChange }: OrdersTableProps) {
  const [searchTerm, setSearchTerm] = useState(filters?.search || "")
  const [statusFilter, setStatusFilter] = useState(filters?.status || "all")
  const [cityFilter, setCityFilter] = useState(filters?.city || "all")
  const [masterFilter, setMasterFilter] = useState(filters?.master || "all")

  // Синхронизируем локальное состояние с пропсами
  useEffect(() => {
    if (filters) {
      setSearchTerm(filters.search || "")
      setStatusFilter(filters.status || "all")
      setCityFilter(filters.city || "all")
      setMasterFilter(filters.master || "all")
    }
  }, [filters])
  const [sortField, setSortField] = useState<keyof Order>("id")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  // Получаем уникальные значения для фильтров
  const cities = filterOptions?.cities?.length > 0 
    ? filterOptions.cities 
    : Array.from(new Set(orders.map(order => order.city)))
  
  const masters = filterOptions?.masters?.length > 0 
    ? filterOptions.masters 
    : Array.from(new Set(orders.map(order => order.master?.name).filter(Boolean)))
  
  // Простое решение - используем данные из текущих заказов
  const statuses = Array.from(new Set(orders.map(order => order.statusOrder)))
  
  // Создаем маппинг статусов для фильтра
  const statusMapping = {
    'Ожидает': 'pending',
    'Модерн': 'modern', 
    'Готово': 'ready',
    'Отказ': 'refusal',
    'Незаказ': 'no_order'
  }

  // Фильтрация происходит на сервере, поэтому просто используем orders
  const filteredOrders = orders

  const handleSort = (field: keyof Order) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-blue-100 text-blue-800"
      case "accepted": return "bg-green-100 text-green-800"
      case "in_work": return "bg-yellow-100 text-yellow-800"
      case "ready": return "bg-emerald-100 text-emerald-800"
      case "refusal": return "bg-red-100 text-red-800"
      case "modern": return "bg-purple-100 text-purple-800"
      case "no_order": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const translateOrderType = (typeOrder: string) => {
    switch (typeOrder) {
      case "first_time": return "Впервые"
      case "repeat": return "Повтор"
      case "warranty": return "Гарантия"
      default: return typeOrder
    }
  }

  const translateEquipment = (equipment: string) => {
    switch (equipment) {
      case "kp": return "КП"
      case "bt": return "БТ"
      case "mnch": return "МНЧ"
      default: return equipment
    }
  }

  const translateStatus = (status: string) => {
    switch (status) {
      case "pending": return "Ожидает"
      case "accepted": return "Принял"
      case "in_work": return "В работе"
      case "ready": return "Готово"
      case "refusal": return "Отказ"
      case "modern": return "Модерн"
      case "no_order": return "Незаказ"
      default: return status
    }
  }

  // Генерируем временные слоты от 10:00 до 22:00 с интервалом 30 минут
  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 10; hour <= 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 22 && minute > 0) break // Останавливаемся на 22:00
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        slots.push(timeString)
      }
    }
    return slots
  }

  const timeSlots = generateTimeSlots()

  // Подсчитываем заявки по времени и направлению (только на сегодня)
  const getOrdersCountByTime = (timeSlot: string, direction: string) => {
    const today = new Date()
    const todayDateString = today.toLocaleDateString('ru-RU')
    
    const matchingOrders = orders.filter(order => {
      // Обрабатываем дату как локальную (без UTC конвертации)
      let localDateString = order.dateMeeting.replace('Z', '').replace(' ', 'T')
      if (!localDateString.includes('T')) {
        localDateString += 'T00:00:00'
      }
      const orderTime = new Date(localDateString)
      const orderTimeString = `${orderTime.getHours().toString().padStart(2, '0')}:${orderTime.getMinutes().toString().padStart(2, '0')}`
      
      // Проверяем, что заказ на сегодня
      const orderDateString = orderTime.toLocaleDateString('ru-RU')
      const isToday = orderDateString === todayDateString
      
      // Сопоставляем типы оборудования (проверяем и английские, и русские значения)
      let matchesDirection = false
      switch (direction) {
        case 'КП':
          matchesDirection = order.typeEquipment === 'kp' || order.typeEquipment === 'КП'
          break
        case 'БТ':
          matchesDirection = order.typeEquipment === 'bt' || order.typeEquipment === 'БТ'
          break
        case 'МНЧ':
          matchesDirection = order.typeEquipment === 'mnch' || order.typeEquipment === 'МНЧ'
          break
        default:
          matchesDirection = false
      }
      
      return orderTimeString === timeSlot && matchesDirection && isToday
    })
    
    
    return matchingOrders.length
  }

  // Показываем ошибку если есть
  if (error) {
    return (
      <div className="w-full h-full flex flex-col">
        <ErrorMessage error={error} className="mb-4" />
      </div>
    )
  }

  return (
    <LoadingOverlay isLoading={isLoading} className="w-full h-full flex flex-col">
      {/* Мини-таблица расписания */}
      <div className="mb-6 w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full">
            <thead>
              <tr>
                <th className="px-4 py-3 text-center font-semibold text-gray-800"></th>
                {timeSlots.map((timeSlot) => (
                  <th key={timeSlot} className="px-3 py-3 text-center text-sm font-bold text-blue-600 bg-blue-50">
                    {timeSlot}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-3 text-center font-bold text-gray-800">КП</td>
                {timeSlots.map((timeSlot) => {
                  const count = getOrdersCountByTime(timeSlot, 'КП')
                  return (
                    <td key={timeSlot} className="px-3 py-3 text-center">
                      <div className={`text-lg font-bold ${
                        count === 0 ? 'text-gray-400' : 
                        count <= 2 ? 'text-green-600' : 
                        count <= 4 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {count}
                      </div>
                    </td>
                  )
                })}
              </tr>
              <tr>
                <td className="px-4 py-3 text-center font-bold text-gray-800">БТ</td>
                {timeSlots.map((timeSlot) => {
                  const count = getOrdersCountByTime(timeSlot, 'БТ')
                  return (
                    <td key={timeSlot} className="px-3 py-3 text-center">
                      <div className={`text-lg font-bold ${
                        count === 0 ? 'text-gray-400' : 
                        count <= 2 ? 'text-green-600' : 
                        count <= 4 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {count}
                      </div>
                    </td>
                  )
                })}
              </tr>
              <tr>
                <td className="px-4 py-3 text-center font-bold text-gray-800">МНЧ</td>
                {timeSlots.map((timeSlot) => {
                  const count = getOrdersCountByTime(timeSlot, 'МНЧ')
                  return (
                    <td key={timeSlot} className="px-3 py-3 text-center">
                      <div className={`text-lg font-bold ${
                        count === 0 ? 'text-gray-400' : 
                        count <= 2 ? 'text-green-600' : 
                        count <= 4 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {count}
                      </div>
                    </td>
                  )
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Фильтры и поиск */}
      <div className="flex flex-wrap gap-4 mb-6 w-full">
        <div className="flex-1 min-w-[300px]">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Поиск по телефону, имени клиента..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                // Debounce будет обработан в родительском компоненте
                onFilterChange?.({
                  ...filters,
                  search: e.target.value
                })
              }}
              className="pl-10 h-10 w-full"
            />
          </div>
        </div>
        
        <Select value={statusFilter} onValueChange={(value) => {
          setStatusFilter(value)
          onFilterChange?.({
            ...filters,
            status: value
          })
        }}>
          <SelectTrigger className="w-[150px] h-10">
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            {statuses.map(status => (
              <SelectItem key={status} value={status}>
                {statusMapping[status as keyof typeof statusMapping] || status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={cityFilter} onValueChange={(value) => {
          setCityFilter(value)
          onFilterChange?.({
            ...filters,
            city: value
          })
        }}>
          <SelectTrigger className="w-[150px] h-10">
            <SelectValue placeholder="Город" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все города</SelectItem>
            {cities.map(city => (
              <SelectItem key={city} value={city}>{city}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={masterFilter} onValueChange={(value) => {
          setMasterFilter(value)
          onFilterChange?.({
            ...filters,
            master: value
          })
        }}>
          <SelectTrigger className="w-[150px] h-10">
            <SelectValue placeholder="Мастер" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все мастера</SelectItem>
            {masters.map(master => (
              <SelectItem key={master} value={master}>{master}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Таблица */}
      <div className="flex-1 overflow-auto rounded-md border bg-white w-full">
        {isLoading && orders.length === 0 ? (
          <div className="p-8">
            <TableLoadingSkeleton rows={8} columns={12} />
          </div>
        ) : (
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort("id")}
                >
                  <div className="flex items-center space-x-1">
                    <span>ID</span>
                    {sortField === "id" && (
                      sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort("rk")}
                >
                  <div className="flex items-center space-x-1">
                    <span>РК</span>
                    {sortField === "rk" && (
                      sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort("city")}
                >
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>Город</span>
                    {sortField === "city" && (
                      sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead>Имя мастера</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort("phone")}
                >
                  <div className="flex items-center space-x-1">
                    <Phone className="w-4 h-4" />
                    <span>Телефон</span>
                    {sortField === "phone" && (
                      sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead>Тип заказа</TableHead>
                <TableHead>Клиент</TableHead>
                <TableHead>Адрес</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort("date_meeting")}
                >
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Дата встречи</span>
                    {sortField === "date_meeting" && (
                      sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead>Техника</TableHead>
                <TableHead>Проблема</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort("status_order")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Статус</span>
                    {sortField === "status_order" && (
                      sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort("master_name")}
                >
                  <div className="flex items-center space-x-1">
                    <User className="w-4 h-4" />
                    <span>Мастер</span>
                    {sortField === "master_name" && (
                      sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort("result")}
                >
                  <div className="flex items-center space-x-1">
                    <Wrench className="w-4 h-4" />
                    <span>Итог</span>
                    {sortField === "result" && (
                      sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.rk}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <span>{order.city}</span>
                    </div>
                  </TableCell>
                  <TableCell>{order.avitoName}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Phone className="w-3 h-3 text-gray-400" />
                      <span>{order.phone}</span>
                    </div>
                  </TableCell>
                  <TableCell>{translateOrderType(order.typeOrder)}</TableCell>
                  <TableCell>{order.clientName}</TableCell>
                  <TableCell className="max-w-[200px] truncate" title={order.address}>
                    {order.address}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span>{formatDateForDisplay(order.dateMeeting)}</span>
                    </div>
                  </TableCell>
                  <TableCell>{translateEquipment(order.typeEquipment)}</TableCell>
                  <TableCell className="max-w-[200px] truncate" title={order.problem}>
                    {order.problem}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.statusOrder)}`}>
                      {translateStatus(order.statusOrder)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {order.master ? (
                      <div className="flex items-center space-x-1">
                        <User className="w-3 h-3 text-gray-400" />
                        <span>{order.master.name}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">Не назначен</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {order.result ? (
                      <span className="font-medium">₽{order.result}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView?.(order)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit?.(order)}
                        disabled={['ready', 'refusal', 'no_order'].includes(order.statusOrder)}
                        className="h-8 w-8 p-0"
                        title={['ready', 'refusal', 'no_order'].includes(order.statusOrder) ? 'Заказ нельзя редактировать' : 'Редактировать заказ'}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {filteredOrders.length === 0 && !isLoading && (
        <div className="text-center py-8 text-gray-500">
          Заказы не найдены
        </div>
      )}

      {/* Пагинация */}
      {pagination && onPageChange && (
        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
          <div className="text-sm text-gray-700">
            Показано {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} из {pagination.total} заказов
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Назад
            </button>
            
            <span className="text-sm text-gray-700">
              Страница {pagination.page} из {pagination.pages}
            </span>
            
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Вперед
            </button>
          </div>
        </div>
      )}
    </LoadingOverlay>
  )
}