"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Navigation } from "@/components/layout/navigation"
import { IncomeForm } from "@/components/forms/income-form"
import { CashHistoryTable } from "@/components/tables/cash-history-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Download, TrendingUp, Banknote } from "lucide-react"
import { config } from "@/lib/config"

interface IncomeData {
  id: number
  name: string
  amount: number
  note?: string
  nameCreate: string
  dateCreate: string
  city?: string
  paymentPurpose?: string
}

export default function CashIncomePage() {
  const [incomes, setIncomes] = useState<IncomeData[]>([])
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
    loadIncomes()
    loadDirectorInfo()
  }, [])

  const loadDirectorInfo = async () => {
    try {
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

  const loadIncomes = async (page: number = 1) => {
    try {
      const params = new URLSearchParams({
        type: 'приход',
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
        throw new Error(`Ошибка загрузки приходов: ${response.status}`)
      }

      const data = await response.json()
      setIncomes(data.operations || [])
      setPagination(data.pagination || { page: 1, limit: 10, total: 0, pages: 0 })
    } catch (error) {
      // Fallback к тестовым данным
      const mockIncomes: IncomeData[] = [
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
          name: "приход",
          amount: 3500,
          note: "Приход по заказу №124",
          nameCreate: "Система",
          dateCreate: "2024-01-14T15:45:00Z"
        }
      ]
      setIncomes(mockIncomes)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveIncome = async (incomeData: {
    city: string
    amount: number
    paymentPurpose: string
    note: string
    nameCreate: string
    receiptDoc?: string
  }) => {
    try {
      const submitData = {
        name: "приход",
        ...incomeData
      }

      const response = await fetch(`${config.apiUrl}/api/cash`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(submitData)
      })

      if (!response.ok) {
        throw new Error(`Ошибка создания прихода: ${response.status}`)
      }

      const data = await response.json()
      setIncomes([...incomes, data.operation])
      setIsFormOpen(false)
    } catch (error) {
    }
  }

  const handleExport = () => {
    // Здесь будет логика экспорта
  }

  const handlePageChange = (page: number) => {
    setLoading(true)
    loadIncomes(page)
  }

  // Статистика
  const totalIncomes = incomes.reduce((sum, income) => sum + income.amount, 0)
  const todayIncomes = incomes.filter(income => {
    const today = new Date().toDateString()
    const incomeDate = new Date(income.dateCreate).toDateString()
    return today === incomeDate
  }).reduce((sum, income) => sum + income.amount, 0)

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
                  <CardTitle className="text-sm font-medium">Всего приходов</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₽{totalIncomes}</div>
                  <p className="text-xs text-muted-foreground">за все время</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Сегодня</CardTitle>
                  <Banknote className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">₽{todayIncomes}</div>
                  <p className="text-xs text-muted-foreground">за сегодня</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Операций</CardTitle>
                  <span className="text-2xl font-bold">{incomes.length}</span>
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
                      <TrendingUp className="w-5 h-5" />
                      <span>История приходов</span>
                    </CardTitle>
                    <CardDescription>
                      Все операции по приходам
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" onClick={() => setIsFormOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Добавить приход
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
                  operations={incomes}
                  pagination={pagination}
                  onPageChange={handlePageChange}
                />
              </CardContent>
            </Card>
          </div>
        </main>

        {/* Модальное окно добавления прихода */}
        <IncomeForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleSaveIncome}
          loading={false}
          directorCities={directorCities}
          directorName={directorName}
        />
      </div>
    </ProtectedRoute>
  )
}
