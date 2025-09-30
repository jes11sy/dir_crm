import { Request } from 'express';

// Расширение типа Request для добавления пользовательских свойств
declare global {
  namespace Express {
    interface Request {
      user?: any;
      rateLimit?: {
        limit: number;
        current: number;
        remaining: number;
        resetTime: Date;
      };
      sessionID?: string;
    }
  }
}

// Экспорт для использования в других файлах
export interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    login: string;
    cities: string[];
    name: string;
  };
}

export interface RateLimitInfo {
  limit: number;
  current: number;
  remaining: number;
  resetTime: Date;
}
