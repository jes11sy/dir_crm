"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { FormField, FormSummary } from "@/components/ui/form-validation"
import { Loader2, Plus, X } from "lucide-react"
import { config } from "@/lib/config"

interface DirectorFormData {
  name: string
  login: string
  password: string
  cities: string[]
  note: string
  tgId: string
}

interface DirectorAddModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function DirectorAddModal({ isOpen, onClose, onSuccess }: DirectorAddModalProps) {
  const [formData, setFormData] = useState<DirectorFormData>({
    name: "",
    login: "",
    password: "",
    cities: [],
    note: "",
    tgId: ""
  })
  const [cityInput, setCityInput] = useState("")
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

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

    if (!formData.login.trim()) {
      errors.login = "Логин обязателен"
    } else if (formData.login.length < 3) {
      errors.login = "Логин должен содержать минимум 3 символа"
    }

    if (!formData.password.trim()) {
      errors.password = "Пароль обязателен"
    } else if (formData.password.length < 6) {
      errors.password = "Пароль должен содержать минимум 6 символов"
    }

    if (formData.cities.length === 0) {
      errors.cities = "Необходимо добавить хотя бы один город"
    }

    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const errors = validateForm()
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }

    setIsSubmitting(true)

    try {
      const token = localStorage.getItem('adminToken')
      
      const response = await fetch(`${config.apiUrl}/api/admin/directors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          login: formData.login.trim(),
          password: formData.password,
          cities: formData.cities,
          note: formData.note.trim() || null,
          tgId: formData.tgId.trim() || null
        })
      })

      const result = await response.json()

      if (response.ok) {
        onSuccess()
        onClose()
        // Сброс формы
        setFormData({
          name: "",
          login: "",
          password: "",
          cities: [],
          note: "",
          tgId: ""
        })
        setValidationErrors({})
      } else {
        if (result.message) {
          setValidationErrors({ general: result.message })
        }
      }
    } catch (error) {
      setValidationErrors({ general: 'Ошибка подключения к серверу' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
      setValidationErrors({})
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Добавить директора
          </DialogTitle>
          <DialogDescription>
            Создание нового директора в системе
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
            error={validationErrors.login}
          >
            <Input
              value={formData.login}
              onChange={(e) => handleInputChange("login", e.target.value)}
              placeholder="Введите логин"
              disabled={isSubmitting}
            />
          </FormField>

          <FormField
            label="Пароль"
            required
            error={validationErrors.password}
          >
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              placeholder="Введите пароль"
              disabled={isSubmitting}
            />
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
                  Создание...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Создать
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
