import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import { getEventTypes, getVendorCategories } from '../controllers/metaController.js';

const router = Router();

router.get('/event-types', authenticate, getEventTypes);
router.get('/vendor-categories', authenticate, getVendorCategories);

export default router;
