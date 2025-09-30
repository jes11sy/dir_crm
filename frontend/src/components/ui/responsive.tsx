import { cn } from "@/lib/utils"

interface ResponsiveGridProps {
  children: React.ReactNode
  cols?: {
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  gap?: number
  className?: string
}

export function ResponsiveGrid({ 
  children, 
  cols = { sm: 1, md: 2, lg: 3, xl: 4 }, 
  gap = 4, 
  className 
}: ResponsiveGridProps) {
  const gridCols = {
    sm: `grid-cols-${cols.sm || 1}`,
    md: `md:grid-cols-${cols.md || 2}`,
    lg: `lg:grid-cols-${cols.lg || 3}`,
    xl: `xl:grid-cols-${cols.xl || 4}`
  }

  return (
    <div 
      className={cn(
        "grid gap-4",
        gridCols.sm,
        gridCols.md,
        gridCols.lg,
        gridCols.xl,
        className
      )}
    >
      {children}
    </div>
  )
}

interface ResponsiveTableProps {
  children: React.ReactNode
  className?: string
}

export function ResponsiveTable({ children, className }: ResponsiveTableProps) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <div className="min-w-full">
        {children}
      </div>
    </div>
  )
}

interface ResponsiveCardProps {
  children: React.ReactNode
  className?: string
}

export function ResponsiveCard({ children, className }: ResponsiveCardProps) {
  return (
    <div 
      className={cn(
        "w-full p-4 sm:p-6 lg:p-8",
        "rounded-lg border bg-white shadow-sm",
        "transition-shadow hover:shadow-md",
        className
      )}
    >
      {children}
    </div>
  )
}

interface ResponsiveTextProps {
  children: React.ReactNode
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

export function ResponsiveText({ 
  children, 
  size = "md", 
  className 
}: ResponsiveTextProps) {
  const sizeClasses = {
    sm: "text-sm sm:text-base",
    md: "text-base sm:text-lg",
    lg: "text-lg sm:text-xl lg:text-2xl",
    xl: "text-xl sm:text-2xl lg:text-3xl xl:text-4xl"
  }

  return (
    <div className={cn(sizeClasses[size], className)}>
      {children}
    </div>
  )
}

interface ResponsiveButtonProps {
  children: React.ReactNode
  variant?: "default" | "outline" | "ghost"
  size?: "sm" | "md" | "lg"
  className?: string
  onClick?: () => void
}

export function ResponsiveButton({ 
  children, 
  variant = "default", 
  size = "md", 
  className,
  onClick 
}: ResponsiveButtonProps) {
  const variantClasses = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50",
    ghost: "text-gray-700 hover:bg-gray-100"
  }

  const sizeClasses = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2 text-base sm:px-6 sm:py-3",
    lg: "px-6 py-3 text-lg sm:px-8 sm:py-4"
  }

  return (
    <button
      className={cn(
        "rounded-md font-medium transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

interface ResponsiveInputProps {
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  className?: string
}

export function ResponsiveInput({ 
  placeholder, 
  value, 
  onChange, 
  className 
}: ResponsiveInputProps) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className={cn(
        "w-full px-3 py-2 sm:px-4 sm:py-3",
        "border border-gray-300 rounded-md",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
        "text-sm sm:text-base",
        className
      )}
    />
  )
}

interface ResponsiveContainerProps {
  children: React.ReactNode
  className?: string
}

export function ResponsiveContainer({ children, className }: ResponsiveContainerProps) {
  return (
    <div 
      className={cn(
        "w-full max-w-7xl mx-auto",
        "px-4 sm:px-6 lg:px-8",
        className
      )}
    >
      {children}
    </div>
  )
}

interface ResponsiveSidebarProps {
  children: React.ReactNode
  isOpen: boolean
  onClose: () => void
  className?: string
}

export function ResponsiveSidebar({ 
  children, 
  isOpen, 
  onClose, 
  className 
}: ResponsiveSidebarProps) {
  return (
    <>
      {/* Overlay для мобильных */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-50",
          "transform transition-transform duration-300 ease-in-out",
          "lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full",
          className
        )}
      >
        {children}
      </div>
    </>
  )
}

interface ResponsiveModalProps {
  children: React.ReactNode
  isOpen: boolean
  onClose: () => void
  title?: string
  className?: string
}

export function ResponsiveModal({ 
  children, 
  isOpen, 
  onClose, 
  title, 
  className 
}: ResponsiveModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className={cn(
          "relative w-full max-w-md sm:max-w-lg lg:max-w-2xl",
          "bg-white rounded-lg shadow-xl",
          "max-h-[90vh] overflow-y-auto",
          className
        )}
      >
        {title && (
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
        )}
        
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
