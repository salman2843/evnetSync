import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import {
  exportActions,
  exportClients,
  exportEvents,
  exportVendors
} from '../controllers/exportController.js';

const router = Router();

router.use(authenticate);
router.get('/clients.csv', exportClients);
router.get('/events.csv', exportEvents);
router.get('/vendors.csv', exportVendors);
router.get('/actions.csv', exportActions);

export default router;
