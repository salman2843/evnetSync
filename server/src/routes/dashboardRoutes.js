import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import { getSummary } from '../controllers/dashboardController.js';

const router = Router();

router.use(authenticate);
router.get('/summary', getSummary);

export default router;
