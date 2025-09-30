import { Router } from 'express'
import { 
  getCashOperations, 
  getCashOperationById, 
  createCashOperation, 
  updateCashOperation, 
  deleteCashOperation,
  getCashStats
} from '../controllers/cashController'
import { authenticateToken } from '../middleware/auth'

const router = Router()

// Все маршруты защищены аутентификацией
router.use(authenticateToken)

router.get('/', getCashOperations)
router.get('/stats', getCashStats)
router.get('/:id', getCashOperationById)
router.post('/', createCashOperation)
router.put('/:id', updateCashOperation)
router.delete('/:id', deleteCashOperation)

export default router
