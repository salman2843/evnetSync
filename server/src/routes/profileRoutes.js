import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import { logoUpload } from '../middleware/upload.js';
import { changePassword, deleteLogo, updateProfile, uploadLogo } from '../controllers/profileController.js';

const router = Router();

router.use(authenticate);
router.patch('/', updateProfile);
router.put('/password', changePassword);
router.post('/logo', logoUpload, uploadLogo);
router.delete('/logo', deleteLogo);

export default router;
