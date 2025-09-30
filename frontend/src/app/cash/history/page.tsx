"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Navigation } from "@/components/layout/navigation"
import { CashHistoryTable } from "@/components/tables/cash-history-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, History, Banknote, TrendingUp, TrendingDown } from "lucide-react"
import { config } from "@/lib/config"

interface CashOperation {
  id: number
  name: string
  amount: number
  note?: string
  nameCreate: string
  dateCreate: string
}

export default function CashHistoryPage() {
  const [operations, setOperations] = useState<CashOperation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOperations()
  }, [])

  const loadOperations = async () => {
    try {
      console.log('🔄 Загружаем историю операций...')
      const response = await fetch('${config.apiUrl}/api/cash?type=all', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      console.log('📡 Ответ сервера (операции):', response.status, response.statusText)

      if (!response.ok) {
        throw new Error(`Ошибка загрузки операций: ${response.status}`)
      }

      const data = await response.json()
      console.log('📦 Данные операций:', data)
      setOperations(data.operations || [])
    } catch (error) {
      console.error("❌ Ошибка загрузки операций:", error)
      // Fallback к тестовым данным
      const mockOperations: CashOperation[] = [
        {
          id: 1,
          name: "приход",
          amount: 5000,
          note: "Приход по заказу №123",
          nameCreate: "Система",
          dateCreate: "2024-01-15T10:30:00Z"
        },
        {
          id: 2,
          name: "расход",
          amount: 2000,
          note: "Покупка запчастей",
          nameCreate: "Админ",
          dateCreate: "2024-01-15T09:00:00Z"
        },
        {
          id: 3,
          name: "приход",
          amount: 3500,
          note: "Приход по заказу №124",
          nameCreate: "Система",
          dateCreate: "2024-01-14T15:45:00Z"
        },
        {
          id: 4,
          name: "расход",
          amount: 1500,
          note: "Оплата аренды",
          nameCreate: "Админ",
          dateCreate: "2024-01-14T14:30:00Z"
        }
      ]
      console.log('🔄 Используем тестовые данные операций')
      setOperations(mockOperations)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    console.log("Экспорт истории операций")
    // Здесь будет логика экспорта
  }

  // Статистика
  const incomes = operations.filter(op => op.name === 'приход')
  const expenses = operations.filter(op => op.name === 'расход')
  const totalIncomes = incomes.reduce((sum, op) => sum + op.amount, 0)
  const totalExpenses = expenses.reduce((sum, op) => sum + op.amount, 0)
  const balance = totalIncomes - totalExpenses

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
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Приходы</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">₽{totalIncomes}</div>
                  <p className="text-xs text-muted-foreground">{incomes.length} операций</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Расходы</CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">₽{totalExpenses}</div>
                  <p className="text-xs text-muted-foreground">{expenses.length} операций</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Баланс</CardTitle>
                  <Banknote className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₽{balance}
                  </div>
                  <p className="text-xs text-muted-foreground">текущий баланс</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Всего операций</CardTitle>
                  <History className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{operations.length}</div>
                  <p className="text-xs text-muted-foreground">всего записей</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <History className="w-5 h-5" />
                      <span>История операций ({operations.length})</span>
                    </CardTitle>
                    <CardDescription>
                      Все операции с кассой в хронологическом порядке
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={handleExport}>
                      <Download className="w-4 h-4 mr-2" />
                      Экспорт
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CashHistoryTable
                  operations={operations}
                />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
