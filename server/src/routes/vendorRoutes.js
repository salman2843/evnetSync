import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import {
  createVendor,
  deleteVendor,
  getVendor,
  listVendors,
  updateVendor
} from '../controllers/vendorController.js';

const router = Router();

router.use(authenticate);
router.route('/')
  .get(listVendors)
  .post(createVendor);
router.route('/:id')
  .get(getVendor)
  .put(updateVendor)
  .delete(deleteVendor);

export default router;
