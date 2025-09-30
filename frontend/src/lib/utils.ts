import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Форматирует дату для отображения в UI, обрабатывая как локальное время
 * @param dateString - дата в формате ISO string из БД (обрабатывается как локальная)
 * @param options - опции форматирования
 * @returns отформатированная дата
 */
export function formatDateForDisplay(
  dateString: string, 
  options: {
    includeTime?: boolean
  } = {}
): string {
  if (!dateString) return ''
  
  const { includeTime = true } = options
  
  try {
    // ВАЖНО: парсим дату как локальную, а не UTC
    // Для этого добавляем 'T' если его нет и убираем 'Z' если есть
    let localDateString = dateString.replace('Z', '').replace(' ', 'T')
    
    // Если нет времени, добавляем 00:00:00
    if (!localDateString.includes('T')) {
      localDateString += 'T00:00:00'
    }
    
    const date = new Date(localDateString)
    
    if (includeTime) {
      return date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } else {
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    }
  } catch (error) {
    console.error('Ошибка форматирования даты:', error)
    return dateString
  }
}

/**
 * Форматирует дату для использования в HTML input[type="datetime-local"]
 * @param dateString - дата в формате ISO string из БД
 * @returns дата в формате YYYY-MM-DDTHH:mm
 */
export function formatDateForInput(dateString: string): string {
  if (!dateString) return ''
  
  try {
    // Обрабатываем как локальную дату
    let localDateString = dateString.replace('Z', '').replace(' ', 'T')
    
    if (!localDateString.includes('T')) {
      localDateString += 'T00:00:00'
    }
    
    const date = new Date(localDateString)
    
    // Форматируем для input[type="datetime-local"]
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    
    return `${year}-${month}-${day}T${hours}:${minutes}`
  } catch (error) {
    console.error('Ошибка форматирования даты для input:', error)
    return ''
  }
}

/**
 * Конвертирует дату из HTML input в формат для отправки на сервер
 * @param inputValue - значение из input[type="datetime-local"]
 * @returns дата в формате для БД (без timezone info)
 */
export function convertInputDateToISO(inputValue: string): string {
  if (!inputValue) return ''
  
  try {
    // Просто берем локальное время как есть и форматируем для БД
    const date = new Date(inputValue)
    
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const seconds = date.getSeconds().toString().padStart(2, '0')
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  } catch (error) {
    console.error('Ошибка конвертации даты:', error)
    return ''
  }
}

