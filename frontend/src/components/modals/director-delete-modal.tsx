"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, Trash2, AlertTriangle } from "lucide-react"

interface Director {
  id: number
  name: string
  login: string
  cities: string[]
}

interface DirectorDeleteModalProps {
  isOpen: boolean
  director: Director | null
  onClose: () => void
  onSuccess: () => void
}

export function DirectorDeleteModal({ isOpen, director, onClose, onSuccess }: DirectorDeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string>("")

  const handleDelete = async () => {
    if (!director) return

    setIsDeleting(true)
    setError("")

    try {
      const token = localStorage.getItem('adminToken')
      
      const response = await fetch(`http://localhost:3002/api/admin/directors/${director.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const result = await response.json()

      if (response.ok) {
        onSuccess()
        onClose()
      } else {
        setError(result.message || 'Ошибка удаления директора')
      }
    } catch (error) {
      console.error('Ошибка удаления директора:', error)
      setError('Ошибка подключения к серверу')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleClose = () => {
    if (!isDeleting) {
      onClose()
      setError("")
    }
  }

  if (!director) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Подтверждение удаления
          </DialogTitle>
          <DialogDescription>
            Это действие нельзя будет отменить
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Удаление директора</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Вы уверены, что хотите удалить директора <strong>"{director.name}"</strong>?
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">Логин:</span>
              <span>{director.login}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">Города:</span>
              <span>{director.cities.join(', ')}</span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Внимание!</p>
                <p>После удаления директор не сможет войти в систему. Все связанные данные будут сохранены.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleClose}
            disabled={isDeleting}
            className="flex-1"
          >
            Отмена
          </Button>
          <Button 
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Удаление...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Удалить
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
