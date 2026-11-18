import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import { getEventTypes } from '../controllers/metaController.js';

const router = Router();

router.get('/event-types', authenticate, getEventTypes);

export default router;
