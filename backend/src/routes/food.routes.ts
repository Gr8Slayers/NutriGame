// src/routes/food.routes.ts
import { Router } from 'express';
import { foodController } from '../controllers/food.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/search_food', authMiddleware, foodController.search_food);

router.post('/add_to_meal', authMiddleware, foodController.add_to_meal);
router.post('/delete_from_meal', authMiddleware, foodController.delete_from_meal);
router.get('/get_meal_log', authMiddleware, foodController.get_meal_log);
router.get('/get_meal_total', authMiddleware, foodController.get_meal_total);

router.post('/add_to_water', authMiddleware, foodController.add_to_water);
router.post('/delete_from_water', authMiddleware, foodController.delete_from_water);
router.get('/get_water_total', authMiddleware, foodController.get_water_total);

router.get('/get_weekly_summary', authMiddleware, foodController.get_weekly_summary);

export default router;
