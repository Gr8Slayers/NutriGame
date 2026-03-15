// src/controllers/user.controller.ts

import { Request, Response, NextFunction } from 'express';
import { userModel, calculateDailyTargets } from '../models/user.model';

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
                    avatar_url: fetchedUser.profile?.avatar_url
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
}

export const userController = new UserController();