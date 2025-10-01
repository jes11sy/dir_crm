"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AdminLoginFormComponent } from "@/components/forms/admin-login-form"
import { AdminLoginForm } from "@/lib/types"
import { config } from "@/lib/config"

export default function AdminLoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleAdminLogin = async (data: AdminLoginForm) => {
    setIsLoading(true)
    
    try {
      const response = await fetch(`${config.apiUrl}/api/admin/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (response.ok) {
        // Сохраняем токен админа в localStorage
        localStorage.setItem('adminToken', result.token)
        localStorage.setItem('adminUser', JSON.stringify(result.admin))
        
        // Перенаправляем на страницу заказов
        router.push('/orders')
      } else {
        alert(result.message || 'Ошибка входа')
      }
    } catch (error) {
      alert('Ошибка подключения к серверу')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminLoginFormComponent onSubmit={handleAdminLogin} isLoading={isLoading} />
    </div>
  )
}
