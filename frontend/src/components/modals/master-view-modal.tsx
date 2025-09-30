"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
import { config } from "@/lib/config"
  MapPin,
  Calendar,
  User,
  FileText,
  UserCheck,
  UserX,
  X,
  Edit,
  Trash2,
  Download,
  CheckCircle,
  XCircle,
  MessageSquare,
  Hash,
  Phone,
  Badge
} from "lucide-react"

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

interface MasterViewModalProps {
  master: Master | null
  isOpen: boolean
  onClose: () => void
  onEdit?: (master: Master) => void
  onDelete?: (masterId: number) => void
}

export function MasterViewModal({ master, isOpen, onClose, onEdit, onDelete }: MasterViewModalProps) {
  if (!master) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case "работает": return "bg-green-100 text-green-800"
      case "уволен": return "bg-red-100 text-red-800"
      case "в отпуске": return "bg-yellow-100 text-yellow-800"
      case "больничный": return "bg-blue-100 text-blue-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "работает": return <UserCheck className="w-5 h-5 text-green-600" />
      case "уволен": return <UserX className="w-5 h-5 text-red-600" />
      default: return <User className="w-5 h-5 text-gray-600" />
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getStatusIcon(master.statusWork)}
              <span>Мастер: {master.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(master)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Редактировать
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(master.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Удалить
                </Button>
              )}
            </div>
          </DialogTitle>
          <DialogDescription>
            Подробная информация о мастере
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Основная информация */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Основная информация</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    Имя мастера
                  </label>
                  <p className="text-sm font-medium">{master.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    Города
                  </label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {master.cities.map((city, index) => (
                      <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {city}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Статус работы</label>
                  <div className="mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(master.statusWork)}`}>
                      {master.statusWork}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    Дата создания
                  </label>
                  <p className="text-sm">{new Date(master.dateCreate).toLocaleDateString('ru-RU')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Telegram информация */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Telegram</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Telegram ID</label>
                  <p className="text-sm">{master.tgId || <span className="text-gray-400">Не указан</span>}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Chat ID</label>
                  <p className="text-sm">{master.chatId || <span className="text-gray-400">Не указан</span>}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Документы */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Документы</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">Паспорт</span>
                  </div>
                  {master.passportDoc ? (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-green-600">Загружен</span>
                      <a 
                        href={master.passportDoc.startsWith('http') ? master.passportDoc : `${config.apiUrl}/uploads/documents/${master.passportDoc}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm underline"
                      >
                        Скачать
                      </a>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">Не загружен</span>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">Договор</span>
                  </div>
                  {master.contractDoc ? (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-green-600">Загружен</span>
                      <a 
                        href={master.contractDoc.startsWith('http') ? master.contractDoc : `${config.apiUrl}/uploads/documents/${master.contractDoc}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm underline"
                      >
                        Скачать
                      </a>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">Не загружен</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Заметки */}
          {master.note && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Заметки</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{master.note}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Закрыть
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
