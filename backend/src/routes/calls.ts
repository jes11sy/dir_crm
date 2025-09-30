import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { getCallsByCallId, getAllCalls, getCallById } from '../controllers/callsController';

const router = Router();

// Все роуты защищены авторизацией
router.use(authenticateToken);

// GET /api/calls - получить все звонки с пагинацией
router.get('/', getAllCalls);

// GET /api/calls/:id - получить конкретный звонок по ID
router.get('/:id', getCallById);

// GET /api/calls/by-call-id/:callId - получить звонки по call_id
router.get('/by-call-id/:callId', getCallsByCallId);

export default router;
