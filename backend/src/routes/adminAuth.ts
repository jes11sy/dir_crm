import { Router } from 'express'
import { 
  adminLogin, 
  verifyAdminToken, 
  getAdmins, 
  createAdmin, 
  updateAdminPassword 
} from '../controllers/adminAuthController'
import { adminAuthMiddleware } from '../middleware/adminAuth'

const router = Router()

/**
 * @route POST /api/admin/auth/login
 * @desc Вход администратора в систему
 * @access Public
 */
router.post('/login', adminLogin)

/**
 * @route GET /api/admin/auth/verify
 * @desc Проверка токена администратора
 * @access Private (Admin)
 */
router.get('/verify', verifyAdminToken)

/**
 * @route GET /api/admin/auth/admins
 * @desc Получение списка всех администраторов
 * @access Private (Admin)
 */
router.get('/admins', adminAuthMiddleware, getAdmins)

/**
 * @route POST /api/admin/auth/admins
 * @desc Создание нового администратора
 * @access Private (Admin)
 */
router.post('/admins', adminAuthMiddleware, createAdmin)

/**
 * @route PUT /api/admin/auth/admins/:adminId/password
 * @desc Обновление пароля администратора
 * @access Private (Admin)
 */
router.put('/admins/:adminId/password', adminAuthMiddleware, updateAdminPassword)

export default router
