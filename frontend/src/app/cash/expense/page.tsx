"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Navigation } from "@/components/layout/navigation"
import { ExpenseForm } from "@/components/forms/expense-form"
import { CashHistoryTable } from "@/components/tables/cash-history-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Download, TrendingDown, Banknote } from "lucide-react"
import { config } from "@/lib/config"

interface ExpenseData {
  id: number
  name: string
  amount: number
  note?: string
  nameCreate: string
  dateCreate: string
}

export default function CashExpensePage() {
  const [expenses, setExpenses] = useState<ExpenseData[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [directorCities, setDirectorCities] = useState<string[]>([])
  const [directorName, setDirectorName] = useState<string>("Директор")
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })

  useEffect(() => {
    loadExpenses()
    loadDirectorInfo()
  }, [])

  const loadDirectorInfo = async () => {
    try {
      // Предполагаем, что в localStorage хранится информация о директоре
      // или делаем запрос на API для получения его городов
      const response = await fetch(`${config.apiUrl}/api/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const userData = await response.json()
        if (userData.user) {
          if (userData.user.cities) {
            setDirectorCities(userData.user.cities)
          }
          if (userData.user.name) {
            setDirectorName(userData.user.name)
          }
        }
      }
    } catch (error) {
      // Fallback к тестовым городам
      setDirectorCities(['Москва', 'СПб', 'Казань'])
    }
  }

  const loadExpenses = async (page: number = 1) => {
    try {
      const params = new URLSearchParams({
        type: 'расход',
        page: page.toString(),
        limit: '10'
      })
      
      const response = await fetch(`${config.apiUrl}/api/cash?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })


      if (!response.ok) {
        throw new Error(`Ошибка загрузки расходов: ${response.status}`)
      }

      const data = await response.json()
      setExpenses(data.operations || [])
      setPagination(data.pagination || { page: 1, limit: 10, total: 0, pages: 0 })
    } catch (error) {
      // Fallback к тестовым данным
      const mockExpenses: ExpenseData[] = [
        {
          id: 1,
          name: "расход",
          amount: 2000,
          note: "Покупка запчастей",
          nameCreate: "Админ",
          dateCreate: "2024-01-15T09:00:00Z"
        },
        {
          id: 2,
          name: "расход",
          amount: 1500,
          note: "Оплата аренды",
          nameCreate: "Админ",
          dateCreate: "2024-01-14T14:30:00Z"
        }
      ]
      setExpenses(mockExpenses)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveExpense = async (expenseData: { amount: number, note: string, nameCreate: string, receiptDoc?: string }) => {
    try {
      const response = await fetch(`${config.apiUrl}/api/cash`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...expenseData,
          name: 'расход'
        })
      })

      if (!response.ok) {
        throw new Error(`Ошибка создания расхода: ${response.status}`)
      }

      const data = await response.json()
      setExpenses([...expenses, data.operation])
      setIsFormOpen(false)
    } catch (error) {
    }
  }

  const handleExport = () => {
    // Здесь будет логика экспорта
  }

  const handlePageChange = (page: number) => {
    setLoading(true)
    loadExpenses(page)
  }

  // Статистика
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const todayExpenses = expenses.filter(expense => {
    const today = new Date().toDateString()
    const expenseDate = new Date(expense.dateCreate).toDateString()
    return today === expenseDate
  }).reduce((sum, expense) => sum + expense.amount, 0)

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Всего расходов</CardTitle>
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₽{totalExpenses}</div>
                  <p className="text-xs text-muted-foreground">за все время</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Сегодня</CardTitle>
                  <Banknote className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">₽{todayExpenses}</div>
                  <p className="text-xs text-muted-foreground">за сегодня</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Операций</CardTitle>
                  <span className="text-2xl font-bold">{expenses.length}</span>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">всего записей</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingDown className="w-5 h-5" />
                      <span>История расходов</span>
                    </CardTitle>
                    <CardDescription>
                      Все операции по расходам
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" onClick={() => setIsFormOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Добавить расход
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExport}>
                      <Download className="w-4 h-4 mr-2" />
                      Экспорт
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CashHistoryTable
                  operations={expenses}
                  pagination={pagination}
                  onPageChange={handlePageChange}
                />
              </CardContent>
            </Card>
          </div>
        </main>

        {/* Модальное окно добавления расхода */}
        <ExpenseForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleSaveExpense}
          loading={false}
          directorCities={directorCities}
          directorName={directorName}
        />
      </div>
    </ProtectedRoute>
  )
}
