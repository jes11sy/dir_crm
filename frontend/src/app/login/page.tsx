"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LoginFormComponent } from "@/components/forms/login-form"
import { LoginForm } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { login } = useAuth()

  const handleLogin = async (data: LoginForm) => {
    setIsLoading(true)
    
    try {
      const response = await fetch('http://localhost:3002/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (response.ok) {
        // Обновляем AuthProvider
        login(result.token, result.user)
        
        // Перенаправляем на главную страницу
        router.push('/')
      } else {
        alert(result.message || 'Ошибка входа')
      }
    } catch (error) {
      console.error('Ошибка входа:', error)
      alert('Ошибка подключения к серверу')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <LoginFormComponent onSubmit={handleLogin} isLoading={isLoading} />
    </div>
  )
}