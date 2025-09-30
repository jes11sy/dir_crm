"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function CashPage() {
  const router = useRouter()

  useEffect(() => {
    // Редирект на страницу истории операций
    router.replace('/cash/history')
  }, [router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
    </div>
  )
}
