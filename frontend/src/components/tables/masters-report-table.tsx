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
  Search, 
  ChevronUp, 
  ChevronDown, 
  User,
  DollarSign,
  ShoppingCart,
  BarChart3
} from "lucide-react"

interface MasterReport {
  id: number
  name: string
  city: string | string[] // Поддержка одного города или массива городов
  ordersCount: number
  totalRevenue: number
  averageCheck: number
  salary: number
}

interface MastersReportTableProps {
  reports: MasterReport[]
}

export function MastersReportTable({ reports }: MastersReportTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<keyof MasterReport>("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  // Фильтрация и сортировка
  const filteredReports = reports
    .filter(report => {
      const reportCities = Array.isArray(report.city) ? report.city : [report.city]
      const cityString = reportCities.join(', ')
      
      return report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             cityString.toLowerCase().includes(searchTerm.toLowerCase())
    })
    .sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]
      
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

  const handleSort = (field: keyof MasterReport) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Общая статистика
  const totalOrders = reports.reduce((sum, report) => sum + report.ordersCount, 0)
  const totalRevenue = reports.reduce((sum, report) => sum + report.totalRevenue, 0)
  const totalSalary = reports.reduce((sum, report) => sum + report.salary, 0)

  return (
    <div className="w-full h-full flex flex-col">

      {/* Общая статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-600">Всего заказов</p>
              <p className="text-2xl font-bold text-blue-600">{totalOrders}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-600">Общий оборот</p>
              <p className="text-2xl font-bold text-green-600">₽{totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-purple-600">Общая зарплата</p>
              <p className="text-2xl font-bold text-purple-600">₽{totalSalary.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
      </div>

      {/* Поиск */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[300px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Поиск по имени мастера или городу..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
        </div>
      </div>

      {/* Таблица */}
      <div className="flex-1 overflow-auto rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center space-x-1">
                  <User className="w-4 h-4" />
                  <span>Мастер</span>
                  {sortField === "name" && (
                    sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort("city")}
              >
                <div className="flex items-center space-x-1">
                  <span>Город</span>
                  {sortField === "city" && (
                    sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort("ordersCount")}
              >
                <div className="flex items-center space-x-1">
                  <ShoppingCart className="w-4 h-4" />
                  <span>Заказов</span>
                  {sortField === "ordersCount" && (
                    sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort("totalRevenue")}
              >
                <div className="flex items-center space-x-1">
                  <span className="text-lg">₽</span>
                  <span>Оборот</span>
                  {sortField === "totalRevenue" && (
                    sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort("averageCheck")}
              >
                <div className="flex items-center space-x-1">
                  <span>Средний чек</span>
                  {sortField === "averageCheck" && (
                    sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort("salary")}
              >
                <div className="flex items-center space-x-1">
                  <User className="w-4 h-4" />
                  <span>Зарплата</span>
                  {sortField === "salary" && (
                    sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReports.map((report) => (
              <TableRow key={report.id}>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{report.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {(() => {
                      const reportCities = Array.isArray(report.city) ? report.city : [report.city]
                      return reportCities.map((city, index) => (
                        <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          {city}
                        </span>
                      ))
                    })()}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <ShoppingCart className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">{report.ordersCount}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-medium text-green-600">₽{report.totalRevenue.toLocaleString()}</span>
                </TableCell>
                <TableCell>
                  <span className="font-medium">₽{report.averageCheck.toLocaleString()}</span>
                </TableCell>
                <TableCell>
                  <span className="font-medium text-purple-600">₽{report.salary.toLocaleString()}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredReports.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Данные по мастерам не найдены
        </div>
      )}
    </div>
  )
}
