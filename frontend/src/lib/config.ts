// Конфигурация приложения
export const config = {
  // API URL
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002',
  
  // App URL
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  
  // Environment
  environment: process.env.NEXT_PUBLIC_ENVIRONMENT || 'development',
  
  // Feature flags
  features: {
    analytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
    errorReporting: process.env.NEXT_PUBLIC_ENABLE_ERROR_REPORTING === 'true',
  },
  
  // API endpoints
  endpoints: {
    auth: '/api/auth',
    orders: '/api/orders',
    masters: '/api/masters',
    cash: '/api/cash',
    reports: '/api/reports',
    calls: '/api/calls',
    recordings: '/api/recordings',
    upload: '/api/upload',
  },
} as const;

// Утилита для создания полного URL API
export function createApiUrl(endpoint: string): string {
  const baseUrl = config.apiUrl.replace(/\/$/, ''); // Убираем trailing slash
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${path}`;
}

// Проверка на продакшен
export const isProduction = config.environment === 'production';
export const isDevelopment = config.environment === 'development';

// Логирование только в development
export function devLog(...args: any[]) {
  if (isDevelopment) {
    console.log(...args);
  }
}

export function devError(...args: any[]) {
  if (isDevelopment) {
    console.error(...args);
  }
}

export function devWarn(...args: any[]) {
  if (isDevelopment) {
    console.warn(...args);
  }
}
