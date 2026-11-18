import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { login, me, register, savePlannerProfile } from '../controllers/authController.js';

const router = Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', authenticate, me);
router.put('/planner-profile', authenticate, savePlannerProfile);

export default router;
