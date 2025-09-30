import { Router } from 'express'
import { 
  getOrders, 
  getOrderById, 
  updateOrder, 
  assignMaster, 
  closeOrder,
  getFilterOptions
} from '../controllers/ordersController'
import { authenticateToken } from '../middleware/auth'

const router = Router()

// Все маршруты защищены аутентификацией
router.use(authenticateToken)

router.get('/', getOrders)
router.get('/filter-options', getFilterOptions)
router.get('/:id', getOrderById)
router.put('/:id', updateOrder)
router.post('/:id/assign-master', assignMaster)
router.post('/:id/close', closeOrder)

export default router
