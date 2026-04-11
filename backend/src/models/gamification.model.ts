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
        targetUserId: number,
        description?: string,
        goalValue?: number
    ) {
        const isSelfChallenge = creatorId === targetUserId;

        const participants = isSelfChallenge
            ? [{ userId: creatorId, role: 'creator', status: 'accepted' }]
            : [
                { userId: creatorId, role: 'creator', status: 'accepted' },
                { userId: targetUserId, role: 'invitee', status: 'pending' },
            ];

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
                    create: participants,
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

        if (challenge.type === 'water') {
            const logs = await prisma.waterLog.findMany({
                where: {
                    userId,
                    date: { gte: startDate, lte: effectiveEnd },
                    amount: { gte: 2000 },
                },
            });
            successfulDays = logs.length;
        } else {
            // calorie, sugar, step → günde yemek kaydı olan günleri say
            const logs = await prisma.mealTotals.findMany({
                where: {
                    userId,
                    date: { gte: startDate, lte: effectiveEnd },
                    meal_category: 'OVERALL',
                    t_calorie: { gt: 0 },
                },
            });
            successfulDays = logs.length;
        }

        const progress = Math.round((successfulDays / durationDays) * 100);
        return Math.min(progress, 100);
    }

    // ==========================================
    // BADGE İŞLEMLERİ
    // ==========================================

    /**
     * Challenge tipine göre badge ödüllendir
     * Her challenge tipi için özel bir badge + genel "Challenge Victor" badge verilir
     */
    public async awardBadge(userId: number, challengeType: string): Promise<void> {
        const badgeNameMap: Record<string, string> = {
            water: 'Water Warrior',
            calorie: 'Calorie Champion',
            sugar: 'Sugar Crusher',
            step: 'Step Master',
        };

        const specificBadgeName = badgeNameMap[challengeType];
        const badgeNames = ['Challenge Victor'];
        if (specificBadgeName) badgeNames.push(specificBadgeName);

        for (const name of badgeNames) {
            const badge = await prisma.badge.findUnique({ where: { name } });
            if (!badge) continue;

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
