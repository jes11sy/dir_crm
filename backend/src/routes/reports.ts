import { Router } from 'express'
import { getCityReports, getMastersReports } from '../controllers/reportsController'

const router = Router()

// GET /api/reports/city - получить отчеты по городам
router.get('/city', getCityReports)

// GET /api/reports/masters - получить отчеты по мастерам
router.get('/masters', getMastersReports)

export default router
