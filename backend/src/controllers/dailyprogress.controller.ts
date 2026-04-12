import { Request, Response, NextFunction } from 'express';
import { dailyProgressModel } from '../models/dailyprogress.model';

export class DailyProgressController {
    async upsert_progress(req: Request, res: Response, next: NextFunction) {
        try {
            const user_id = req.user!.id;
            const { date, currentWeight, mood, totalCaloriesConsumed, calorieGoal, goalAchieved, movement } = req.body;

            if (!date) {
                return res.status(400).json({ success: false, message: 'Please provide a date.' });
            }

            const parsedDate = new Date(date);
            if (isNaN(parsedDate.getTime())) {
                return res.status(400).json({ success: false, message: 'Invalid calendar date.' });
            }
            parsedDate.setHours(0,0,0,0);

            let weightNum;
            if (currentWeight !== undefined) {
                weightNum = parseFloat(currentWeight);
                if (isNaN(weightNum)) weightNum = undefined;
            }

            const updated = await dailyProgressModel.upsertProgress(user_id, parsedDate, {
                currentWeight: weightNum,
                mood,
                totalCaloriesConsumed,
                calorieGoal,
                goalAchieved,
                movement: movement !== undefined ? parseInt(movement) : undefined
            });

            return res.status(200).json({ success: true, message: 'Daily progress updated.', data: updated });
        } catch (err) {
            next(err);
        }
    }

    async get_weekly_progress(req: Request, res: Response, next: NextFunction) {
        try {
            const user_id = req.user!.id;
            const progress = await dailyProgressModel.getWeeklyProgress(user_id);
            return res.status(200).json({ success: true, data: progress });
        } catch (err) {
            next(err);
        }
    }
}

export const dailyProgressController = new DailyProgressController();
