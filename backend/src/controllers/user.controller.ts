// src/controllers/user.controller.ts

import { Request, Response, NextFunction } from 'express';
import { userModel } from '../models/user.model';

export class UserController {

    async updateUserProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id; // Assuming jwt/auth middleware sets req.user

            const { age, gender, weight, height, target_weight, reason_to_diet, avatar_url, ...extra } = req.body; // sadece belli ozelliklerin degismesini mumkun kiliyor

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

            const updatedUser = await userModel.updateUserProfileById(userId, updates);
            return res.status(200).json({ success: true, user: req.user!.id/*updatedUser*/ });
        } catch (err) {
            next(err);
        }
    }

    async getUserProfile(req: Request, res: Response, next: NextFunction) {
    }

    async deleteAccount(req: Request, res: Response, next: NextFunction) {
    }
}

export const userController = new UserController();