"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormField, FormSummary } from "@/components/ui/form-validation"
import { createIncomeValidator, sanitizeFormData, validateFile } from "@/lib/validation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Save, X, Upload, FileText, Image, Trash2, CheckCircle } from "lucide-react"
import { config } from "@/lib/config"

interface IncomeFormData {
  city: string
  amount: number
  paymentPurpose: string
  note: string
  receiptDoc?: string
  nameCreate: string
}

interface IncomeFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: IncomeFormData) => void
  loading?: boolean
  directorCities?: string[]
  directorName?: string
}

export function IncomeForm({ isOpen, onClose, onSubmit, loading = false, directorCities = [], directorName = "Директор" }: IncomeFormProps) {
  const [formData, setFormData] = useState<IncomeFormData>({
    city: "",
    amount: 0,
    paymentPurpose: "",
    note: "",
    nameCreate: directorName // Используем реальное имя директора
  })

  // Предопределенные варианты назначения платежа для приходов
  const paymentPurposeOptions = [
    "Заказ",
    "Депозит",
    "Штраф",
    "Иное"
  ]
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [showValidation, setShowValidation] = useState(false)

  const validator = createIncomeValidator()

  // Обновляем имя создателя при изменении имени директора
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      nameCreate: directorName
    }))
  }, [directorName])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setShowValidation(true)

    // Подготавливаем данные для валидации
    const dataToValidate = sanitizeFormData(formData)
    
    // Валидируем данные
    const isValid = validator.validate(dataToValidate)
    const errors = validator.getErrors()
    
    setValidationErrors(errors)
    
    if (!isValid) {
      return
    }

    try {
      let fileUrl = undefined
      
      // Если есть файл, загружаем его в S3
      if (receiptFile) {
        
        const uploadFormData = new FormData()
        uploadFormData.append('document', receiptFile)
        uploadFormData.append('folder', 'director/cash/receipt_doc')

        const uploadResponse = await fetch(`${config.apiUrl}/api/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: uploadFormData
        })

        if (!uploadResponse.ok) {
          throw new Error('Ошибка загрузки файла в S3')
        }

        const uploadData = await uploadResponse.json()
        
        // Сохраняем URL файла из S3
        fileUrl = uploadData.url
      }

      // Добавляем информацию о файле к данным формы
      const submitData = {
        ...formData,
        receiptDoc: fileUrl
      }
      
      await onSubmit(submitData)
    } catch (error) {
      alert('Ошибка создания прихода. Попробуйте еще раз.')
    }
  }

  const processFile = (file: File) => {
    const fileError = validateFile(file, {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['image/jpeg', 'image/png', 'application/pdf']
    })
    
    if (fileError) {
      alert(fileError)
      return
    }
    
    setReceiptFile(file)
    
    // Создаем превью для изображений
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setFilePreview(null)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const removeFile = () => {
    setReceiptFile(null)
    setFilePreview(null)
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = e.dataTransfer.files
    if (files && files[0]) {
      processFile(files[0])
    }
  }

  const resetForm = () => {
    setFormData({
      city: "",
      amount: 0,
      paymentPurpose: "",
      note: "",
      nameCreate: directorName
    })
    setReceiptFile(null)
    setFilePreview(null)
    setValidationErrors({})
    setShowValidation(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleInputChange = (field: keyof IncomeFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Очищаем ошибку при изменении поля
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Save className="w-5 h-5 text-green-600" />
            </div>
            Новый приход
          </DialogTitle>
          <DialogDescription className="text-gray-600 mt-2">
            Добавьте информацию о поступлении средств
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {showValidation && Object.keys(validationErrors).length > 0 && (
            <FormSummary errors={validationErrors} />
          )}
          
          <FormField
            label="Город"
            required
            error={showValidation ? validationErrors.city : null}
          >
            <Select
              value={formData.city}
              onValueChange={(value) => handleInputChange("city", value)}
            >
              <SelectTrigger className={`${showValidation && validationErrors.city ? 'border-red-500' : ''}`}>
                <SelectValue placeholder="Выберите город" />
              </SelectTrigger>
              <SelectContent>
                {directorCities.length > 0 ? (
                  directorCities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-cities" disabled>
                    Нет доступных городов
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </FormField>

          <FormField
            label="Сумма"
            required
            error={showValidation ? validationErrors.amount : null}
          >
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">₽</span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.amount || ""}
                onChange={(e) => handleInputChange("amount", parseFloat(e.target.value) || 0)}
                placeholder="0"
                className={`pl-8 text-lg font-medium ${showValidation && validationErrors.amount ? 'border-red-500' : ''}`}
              />
            </div>
          </FormField>

          <FormField
            label="Назначение платежа"
            required
            error={showValidation ? validationErrors.paymentPurpose : null}
          >
            <Select
              value={formData.paymentPurpose}
              onValueChange={(value) => handleInputChange("paymentPurpose", value)}
            >
              <SelectTrigger className={`${showValidation && validationErrors.paymentPurpose ? 'border-red-500' : ''}`}>
                <SelectValue placeholder="Выберите назначение платежа" />
              </SelectTrigger>
              <SelectContent>
                {paymentPurposeOptions.map((purpose) => (
                  <SelectItem key={purpose} value={purpose}>
                    {purpose}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField
            label="Комментарий"
            required
            error={showValidation ? validationErrors.note : null}
          >
            <Textarea
              id="note"
              value={formData.note}
              onChange={(e) => handleInputChange("note", e.target.value)}
              placeholder="Введите комментарий к операции"
              rows={3}
              className={`resize-none ${showValidation && validationErrors.note ? 'border-red-500' : ''}`}
            />
          </FormField>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Чек операции (опционально)</Label>
            
            {!receiptFile ? (
              <div
                className={`relative border-2 border-dashed rounded-lg p-6 transition-all duration-200 cursor-pointer hover:border-green-400 hover:bg-green-50/50 ${
                  dragActive 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-300 bg-gray-50'
                }`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <input
                  id="receipt"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="text-center">
                  <div className="mx-auto w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                    <Upload className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-900">
                      Нажмите для выбора или перетащите файл
                    </p>
                    <p className="text-xs text-gray-500">
                      PDF, JPG, PNG до 5 МБ
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border rounded-lg p-4 bg-white">
                <div className="flex items-start space-x-4">
                  {filePreview ? (
                    <div className="flex-shrink-0">
                      <img 
                        src={filePreview} 
                        alt="Превью чека" 
                        className="w-20 h-20 object-cover rounded-lg border"
                      />
                    </div>
                  ) : (
                    <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {receiptFile.name}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {(receiptFile.size / 1024 / 1024).toFixed(2)} МБ
                    </p>
                    <div className="mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={removeFile}
                        className="text-red-600 border-red-200 hover:bg-red-50"
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

          <DialogFooter className="gap-3 pt-6">
            <Button type="button" variant="outline" onClick={handleClose} className="px-6">
              <X className="w-4 h-4 mr-2" />
              Отмена
            </Button>
            <Button type="submit" disabled={loading} className="px-6 bg-green-600 hover:bg-green-700">
              <Save className="w-4 h-4 mr-2" />
              {loading ? "Сохранение..." : "Добавить приход"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
