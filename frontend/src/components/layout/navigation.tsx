"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { ResponsiveSidebar, ResponsiveContainer } from "@/components/ui/responsive"
import { FadeIn, SlideIn } from "@/components/ui/animations"
import { 
  ShoppingCart, 
  Wallet, 
  Users, 
  BarChart3,
  History,
  TrendingUp,
  TrendingDown,
  MapPin,
  UserCheck,
  LogOut,
  Menu,
  X
} from "lucide-react"

const navigationItems = [
  {
    title: "Заказы",
    href: "/orders",
    icon: ShoppingCart,
  },
  {
    title: "Касса",
    href: "/cash",
    icon: Wallet,
    children: [
      {
        title: "История",
        href: "/cash/history",
        icon: History,
      },
      {
        title: "Расход",
        href: "/cash/expense",
        icon: TrendingDown,
      },
      {
        title: "Приход",
        href: "/cash/income",
        icon: TrendingUp,
      },
    ],
  },
  {
    title: "Сотрудники",
    href: "/masters",
    icon: Users,
  },
  {
    title: "Отчеты",
    href: "/reports",
    icon: BarChart3,
    children: [
      {
        title: "Отчет по городу",
        href: "/reports/city",
        icon: MapPin,
      },
      {
        title: "Отчет по мастерам",
        href: "/reports/masters",
        icon: UserCheck,
      },
    ],
  },
]

export function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:flex items-center justify-between px-6 py-4 border-b bg-white shadow-sm">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">CRM</span>
            </div>
            <span className="font-semibold text-xl">Директор</span>
          </div>
          
          <div className="flex items-center space-x-2">
            {navigationItems.map((item) => (
              <div key={item.href} className="relative group">
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    pathname === item.href
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.title}</span>
                </Link>
                
                {item.children && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-2">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "flex items-center space-x-3 px-4 py-3 text-sm hover:bg-gray-50 transition-colors",
                            pathname === child.href
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <child.icon className="w-4 h-4" />
                          <span>{child.title}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3 px-3 py-2 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">{user?.name?.[0]}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.city}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="flex items-center space-x-2 hover:bg-red-50 hover:border-red-200 hover:text-red-600"
          >
            <LogOut className="w-4 h-4" />
            <span>Выйти</span>
          </Button>
        </div>
      </nav>

    {/* Mobile Navigation */}
    <nav className="lg:hidden flex items-center justify-between px-4 py-3 border-b">
      <div className="flex items-center space-x-2">
        <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-xs">CRM</span>
        </div>
        <span className="font-semibold text-base">Директор</span>
      </div>
      
      <div className="flex items-center space-x-2">
        <span className="text-xs text-muted-foreground mobile-hidden">
          {user?.name}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>
    </nav>

    {/* Mobile Sidebar */}
    <ResponsiveSidebar 
      isOpen={isMobileMenuOpen} 
      onClose={() => setIsMobileMenuOpen(false)}
      className="p-4"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">CRM</span>
          </div>
          <span className="font-semibold text-lg">Директор</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMobileMenuOpen(false)}
          className="p-2"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="space-y-2">
        {navigationItems.map((item, index) => (
          <SlideIn key={item.href} direction="left" delay={index * 100}>
            <div className="space-y-1">
              <Link
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.title}</span>
              </Link>
              
              {item.children && (
                <div className="ml-6 space-y-1">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center space-x-3 px-3 py-2 rounded-md text-sm hover:bg-accent",
                        pathname === child.href
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <child.icon className="w-4 h-4" />
                      <span>{child.title}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </SlideIn>
        ))}
      </div>

      <div className="mt-8 pt-4 border-t">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium">{user?.name?.[0]}</span>
          </div>
          <div>
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{user?.city}</p>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Выйти</span>
        </Button>
      </div>
    </ResponsiveSidebar>
    </>
  )
}