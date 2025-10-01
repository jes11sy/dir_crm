"use client"

import React, { Component, ReactNode } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onError?.(error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Произошла ошибка
          </h2>
          <p className="text-gray-600 mb-4 max-w-md">
            Что-то пошло не так. Попробуйте обновить страницу или обратитесь к администратору.
          </p>
          {process.env.NODE_ENV === "development" && this.state.error && (
            <details className="mb-4 p-4 bg-red-50 rounded-lg text-left max-w-md">
              <summary className="cursor-pointer font-medium text-red-800">
                Детали ошибки (только в режиме разработки)
              </summary>
              <pre className="mt-2 text-xs text-red-700 whitespace-pre-wrap">
                {this.state.error.toString()}
              </pre>
            </details>
          )}
          <Button onClick={this.handleRetry} className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4" />
            <span>Попробовать снова</span>
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}

interface ErrorMessageProps {
  error?: string | Error | null
  className?: string
}

export function ErrorMessage({ error, className }: ErrorMessageProps) {
  if (!error) return null

  const errorText = typeof error === "string" ? error : error.message

  return (
    <div className={`flex items-center space-x-2 text-red-600 text-sm ${className}`}>
      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
      <span>{errorText}</span>
    </div>
  )
}

interface ErrorToastProps {
  error: string
  onClose: () => void
  className?: string
}

export function ErrorToast({ error, onClose, className }: ErrorToastProps) {
  return (
    <div className={`fixed top-4 right-4 z-50 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg max-w-md ${className}`}>
      <div className="flex items-start space-x-3">
        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium text-red-800">Ошибка</h3>
          <p className="text-sm text-red-700 mt-1">{error}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
        >
          ×
        </Button>
      </div>
    </div>
  )
}
