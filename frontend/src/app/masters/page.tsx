"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Navigation } from "@/components/layout/navigation"
import { MastersTable } from "@/components/tables/masters-table"
import { MasterEditModal } from "@/components/modals/master-edit-modal"
import { MasterViewModal } from "@/components/modals/master-view-modal"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Plus, UserCheck, UserX } from "lucide-react"
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

export default function MastersPage() {
  const [masters, setMasters] = useState<Master[]>([])
  const [selectedMaster, setSelectedMaster] = useState<Master | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  // Загрузка данных
  useEffect(() => {
    loadMasters()
  }, [])

  const loadMasters = async () => {
    try {
      const response = await fetch(`${config.apiUrl}/api/masters`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })


      if (!response.ok) {
        throw new Error(`Ошибка загрузки мастеров: ${response.status}`)
      }

      const data = await response.json()
      setMasters(data.masters || [])
    } catch (error) {
      // Fallback к тестовым данным
      const mockMasters: Master[] = [
        {
          id: 1,
          name: "Алексей Мастеров",
          city: ["СПб"],
          statusWork: "работает",
          dateCreate: "2024-01-01T00:00:00Z",
          passportDoc: "passport_001.pdf",
          contractDoc: "contract_001.pdf",
          note: "Опытный мастер по ремонту стиральных машин"
        },
        {
          id: 2,
          name: "Петр Ремонтников",
          city: ["Москва", "СПб"],
          statusWork: "работает",
          dateCreate: "2024-01-02T00:00:00Z",
          passportDoc: "passport_002.pdf",
          note: "Специализируется на холодильниках"
        },
        {
          id: 3,
          name: "Иван Уволенов",
          city: ["Казань"],
          statusWork: "уволен",
          dateCreate: "2023-12-01T00:00:00Z",
          note: "Уволен за нарушение дисциплины"
        }
      ]
      setMasters(mockMasters)
    } finally {
      setLoading(false)
    }
  }

  const handleEditMaster = (master: Master) => {
    setSelectedMaster(master)
    setIsEditModalOpen(true)
  }

  const handleViewMaster = (master: Master) => {
    setSelectedMaster(master)
    setIsViewModalOpen(true)
  }

  const handleDeleteMaster = async (masterId: number) => {
    if (confirm("Вы уверены, что хотите удалить этого мастера?")) {
      try {
        const response = await fetch(`${config.apiUrl}/api/masters/${masterId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })

        if (!response.ok) {
          throw new Error(`Ошибка удаления мастера: ${response.status}`)
        }

        setMasters(masters.filter(master => master.id !== masterId))
      } catch (error) {
        // Fallback к локальному удалению
        setMasters(masters.filter(master => master.id !== masterId))
      }
    }
  }

  const handleSaveMaster = async (updatedMaster: Master) => {
    try {
      if (updatedMaster.id) {
        // Редактирование существующего
        const response = await fetch(`${config.apiUrl}/api/masters/${updatedMaster.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(updatedMaster)
        })

        if (!response.ok) {
          throw new Error(`Ошибка обновления мастера: ${response.status}`)
        }

        const data = await response.json()
        setMasters(masters.map(master =>
          master.id === updatedMaster.id ? data.master : master
        ))
      } else {
        // Добавление нового
        const response = await fetch(`${config.apiUrl}/api/masters`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(updatedMaster)
        })

        if (!response.ok) {
          throw new Error(`Ошибка создания мастера: ${response.status}`)
        }

        const data = await response.json()
        setMasters([...masters, data.master])
      }
    } catch (error) {
      // Fallback к локальному обновлению
      if (updatedMaster.id) {
        setMasters(masters.map(master =>
          master.id === updatedMaster.id ? updatedMaster : master
        ))
      } else {
        const newMaster = { ...updatedMaster, id: Date.now() }
        setMasters([...masters, newMaster])
      }
    }
  }

  const handleNewMaster = () => {
    setSelectedMaster(null)
    setIsEditModalOpen(true)
  }

  const handleHistoryMaster = (master: Master) => {
    window.location.href = `/masters/${master.id}/history`
  }

  // Статистика
  const totalMasters = masters.length
  const activeMasters = masters.filter(master => master.statusWork === "работает").length
  const inactiveMasters = masters.filter(master => master.statusWork !== "работает").length
  

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
                  <CardTitle className="text-sm font-medium">Всего мастеров</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalMasters}</div>
                  <p className="text-xs text-muted-foreground">+0 новых за месяц</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Активные</CardTitle>
                  <UserCheck className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{activeMasters}</div>
                  <p className="text-xs text-muted-foreground">работают сейчас</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Неактивные</CardTitle>
                  <UserX className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{inactiveMasters}</div>
                  <p className="text-xs text-muted-foreground">не работают</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="w-5 h-5" />
                      <span>Список мастеров</span>
                    </CardTitle>
                    <CardDescription>
                      Все мастера с возможностью управления
                    </CardDescription>
                  </div>
                  <Button size="sm" onClick={handleNewMaster}>
                    <Plus className="w-4 h-4 mr-2" />
                    Добавить мастера
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <MastersTable
                  masters={masters}
                  onEdit={handleEditMaster}
                  onView={handleViewMaster}
                  onDelete={handleDeleteMaster}
                  onHistory={handleHistoryMaster}
                />
              </CardContent>
            </Card>
          </div>
        </main>

        {/* Модальные окна */}
        <MasterEditModal
          master={selectedMaster}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveMaster}
        />

        <MasterViewModal
          master={selectedMaster}
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          onEdit={handleEditMaster}
          onDelete={handleDeleteMaster}
        />
      </div>
    </ProtectedRoute>
  )
}
