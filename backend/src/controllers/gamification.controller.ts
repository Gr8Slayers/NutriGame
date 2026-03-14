import { Request, Response } from 'express';
import { gamificationModel } from '../models/gamification.model'; // Prisma model import'u düzeltildi

export class GamificationController {

    public async updateStreak(req: Request, res: Response): Promise<void> {
        try {
            const rawUserId = (req as any).user?.id || req.body.userId;

            const userId = Number(rawUserId);
            console.log(`[StreakUpdate] Start for userId: ${userId}`);

            // Eğer userId gönderilmediyse veya sayıya çevrilemediyse hata dön
            if (!userId || isNaN(userId)) {
                console.log(`[StreakUpdate] Error: Invalid userId: ${rawUserId}`);
                res.status(400).json({ success: false, message: 'Valid User ID (Number) is required' });
                return;
            }

            //  Veritabanından kullanıcının mevcut serisini çek (Model üzerinden)
            let userStreak = await gamificationModel.getStreakByUserId(userId);

            //  Bugünün tarihini oluştur ve saatleri sıfırla (00:00:00)
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            //  Kullanıcının hiç seri kaydı yoksa yeni oluştur
            if (!userStreak) {
                console.log(`[StreakUpdate] Creating new streak for userId: ${userId}`);
                const newStreak = await gamificationModel.createStreak(userId);
                res.status(201).json({ success: true, data: newStreak });
                return;
            }

            console.log(`[StreakUpdate] Existing streak found: current=${userStreak.currentStreak}, lastActive=${userStreak.lastActiveDate}`);

            //  Veritabanındaki son aktif tarihi al ve saatlerini sıfırla
            const lastActive = new Date(userStreak.lastActiveDate);
            lastActive.setHours(0, 0, 0, 0);

            //  Gün farkını hesapla
            const diffInTime = today.getTime() - lastActive.getTime();
            const diffInDays = Math.floor(diffInTime / (1000 * 3600 * 24));
            console.log(`[StreakUpdate] diffInDays calculated: ${diffInDays}`);

            let pointsToAdd = 0;

            //  Kuralları Uygula (3 Gün Toleransı)
            if (diffInDays === 0) {
                console.log(`[StreakUpdate] Streak already updated today. Returning.`);
                // Zaten bugün güncellenmiş
                res.status(200).json({
                    success: true,
                    message: 'Streak already updated today',
                    data: userStreak
                });
                return;
            } else if (diffInDays > 0 && diffInDays < 3) {
                console.log(`[StreakUpdate] Continuing streak (+1)`);
                // 1 veya 2 gün fark: Seri bozulmadan devam eder
                userStreak.currentStreak += 1;
                userStreak.lastActiveDate = today;
                pointsToAdd = 10; // Seri koruma ödülü
            } else if (diffInDays >= 3) {
                console.log(`[StreakUpdate] Streak broken. Resetting to 1.`);
                // 3 veya daha fazla gün fark: Seri kırılır!
                userStreak.currentStreak = 1;
                userStreak.lastActiveDate = today;
                pointsToAdd = 5; // Yeniden başlama teselli puanı
            }

            //  Rekor (Longest Streak) Kontrolü
            if (userStreak.currentStreak > userStreak.longestStreak) {
                userStreak.longestStreak = userStreak.currentStreak;
            }

            userStreak.totalPoints += pointsToAdd;

            //  Güncellenen veriyi Prisma (Model) üzerinden kaydet
            const updatedStreak = await gamificationModel.updateStreakData(userId, {
                currentStreak: userStreak.currentStreak,
                longestStreak: userStreak.longestStreak,
                lastActiveDate: userStreak.lastActiveDate,
                totalPoints: userStreak.totalPoints,
            });

            res.status(200).json({ success: true, data: updatedStreak });
        } catch (error) {
            console.error('Error in updateStreak:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    public async getStreak(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.id;

            if (!userId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            const streak = await gamificationModel.getStreakByUserId(Number(userId));

            if (!streak) {
                // If no streak exists, return a default one or create it
                res.status(200).json({
                    success: true,
                    data: { currentStreak: 0, longestStreak: 0, totalPoints: 0 }
                });
                return;
            }

            res.status(200).json({ success: true, data: streak });
        } catch (error) {
            console.error('Error in getStreak:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }


    public async handleProgressEvent(req: Request, res: Response): Promise<void> {
        res.status(200).json({ success: true, message: 'Progress event handled' });
    }

    public async evaluateChallengeCompletion(req: Request, res: Response): Promise<void> {
        res.status(200).json({ success: true, message: 'Challenge evaluation completed' });
    }

    public async completeChallenge(req: Request, res: Response): Promise<void> {
        res.status(200).json({ success: true, message: 'Challenge completed successfully' });
    }

    public async getChallengeProgress(req: Request, res: Response): Promise<void> {
        res.status(200).json({ success: true, data: { progress: 50 } });
    }
}

export const gamificationController = new GamificationController();