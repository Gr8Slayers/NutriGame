// src/controllers/user.controller.ts

import { Request, Response, NextFunction } from 'express';
import { userModel, calculateDailyTargets } from '../models/user.model';
import prisma from '../config/prisma';

export class UserController {

    async updateUserProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;

            const { age, gender, weight, height, target_weight, reason_to_diet, avatar_url, ...extra } = req.body;

            const updates: any = {};
            if (age) updates.age = age;
            if (gender) updates.gender = gender;
            if (weight) updates.weight = weight;
            if (height) updates.height = height;
            if (target_weight) updates.target_weight = target_weight;
            if (reason_to_diet) updates.reason_to_diet = reason_to_diet;
            if (avatar_url) updates.avatar_url = avatar_url;

            if (Object.keys(updates).length === 0) {
                return res.status(400).json({ success: false, message: 'No data to update.' });
            }

            await userModel.updateUserProfileById(Number(userId), updates);
            return res.status(200).json({ success: true, message: 'User Profile is updated successfully.' });
        } catch (err) {
            next(err);
        }
    }

    async getUserProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;

            const fetchedUser = await userModel.fetchUser(Number(userId));

            if (!fetchedUser) {
                return res.status(401).json({ success: false, message: 'User is not found.' });
            }

            return res.status(200).json({
                success: true,
                message: 'User is fetched successfully.',
                data: {
                    username: fetchedUser.username,
                    email: fetchedUser.email,
                    age: fetchedUser.profile?.age,
                    gender: fetchedUser.profile?.gender,
                    height: fetchedUser.profile?.height,
                    weight: fetchedUser.profile?.weight,
                    target_weight: fetchedUser.profile?.target_weight,
                    reason_to_diet: fetchedUser.profile?.reason_to_diet,
                    avatar_url: fetchedUser.profile?.avatar_url,
                    followerCount: (fetchedUser as any).followerCount,
                    followingCount: (fetchedUser as any).followingCount
                }
            });
        } catch (err) {
            next(err);
        }
    }

    async deleteAccount(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            await userModel.deleteUser(Number(userId));
            return res.status(200).json({ success: true, message: 'User is deleted successfully.' });
        } catch (err) {
            next(err);
        }
    }

    async searchUsers(req: Request, res: Response, next: NextFunction) {
        try {
            const currentUserId = req.user!.id;
            const query = (req.query.query as string)?.trim();
            if (!query) {
                return res.status(400).json({ success: false, message: 'query param is required' });
            }
            const users = await userModel.searchUsers(query, Number(currentUserId));
            return res.status(200).json({ success: true, data: users });
        } catch (err) {
            next(err);
        }
    }

    async getDailyTargets(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;

            const fetchedUser = await userModel.fetchUser(Number(userId));

            if (!fetchedUser || !fetchedUser.profile) {
                return res.status(404).json({ success: false, message: 'User profile not found. Please complete signup.' });
            }

            const p = fetchedUser.profile;
            // activity_level was removed from the schema; use 'Moderately Active' as default
            const targets = calculateDailyTargets(
                p.age,
                p.gender,
                p.weight,
                p.height,
                'Moderately Active', // default since field no longer stored in DB
                p.reason_to_diet
            );

            return res.status(200).json({
                success: true,
                message: 'Daily targets calculated successfully.',
                data: targets
            });
        } catch (err) {
            next(err);
        }
    }

    async getPublicProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const currentUserId = req.user!.id;
            const targetUserId = parseInt(req.params.userId);

            if (isNaN(targetUserId)) {
                return res.status(400).json({ success: false, message: 'Invalid userId.' });
            }

            const profile = await userModel.fetchPublicProfile(targetUserId, Number(currentUserId));

            if (!profile) {
                return res.status(404).json({ success: false, message: 'User not found.' });
            }

            return res.status(200).json({ success: true, data: profile });
        } catch (err) {
            next(err);
        }
    }

    async updatePushToken(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            const { expoPushToken } = req.body;

            if (!userId) {
                res.status(401).json({ success: false, message: 'Unauthorized access.' });
                return;
            }

            if (!expoPushToken) {
                res.status(400).json({ success: false, message: 'Push token is required.' });
                return;
            }

            const updatedUser = await userModel.updateUser(userId, { expoPushToken });
            res.status(200).json({ success: true, message: 'Push token updated successfully.' });
        } catch (error) {
            console.error('Error updating push token:', error);
            res.status(500).json({ success: false, message: 'Internal server error.' });
        }
    }

    async getNotifications(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Unauthorized access.' });
                return;
            }

            const notifications = await prisma.notification.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 50
            });

            res.status(200).json({ success: true, data: notifications });
        } catch (error) {
            console.error('Error fetching notifications:', error);
            res.status(500).json({ success: false, message: 'Internal server error.' });
        }
    }
}

export const userController = new UserController();