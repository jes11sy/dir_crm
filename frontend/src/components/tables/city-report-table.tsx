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
  MapPin,
  TrendingUp,
  ShoppingCart
} from "lucide-react"

interface CityReport {
  city: string
  closedOrders: number
  averageCheck: number
  totalRevenue: number
  companyIncome: number
  cashBalance: number
}

interface CityReportTableProps {
  reports: CityReport[]
}

export function CityReportTable({ reports }: CityReportTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<keyof CityReport>("city")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  // Фильтрация и сортировка
  const filteredReports = reports
    .filter(report => 
      report.city.toLowerCase().includes(searchTerm.toLowerCase())
    )
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

  const handleSort = (field: keyof CityReport) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Общая статистика
  const totalClosedOrders = reports.reduce((sum, report) => sum + report.closedOrders, 0)
  const totalRevenue = reports.reduce((sum, report) => sum + report.totalRevenue, 0)
  const totalCompanyIncome = reports.reduce((sum, report) => sum + report.companyIncome, 0)
  const totalCashBalance = reports.reduce((sum, report) => sum + report.cashBalance, 0)

  return (
    <div className="w-full h-full flex flex-col">

      {/* Общая статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-600">Всего заказов</p>
              <p className="text-2xl font-bold text-blue-600">{totalClosedOrders}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <div>
              <p className="text-sm font-medium text-green-600">Общий оборот</p>
              <p className="text-2xl font-bold text-green-600">₽{totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-purple-600">Доход компании</p>
              <p className="text-2xl font-bold text-purple-600">₽{totalCompanyIncome.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <div>
              <p className="text-sm font-medium text-gray-600">Касса</p>
              <p className={`text-2xl font-bold ${totalCashBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₽{totalCashBalance.toLocaleString()}
              </p>
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
              placeholder="Поиск по городу..."
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
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort("closedOrders")}
              >
                <div className="flex items-center space-x-1">
                  <ShoppingCart className="w-4 h-4" />
                  <span>Закрытых заказов</span>
                  {sortField === "closedOrders" && (
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
                onClick={() => handleSort("totalRevenue")}
              >
                <div className="flex items-center space-x-1">
                  <span>Оборот</span>
                  {sortField === "totalRevenue" && (
                    sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort("companyIncome")}
              >
                <div className="flex items-center space-x-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>Доход компании</span>
                  {sortField === "companyIncome" && (
                    sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort("cashBalance")}
              >
                <div className="flex items-center space-x-1">
                  <span>Касса</span>
                  {sortField === "cashBalance" && (
                    sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReports.map((report, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{report.city}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <ShoppingCart className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">{report.closedOrders}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-medium">₽{report.averageCheck.toLocaleString()}</span>
                </TableCell>
                <TableCell>
                  <span className="font-medium text-green-600">₽{report.totalRevenue.toLocaleString()}</span>
                </TableCell>
                <TableCell>
                  <span className="font-medium text-purple-600">₽{report.companyIncome.toLocaleString()}</span>
                </TableCell>
                <TableCell>
                  <span className={`font-medium ${report.cashBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₽{report.cashBalance.toLocaleString()}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredReports.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Данные по городам не найдены
        </div>
      )}
    </div>
  )
}
