import { Request, Response, NextFunction } from 'express';
import { dailyProgressModel } from '../models/dailyprogress.model';
import { notificationService } from '../services/notification.service';
import { dailyProgressUpsertSchema } from '../validation/schemas';
import { getValidationErrors, getValidationMessage } from '../validation/utils';

export class DailyProgressController {
    async upsert_progress(req: Request, res: Response, next: NextFunction) {
        try {
            const user_id = req.user!.id;
            const parsed = dailyProgressUpsertSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({
                    success: false,
                    message: getValidationMessage(parsed.error, 'Please provide a date.'),
                    errors: getValidationErrors(parsed.error),
                });
            }
            const { date, currentWeight, mood, totalCaloriesConsumed, calorieGoal, goalAchieved, movement } = parsed.data;

            // FIX: date string'i direkt parse et, timezone kaymasını önle.
            // Frontend'den "YYYY-MM-DD" formatında geliyor, bunu UTC noon olarak
            // kaydet — böylece hiçbir timezone'da gün kayması olmaz.
            const [year, month, day] = (date as string).split('-').map(Number);
            if (!year || !month || !day) {
                return res.status(400).json({ success: false, message: 'Invalid date format. Expected YYYY-MM-DD.' });
            }

            // UTC 12:00 — hem geri hem ileri timezone'larda güvenli
            const parsedDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
            if (isNaN(parsedDate.getTime())) {
                return res.status(400).json({ success: false, message: 'Invalid calendar date.' });
            }

            const updated = await dailyProgressModel.upsertProgress(user_id, parsedDate, {
                currentWeight,
                mood,
                totalCaloriesConsumed,
                calorieGoal,
                goalAchieved,
                movement,
            });

            // Notify user when daily goal is achieved
            if (goalAchieved === true) {
                await notificationService.sendPushNotification(
                    user_id,
                    "Daily Goal Achieved! 🎉",
                    "You've hit your calorie goal for today. Keep up the great work!"
                );
            }

            return res.status(200).json({ success: true, message: 'Daily progress updated.', data: updated });
        } catch (err) {
            next(err);
        }
    }

    async get_weekly_progress(req: Request, res: Response, next: NextFunction) {
        try {
            const user_id = req.user!.id;
            const progress = await dailyProgressModel.getWeeklyProgress(user_id);

            const formattedProgress = progress.map(p => ({
                ...p,
                // FIX: UTC'den YYYY-MM-DD al — getUTC* ile timezone kayması olmaz
                date: `${p.date.getUTCFullYear()}-${String(p.date.getUTCMonth() + 1).padStart(2, '0')}-${String(p.date.getUTCDate()).padStart(2, '0')}`,
            }));

            return res.status(200).json({ success: true, data: formattedProgress });
        } catch (err) {
            next(err);
        }
    }
}

export const dailyProgressController = new DailyProgressController();
