"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { FormField, FormSummary } from "@/components/ui/form-validation"
import { Loader2, Edit, X } from "lucide-react"

interface Director {
  id: number
  name: string
  login: string
  cities: string[]
  note?: string
  tgId?: string
}

interface DirectorFormData {
  name: string
  cities: string[]
  note: string
  tgId: string
  password: string
}

interface DirectorEditModalProps {
  isOpen: boolean
  director: Director | null
  onClose: () => void
  onSuccess: () => void
}

export function DirectorEditModal({ isOpen, director, onClose, onSuccess }: DirectorEditModalProps) {
  const [formData, setFormData] = useState<DirectorFormData>({
    name: "",
    cities: [],
    note: "",
    tgId: "",
    password: ""
  })
  const [cityInput, setCityInput] = useState("")
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Заполняем форму данными директора при открытии
  useEffect(() => {
    if (director && isOpen) {
      setFormData({
        name: director.name,
        cities: [...director.cities],
        note: director.note || "",
        tgId: director.tgId || "",
        password: ""
      })
    }
  }, [director, isOpen])

  const handleInputChange = (field: keyof DirectorFormData, value: string) => {
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

  const addCity = () => {
    const city = cityInput.trim()
    if (city && !formData.cities.includes(city)) {
      setFormData(prev => ({
        ...prev,
        cities: [...prev.cities, city]
      }))
      setCityInput("")
    }
  }

  const removeCity = (cityToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      cities: prev.cities.filter(city => city !== cityToRemove)
    }))
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.name.trim()) {
      errors.name = "Имя обязательно"
    }

    if (formData.cities.length === 0) {
      errors.cities = "Необходимо указать хотя бы один город"
    }

    if (formData.password && formData.password.length < 6) {
      errors.password = "Пароль должен содержать минимум 6 символов"
    }

    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!director) return

    const errors = validateForm()
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }

    setIsSubmitting(true)

    try {
      const token = localStorage.getItem('adminToken')
      
      const updateData: any = {
        name: formData.name.trim(),
        cities: formData.cities,
        note: formData.note.trim() || null,
        tgId: formData.tgId.trim() || null
      }

      // Добавляем пароль только если он заполнен
      if (formData.password.trim()) {
        updateData.password = formData.password
      }

      const response = await fetch(`http://localhost:3002/api/admin/directors/${director.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      })

      const result = await response.json()

      if (response.ok) {
        onSuccess()
        onClose()
        setValidationErrors({})
      } else {
        if (result.message) {
          setValidationErrors({ general: result.message })
        }
      }
    } catch (error) {
      console.error('Ошибка обновления директора:', error)
      setValidationErrors({ general: 'Ошибка подключения к серверу' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
      setValidationErrors({})
      setCityInput("")
    }
  }

  if (!director) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Редактировать директора
          </DialogTitle>
          <DialogDescription>
            Изменение данных директора "{director.name}"
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {validationErrors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{validationErrors.general}</p>
            </div>
          )}

          <FormField
            label="Имя директора"
            required
            error={validationErrors.name}
          >
            <Input
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Введите имя директора"
              disabled={isSubmitting}
            />
          </FormField>

          <FormField
            label="Логин"
            required
          >
            <Input
              value={director.login}
              disabled
              className="bg-gray-100"
              placeholder="Логин нельзя изменить"
            />
            <p className="text-xs text-gray-500 mt-1">Логин нельзя изменить после создания</p>
          </FormField>

          <FormField
            label="Новый пароль"
            error={validationErrors.password}
          >
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              placeholder="Оставьте пустым, чтобы не менять"
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">Заполните только для смены пароля</p>
          </FormField>

          <FormField
            label="Города"
            required
            error={validationErrors.cities}
          >
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  placeholder="Введите название города"
                  disabled={isSubmitting}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addCity()
                    }
                  }}
                />
                <Button 
                  type="button" 
                  onClick={addCity}
                  disabled={isSubmitting || !cityInput.trim()}
                  size="sm"
                >
                  Добавить
                </Button>
              </div>
              
              {formData.cities.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.cities.map((city, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                    >
                      <span>{city}</span>
                      <button
                        type="button"
                        onClick={() => removeCity(city)}
                        disabled={isSubmitting}
                        className="hover:text-blue-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </FormField>

          <FormField
            label="Telegram ID"
            error={validationErrors.tgId}
          >
            <Input
              value={formData.tgId}
              onChange={(e) => handleInputChange("tgId", e.target.value)}
              placeholder="Введите Telegram ID"
              disabled={isSubmitting}
            />
          </FormField>

          <FormField
            label="Примечание"
            error={validationErrors.note}
          >
            <Textarea
              value={formData.note}
              onChange={(e) => handleInputChange("note", e.target.value)}
              placeholder="Дополнительная информация"
              disabled={isSubmitting}
              rows={3}
            />
          </FormField>

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Отмена
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Сохранение...
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4 mr-2" />
                  Сохранить
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
