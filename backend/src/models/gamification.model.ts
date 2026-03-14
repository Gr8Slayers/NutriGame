import prisma from '../config/prisma';
import { Streak, Prisma } from '@prisma/client';

export class GamificationModel {

    /**
     * Kullanıcı ID'sine göre mevcut seri kaydını getirir.
     * DİKKAT: userId artık string değil, number!
     */
    public async getStreakByUserId(userId: number): Promise<Streak | null> {
        return await prisma.streak.findUnique({
            where: { userId: userId },
        });
    }

    /**
     * Yeni bir kullanıcı için ilk seri (streak) kaydını oluşturur.
     */
    public async createStreak(
        userId: number,
        points: number = 10
    ): Promise<Streak> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return await prisma.streak.create({
            data: {
                userId: userId,
                currentStreak: 1,
                longestStreak: 1,
                lastActiveDate: today,
                totalPoints: points,
            },
        });
    }

    /**
     * Mevcut bir seri kaydını günceller.
     */
    public async updateStreakData(
        userId: number,
        updateData: Partial<Streak>
    ): Promise<Streak> {
        return await prisma.streak.update({
            where: { userId: userId },
            data: updateData,
        });
    }

    // ==========================================
    // CHALLENGE (MEYDAN OKUMA) İŞLEMLERİ
    // (Şemana Challenge modelini eklediğinde buradaki yorum satırlarını açabilirsin)
    // ==========================================
    /*
    public async getUserChallenges(userId: number): Promise<Challenge[]> { ... }
    public async createChallenge(userId: number, ...): Promise<Challenge> { ... }
    public async markChallengeAsCompleted(challengeId: number): Promise<Challenge> { ... }
    */
}

export const gamificationModel = new GamificationModel();