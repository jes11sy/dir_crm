"use client"

import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Shield, LogOut, Users, BarChart3, Package } from "lucide-react"

interface AdminHeaderProps {
  adminLogin: string
  onLogout: () => void
}

export function AdminHeader({ adminLogin, onLogout }: AdminHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()

  const navigationItems = [
    {
      name: "Директора",
      path: "/admin/directors",
      icon: Users
    },
    {
      name: "Статистика", 
      path: "/admin/statistics",
      icon: BarChart3
    },
    {
      name: "Заказы",
      path: "/admin/orders", 
      icon: Package
    }
  ]

  const isActive = (path: string) => pathname === path

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              {/* Левая часть */}
              <td style={{ width: '400px', padding: '1rem 0', verticalAlign: 'middle' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div 
                    className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-700 transition-colors"
                    onClick={() => router.push('/admin')}
                  >
                    <Shield className="text-white w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">Панель администратора</h1>
                    <p className="text-sm text-gray-500">Добро пожаловать, {adminLogin}</p>
                  </div>
                </div>
              </td>

              {/* Центральная часть */}
              <td style={{ textAlign: 'center', padding: '1rem 0', verticalAlign: 'middle' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                  {navigationItems.map((item) => {
                    const Icon = item.icon
                    const active = isActive(item.path)
                    
                    return (
                      <Button
                        key={item.path}
                        onClick={() => router.push(item.path)}
                        variant="ghost"
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                          active 
                            ? 'bg-gray-900 text-white hover:bg-gray-800' 
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="font-medium">{item.name}</span>
                      </Button>
                    )
                  })}
                </div>
              </td>

              {/* Правая часть */}
              <td style={{ width: '200px', textAlign: 'right', padding: '1rem 0', verticalAlign: 'middle' }}>
                <Button 
                  onClick={onLogout}
                  variant="outline" 
                  className="border-gray-300 text-gray-600 hover:bg-gray-50"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Выйти
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </header>
  )
}
