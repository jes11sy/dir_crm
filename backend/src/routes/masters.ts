import { Router } from 'express'
import { 
  getMasters, 
  getMasterById, 
  createMaster, 
  updateMaster, 
  deleteMaster,
  getMasterStats
} from '../controllers/mastersController'
import { authenticateToken } from '../middleware/auth'

const router = Router()

// Все маршруты защищены аутентификацией
router.use(authenticateToken)

router.get('/', getMasters)
router.get('/:id', getMasterById)
router.get('/:id/stats', getMasterStats)
router.post('/', createMaster)
router.put('/:id', updateMaster)
router.delete('/:id', deleteMaster)

export default router
