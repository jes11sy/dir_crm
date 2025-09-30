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
  Calendar,
  FileText,
  User,
  TrendingUp,
  TrendingDown
} from "lucide-react"
import { LoadingOverlay, TableLoadingSkeleton } from "@/components/ui/loading-spinner"
import { ErrorMessage } from "@/components/ui/error-boundary"

interface CashOperation {
  id: number
  name: string // "приход" или "расход"
  amount: number
  note: string
  receiptDoc?: string
  dateCreate: string
  nameCreate: string
  paymentPurpose?: string
  city?: string
}

interface CashHistoryTableProps {
  operations: CashOperation[]
  isLoading?: boolean
  error?: string | null
}

export function CashHistoryTable({ operations, isLoading = false, error }: CashHistoryTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [sortField, setSortField] = useState<keyof CashOperation>("id")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  // Получаем уникальные значения для фильтров
  const types = Array.from(new Set(operations.map(op => op.name)))
  const dates = Array.from(new Set(operations.map(op => 
    new Date(op.dateCreate).toLocaleDateString('ru-RU')
  )))

  // Фильтрация и сортировка
  const filteredOperations = operations
    .filter(operation => {
      const matchesSearch = 
        operation.note.toLowerCase().includes(searchTerm.toLowerCase()) ||
        operation.nameCreate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        operation.amount.toString().includes(searchTerm)
      
      const matchesType = typeFilter === "all" || operation.name === typeFilter
      const matchesDate = dateFilter === "all" || 
        new Date(operation.dateCreate).toLocaleDateString('ru-RU') === dateFilter

      return matchesSearch && matchesType && matchesDate
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

  const handleSort = (field: keyof CashOperation) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "приход": return "bg-green-100 text-green-800"
      case "расход": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "приход": return <TrendingUp className="w-4 h-4 text-green-600" />
      case "расход": return <TrendingDown className="w-4 h-4 text-red-600" />
      default: return <DollarSign className="w-4 h-4 text-gray-600" />
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
              placeholder="Поиск по сумме, заметкам, создателю..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
        </div>
        
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px] h-10">
            <SelectValue placeholder="Тип" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все типы</SelectItem>
            {types.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-[150px] h-10">
            <SelectValue placeholder="Дата" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все даты</SelectItem>
            {dates.map(date => (
              <SelectItem key={date} value={date}>{date}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Таблица */}
      <div className="flex-1 overflow-auto rounded-md border bg-white">
        {isLoading && operations.length === 0 ? (
          <div className="p-8">
            <TableLoadingSkeleton rows={6} columns={7} />
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
                  <span>Тип</span>
                  {sortField === "name" && (
                    sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </TableHead>
              <TableHead>Город</TableHead>
              <TableHead>Назначение платежа</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort("amount")}
              >
                <div className="flex items-center space-x-1">
                  <span>Сумма</span>
                  {sortField === "amount" && (
                    sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </TableHead>
              <TableHead className="min-w-[300px]">Комментарий</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort("dateCreate")}
              >
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Дата</span>
                  {sortField === "dateCreate" && (
                    sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort("nameCreate")}
              >
                <div className="flex items-center space-x-1">
                  <User className="w-4 h-4" />
                  <span>Создатель</span>
                  {sortField === "nameCreate" && (
                    sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </TableHead>
            <TableHead>Документ</TableHead>
          </TableRow>
        </TableHeader>
          <TableBody>
            {filteredOperations.map((operation) => (
              <TableRow key={operation.id}>
                <TableCell className="font-medium">{operation.id}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(operation.name)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(operation.name)}`}>
                      {operation.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {operation.city || <span className="text-gray-400">-</span>}
                </TableCell>
                <TableCell className="max-w-[200px] truncate" title={operation.paymentPurpose}>
                  {operation.paymentPurpose || <span className="text-gray-400">-</span>}
                </TableCell>
                <TableCell>
                  <div className={`font-medium ${operation.name === "приход" ? "text-green-600" : "text-red-600"}`}>
                    {operation.name === "приход" ? "+" : "-"}₽{operation.amount.toLocaleString()}
                  </div>
                </TableCell>
                <TableCell className="max-w-[300px]">
                  <div className="text-sm whitespace-pre-wrap break-words" title={operation.note}>
                    {operation.note || <span className="text-gray-400">-</span>}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    <span>{new Date(operation.dateCreate).toLocaleDateString('ru-RU')}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <User className="w-3 h-3 text-gray-400" />
                    <span>{operation.nameCreate}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {operation.receiptDoc ? (
                    <div className="flex items-center space-x-1 text-blue-600">
                      <FileText className="w-3 h-3" />
                      <a 
                        href={operation.receiptDoc.startsWith('http') ? operation.receiptDoc : `http://localhost:3002/uploads/documents/${operation.receiptDoc}`}
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
              </TableRow>
            ))}
            </TableBody>
          </Table>
        )}
      </div>

      {filteredOperations.length === 0 && !isLoading && (
        <div className="text-center py-8 text-gray-500">
          Операции не найдены
        </div>
      )}
    </LoadingOverlay>
  )
}
