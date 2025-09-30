"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { FormField, FormSummary } from "@/components/ui/form-validation"
import { createLoginValidator, sanitizeFormData } from "@/lib/validation"
import { Loader2, Lock, User, Shield } from "lucide-react"

export interface AdminLoginForm {
  login: string
  password: string
}

interface AdminLoginFormComponentProps {
  onSubmit: (data: AdminLoginForm) => void
  isLoading?: boolean
}

export function AdminLoginFormComponent({ onSubmit, isLoading = false }: AdminLoginFormComponentProps) {
  const [formData, setFormData] = useState<AdminLoginForm>({
    login: "",
    password: ""
  })
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [showValidation, setShowValidation] = useState(false)

  const validator = createLoginValidator()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setShowValidation(true)
    
    const sanitizedData = sanitizeFormData(formData)
    const isValid = validator.validate(sanitizedData)
    
    if (!isValid) {
      setValidationErrors(validator.getErrors())
      return
    }
    
    setValidationErrors({})
    onSubmit(sanitizedData as AdminLoginForm)
  }

  const handleInputChange = (field: keyof AdminLoginForm, value: string) => {
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
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Логотип и заголовок */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Shield className="text-white w-8 h-8" />
          </div>
          <h1 className="mt-6 text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Панель администратора
          </h1>
          <p className="mt-2 text-gray-600 text-lg">
            Вход в систему управления
          </p>
        </div>

        {/* Форма входа */}
        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold text-center text-red-700">
              Администратор
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              Введите ваши административные данные
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {showValidation && Object.keys(validationErrors).length > 0 && (
              <FormSummary errors={validationErrors} />
            )}
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <FormField
                label="Логин администратора"
                required
                error={showValidation ? validationErrors.login : null}
              >
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="login"
                    type="text"
                    value={formData.login}
                    onChange={(e) => handleInputChange("login", e.target.value)}
                    placeholder="Введите логин администратора"
                    className={`pl-12 h-12 border-gray-200 focus:border-red-500 focus:ring-red-500 rounded-xl ${
                      showValidation && validationErrors.login ? 'border-red-500' : ''
                    }`}
                  />
                </div>
              </FormField>

              <FormField
                label="Пароль"
                required
                error={showValidation ? validationErrors.password : null}
              >
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    placeholder="Введите пароль"
                    className={`pl-12 h-12 border-gray-200 focus:border-red-500 focus:ring-red-500 rounded-xl ${
                      showValidation && validationErrors.password ? 'border-red-500' : ''
                    }`}
                  />
                </div>
              </FormField>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Вход в систему...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5 mr-2" />
                    <span>Войти как администратор</span>
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Футер */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            © 2025 Новые Схемы. Все права защищены.
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Административная панель системы
          </p>
        </div>
      </div>
    </div>
  )
}
