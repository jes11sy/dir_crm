"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Save, X, Upload, FileText, Trash2, CheckCircle, Loader2, User, Files } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
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

interface MasterEditModalProps {
  master: Master | null
  isOpen: boolean
  onClose: () => void
  onSave: (master: Master) => void
}

export function MasterEditModal({ master, isOpen, onClose, onSave }: MasterEditModalProps) {
  const { user, isLoading } = useAuth()
  const [formData, setFormData] = useState<Partial<Master>>({})
  const [passportFile, setPassportFile] = useState<File | null>(null)
  const [contractFile, setContractFile] = useState<File | null>(null)
  const [selectedCities, setSelectedCities] = useState<string[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [passportPreview, setPassportPreview] = useState<string | null>(null)
  const [contractPreview, setContractPreview] = useState<string | null>(null)
  const [uploadingPassport, setUploadingPassport] = useState(false)
  const [uploadingContract, setUploadingContract] = useState(false)
  const [activeTab, setActiveTab] = useState("info")


  // Не отображаем модал пока загружаются данные пользователя
  if (isLoading) {
    return null
  }

  // Загружаем актуальную информацию о пользователе из API
  const loadCurrentUser = async () => {
    try {
      const response = await fetch(`${config.apiUrl}/api/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCurrentUser(data.user)
      }
    } catch (error) {
    }
  }

  useEffect(() => {
    if (isOpen && !currentUser) {
      loadCurrentUser()
    }
  }, [isOpen])

  useEffect(() => {
    if (master) {
      setFormData(master)
      // Инициализируем выбранные города
      setSelectedCities(master.cities || [])
    } else {
      setFormData({
        cities: [],
        name: "",
        statusWork: "работает",
        note: "",
        tgId: "",
        chatId: ""
      })
      setSelectedCities([])
    }
    setPassportFile(null)
    setContractFile(null)
    setPassportPreview(null)
    setContractPreview(null)
    setUploadingPassport(false)
    setUploadingContract(false)
    setActiveTab("info")
  }, [master])

  const handleSave = () => {
    if (formData && selectedCities.length > 0) {
      const updatedMaster = {
        ...formData,
        cities: selectedCities, // Сохраняем массив выбранных городов
        passportDoc: passportFile ? passportFile.name : formData.passportDoc,
        contractDoc: contractFile ? contractFile.name : formData.contractDoc,
        tgId: formData.tgId || undefined, // Явно добавляем tgId
        chatId: formData.chatId || undefined, // Явно добавляем chatId
      } as Master
      console.log('💾 Отправляем мастера на сохранение:', updatedMaster)
      onSave(updatedMaster)
      // НЕ закрываем модалку здесь - это делается в родительском компоненте после успешного сохранения
    }
  }

  const handleInputChange = (field: keyof Master, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleCityToggle = (city: string) => {
    setSelectedCities(prev => {
      if (prev.includes(city)) {
        return prev.filter(c => c !== city)
      } else {
        return [...prev, city]
      }
    })
  }

  // Получаем доступные города директора
  const getAvailableCities = () => {
    // Используем актуальные данные из API, если есть, иначе из auth-context
    const userData = currentUser || user
    
    if (!userData?.cities || !Array.isArray(userData.cities) || userData.cities.length === 0) {
      return []
    }
    
    return userData.cities
  }
  
  const availableCities = getAvailableCities()

  const processFile = (type: 'passport' | 'contract', file: File) => {
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

    // Сохраняем файл и создаем превью для изображений
    if (type === 'passport') {
      setPassportFile(file)
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => setPassportPreview(e.target?.result as string)
        reader.readAsDataURL(file)
      } else {
        setPassportPreview(null)
      }
    } else {
      setContractFile(file)
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => setContractPreview(e.target?.result as string)
        reader.readAsDataURL(file)
      } else {
        setContractPreview(null)
      }
    }

    // Загружаем файл
    handleFileUpload(type, file)
  }

  const handleFileUpload = async (type: 'passport' | 'contract', file: File) => {
    try {
      // Устанавливаем состояние загрузки
      if (type === 'passport') {
        setUploadingPassport(true)
      } else {
        setUploadingContract(true)
      }

      const formData = new FormData()
      formData.append('document', file)
      
      // Устанавливаем правильные пути для документов мастера
      const folderPath = type === 'passport' 
        ? 'director/masters/passport_doc'
        : 'director/masters/contract_doc'
      
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

      // Обновляем данные формы с URL файла
      if (type === 'passport') {
        setFormData(prev => ({ ...prev, passportDoc: data.url }))
      } else {
        setFormData(prev => ({ ...prev, contractDoc: data.url }))
      }
    } catch (error) {
      alert('Ошибка загрузки файла. Попробуйте еще раз.')
      
      // Очищаем файл при ошибке
      if (type === 'passport') {
        setPassportFile(null)
        setPassportPreview(null)
      } else {
        setContractFile(null)
        setContractPreview(null)
      }
    } finally {
      // Убираем состояние загрузки
      if (type === 'passport') {
        setUploadingPassport(false)
      } else {
        setUploadingContract(false)
      }
    }
  }

  const removeFile = (type: 'passport' | 'contract') => {
    if (type === 'passport') {
      setPassportFile(null)
      setPassportPreview(null)
      setFormData(prev => ({ ...prev, passportDoc: undefined }))
    } else {
      setContractFile(null)
      setContractPreview(null)
      setFormData(prev => ({ ...prev, contractDoc: undefined }))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {master ? `Редактирование мастера: ${master.name}` : "Добавление нового мастера"}
          </DialogTitle>
          <DialogDescription>
            {master ? "Измените данные мастера и сохраните изменения" : "Заполните данные нового мастера"}
          </DialogDescription>
          {(currentUser || user) && (
            <div className="mt-2 text-xs text-blue-600">
              Директор: {(currentUser || user).name} ({(currentUser || user).cities?.join(', ') || 'Нет городов'})
            </div>
          )}
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Основная информация
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <Files className="w-4 h-4" />
              Документы
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Имя мастера *</Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Введите имя мастера"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cities">Города *</Label>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Выберите города, в которых будет работать мастер (доступно для вашего региона: {availableCities.length})
                </p>
                {availableCities.length === 0 ? (
                  <div className="text-sm text-red-600 p-4 border border-red-200 rounded-md bg-red-50">
                    Нет доступных городов для вашего региона. Обратитесь к администратору.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Выпадающий список с множественным выбором */}
                    <Select 
                      value={selectedCities.length > 0 ? selectedCities[0] : ""} 
                      onValueChange={(value) => {
                        if (!selectedCities.includes(value)) {
                          setSelectedCities([...selectedCities, value])
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите город для добавления" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCities
                          .filter(city => !selectedCities.includes(city))
                          .map((city) => (
                            <SelectItem key={city} value={city}>
                              {city}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    
                    {/* Отображение выбранных городов */}
                    {selectedCities.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-green-600">
                          Выбранные города ({selectedCities.length}):
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedCities.map((city) => (
                            <div
                              key={city}
                              className="flex items-center space-x-2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm"
                            >
                              <span>{city}</span>
                              <button
                                type="button"
                                onClick={() => handleCityToggle(city)}
                                className="ml-1 hover:bg-primary-foreground/20 rounded-full p-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="statusWork">Статус работы</Label>
            <Select value={formData.statusWork || "работает"} onValueChange={(value) => handleInputChange("statusWork", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="работает">Работает</SelectItem>
                <SelectItem value="уволен">Уволен</SelectItem>
                <SelectItem value="в отпуске">В отпуске</SelectItem>
                <SelectItem value="больничный">Больничный</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Заметки</Label>
            <Textarea
              id="note"
              value={formData.note || ""}
              onChange={(e) => handleInputChange("note", e.target.value)}
              placeholder="Дополнительная информация о мастере"
              rows={3}
            />
          </div>

          {/* Telegram поля */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tgId">Telegram ID</Label>
              <Input
                id="tgId"
                value={formData.tgId || ""}
                onChange={(e) => handleInputChange("tgId", e.target.value)}
                placeholder="@username или числовой ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chatId">Chat ID</Label>
              <Input
                id="chatId"
                value={formData.chatId || ""}
                onChange={(e) => handleInputChange("chatId", e.target.value)}
                placeholder="Числовой Chat ID"
              />
            </div>
          </div>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4 mt-4">
          {/* Загрузка документов */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Документы</Label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Паспорт */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Паспорт</Label>
                
                {!passportFile ? (
                  <div className="relative border-2 border-dashed border-blue-300 rounded-lg p-4 transition-all duration-200 cursor-pointer hover:border-blue-400 hover:bg-blue-50/50">
                    <input
                      id="passport"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) processFile('passport', file)
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="text-center">
                      <div className="mx-auto w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                        <Upload className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-900">
                          Загрузить паспорт
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
                      {passportPreview ? (
                        <div className="flex-shrink-0">
                          <img
                            src={passportPreview}
                            alt="Превью паспорта"
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
                          {uploadingPassport ? (
                            <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {passportFile.name}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {(passportFile.size / 1024 / 1024).toFixed(2)} МБ
                        </p>
                        <div className="mt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeFile('passport')}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            disabled={uploadingPassport}
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

              {/* Договор */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Договор</Label>
                
                {!contractFile ? (
                  <div className="relative border-2 border-dashed border-green-300 rounded-lg p-4 transition-all duration-200 cursor-pointer hover:border-green-400 hover:bg-green-50/50">
                    <input
                      id="contract"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) processFile('contract', file)
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="text-center">
                      <div className="mx-auto w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                        <Upload className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-900">
                          Загрузить договор
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
                      {contractPreview ? (
                        <div className="flex-shrink-0">
                          <img
                            src={contractPreview}
                            alt="Превью договора"
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
                          {uploadingContract ? (
                            <Loader2 className="w-4 h-4 text-green-500 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {contractFile.name}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {(contractFile.size / 1024 / 1024).toFixed(2)} МБ
                        </p>
                        <div className="mt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeFile('contract')}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            disabled={uploadingContract}
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
          </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Отмена
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!formData.name || selectedCities.length === 0 || availableCities.length === 0}
          >
            <Save className="w-4 h-4 mr-2" />
            {master ? "Сохранить" : "Добавить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
