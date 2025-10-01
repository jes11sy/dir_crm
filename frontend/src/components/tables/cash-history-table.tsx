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
import { config } from "@/lib/config"

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
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
  onPageChange?: (page: number) => void
  filters?: {
    type: string
    dateFrom: string
    dateTo: string
  }
  onFilterChange?: (filters: any) => void
}

export function CashHistoryTable({ operations, isLoading = false, error, pagination, onPageChange, filters, onFilterChange }: CashHistoryTableProps) {
  const [typeFilter, setTypeFilter] = useState(filters?.type || "all")

  // Фильтрация на сервере, поэтому просто используем operations
  const filteredOperations = operations

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

      {/* Фильтры */}
      <div className="flex flex-wrap gap-4 mb-6">
        <Select value={typeFilter} onValueChange={(value) => {
          setTypeFilter(value)
          onFilterChange?.({
            ...filters,
            type: value
          })
        }}>
          <SelectTrigger className="w-[150px] h-10">
            <SelectValue placeholder="Тип" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все типы</SelectItem>
            <SelectItem value="приход">Приход</SelectItem>
            <SelectItem value="расход">Расход</SelectItem>
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
              <TableHead>
                <div className="flex items-center space-x-1">
                  <span>ID</span>
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center space-x-1">
                  <span>Тип</span>
                </div>
              </TableHead>
              <TableHead>Город</TableHead>
              <TableHead>Назначение платежа</TableHead>
              <TableHead>
                <div className="flex items-center space-x-1">
                  <span>Сумма</span>
                </div>
              </TableHead>
              <TableHead className="min-w-[300px]">Комментарий</TableHead>
              <TableHead>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Дата</span>
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center space-x-1">
                  <User className="w-4 h-4" />
                  <span>Создатель</span>
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
                        href={operation.receiptDoc.startsWith('http') ? operation.receiptDoc : `${config.apiUrl}/uploads/documents/${operation.receiptDoc}`}
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

      {/* Пагинация */}
      {pagination && onPageChange && (
        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
          <div className="text-sm text-gray-700">
            Показано {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} из {pagination.total} операций
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
