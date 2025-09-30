import { Navigation } from "@/components/layout/navigation"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ResponsiveContainer, ResponsiveGrid, ResponsiveCard } from "@/components/ui/responsive"
import { FadeIn, SlideIn, Stagger, HoverScale } from "@/components/ui/animations"
import { 
  ShoppingCart, 
  Wallet, 
  Users, 
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle
} from "lucide-react"

export default function Home() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navigation />
        
        <main className="container mx-auto p-6">
        <FadeIn>
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Панель управления</h1>
            <p className="text-muted-foreground">
              Добро пожаловать в CRM систему для управления заявками
            </p>
          </div>
        </FadeIn>

        <ResponsiveGrid 
          cols={{ sm: 1, md: 2, lg: 4 }} 
          className="mb-8"
        >
          <Stagger staggerDelay={100}>
            <HoverScale>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Всего заказов</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,234</div>
                  <p className="text-xs text-muted-foreground">
                    +20.1% с прошлого месяца
                  </p>
                </CardContent>
              </Card>
            </HoverScale>

            <HoverScale>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Активные заказы</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">89</div>
                  <p className="text-xs text-muted-foreground">
                    +12.5% с прошлого месяца
                  </p>
                </CardContent>
              </Card>
            </HoverScale>

            <HoverScale>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Завершенные</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,145</div>
                  <p className="text-xs text-muted-foreground">
                    +18.2% с прошлого месяца
                  </p>
                </CardContent>
              </Card>
            </HoverScale>

            <HoverScale>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Оборот</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₽2,345,678</div>
                  <p className="text-xs text-muted-foreground">
                    +15.3% с прошлого месяца
                  </p>
                </CardContent>
              </Card>
            </HoverScale>
          </Stagger>
        </ResponsiveGrid>

        <ResponsiveGrid cols={{ sm: 1, lg: 2 }} className="gap-6">
          <SlideIn direction="left">
            <Card>
              <CardHeader>
                <CardTitle>Быстрые действия</CardTitle>
                <CardDescription>
                  Основные функции системы
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <HoverScale>
                  <Button className="w-full justify-start" variant="outline">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Просмотреть заказы
                  </Button>
                </HoverScale>
                <HoverScale>
                  <Button className="w-full justify-start" variant="outline">
                    <Wallet className="mr-2 h-4 w-4" />
                    Управление кассой
                  </Button>
                </HoverScale>
                <HoverScale>
                  <Button className="w-full justify-start" variant="outline">
                    <Users className="mr-2 h-4 w-4" />
                    Сотрудники
                  </Button>
                </HoverScale>
                <HoverScale>
                  <Button className="w-full justify-start" variant="outline">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Отчеты
                  </Button>
                </HoverScale>
              </CardContent>
            </Card>
          </SlideIn>

          <SlideIn direction="right">
            <Card>
              <CardHeader>
                <CardTitle>Последние заказы</CardTitle>
                <CardDescription>
                  Недавно созданные заказы
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Stagger staggerDelay={50}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">РК-2024-001</p>
                      <p className="text-sm text-muted-foreground">Иван Петров</p>
                    </div>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      Новый
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">РК-2024-002</p>
                      <p className="text-sm text-muted-foreground">Мария Сидорова</p>
                    </div>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                      В работе
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">РК-2024-003</p>
                      <p className="text-sm text-muted-foreground">Алексей Козлов</p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                      Завершен
                    </span>
                  </div>
                </Stagger>
              </CardContent>
            </Card>
          </SlideIn>
        </ResponsiveGrid>
        </main>
      </div>
    </ProtectedRoute>
  )
}
