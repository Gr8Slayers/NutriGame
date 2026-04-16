import { Router } from 'express';
import multer from 'multer';
import { imageController } from '../controllers/image.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Upload general image (avatars, posts, etc)
router.post('/', upload.single('image'), imageController.upload);

// Serve image from DB
router.get('/:id', imageController.getImage);

export default router;
