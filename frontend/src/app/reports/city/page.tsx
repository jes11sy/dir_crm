"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Navigation } from "@/components/layout/navigation"
import { CityReportTable } from "@/components/tables/city-report-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, Calendar } from "lucide-react"
import { config } from "@/lib/config"

interface CityReport {
  city: string
  closedOrders: number
  averageCheck: number
  totalRevenue: number
  companyIncome: number
  cashBalance: number
}

export default function ReportsCityPage() {
  const [reports, setReports] = useState<CityReport[]>([])
  const [loading, setLoading] = useState(true)
  const [userCity, setUserCity] = useState<string>('')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [isPeriodDialogOpen, setIsPeriodDialogOpen] = useState(false)

  useEffect(() => {
    loadCityReports()
  }, [dateFrom, dateTo])

  const loadCityReports = async () => {
    try {
      console.log('🔄 Загружаем отчет по городам...')
      
      // Получаем город директора из токена
      const token = localStorage.getItem('token')
      let userCity = 'all'
      
      if (token) {
        try {
          // Проверяем, что токен имеет правильный формат JWT (3 части разделенные точками)
          const tokenParts = token.split('.')
          if (tokenParts.length === 3 && tokenParts[1]) {
            // Дополнительная проверка на валидность base64
            const payloadPart = tokenParts[1]
            if (/^[A-Za-z0-9+/]*={0,2}$/.test(payloadPart)) {
              const payload = JSON.parse(atob(payloadPart))
              // Теперь в токене cities - это массив
              userCity = payload.cities && payload.cities.length > 0 ? payload.cities[0] : 'all'
            } else {
              console.warn('Неверная кодировка payload в токене')
              userCity = 'all'
            }
          } else {
            console.warn('Неверный формат токена')
            userCity = 'all'
          }
        } catch (error) {
          console.error('Ошибка декодирования токена:', error)
          userCity = 'all'
        }
      }
      
      console.log('🏙️ Город пользователя:', userCity)
      setUserCity(userCity)
      
      let apiUrl = `${config.apiUrl}/api/reports/city?city=${userCity}`
      
      // Добавляем параметры периода если они заданы
      if (dateFrom) {
        apiUrl += `&dateFrom=${dateFrom}`
      }
      if (dateTo) {
        apiUrl += `&dateTo=${dateTo}`
      }

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('📊 Получены данные отчета:', data)
        setReports(data || [])
      } else {
        throw new Error(`Ошибка загрузки отчета: ${response.status}`)
      }
    } catch (error) {
      console.error("❌ Ошибка загрузки отчета по городам:", error)
      // Fallback к тестовым данным
      const mockReports: CityReport[] = [
        {
          city: "Москва",
          closedOrders: 25,
          averageCheck: 4500,
          totalRevenue: 112500,
          companyIncome: 90000,
          expenses: 15000,
          netIncome: 75000
        },
        {
          city: "СПб",
          closedOrders: 18,
          averageCheck: 5200,
          totalRevenue: 93600,
          companyIncome: 74880,
          expenses: 12000,
          netIncome: 62880
        },
        {
          city: "Казань",
          closedOrders: 12,
          averageCheck: 3800,
          totalRevenue: 45600,
          companyIncome: 36480,
          expenses: 8000,
          netIncome: 28480
        },
        {
          city: "Екатеринбург",
          closedOrders: 8,
          averageCheck: 4200,
          totalRevenue: 33600,
          companyIncome: 26880,
          expenses: 6000,
          netIncome: 20880
        }
      ]
      console.log('🔄 Используем тестовые данные отчета')
      setReports(mockReports)
    } finally {
      setLoading(false)
    }
  }

  const handleApplyPeriod = () => {
    loadCityReports()
    setIsPeriodDialogOpen(false)
  }

  const handleClearPeriod = () => {
    setDateFrom('')
    setDateTo('')
    loadCityReports()
    setIsPeriodDialogOpen(false)
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
      <div className="min-h-screen bg-background">
        <Navigation />
        
        <main className="container mx-auto p-6">

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <MapPin className="w-5 h-5" />
                      <span>
                        {userCity === 'all' ? 'Статистика по всем городам' : `Статистика по городу ${userCity}`}
                      </span>
                    </CardTitle>
                    <CardDescription>
                      {userCity === 'all' ? 'Анализ эффективности работы по всем городам' : `Анализ эффективности работы по городу ${userCity}`}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Dialog open={isPeriodDialogOpen} onOpenChange={setIsPeriodDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Calendar className="w-4 h-4 mr-2" />
                          {dateFrom || dateTo ? 'Период (задан)' : 'Период'}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Выбрать период</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="dateFrom" className="text-right">
                              С
                            </Label>
                            <Input
                              id="dateFrom"
                              type="date"
                              value={dateFrom}
                              onChange={(e) => setDateFrom(e.target.value)}
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="dateTo" className="text-right">
                              До
                            </Label>
                            <Input
                              id="dateTo"
                              type="date"
                              value={dateTo}
                              onChange={(e) => setDateTo(e.target.value)}
                              className="col-span-3"
                            />
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <Button variant="outline" onClick={handleClearPeriod}>
                            Очистить
                          </Button>
                          <Button onClick={handleApplyPeriod}>
                            Применить
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CityReportTable
                  reports={reports}
                />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
