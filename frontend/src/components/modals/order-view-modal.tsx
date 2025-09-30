"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { formatDateForDisplay } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  MapPin, 
  Phone, 
  Calendar, 
  User, 
  Wrench, 
  X,
  Edit,
  FileText,
  Download,
  Eye,
  Clock,
  Building,
  AlertCircle,
  PhoneCall,
  Play,
  Pause,
  Volume2,
  Loader2
} from "lucide-react"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { CallRecord } from "@/lib/types"
import { AudioPlayer } from "@/components/ui/audio-player"
import { createApiUrl } from "@/lib/config"

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
  callId?: string
  bsoDoc?: string
  expenditureDoc?: string
}

interface OrderViewModalProps {
  order: Order | null
  isOpen: boolean
  onClose: () => void
  onEdit?: (order: Order) => void
  onDelete?: (orderId: number) => void
}

export function OrderViewModal({ order, isOpen, onClose, onEdit, onDelete }: OrderViewModalProps) {
  const [activeTab, setActiveTab] = useState("info")
  const [selectedMaster, setSelectedMaster] = useState(order?.masterId?.toString() || "none")
  const [result, setResult] = useState(order?.result?.toString() || "")
  const [expenditure, setExpenditure] = useState("")
  const [callRecords, setCallRecords] = useState<CallRecord[]>([])
  const [loadingRecords, setLoadingRecords] = useState(false)
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)

  // Загрузка записей звонков при открытии модала
  useEffect(() => {
    if (isOpen && order?.callId) {
      loadCallRecords()
    }
  }, [isOpen, order?.callId])

  // Cleanup при закрытии модала
  useEffect(() => {
    if (!isOpen) {
      setPlayingAudio(null)
    }
  }, [isOpen])

  const loadCallRecords = async () => {
    if (!order?.callId) return
    
    setLoadingRecords(true)
    try {
      const response = await fetch(createApiUrl(`/api/calls/by-call-id/${order.callId}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        throw new Error(`Ошибка загрузки записей: ${response.status}`)
      }

      const data = await response.json()
      setCallRecords(data.calls || [])
    } catch (error) {
      console.error('Ошибка при загрузке записей звонков:', error)
      setCallRecords([])
    } finally {
      setLoadingRecords(false)
    }
  }

  const handlePlayAudio = (recordingPath: string) => {
    if (playingAudio === recordingPath) {
      setPlayingAudio(null)
    } else {
      setPlayingAudio(recordingPath)
    }
  }

  const getAudioUrl = (recordingPath: string) => {
    const token = localStorage.getItem('token')
    return recordingPath.startsWith('http') 
      ? recordingPath 
      : createApiUrl(`/api/recordings/${recordingPath}${token ? `?token=${token}` : ''}`)
  }
  
  if (!order) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-blue-100 text-blue-800 border-blue-200"
      case "accepted": return "bg-green-100 text-green-800 border-green-200"
      case "in_work": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "ready": return "bg-emerald-100 text-emerald-800 border-emerald-200"
      case "refusal": return "bg-red-100 text-red-800 border-red-200"
      case "modern": return "bg-purple-100 text-purple-800 border-purple-200"
      case "no_order": return "bg-gray-100 text-gray-800 border-gray-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
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
    switch (status) {
      case "pending": return "Ожидает"
      case "accepted": return "Принял"
      case "in_work": return "В работе"
      case "ready": return "Готово"
      case "refusal": return "Отказ"
      case "modern": return "Модерн"
      case "no_order": return "Незаказ"
      default: return status
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold">
                Заказ #{order.id}
              </DialogTitle>
              <div className="mt-2">
                <Badge variant="outline" className={getStatusColor(order.statusOrder)}>
                  {translateStatus(order.statusOrder)}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(order)}
                  className="gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Редактировать
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Информация по заявке
            </TabsTrigger>
            <TabsTrigger value="master" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Мастер
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Документы
            </TabsTrigger>
            <TabsTrigger value="calls" className="flex items-center gap-2">
              <PhoneCall className="w-4 h-4" />
              Запись звонка
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-6 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* Информация по заявке */}
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  Информация по заявке
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">РК</label>
                    <p className="text-sm font-medium">{order.rk}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Имя мастера</label>
                    <p className="text-sm font-medium">{order.avitoName}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">ФИО</label>
                    <p className="text-sm font-medium">{order.clientName}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      Телефон
                    </label>
                    <p className="text-sm font-medium">{order.phone}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Адрес</label>
                    <p className="text-sm font-medium">{order.address}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      Город
                    </label>
                    <p className="text-sm font-medium">{order.city}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Тип заявки</label>
                    <p className="text-sm font-medium">{translateOrderType(order.typeOrder)}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Тип техники</label>
                    <p className="text-sm font-medium">{translateEquipment(order.typeEquipment)}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Проблема</label>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{order.problem}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Дата встречи
                  </label>
                  <p className="text-sm font-medium">
                    {order.dateMeeting ? 
                      formatDateForDisplay(order.dateMeeting) : 
                      'Не указана'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="master" className="mt-6 space-y-6 max-h-[60vh] overflow-y-auto">
            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-orange-500" />
                  Назначение мастера и итоги
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Мастер */}
                <div className="space-y-2">
                  <Label>Назначенный мастер</Label>
                  <div className="p-3 bg-muted rounded-lg">
                    {order.master ? (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white font-bold">
                          {order.master.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{order.master.name}</p>
                          <p className="text-sm text-muted-foreground">{order.master.city}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Мастер не назначен</p>
                    )}
                  </div>
                </div>

                {/* Итог */}
                <div className="space-y-2">
                  <Label>Итог (₽)</Label>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-lg font-semibold">
                      {order.result ? `₽${order.result}` : 'Не указан'}
                    </p>
                  </div>
                </div>

                {/* Расход */}
                <div className="space-y-2">
                  <Label>Расход (₽)</Label>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-lg font-semibold">
                      {order.expenditure ? `₽${order.expenditure}` : 'Не указан'}
                    </p>
                  </div>
                </div>

                {/* Чистыми */}
                <div className="space-y-2">
                  <Label>Чистыми (₽)</Label>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-lg font-semibold">
                      {order.clean ? `₽${order.clean}` : 'Не указан'}
                    </p>
                  </div>
                </div>

                {/* Сдача мастера */}
                <div className="space-y-2">
                  <Label>Сдача мастера (₽)</Label>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-lg font-semibold">
                      {order.masterChange ? `₽${order.masterChange}` : 'Не указан'}
                    </p>
                  </div>
                </div>


              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="mt-6 space-y-6 max-h-[60vh] overflow-y-auto">
            <Card className="border-l-4 border-l-indigo-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-500" />
                  Документы и файлы
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* БСО */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">БСО</label>
                  <div className="p-3 border rounded-lg bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">БСО</h4>
                          <p className="text-xs text-gray-500">Бланк строгой отчетности</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {order.bsoDoc ? (
                          <>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <Eye className="w-3 h-3 mr-1" />
                              Загружен
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              asChild
                              className="hover:bg-blue-50 hover:border-blue-300"
                            >
                              <a 
                                href={order.bsoDoc.startsWith('http') ? order.bsoDoc : `${config.apiUrl}/uploads/documents/${order.bsoDoc}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Download className="w-3 h-3 mr-1" />
                                Скачать
                              </a>
                            </Button>
                          </>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                            <X className="w-3 h-3 mr-1" />
                            Не загружен
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Чек расхода */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Чек расхода</label>
                  <div className="p-3 border rounded-lg bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100">
                          <FileText className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Чек расхода</h4>
                          <p className="text-xs text-gray-500">Документ о расходах</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {order.expenditureDoc ? (
                          <>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <Eye className="w-3 h-3 mr-1" />
                              Загружен
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              asChild
                              className="hover:bg-green-50 hover:border-green-300"
                            >
                              <a 
                                href={order.expenditureDoc.startsWith('http') ? order.expenditureDoc : `${config.apiUrl}/uploads/documents/${order.expenditureDoc}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Download className="w-3 h-3 mr-1" />
                                Скачать
                              </a>
                            </Button>
                          </>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                            <X className="w-3 h-3 mr-1" />
                            Не загружен
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calls" className="mt-6 space-y-6 max-h-[60vh] overflow-y-auto">
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <PhoneCall className="w-5 h-5 text-green-500" />
                  Записи звонков
                  {order.callId && (
                    <span className="text-sm font-normal text-muted-foreground">
                      (Call ID: {order.callId})
                    </span>
                  )}
                </CardTitle>
                {!order.callId && (
                  <CardDescription>
                    Call ID не указан для данного заказа
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {!order.callId ? (
                  <div className="text-center py-8">
                    <PhoneCall className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Call ID не привязан к данному заказу</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Записи звонков недоступны
                    </p>
                  </div>
                ) : loadingRecords ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-green-500 mx-auto mb-4" />
                    <p className="text-gray-500">Загрузка записей звонков...</p>
                  </div>
                ) : callRecords.length === 0 ? (
                  <div className="text-center py-8">
                    <PhoneCall className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Записи звонков не найдены</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Для Call ID: {order.callId}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {callRecords.map((record) => (
                      <div key={record.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100">
                              <PhoneCall className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">
                                Звонок #{record.id}
                              </h4>
                              <p className="text-xs text-gray-500">
                                {formatDateForDisplay(record.dateCreate)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              record.status === 'completed' 
                                ? 'bg-green-100 text-green-800' 
                                : record.status === 'missed'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {record.status}
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                          <div>
                            <span className="font-medium text-gray-600">Клиент:</span>
                            <p className="text-gray-900">{record.phoneClient}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">АТС:</span>
                            <p className="text-gray-900">{record.phoneAts}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Город:</span>
                            <p className="text-gray-900">{record.city}</p>
                          </div>
                          {record.operator && (
                            <div>
                              <span className="font-medium text-gray-600">Оператор:</span>
                              <p className="text-gray-900">{record.operator.name}</p>
                            </div>
                          )}
                        </div>

                        {/* Запись звонка */}
                        {record.recordingPath ? (
                          <div className="mt-4">
                            {playingAudio === record.recordingPath ? (
                              <AudioPlayer
                                src={getAudioUrl(record.recordingPath)}
                                title={`Звонок #${record.id}`}
                                onError={(error) => {
                                  console.error('Ошибка плеера:', error)
                                  setPlayingAudio(null)
                                }}
                                className="mb-4"
                              />
                            ) : (
                              <div className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <Volume2 className="w-5 h-5 text-gray-600" />
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">
                                        Аудиозапись
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {record.recordingProcessedAt && 
                                          `Обработано: ${formatDateForDisplay(record.recordingProcessedAt)}`
                                        }
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handlePlayAudio(record.recordingPath!)}
                                      className="flex items-center gap-2"
                                    >
                                      <Play className="w-3 h-3" />
                                      Открыть плеер
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      asChild
                                      className="flex items-center gap-2"
                                    >
                                      <a 
                                        href={getAudioUrl(record.recordingPath)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <Download className="w-3 h-3" />
                                        Скачать
                                      </a>
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <X className="w-5 h-5 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium text-gray-600">
                                  Запись недоступна
                                </p>
                                <p className="text-xs text-gray-500">
                                  Аудиозапись не была сохранена
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}