import { Router } from 'express';
import { gamificationController } from '../controllers/gamification.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/streak/update', authMiddleware, (req, res) => gamificationController.updateStreak(req, res));
router.get('/streak', authMiddleware, (req, res) => gamificationController.getStreak(req, res));

router.post('/progress/event', (req, res) => gamificationController.handleProgressEvent(req, res));
router.post('/challenge/evaluate', (req, res) => gamificationController.evaluateChallengeCompletion(req, res));
router.post('/challenge/complete', (req, res) => gamificationController.completeChallenge(req, res));
router.get('/challenge/progress', (req, res) => gamificationController.getChallengeProgress(req, res));

export default router;