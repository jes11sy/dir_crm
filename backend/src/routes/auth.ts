import { Router } from 'express'
import { login, register, getProfile } from '../controllers/authController'
import { authenticateToken } from '../middleware/auth'

const router = Router()

// Публичные маршруты
router.post('/login', login)
router.post('/register', register)

// Защищенные маршруты
router.get('/profile', authenticateToken, getProfile)

export default router
