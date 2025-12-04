// src/routes/user.routes.ts
import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.patch('/profile', authMiddleware, userController.updateUserProfile);
router.get('/profile', authMiddleware, userController.getUserProfile);
router.delete('/profile', authMiddleware, userController.deleteAccount);

export default router;
