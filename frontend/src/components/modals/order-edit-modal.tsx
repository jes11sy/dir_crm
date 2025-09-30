"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, Phone, User, FileText, Receipt, Edit, Save, X, Upload, Trash2, CheckCircle, Loader2 } from "lucide-react"
import { config } from "@/lib/config"
// Локальный интерфейс Order для модального окна
interface Order {
  id: number
  rk: string
  city: string
  avitoName: string
  phone: string
  typeOrder: string
  clientName: string
  address: string
  dateMeeting: string
  typeEquipment: string
  problem: string
  statusOrder: string
  masterId: number | null
  master?: {
    id: number
    name: string
    city: string
  }
  result: number | null
  expenditure: number | null
  clean: number | null
  masterChange: number | null
  bsoDoc?: string
  expenditureDoc?: string
}

interface Master {
  id: number
  name: string
  city: string | string[]
  status_work: string
}

interface OrderEditModalProps {
  order: Order | null
  masters: Master[]
  isOpen: boolean
  onClose: () => void
  onSave: (orderData: Partial<Order>) => void
}

export default function OrderEditModal({ order, masters, isOpen, onClose, onSave }: OrderEditModalProps) {
  const [formData, setFormData] = useState<Partial<Order>>({})
  const [activeTab, setActiveTab] = useState("info")
  
  // Состояния для загрузки файлов
  const [bsoFile, setBsoFile] = useState<File | null>(null)
  const [expenditureFile, setExpenditureFile] = useState<File | null>(null)
  const [bsoPreview, setBsoPreview] = useState<string | null>(null)
  const [expenditurePreview, setExpenditurePreview] = useState<string | null>(null)
  const [uploadingBso, setUploadingBso] = useState(false)
  const [uploadingExpenditure, setUploadingExpenditure] = useState(false)

  useEffect(() => {
    if (order) {
      setFormData({
        id: order.id,
        rk: order.rk,
        avitoName: order.avitoName,
        clientName: order.clientName,
        phone: order.phone,
        address: order.address,
        city: order.city,
        typeOrder: order.typeOrder,
        typeEquipment: order.typeEquipment,
        problem: order.problem,
        dateMeeting: order.dateMeeting,
        statusOrder: order.statusOrder,
        masterId: order.masterId,
        result: order.result,
        expenditure: order.expenditure,
        clean: order.clean,
        masterChange: order.masterChange,
        bsoDoc: order.bsoDoc,
        expenditureDoc: order.expenditureDoc
      })
    }
    
    // Сброс состояний файлов при открытии/закрытии модала
    setBsoFile(null)
    setExpenditureFile(null)
    setBsoPreview(null)
    setExpenditurePreview(null)
    setUploadingBso(false)
    setUploadingExpenditure(false)
  }, [order])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = () => {
    // Автоматически вычисляем чистые и сдачу мастера
    const result = formData.result || 0
    const expenditure = formData.expenditure || 0
    const clean = result - expenditure
    const masterChange = clean / 2

    const updatedFormData = {
      ...formData,
      clean: clean,
      masterChange: masterChange
    }

    onSave(updatedFormData)
    onClose()
  }

  // Функции для обработки файлов
  const processFile = (type: 'bso' | 'expenditure', file: File) => {
    // Валидация файла
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      alert('Размер файла не должен превышать 5 МБ')
      return
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      alert('Разрешены только файлы формата JPG, PNG, PDF')
      return
    }

    // Установка файла и создание превью для изображений
    if (type === 'bso') {
      setBsoFile(file)
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => setBsoPreview(e.target?.result as string)
        reader.readAsDataURL(file)
      } else {
        setBsoPreview(null)
      }
    } else {
      setExpenditureFile(file)
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => setExpenditurePreview(e.target?.result as string)
        reader.readAsDataURL(file)
      } else {
        setExpenditurePreview(null)
      }
    }

    // Загрузка файла
    handleFileUpload(type, file)
  }

  const handleFileUpload = async (type: 'bso' | 'expenditure', file: File) => {
    try {
      if (type === 'bso') {
        setUploadingBso(true)
      } else {
        setUploadingExpenditure(true)
      }

      const formData = new FormData()
      formData.append('document', file)

      const folderPath = type === 'bso' 
        ? 'director/orders/bso_doc'
        : 'director/orders/expenditure_doc'

      formData.append('folder', folderPath)

      const response = await fetch(`${config.apiUrl}/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error(`Ошибка загрузки файла: ${response.status}`)
      }

      const data = await response.json()

      if (type === 'bso') {
        handleInputChange('bsoDoc', data.url)
      } else {
        handleInputChange('expenditureDoc', data.url)
      }
    } catch (error) {
      console.error('Ошибка загрузки файла:', error)
      alert('Ошибка загрузки файла. Попробуйте еще раз.')

      // Очистка файла при ошибке
      if (type === 'bso') {
        setBsoFile(null)
        setBsoPreview(null)
      } else {
        setExpenditureFile(null)
        setExpenditurePreview(null)
      }
    } finally {
      if (type === 'bso') {
        setUploadingBso(false)
      } else {
        setUploadingExpenditure(false)
      }
    }
  }

  const removeFile = (type: 'bso' | 'expenditure') => {
    if (type === 'bso') {
      setBsoFile(null)
      setBsoPreview(null)
      handleInputChange('bsoDoc', undefined)
    } else {
      setExpenditureFile(null)
      setExpenditurePreview(null)
      handleInputChange('expenditureDoc', undefined)
    }
  }

  const availableMasters = masters

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Ожидает": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "Принял": return "bg-blue-100 text-blue-800 border-blue-200"
      case "В работе": return "bg-orange-100 text-orange-800 border-orange-200"
      case "Готово": return "bg-green-100 text-green-800 border-green-200"
      case "Отказ": return "bg-red-100 text-red-800 border-red-200"
      case "Модерн": return "bg-purple-100 text-purple-800 border-purple-200"
      case "Незаказ": return "bg-gray-100 text-gray-800 border-gray-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  // Функция для получения доступных статусов в зависимости от текущего
  const getAvailableStatuses = (currentStatus: string) => {
    const allStatuses = [
      { value: "Ожидает", label: "Ожидает" },
      { value: "Принял", label: "Принял" },
      { value: "В работе", label: "В работе" },
      { value: "Модерн", label: "Модерн" },
      { value: "Готово", label: "Готово" },
      { value: "Отказ", label: "Отказ" },
      { value: "Незаказ", label: "Незаказ" }
    ]

    // Если статус "Модерн", доступны только финальные статусы
    if (currentStatus === "Модерн") {
      return [
        { value: "Модерн", label: "Модерн" }, // оставляем текущий
        { value: "Готово", label: "Готово" },
        { value: "Отказ", label: "Отказ" },
        { value: "Незаказ", label: "Незаказ" }
      ]
    }

    // Для всех остальных статусов - все доступны
    return allStatuses
  }

  const translateOrderType = (typeOrder: string) => {
    switch (typeOrder) {
      case "first_time": return "Впервые"
      case "repeat": return "Повтор"
      case "warranty": return "Гарантия"
      default: return typeOrder
    }
  }


  const translateEquipment = (equipment: string) => {
    switch (equipment) {
      case "kp": return "КП"
      case "bt": return "БТ"
      case "mnch": return "МНЧ"
      default: return equipment
    }
  }

  const translateStatus = (status: string) => {
    // Статусы уже приходят на русском языке, просто возвращаем как есть
    return status
  }

  if (!order) return null

  // Проверяем, можно ли редактировать заказ
  const isEditable = !['Готово', 'Отказ', 'Незаказ'].includes(order.statusOrder)
  
  if (!isEditable) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-red-600">
              Редактирование недоступно
            </DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Заказ нельзя редактировать
              </h3>
              <p className="text-gray-600 mb-4">
                Заказы со статусом "{translateStatus(order.statusOrder)}" не подлежат редактированию.
              </p>
              <p className="text-sm text-gray-500">
                Статус: <span className="font-medium">{translateStatus(order.statusOrder)}</span>
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={onClose} variant="outline">
              Закрыть
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <DialogTitle className="text-2xl font-bold">
                Редактирование заказа #{order.id}
              </DialogTitle>
              <div className="flex items-center gap-3">
                <Label className="text-sm font-medium text-gray-600">Статус:</Label>
                <div className="relative">
                  <Select 
                    value={formData.statusOrder || ""} 
                    onValueChange={(value) => handleInputChange("statusOrder", value)}
                  >
                    <SelectTrigger className="w-52 h-11 bg-white border-2 border-gray-200 rounded-lg shadow-sm hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200">
                      <SelectValue placeholder="Выберите статус заказа" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableStatuses(order.statusOrder).map(status => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              Сохранить
            </Button>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Информация по заявке</TabsTrigger>
            <TabsTrigger value="master">Мастер</TabsTrigger>
            <TabsTrigger value="documents">Документы</TabsTrigger>
          </TabsList>

          {/* Информация по заявке */}
          <TabsContent value="info" className="mt-6 space-y-6 max-h-[60vh] overflow-y-auto">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  Основная информация
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>РК</Label>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-medium">{formData.rk || 'Не указан'}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Имя мастера</Label>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-medium">{formData.avitoName || 'Не указан'}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>ФИО</Label>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-medium">{formData.clientName || 'Не указан'}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Телефон</Label>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-medium">{formData.phone || 'Не указан'}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Адрес</Label>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-medium">{formData.address || 'Не указан'}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Город</Label>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-medium">{formData.city || 'Не указан'}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Тип заявки</Label>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-medium">{translateOrderType(formData.typeOrder || '') || 'Не указан'}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Тип техники</Label>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-medium">{translateEquipment(formData.typeEquipment || '') || 'Не указан'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Проблема</Label>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="font-medium">{formData.problem || 'Не указана'}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Дата встречи</Label>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="font-medium">
                      {formData.meetingDate ? new Date(formData.meetingDate).toLocaleString('ru-RU') : 'Не указана'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Мастер */}
          <TabsContent value="master" className="mt-6 space-y-6 max-h-[60vh] overflow-y-auto">
            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-orange-500" />
                  Назначение мастера и итоги
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Назначенный мастер</Label>
                  <Select 
                    value={formData.masterId?.toString() || "none"} 
                    onValueChange={(value) => handleInputChange("masterId", value === "none" ? null : parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите мастера" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Не назначен</SelectItem>
                      {availableMasters.map(master => (
                        <SelectItem key={master.id} value={master.id.toString()}>
                          {master.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="result">Итог (₽)</Label>
                    <Input
                      id="result"
                      type="number"
                      value={formData.result || ""}
                      onChange={(e) => handleInputChange("result", e.target.value ? parseFloat(e.target.value) : null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expenditure">Расход (₽)</Label>
                    <Input
                      id="expenditure"
                      type="number"
                      value={formData.expenditure || ""}
                      onChange={(e) => handleInputChange("expenditure", e.target.value ? parseFloat(e.target.value) : null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clean">Чистыми (₽)</Label>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-medium">
                        {(() => {
                          const result = formData.result || 0
                          const expenditure = formData.expenditure || 0
                          const clean = result - expenditure
                          return clean.toFixed(2)
                        })()}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="masterChange">Сдача мастера (₽)</Label>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-medium">
                        {(() => {
                          const result = formData.result || 0
                          const expenditure = formData.expenditure || 0
                          const clean = result - expenditure
                          const masterChange = clean / 2
                          return masterChange.toFixed(2)
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Документы */}
          <TabsContent value="documents" className="mt-6 space-y-6 max-h-[60vh] overflow-y-auto">
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-500" />
                  Документы
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* БСО */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">БСО</Label>

                    {!bsoFile ? (
                      <div className="relative border-2 border-dashed border-blue-300 rounded-lg p-4 transition-all duration-200 cursor-pointer hover:border-blue-400 hover:bg-blue-50/50">
                        <input
                          id="bso"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) processFile('bso', file)
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="text-center">
                          <div className="mx-auto w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                            <Upload className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-900">
                              Загрузить БСО
                            </p>
                            <p className="text-xs text-gray-500">
                              PDF, JPG, PNG до 5 МБ
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="border rounded-lg p-3 bg-white">
                        <div className="flex items-start space-x-3">
                          {bsoPreview ? (
                            <div className="flex-shrink-0">
                              <img
                                src={bsoPreview}
                                alt="Превью БСО"
                                className="w-16 h-16 object-cover rounded-lg border"
                              />
                            </div>
                          ) : (
                            <div className="flex-shrink-0 w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                              <FileText className="w-6 h-6 text-blue-600" />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              {uploadingBso ? (
                                <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              )}
                              <span className="text-sm font-medium text-gray-900 truncate">
                                {bsoFile.name}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">
                              {(bsoFile.size / 1024 / 1024).toFixed(2)} МБ
                            </p>
                            <div className="mt-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeFile('bso')}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                disabled={uploadingBso}
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Удалить
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Чек расхода */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Чек расхода</Label>

                    {!expenditureFile ? (
                      <div className="relative border-2 border-dashed border-green-300 rounded-lg p-4 transition-all duration-200 cursor-pointer hover:border-green-400 hover:bg-green-50/50">
                        <input
                          id="expenditure"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) processFile('expenditure', file)
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="text-center">
                          <div className="mx-auto w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                            <Upload className="w-5 h-5 text-green-600" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-900">
                              Загрузить чек расхода
                            </p>
                            <p className="text-xs text-gray-500">
                              PDF, JPG, PNG до 5 МБ
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="border rounded-lg p-3 bg-white">
                        <div className="flex items-start space-x-3">
                          {expenditurePreview ? (
                            <div className="flex-shrink-0">
                              <img
                                src={expenditurePreview}
                                alt="Превью чека"
                                className="w-16 h-16 object-cover rounded-lg border"
                              />
                            </div>
                          ) : (
                            <div className="flex-shrink-0 w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center">
                              <FileText className="w-6 h-6 text-green-600" />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              {uploadingExpenditure ? (
                                <Loader2 className="w-4 h-4 text-green-500 animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              )}
                              <span className="text-sm font-medium text-gray-900 truncate">
                                {expenditureFile.name}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">
                              {(expenditureFile.size / 1024 / 1024).toFixed(2)} МБ
                            </p>
                            <div className="mt-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeFile('expenditure')}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                disabled={uploadingExpenditure}
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Удалить
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}