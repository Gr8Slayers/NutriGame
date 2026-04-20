import prisma from '../config/prisma';
import { Streak, Challenge, ChallengeParticipant } from '@prisma/client';

export class GamificationModel {

    // ==========================================
    // STREAK İŞLEMLERİ
    // ==========================================

    public async getStreakByUserId(userId: number): Promise<Streak | null> {
        return await prisma.streak.findUnique({
            where: { userId },
        });
    }

    public async createStreak(userId: number, points: number = 10): Promise<Streak> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return await prisma.streak.create({
            data: {
                userId,
                currentStreak: 1,
                longestStreak: 1,
                lastActiveDate: today,
                totalPoints: points,
            },
        });
    }

    public async updateStreakData(userId: number, updateData: Partial<Streak>): Promise<Streak> {
        return await prisma.streak.update({
            where: { userId },
            data: updateData,
        });
    }

    // ==========================================
    // CHALLENGE İŞLEMLERİ
    // ==========================================

    public async createChallenge(
        creatorId: number,
        title: string,
        type: string,
        endDate: Date,
        targetUserIds: number[],
        description?: string,
        goalValue?: number
    ) {
        // Creator her zaman katılımcıdır
        const participantsData: {
            userId: number;
            role: 'creator' | 'invitee';
            status: 'accepted' | 'pending' | 'declined';
        }[] = [
                { userId: creatorId, role: 'creator', status: 'accepted' }
            ];

        // Davet edilen diğer kullanıcıları ekle (eğer kendisi değilse ve listede yoksa)
        targetUserIds.forEach(tId => {
            if (tId !== creatorId && !participantsData.some(p => p.userId === tId)) {
                participantsData.push({ userId: tId, role: 'invitee', status: 'pending' });
            }
        });

        const isSelfChallenge = participantsData.length === 1;

        return await prisma.challenge.create({
            data: {
                creatorId,
                title,
                description,
                type,
                goalValue,
                endDate,
                status: isSelfChallenge ? 'active' : 'pending',
                participants: {
                    create: participantsData,
                },
            },
            include: { participants: true },
        });
    }

    public async getChallengeById(challengeId: number) {
        return await prisma.challenge.findUnique({
            where: { id: challengeId },
            include: { participants: true },
        });
    }

    public async deleteChallenge(challengeId: number, userId: number): Promise<{ success: boolean; message: string }> {
        const challenge = await this.getChallengeById(challengeId);

        if (!challenge) {
            return { success: false, message: 'Challenge not found' };
        }

        if (challenge.creatorId !== userId) {
            return { success: false, message: 'Only the creator can delete this challenge' };
        }

        // Delete associated records first (Prisma cascaded delete might handle this if configured in schema, but manual delete is safer here)
        await prisma.challengeParticipant.deleteMany({
            where: { challengeId }
        });

        await prisma.challenge.delete({
            where: { id: challengeId }
        });

        return { success: true, message: 'Challenge deleted successfully' };
    }

    public async leaveChallenge(challengeId: number, userId: number): Promise<{ success: boolean; message: string; creatorId?: number; challengeTitle?: string }> {
        const challenge = await this.getChallengeById(challengeId);
        if (!challenge) return { success: false, message: 'Challenge not found' };
        if (challenge.creatorId === userId) return { success: false, message: 'Creator cannot leave — delete the challenge instead' };

        const participant = challenge.participants.find((p: any) => p.userId === userId);
        if (!participant) return { success: false, message: 'Not a participant of this challenge' };

        await prisma.challengeParticipant.delete({
            where: { challengeId_userId: { challengeId, userId } },
        });

        return { success: true, message: 'Left challenge', creatorId: challenge.creatorId, challengeTitle: challenge.title };
    }

    public async getUserActiveChallenges(userId: number) {
        return await prisma.challenge.findMany({
            where: {
                participants: {
                    some: { userId, status: 'accepted' },
                },
                status: { in: ['active', 'pending'] },
            },
            include: { participants: true },
            orderBy: { startDate: 'desc' },
        });
    }

    public async getUserInvites(userId: number) {
        return await prisma.challenge.findMany({
            where: {
                participants: {
                    some: { userId, role: 'invitee', status: 'pending' },
                },
            },
            include: { participants: true },
            orderBy: { startDate: 'desc' },
        });
    }

    public async respondToChallenge(challengeId: number, userId: number, accept: boolean) {
        const newStatus = accept ? 'accepted' : 'declined';
        await prisma.challengeParticipant.update({
            where: { challengeId_userId: { challengeId, userId } },
            data: { status: newStatus },
        });

        if (accept) {
            // Tüm katılımcılar kabul ettiyse challenge'ı aktif yap
            const allAccepted = await prisma.challengeParticipant.count({
                where: { challengeId, status: { not: 'accepted' } },
            });
            if (allAccepted === 0) {
                await prisma.challenge.update({
                    where: { id: challengeId },
                    data: { status: 'active' },
                });
            } else {
                // En az biri kabul etti, aktif sayılabilir
                await prisma.challenge.update({
                    where: { id: challengeId },
                    data: { status: 'active' },
                });
            }
        }

        return await this.getChallengeById(challengeId);
    }

    public async claimReward(challengeId: number, userId: number) {
        return await prisma.challengeParticipant.update({
            where: { challengeId_userId: { challengeId, userId } },
            data: { rewardClaimed: true },
        });
    }

    public async calculateProgress(challengeId: number, userId: number): Promise<number> {
        const challenge = await this.getChallengeById(challengeId);
        if (!challenge) return 0;

        const startDate = new Date(challenge.startDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(challenge.endDate);
        endDate.setHours(23, 59, 59, 999);

        const today = new Date();
        const effectiveEnd = today < endDate ? today : endDate;

        const durationDays = Math.ceil(
            (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (durationDays <= 0) return 0;

        let successfulDays = 0;
        const goal = challenge.goalValue || (challenge.type === 'water' ? 2000 : 0);

        if (challenge.type === 'water') {
            const dailySummaries = await prisma.waterLog.groupBy({
                by: ['date'],
                where: {
                    userId,
                    date: { gte: startDate, lte: effectiveEnd },
                },
                _sum: {
                    amount: true,
                },
            });
            successfulDays = dailySummaries.filter(d => (d._sum.amount || 0) >= goal).length;
        } else if (challenge.type === 'calorie') {
            const logs = await prisma.mealTotals.findMany({
                where: {
                    userId,
                    date: { gte: startDate, lte: effectiveEnd },
                    meal_category: 'OVERALL',
                },
            });
            // Calorie goal success (usually reaching a floor or staying within range)
            successfulDays = logs.filter(l => l.t_calorie >= goal).length;
        } else if (challenge.type === 'sugar') {
            const logs = await prisma.mealTotals.findMany({
                where: {
                    userId,
                    date: { gte: startDate, lte: effectiveEnd },
                    meal_category: 'OVERALL',
                },
            });
            // Sugar (Carbs) success if BELOW or EQUAL to goal. We check t_calorie > 0 to ensure they actually logged meals.
            successfulDays = logs.filter(l => l.t_calorie > 0 && l.t_carb <= goal).length;
        } else if (challenge.type === 'step' || challenge.type === 'move') {
            const logs = await prisma.dailyProgress.findMany({
                where: {
                    userId,
                    date: { gte: startDate, lte: effectiveEnd },
                },
            });
            successfulDays = logs.filter(l => l.movement >= goal).length;
        }

        const progress = Math.round((successfulDays / durationDays) * 100);
        return Math.min(progress, 100);
    }

    public async calculateDailyCurrent(challengeId: number, userId: number): Promise<number> {
        const challenge = await this.getChallengeById(challengeId);
        if (!challenge) return 0;

        // Günün başını ve sonunu belirliyoruz
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        if (challenge.type === 'water') {
            const summary = await prisma.waterLog.aggregate({
                where: {
                    userId,
                    // DÜZELTİLEN KISIM: equals yerine gte (büyük eşit) ve lte (küçük eşit) kullanıyoruz
                    date: { gte: startOfDay, lte: endOfDay },
                },
                _sum: {
                    amount: true,
                },
            });
            return summary._sum.amount || 0;

        } else if (challenge.type === 'calorie') {
            const log = await prisma.mealTotals.findUnique({
                where: {
                    userId_date_meal_category: {
                        userId,
                        date: startOfDay, // Eğer MealTotals tablonda tarihler saat 00:00 olarak kaydediliyorsa bu çalışır
                        meal_category: 'OVERALL',
                    },
                },
            });
            return log?.t_calorie || 0;
        } else if (challenge.type === 'sugar') {
            const log = await prisma.mealTotals.findUnique({
                where: {
                    userId_date_meal_category: {
                        userId,
                        date: startOfDay,
                        meal_category: 'OVERALL',
                    },
                },
            });
            return log?.t_carb || 0;
        } else if (challenge.type === 'step' || challenge.type === 'move') {
            const log = await prisma.dailyProgress.findUnique({
                where: {
                    userId_date: {
                        userId,
                        date: startOfDay,
                    },
                },
            });
            return log?.movement || 0;
        }

        return 0;
    }

    public async getChallengeDayHistory(challengeId: number, userId: number): Promise<any[]> {
        const challenge = await this.getChallengeById(challengeId);
        if (!challenge) return [];

        const startDate = new Date(challenge.startDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(challenge.endDate);
        endDate.setHours(23, 59, 59, 999);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const diffTime = endDate.getTime() - startDate.getTime();
        const durationDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

        const history = [];
        const goal = challenge.goalValue || (challenge.type === 'water' ? 2000 : 0);

        let logs: any[] = [];
        if (challenge.type === 'water') {
            const waterLogs = await prisma.waterLog.findMany({
                where: { userId, date: { gte: startDate, lte: endDate } }
            });
            const grouped = new Map();
            waterLogs.forEach(l => {
                const d = l.date.toISOString().split('T')[0];
                grouped.set(d, (grouped.get(d) || 0) + l.amount);
            });
            logs = Array.from(grouped.entries()).map(([date, amount]) => ({
                date: new Date(date),
                _sum: { amount }
            }));
        } else if (challenge.type === 'calorie' || challenge.type === 'sugar') {
            logs = await prisma.mealTotals.findMany({
                where: { userId, date: { gte: startDate, lte: endDate }, meal_category: 'OVERALL' }
            });
        } else if (challenge.type === 'step' || challenge.type === 'move') {
            logs = await prisma.dailyProgress.findMany({
                where: { userId, date: { gte: startDate, lte: endDate } }
            });
        }

        for (let i = 0; i < durationDays; i++) {
            const currentDay = new Date(startDate);
            currentDay.setDate(startDate.getDate() + i);
            currentDay.setHours(0, 0, 0, 0);

            let status: 'success' | 'fail' | 'today' | 'upcoming' = 'fail';

            if (currentDay > today) {
                status = 'upcoming';
            } else {
                const dayLog = logs.find(l => {
                    const lDate = new Date(l.date);
                    lDate.setHours(0, 0, 0, 0);
                    return lDate.getTime() === currentDay.getTime();
                });

                let amount = 0;
                if (challenge.type === 'water') amount = dayLog?._sum?.amount || 0;
                else if (challenge.type === 'calorie') amount = dayLog?.t_calorie || 0;
                else if (challenge.type === 'sugar') amount = dayLog?.t_carb || 0;
                else if (challenge.type === 'step' || challenge.type === 'move') amount = dayLog?.movement || 0;

                let isGoalMet = false;
                if (challenge.type === 'sugar') {
                    const hasLoggedMeals = dayLog && dayLog.t_calorie && dayLog.t_calorie > 0;
                    isGoalMet = hasLoggedMeals && amount <= goal;
                } else {
                    isGoalMet = amount >= goal;
                }

                if (isGoalMet) {
                    status = 'success';
                } else if (currentDay.getTime() === today.getTime()) {
                    status = 'today';
                } else {
                    status = 'fail';
                }
            }

            history.push({
                date: currentDay.toISOString().split('T')[0],
                status
            });
        }

        return history;
    }


    // ==========================================
    // BADGE İŞLEMLERİ
    // ==========================================

    /**
     * Challenge tipine göre sequential (seviyeli) badge ödüllendir
     */
    public async awardBadge(userId: number, challengeType: string): Promise<any | null> {
        const folderMap: Record<string, string> = {
            water: 'water',
            sugar: 'sugar',
            calorie: 'move',
            step: 'move',
            move: 'move',
        };

        const folder = folderMap[challengeType] || 'move';

        // Bu kullanıcının bu tipteki tamamlanmış (rewardClaimed) meydan okuma sayısını say
        const completionCount = await prisma.challengeParticipant.count({
            where: {
                userId,
                rewardClaimed: true,
                challenge: { type: challengeType }
            }
        });

        let calculatedLevel = 0;
        if (completionCount >= 15) {
            calculatedLevel = 3;
        } else if (completionCount >= 5) {
            calculatedLevel = 2;
        } else if (completionCount >= 1) {
            calculatedLevel = 1;
        }

        const level = Math.min(calculatedLevel, 3);
        if (level > 0) {
            let badgeName = '';
            if (folder === 'water') {
                if (level === 1) badgeName = 'First Drop';
                else if (level === 2) badgeName = 'Oasis Explorer';
                else badgeName = 'Hydration Master';
            } else if (folder === 'sugar') {
                if (level === 1) badgeName = 'Bitter Truth';
                else if (level === 2) badgeName = 'Sugar Detox';
                else badgeName = 'Sweet-proof';
            } else { // move, calorie, step
                if (level === 1) badgeName = 'First Step';
                else if (level === 2) badgeName = 'Fitness Addict';
                else badgeName = 'Marathon Spirit';
            }

            const iconName = `${folder}_${level}`;

            // Badge'i veritabanında bul veya oluştur (upsert)
            const badge = await prisma.badge.upsert({
                where: { name: badgeName },
                update: { iconName },
                create: {
                    name: badgeName,
                    description: `${challengeType} category ${level}. level success!`,
                    iconName: iconName,
                },
            });

            // Kullanıcıya bu badge'i ata (eğer zaten yoksa)
            await prisma.userBadge.upsert({
                where: { userId_badgeId: { userId, badgeId: badge.id } },
                update: {},
                create: { userId, badgeId: badge.id },
            });

            return badge;
        }

        return null;
    }

    /**
     * Günlük seri (streak) ulaşıldığında rozet ver
     */
    public async checkAndAwardStreakBadge(userId: number, currentStreak: number): Promise<void> {
        let level = 0;
        if (currentStreak >= 30) {
            level = 3;
        } else if (currentStreak >= 20) {
            level = 2;
        } else if (currentStreak >= 10) {
            level = 1;
        }

        if (level > 0) {
            let badgeName = '';
            if (level === 1) badgeName = "Iron Will";
            else if (level === 2) badgeName = "Steel Dicipline";
            else if (level === 3) badgeName = "Diamond Focus";

            const iconName = `streak_${level}`; // streak_1, streak_2, streak_3

            const badge = await prisma.badge.upsert({
                where: { name: badgeName },
                update: { iconName },
                create: {
                    name: badgeName,
                    description: `Kesintisiz uygulamaya girme serisi Level ${level} başarısı!`,
                    iconName: iconName,
                },
            });

            await prisma.userBadge.upsert({
                where: { userId_badgeId: { userId, badgeId: badge.id } },
                update: {},
                create: { userId, badgeId: badge.id },
            });
        }
    }

    /**
     * Kullanıcının kazandığı tüm badge'leri getir
     */
    public async getUserBadges(userId: number) {
        return await prisma.userBadge.findMany({
            where: { userId },
            include: { badge: true },
            orderBy: { earnedAt: 'desc' },
        });
    }
}

export const gamificationModel = new GamificationModel();
