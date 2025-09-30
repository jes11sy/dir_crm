// Утилиты для валидации форм

export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: RegExp
  custom?: (value: any) => string | null
}

export interface ValidationErrors {
  [key: string]: string
}

export class FormValidator {
  private rules: Record<string, ValidationRule> = {}
  private errors: ValidationErrors = {}

  addRule(field: string, rule: ValidationRule) {
    this.rules[field] = rule
    return this
  }

  validate(data: Record<string, any>): boolean {
    this.errors = {}
    let isValid = true

    for (const [field, rule] of Object.entries(this.rules)) {
      const value = data[field]
      const error = this.validateField(field, value, rule)
      
      if (error) {
        this.errors[field] = error
        isValid = false
      }
    }

    return isValid
  }

  private validateField(field: string, value: any, rule: ValidationRule): string | null {
    // Проверка на обязательность
    if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return `${this.getFieldName(field)} обязательно для заполнения`
    }

    // Если поле пустое и не обязательное, пропускаем остальные проверки
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return null
    }

    // Проверка минимальной длины
    if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
      return `${this.getFieldName(field)} должно содержать минимум ${rule.minLength} символов`
    }

    // Проверка максимальной длины
    if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
      return `${this.getFieldName(field)} должно содержать максимум ${rule.maxLength} символов`
    }

    // Проверка минимального значения
    if (rule.min !== undefined && typeof value === 'number' && value < rule.min) {
      return `${this.getFieldName(field)} должно быть не менее ${rule.min}`
    }

    // Проверка максимального значения
    if (rule.max !== undefined && typeof value === 'number' && value > rule.max) {
      return `${this.getFieldName(field)} должно быть не более ${rule.max}`
    }

    // Проверка по регулярному выражению
    if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
      return `${this.getFieldName(field)} имеет неверный формат`
    }

    // Кастомная валидация
    if (rule.custom) {
      const customError = rule.custom(value)
      if (customError) {
        return customError
      }
    }

    return null
  }

  private getFieldName(field: string): string {
    const fieldNames: Record<string, string> = {
      login: 'Логин',
      password: 'Пароль',
      name: 'Имя',
      city: 'Город',
      amount: 'Сумма',
      note: 'Примечание',
      nameCreate: 'Создатель',
      phone: 'Телефон',
      email: 'Email',
      address: 'Адрес'
    }
    return fieldNames[field] || field
  }

  getErrors(): ValidationErrors {
    return this.errors
  }

  getError(field: string): string | null {
    return this.errors[field] || null
  }

  hasErrors(): boolean {
    return Object.keys(this.errors).length > 0
  }
}

// Предустановленные валидаторы для разных типов форм
export const createLoginValidator = () => {
  return new FormValidator()
    .addRule('login', {
      required: true,
      minLength: 3,
      maxLength: 50
    })
    .addRule('password', {
      required: true,
      minLength: 6,
      maxLength: 100
    })
}

export const createExpenseValidator = () => {
  return new FormValidator()
    .addRule('city', {
      required: true,
      minLength: 2,
      maxLength: 50
    })
    .addRule('amount', {
      required: true,
      min: 0.01,
      max: 1000000
    })
    .addRule('note', {
      required: true,
      minLength: 3,
      maxLength: 500
    })
    .addRule('paymentPurpose', {
      required: true,
      custom: (value) => {
        const validOptions = ["Авито", "Офис", "Промоутеры", "Листовки", "Инкас", "Зарплата директора", "Иное"]
        if (!validOptions.includes(value)) {
          return "Выберите назначение платежа из списка"
        }
        return null
      }
    })
    .addRule('nameCreate', {
      required: true,
      minLength: 2,
      maxLength: 100
    })
}

export const createIncomeValidator = () => {
  return new FormValidator()
    .addRule('city', {
      required: true,
      minLength: 2,
      maxLength: 50
    })
    .addRule('amount', {
      required: true,
      min: 0.01,
      max: 1000000
    })
    .addRule('note', {
      required: true,
      minLength: 3,
      maxLength: 500
    })
    .addRule('paymentPurpose', {
      required: true,
      custom: (value) => {
        const validOptions = ["Заказ", "Депозит", "Штраф", "Иное"]
        if (!validOptions.includes(value)) {
          return "Выберите назначение платежа из списка"
        }
        return null
      }
    })
    .addRule('nameCreate', {
      required: true,
      minLength: 2,
      maxLength: 100
    })
}

export const createMasterValidator = () => {
  return new FormValidator()
    .addRule('name', {
      required: true,
      minLength: 2,
      maxLength: 100
    })
    .addRule('city', {
      required: true,
      minLength: 2,
      maxLength: 100
    })
    .addRule('statusWork', {
      required: true
    })
    .addRule('note', {
      maxLength: 500
    })
}

export const createOrderValidator = () => {
  return new FormValidator()
    .addRule('phone', {
      required: true,
      pattern: /^[\+]?[1-9][\d]{0,15}$/,
      custom: (value: string) => {
        if (!value.match(/^[\+]?[1-9][\d]{0,15}$/)) {
          return 'Введите корректный номер телефона'
        }
        return null
      }
    })
    .addRule('clientName', {
      required: true,
      minLength: 2,
      maxLength: 100
    })
    .addRule('address', {
      required: true,
      minLength: 5,
      maxLength: 200
    })
    .addRule('problem', {
      required: true,
      minLength: 10,
      maxLength: 1000
    })
}

// Утилиты для валидации файлов
export const validateFile = (file: File, options: {
  maxSize?: number // в байтах
  allowedTypes?: string[]
} = {}): string | null => {
  const { maxSize = 5 * 1024 * 1024, allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'] } = options

  if (file.size > maxSize) {
    return `Размер файла не должен превышать ${Math.round(maxSize / 1024 / 1024)}MB`
  }

  if (!allowedTypes.includes(file.type)) {
    return `Разрешены только файлы: ${allowedTypes.map(type => type.split('/')[1]).join(', ')}`
  }

  return null
}

// Утилиты для санитизации данных
export const sanitizeString = (str: string): string => {
  return str.trim().replace(/[<>]/g, '')
}

export const sanitizeNumber = (num: number): number => {
  return Math.round(num * 100) / 100 // Округляем до 2 знаков после запятой
}

export const sanitizeFormData = (data: Record<string, any>): Record<string, any> => {
  const sanitized: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value)
    } else if (typeof value === 'number') {
      sanitized[key] = sanitizeNumber(value)
    } else {
      sanitized[key] = value
    }
  }
  
  return sanitized
}
