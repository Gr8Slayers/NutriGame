import { Router } from 'express';
import { dailyProgressController } from '../controllers/dailyprogress.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/upsert', authMiddleware, dailyProgressController.upsert_progress.bind(dailyProgressController));
router.get('/weekly', authMiddleware, dailyProgressController.get_weekly_progress.bind(dailyProgressController));

export default router;
