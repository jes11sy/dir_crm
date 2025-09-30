import { cn } from "@/lib/utils"
import { AlertCircle, CheckCircle } from "lucide-react"

interface ValidationErrorProps {
  error?: string | null
  className?: string
}

export function ValidationError({ error, className }: ValidationErrorProps) {
  if (!error) return null

  return (
    <div className={cn("flex items-center space-x-1 text-red-600 text-sm mt-1", className)}>
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <span>{error}</span>
    </div>
  )
}

interface ValidationSuccessProps {
  message?: string
  className?: string
}

export function ValidationSuccess({ message, className }: ValidationSuccessProps) {
  if (!message) return null

  return (
    <div className={cn("flex items-center space-x-1 text-green-600 text-sm mt-1", className)}>
      <CheckCircle className="w-4 h-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  )
}

interface FormFieldProps {
  label: string
  required?: boolean
  error?: string | null
  success?: string | null
  children: React.ReactNode
  className?: string
}

export function FormField({ 
  label, 
  required = false, 
  error, 
  success, 
  children, 
  className 
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        {children}
        {error && (
          <div className="absolute -bottom-5 left-0">
            <ValidationError error={error} />
          </div>
        )}
        {success && (
          <div className="absolute -bottom-5 left-0">
            <ValidationSuccess message={success} />
          </div>
        )}
      </div>
    </div>
  )
}

interface FormSummaryProps {
  errors: Record<string, string>
  className?: string
}

export function FormSummary({ errors, className }: FormSummaryProps) {
  const errorCount = Object.keys(errors).length
  
  if (errorCount === 0) return null

  return (
    <div className={cn("bg-red-50 border border-red-200 rounded-md p-4", className)}>
      <div className="flex items-center space-x-2 mb-2">
        <AlertCircle className="w-5 h-5 text-red-600" />
        <h3 className="font-medium text-red-800">
          Исправьте следующие ошибки ({errorCount}):
        </h3>
      </div>
      <ul className="space-y-1">
        {Object.entries(errors).map(([field, error]) => (
          <li key={field} className="text-sm text-red-700">
            • {error}
          </li>
        ))}
      </ul>
    </div>
  )
}

interface FormProgressProps {
  current: number
  total: number
  className?: string
}

export function FormProgress({ current, total, className }: FormProgressProps) {
  const percentage = (current / total) * 100

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between text-sm text-gray-600">
        <span>Прогресс заполнения</span>
        <span>{current} из {total}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
