import { Router } from 'express';
import { gamificationController } from '../controllers/gamification.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Streak
router.post('/streak/update', authMiddleware, (req, res) => gamificationController.updateStreak(req, res));
router.get('/streak', authMiddleware, (req, res) => gamificationController.getStreak(req, res));

// Challenge CRUD
router.post('/challenge/create', authMiddleware, (req, res) => gamificationController.createChallenge(req, res));
router.get('/challenges', authMiddleware, (req, res) => gamificationController.getChallenges(req, res));
router.get('/challenge/progress', authMiddleware, (req, res) => gamificationController.getChallengeProgress(req, res));
router.post('/challenge/complete', authMiddleware, (req, res) => gamificationController.completeChallenge(req, res));
router.post('/challenge/respond', authMiddleware, (req, res) => gamificationController.respondToChallenge(req, res));

// Legacy stubs (eski frontend referansları için)
router.post('/progress/event', authMiddleware, (req, res) => gamificationController.handleProgressEvent(req, res));
router.post('/challenge/evaluate', authMiddleware, (req, res) => gamificationController.evaluateChallengeCompletion(req, res));

export default router;
