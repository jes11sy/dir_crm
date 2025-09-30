import { Router } from 'express'
import { 
  getDirectors, 
  getDirectorById, 
  createDirector, 
  updateDirector, 
  deleteDirector 
} from '../controllers/directorsController'
import { adminAuthMiddleware } from '../middleware/adminAuth'

const router = Router()

/**
 * @route GET /api/admin/directors
 * @desc Получение списка всех директоров
 * @access Private (Admin)
 */
router.get('/', adminAuthMiddleware, getDirectors)

/**
 * @route GET /api/admin/directors/:id
 * @desc Получение директора по ID
 * @access Private (Admin)
 */
router.get('/:id', adminAuthMiddleware, getDirectorById)

/**
 * @route POST /api/admin/directors
 * @desc Создание нового директора
 * @access Private (Admin)
 */
router.post('/', adminAuthMiddleware, createDirector)

/**
 * @route PUT /api/admin/directors/:id
 * @desc Обновление директора
 * @access Private (Admin)
 */
router.put('/:id', adminAuthMiddleware, updateDirector)

/**
 * @route DELETE /api/admin/directors/:id
 * @desc Удаление директора
 * @access Private (Admin)
 */
router.delete('/:id', adminAuthMiddleware, deleteDirector)

export default router
