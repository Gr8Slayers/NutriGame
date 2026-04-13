import { Request, Response } from 'express';
import { ChallengeParticipant } from '@prisma/client';
import { gamificationModel } from '../models/gamification.model';
import { notificationService } from '../services/notification.service';
import prisma from '../config/prisma';

export class GamificationController {

    // ==========================================
    // STREAK
    // ==========================================

    public async updateStreak(req: Request, res: Response): Promise<void> {
        try {
            const rawUserId = (req as any).user?.id || req.body.userId;
            const userId = Number(rawUserId);

            if (!userId || isNaN(userId)) {
                res.status(400).json({ success: false, message: 'Valid User ID (Number) is required' });
                return;
            }

            let userStreak = await gamificationModel.getStreakByUserId(userId);

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (!userStreak) {
                const newStreak = await gamificationModel.createStreak(userId);
                res.status(201).json({ success: true, data: newStreak });
                return;
            }

            const lastActive = new Date(userStreak.lastActiveDate);
            lastActive.setHours(0, 0, 0, 0);

            const diffInDays = Math.floor(
                (today.getTime() - lastActive.getTime()) / (1000 * 3600 * 24)
            );

            let pointsToAdd = 0;

            if (diffInDays === 0) {
                res.status(200).json({ success: true, message: 'Streak already updated today', data: userStreak });
                return;
            } else if (diffInDays > 0 && diffInDays < 3) {
                userStreak.currentStreak += 1;
                userStreak.lastActiveDate = today;
                pointsToAdd = 10;
            } else {
                userStreak.currentStreak = 1;
                userStreak.lastActiveDate = today;
                pointsToAdd = 5;
            }

            if (userStreak.currentStreak > userStreak.longestStreak) {
                userStreak.longestStreak = userStreak.currentStreak;
            }
            userStreak.totalPoints += pointsToAdd;

            const updatedStreak = await gamificationModel.updateStreakData(userId, {
                currentStreak: userStreak.currentStreak,
                longestStreak: userStreak.longestStreak,
                lastActiveDate: userStreak.lastActiveDate,
                totalPoints: userStreak.totalPoints,
            });

            // Yeni kural: Seri seviyelerini kontrol et ve rozet ver
            await gamificationModel.checkAndAwardStreakBadge(userId, updatedStreak.currentStreak);

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
                res.status(200).json({
                    success: true,
                    data: { currentStreak: 0, longestStreak: 0, totalPoints: 0 },
                });
                return;
            }

            res.status(200).json({ success: true, data: streak });
        } catch (error) {
            console.error('Error in getStreak:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    // ==========================================
    // CHALLENGE
    // ==========================================

    public async createChallenge(req: Request, res: Response): Promise<void> {
        try {
            const creatorId = Number((req as any).user?.id);
            if (!creatorId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            const { title, type, targetUserIds, endDate, description, goalValue } = req.body;

            if (!title || !type || !endDate) {
                res.status(400).json({ success: false, message: 'title, type and endDate are required' });
                return;
            }

            const validTypes = ['calorie', 'water', 'sugar', 'step', 'move'];
            if (!validTypes.includes(type)) {
                res.status(400).json({ success: false, message: `type must be one of: ${validTypes.join(', ')}` });
                return;
            }

            const userIds = Array.isArray(targetUserIds) ? targetUserIds.map(Number).filter(id => !isNaN(id)) : [];

            const end = new Date(endDate);
            if (isNaN(end.getTime())) {
                res.status(400).json({ success: false, message: 'Invalid endDate format' });
                return;
            }

            const challenge = await gamificationModel.createChallenge(creatorId, title, type, end, userIds, description, goalValue ? Number(goalValue) : undefined);

            res.status(201).json({ success: true, data: challenge, message: 'Challenge created successfully' });
        } catch (error) {
            console.error('Error in createChallenge:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    public async deleteChallenge(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            const challengeId = Number(req.params.id);
            if (!challengeId || isNaN(challengeId)) {
                res.status(400).json({ success: false, message: 'Valid challengeId is required' });
                return;
            }

            const result = await gamificationModel.deleteChallenge(challengeId, Number(userId));

            if (!result.success) {
                res.status(403).json(result);
                return;
            }

            res.status(200).json(result);
        } catch (error) {
            console.error('Error in deleteChallenge:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    public async getChallenges(req: Request, res: Response): Promise<void> {
        try {
            const userId = Number((req as any).user?.id);
            if (!userId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            const [activeChallenges, invites] = await Promise.all([
                gamificationModel.getUserActiveChallenges(userId),
                gamificationModel.getUserInvites(userId),
            ]);

            // Progress'i hesapla
            const activeWithProgress = await Promise.all(
                activeChallenges.map(async (c: any) => {
                    const progress = await gamificationModel.calculateProgress(c.id, userId);
                    const todayCurrent = await gamificationModel.calculateDailyCurrent(c.id, userId);
                    const myParticipant = c.participants.find((p: ChallengeParticipant) => p.userId === userId);
                    return {
                        id: String(c.id),
                        title: c.title,
                        type: c.type,
                        status: c.status,
                        startDate: c.startDate,
                        endDate: c.endDate,
                        progress,
                        goalValue: c.goalValue,
                        todayCurrent,
                        rewardClaimed: myParticipant?.rewardClaimed ?? false,
                    };
                })
            );

            const inviteList = await Promise.all(invites.map(async (c: any) => {
                const creator = c.participants.find((p: ChallengeParticipant) => p.role === 'creator');
                let senderUsername = '';
                if (creator) {
                    const user = await prisma.user.findUnique({ where: { id: creator.userId }, select: { username: true } });
                    senderUsername = user?.username ?? '';
                }
                return {
                    id: String(c.id),
                    title: c.title,
                    description: c.description,
                    type: c.type,
                    goalValue: c.goalValue,
                    endDate: c.endDate,
                    senderId: creator ? String(creator.userId) : '',
                    senderUsername,
                };
            }));

            res.status(200).json({
                success: true,
                data: { activeChallenges: activeWithProgress, invites: inviteList },
            });
        } catch (error) {
            console.error('Error in getChallenges:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    public async getChallengeProgress(req: Request, res: Response): Promise<void> {
        try {
            const userId = Number((req as any).user?.id);
            const challengeId = Number(req.query.challengeId);

            if (!userId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }
            if (!challengeId || isNaN(challengeId)) {
                res.status(400).json({ success: false, message: 'challengeId is required' });
                return;
            }

            const challenge = await gamificationModel.getChallengeById(challengeId);
            if (!challenge) {
                res.status(404).json({ success: false, message: 'Challenge not found' });
                return;
            }

            const isParticipant = challenge.participants.some((p: ChallengeParticipant) => p.userId === userId);
            if (!isParticipant) {
                res.status(403).json({ success: false, message: 'Not a participant of this challenge' });
                return;
            }

            const progress = await gamificationModel.calculateProgress(challengeId, userId);
            const todayCurrent = await gamificationModel.calculateDailyCurrent(challengeId, userId);
            const dayHistory = await gamificationModel.getChallengeDayHistory(challengeId, userId);
            const myParticipant = challenge.participants.find((p: ChallengeParticipant) => p.userId === userId);

            const durationDays = Math.ceil(
                (new Date(challenge.endDate).getTime() - new Date(challenge.startDate).getTime()) / (1000 * 60 * 60 * 24)
            );

            res.status(200).json({
                success: true,
                data: {
                    id: String(challenge.id),
                    title: challenge.title,
                    description: challenge.description || `${challenge.type.charAt(0).toUpperCase() + challenge.type.slice(1)} challenge`,
                    type: challenge.type,
                    goalValue: challenge.goalValue,
                    progress,
                    todayCurrent,
                    dayHistory,
                    durationDays,
                    startDate: challenge.startDate,
                    endDate: challenge.endDate,
                    status: challenge.status,
                    creatorId: String(challenge.creatorId),
                    rewardClaimed: myParticipant?.rewardClaimed ?? false,
                },
            });
        } catch (error) {
            console.error('Error in getChallengeProgress:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    public async completeChallenge(req: Request, res: Response): Promise<void> {
        try {
            const userId = Number((req as any).user?.id);
            const { challengeId } = req.body;

            if (!userId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }
            if (!challengeId) {
                res.status(400).json({ success: false, message: 'challengeId is required' });
                return;
            }

            const id = Number(challengeId);
            const challenge = await gamificationModel.getChallengeById(id);
            if (!challenge) {
                res.status(404).json({ success: false, message: 'Challenge not found' });
                return;
            }

            const participant = challenge.participants.find((p: ChallengeParticipant) => p.userId === userId);
            if (!participant) {
                res.status(403).json({ success: false, message: 'Not a participant of this challenge' });
                return;
            }
            if (participant.rewardClaimed) {
                res.status(400).json({ success: false, message: 'Reward already claimed' });
                return;
            }

            const progress = await gamificationModel.calculateProgress(id, userId);
            if (progress < 100) {
                res.status(400).json({ success: false, message: 'Challenge not yet completed (progress < 100%)' });
                return;
            }

            await gamificationModel.claimReward(id, userId);

            // Badge ödül (challenge tipine göre)
            const earnedBadge = await gamificationModel.awardBadge(userId, challenge.type);

            // Streak'e bonus puan ekle
            const streak = await gamificationModel.getStreakByUserId(userId);
            if (streak) {
                await gamificationModel.updateStreakData(userId, {
                    totalPoints: streak.totalPoints + 50,
                });
            }

            // MEYDAN OKUMA TAMAMLANDI - VERİTABANINDAN SİL
            await prisma.challenge.delete({
                where: { id }
            });

            // Push Notification to the opponent
            const opponent = challenge.participants.find((p: ChallengeParticipant) => p.userId !== userId);
            if (opponent) {
                const winnerInfo = await prisma.user.findUnique({ where: { id: userId } });
                if (winnerInfo) {
                    await notificationService.sendPushNotification(opponent.userId, "Challenge Completed!", `${winnerInfo.username} won the "${challenge.title}" challenge you participated in!`);
                }
            }

            res.status(200).json({
                success: true,
                message: 'Reward claimed! Badge earned & +50 bonus points added. Challenge deleted.',
                earnedBadge
            });
        } catch (error) {
            console.error('Error in completeChallenge:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    public async respondToChallenge(req: Request, res: Response): Promise<void> {
        try {
            const userId = Number((req as any).user?.id);
            const { challengeId, accept } = req.body;

            if (!userId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }
            if (!challengeId || accept === undefined) {
                res.status(400).json({ success: false, message: 'challengeId and accept (boolean) are required' });
                return;
            }

            const updated = await gamificationModel.respondToChallenge(Number(challengeId), userId, Boolean(accept));
            res.status(200).json({ success: true, data: updated });
        } catch (error) {
            console.error('Error in respondToChallenge:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    public async handleProgressEvent(req: Request, res: Response): Promise<void> {
        res.status(200).json({ success: true, message: 'Progress event handled' });
    }

    public async evaluateChallengeCompletion(req: Request, res: Response): Promise<void> {
        res.status(200).json({ success: true, message: 'Challenge evaluation completed' });
    }

    public async getBadges(req: Request, res: Response): Promise<void> {
        try {
            const targetUserId = Number(req.params.userId);
            if (!targetUserId || isNaN(targetUserId)) {
                res.status(400).json({ success: false, message: 'Valid userId is required' });
                return;
            }

            const userBadges = await gamificationModel.getUserBadges(targetUserId);
            const badges = userBadges.map(ub => ({
                id: String(ub.badge.id),
                name: ub.badge.name,
                description: ub.badge.description,
                iconName: ub.badge.iconName,
                earnedAt: ub.earnedAt.toISOString(),
            }));

            res.status(200).json({ success: true, data: badges });
        } catch (error) {
            console.error('Error in getBadges:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
}

export const gamificationController = new GamificationController();
