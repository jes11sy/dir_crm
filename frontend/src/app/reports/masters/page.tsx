"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Navigation } from "@/components/layout/navigation"
import { MastersReportTable } from "@/components/tables/masters-report-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Download, Calendar, Filter } from "lucide-react"
import { config } from "@/lib/config"

interface MasterReport {
  id: number
  name: string
  city: string | string[] // Поддержка одного города или массива городов
  ordersCount: number
  totalRevenue: number
  averageCheck: number
  salary: number
}

export default function ReportsMastersPage() {
  const [reports, setReports] = useState<MasterReport[]>([])
  const [loading, setLoading] = useState(true)
  const [userCity, setUserCity] = useState<string>('')

  useEffect(() => {
    loadMastersReports()
  }, [])

  const loadMastersReports = async () => {
    try {
      
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
              userCity = 'all'
            }
          } else {
            userCity = 'all'
          }
        } catch (error) {
          userCity = 'all'
        }
      }
      
      setUserCity(userCity)
      
      const response = await fetch(`${config.apiUrl}/api/reports/masters?city=${userCity}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setReports(data || [])
      } else {
        throw new Error(`Ошибка загрузки отчета: ${response.status}`)
      }
    } catch (error) {
      // Fallback к тестовым данным
      const mockReports: MasterReport[] = [
        {
          id: 1,
          name: "Алексей Мастеров",
          city: "Москва",
          ordersCount: 15,
          totalRevenue: 67500,
          averageCheck: 4500,
          salary: 27000
        },
        {
          id: 2,
          name: "Петр Ремонтников",
          city: "СПб",
          ordersCount: 12,
          totalRevenue: 62400,
          averageCheck: 5200,
          salary: 24960
        },
        {
          id: 3,
          name: "Иван Специалист",
          city: "Казань",
          ordersCount: 8,
          totalRevenue: 30400,
          averageCheck: 3800,
          salary: 12160
        },
        {
          id: 4,
          name: "Сергей Профи",
          city: "Екатеринбург",
          ordersCount: 6,
          totalRevenue: 25200,
          averageCheck: 4200,
          salary: 10080
        },
        {
          id: 5,
          name: "Михаил Эксперт",
          city: "Москва",
          ordersCount: 10,
          totalRevenue: 45000,
          averageCheck: 4500,
          salary: 18000
        }
      ]
      setReports(mockReports)
    } finally {
      setLoading(false)
    }
  }


  const handleExport = () => {
    // Здесь будет логика экспорта
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
                      <Users className="w-5 h-5" />
                      <span>
                        {userCity === 'all' ? 'Статистика по всем мастерам' : `Статистика по мастерам города ${userCity}`}
                      </span>
                    </CardTitle>
                    <CardDescription>
                      {userCity === 'all' ? 'Анализ эффективности работы всех мастеров' : `Анализ эффективности работы мастеров города ${userCity}`}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Calendar className="w-4 h-4 mr-2" />
                      Период
                    </Button>
                    <Button variant="outline" size="sm">
                      <Filter className="w-4 h-4 mr-2" />
                      Фильтр
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExport}>
                      <Download className="w-4 h-4 mr-2" />
                      Экспорт
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <MastersReportTable
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
