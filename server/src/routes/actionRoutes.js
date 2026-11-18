import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import {
  createAction,
  listActions,
  regenerateActions,
  updateAction
} from '../controllers/actionController.js';

const router = Router();

router.use(authenticate);
router.route('/')
  .get(listActions)
  .post(createAction);
router.post('/regenerate', regenerateActions);
router.patch('/:id', updateAction);

export default router;
