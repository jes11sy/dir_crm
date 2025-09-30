"use client"

import { useState } from "react"
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
  ChevronUp, 
  ChevronDown, 
  Eye, 
  Edit, 
  Trash2,
  User,
  MapPin,
  Calendar,
  FileText,
  UserCheck,
  UserX,
  History
} from "lucide-react"
import { LoadingOverlay, TableLoadingSkeleton } from "@/components/ui/loading-spinner"
import { ErrorMessage } from "@/components/ui/error-boundary"
import { formatDateForDisplay } from "@/lib/utils"
import { config } from "@/lib/config"

interface Master {
  id: number
  cities: string[] // Массив городов
  name: string
  passportDoc?: string
  contractDoc?: string
  statusWork: string
  dateCreate: string
  note?: string
  tgId?: string
  chatId?: string
}

interface MastersTableProps {
  masters: Master[]
  onEdit?: (master: Master) => void
  onDelete?: (masterId: number) => void
  onView?: (master: Master) => void
  onHistory?: (master: Master) => void
  isLoading?: boolean
  error?: string | null
}

export function MastersTable({ masters, onEdit, onDelete, onView, onHistory, isLoading = false, error }: MastersTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [cityFilter, setCityFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortField, setSortField] = useState<keyof Master>("id")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")


  // Получаем уникальные значения для фильтров
  const cities = Array.from(new Set(masters.flatMap(master => {
    // Проверяем, есть ли поле cities (новый формат) или city (старый формат)
    const masterCities = (master as any).cities || master.city
    return Array.isArray(masterCities) ? masterCities : [masterCities]
  })))
  const statuses = Array.from(new Set(masters.map(master => master.statusWork)))

  // Фильтрация и сортировка
  const filteredMasters = masters
    .filter(master => {
      // Проверяем, есть ли поле cities (новый формат) или city (старый формат)
      const masterCities = (master as any).cities || master.city
      const citiesArray = Array.isArray(masterCities) ? masterCities : [masterCities]
      const cityString = citiesArray.join(', ')
      
      const matchesSearch = 
        master.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cityString.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (master.note && master.note.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesCity = cityFilter === "all" || citiesArray.includes(cityFilter)
      const matchesStatus = statusFilter === "all" || master.statusWork === statusFilter

      return matchesSearch && matchesCity && matchesStatus
    })
    .sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]
      
      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1
      
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc" 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }
      
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue
      }
      
      return 0
    })

  const handleSort = (field: keyof Master) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "работает": return "bg-green-100 text-green-800"
      case "уволен": return "bg-red-100 text-red-800"
      case "в отпуске": return "bg-yellow-100 text-yellow-800"
      case "больничный": return "bg-blue-100 text-blue-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "работает": return <UserCheck className="w-4 h-4 text-green-600" />
      case "уволен": return <UserX className="w-4 h-4 text-red-600" />
      default: return <User className="w-4 h-4 text-gray-600" />
    }
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
      {/* Фильтры и поиск */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[300px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Поиск по имени, городу, заметкам..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
        </div>
        
        <Select value={cityFilter} onValueChange={setCityFilter}>
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

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px] h-10">
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            {statuses.map(status => (
              <SelectItem key={status} value={status}>{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Таблица */}
      <div className="flex-1 overflow-auto rounded-md border bg-white">
        {isLoading && masters.length === 0 ? (
          <div className="p-8">
            <TableLoadingSkeleton rows={6} columns={8} />
          </div>
        ) : (
          <Table>
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
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center space-x-1">
                  <User className="w-4 h-4" />
                  <span>Имя</span>
                  {sortField === "name" && (
                    sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>Города</span>
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort("statusWork")}
              >
                <div className="flex items-center space-x-1">
                  <span>Статус</span>
                  {sortField === "statusWork" && (
                    sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort("dateCreate")}
              >
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Дата создания</span>
                  {sortField === "dateCreate" && (
                    sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </TableHead>
              <TableHead>Паспорт</TableHead>
              <TableHead>Договор</TableHead>
              <TableHead>Заметки</TableHead>
              <TableHead>Telegram ID</TableHead>
              <TableHead>Chat ID</TableHead>
              <TableHead>Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMasters.map((master) => (
              <TableRow key={master.id}>
                <TableCell className="font-medium">{master.id}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(master.statusWork)}
                    <span className="font-medium">{master.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    <div className="flex flex-wrap gap-1">
                      {master.cities.map((city, index) => (
                        <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          {city}
                        </span>
                      ))}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(master.statusWork)}`}>
                    {master.statusWork}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    <span>{formatDateForDisplay(master.dateCreate, { includeTime: false })}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {master.passportDoc ? (
                    <div className="flex items-center space-x-1 text-blue-600">
                      <FileText className="w-3 h-3" />
                      <a 
                        href={master.passportDoc.startsWith('http') ? master.passportDoc : `${config.apiUrl}/uploads/documents/${master.passportDoc}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs underline"
                      >
                        Скачать
                      </a>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">Нет</span>
                  )}
                </TableCell>
                <TableCell>
                  {master.contractDoc ? (
                    <div className="flex items-center space-x-1 text-green-600">
                      <FileText className="w-3 h-3" />
                      <a 
                        href={master.contractDoc.startsWith('http') ? master.contractDoc : `${config.apiUrl}/uploads/documents/${master.contractDoc}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs underline"
                      >
                        Скачать
                      </a>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">Нет</span>
                  )}
                </TableCell>
                <TableCell className="max-w-[200px] truncate" title={master.note}>
                  {master.note || <span className="text-gray-400">-</span>}
                </TableCell>
                <TableCell>
                  {master.tgId || <span className="text-gray-400">-</span>}
                </TableCell>
                <TableCell>
                  {master.chatId || <span className="text-gray-400">-</span>}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView?.(master)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onHistory?.(master)}
                      className="h-8 w-8 p-0"
                      title="История работы"
                    >
                      <History className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit?.(master)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete?.(master.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            </TableBody>
          </Table>
        )}
      </div>

      {filteredMasters.length === 0 && !isLoading && (
        <div className="text-center py-8 text-gray-500">
          Мастера не найдены
        </div>
      )}
    </LoadingOverlay>
  )
}
