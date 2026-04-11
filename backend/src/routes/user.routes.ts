// src/routes/user.routes.ts
import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/search', authMiddleware, userController.searchUsers.bind(userController));
router.patch('/profile', authMiddleware, userController.updateUserProfile.bind(userController));
router.get('/profile', authMiddleware, userController.getUserProfile.bind(userController));
router.delete('/profile', authMiddleware, userController.deleteAccount.bind(userController));
router.get('/daily_targets', authMiddleware, userController.getDailyTargets.bind(userController));
router.get('/profile/:userId', authMiddleware, userController.getPublicProfile.bind(userController));

export default router;
