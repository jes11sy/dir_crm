import { Router } from 'express'
import { uploadDocument, deleteDocument, uploadMiddleware } from '../controllers/uploadController'
import { authenticateToken } from '../middleware/auth'

const router = Router()

// Все маршруты защищены аутентификацией
router.use(authenticateToken)

router.post('/', uploadMiddleware, uploadDocument)
router.delete('/:filename', deleteDocument)

export default router
