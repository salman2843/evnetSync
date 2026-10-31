import { Router } from 'express';
import { login, me, register, savePlannerProfile } from '../controllers/authController.js';
import authenticate from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, me);
router.put('/planner-profile', authenticate, savePlannerProfile);

export default router;
