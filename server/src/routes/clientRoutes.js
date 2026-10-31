import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import { createClient, deleteClient, getClient, listClients, updateClient } from '../controllers/clientController.js';

const router = Router();

router.use(authenticate);
router.route('/')
  .post(createClient)
  .get(listClients);
router.route('/:id')
  .get(getClient)
  .put(updateClient)
  .delete(deleteClient);

export default router;
