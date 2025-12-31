// src/controllers/user.controller.ts

import { Request, Response, NextFunction } from 'express';
import { userModel } from '../models/user.model';

export class UserController {

    async updateUserProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id; // Assuming jwt/auth middleware sets req.user

            // ATTENTION: burada elimdeki user id ye sahip bir user var mi kontrolu yapmali miyim emin degilim, zaten giris yapabildiysek user vardir vs. bir hata alirsak bu ihtimal aklimizda bulunsun.

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
            return res.status(200).json({ success: true, message: 'User Profile is updated successfully.' });
        } catch (err) {
            next(err);
        }
    }

    async getUserProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id; // Assuming jwt/auth middleware sets req.user

            const fetchedUser = await userModel.fetchUser(userId);

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
        // TO DO: bu istekten sonra user giris sayfasina yonlendirilmeli degil mi frontend tarfindan
        try {
            const userId = req.user!.id; // Assuming jwt/auth middleware sets req.user

            // ATTENTION: burada elimdeki user id ye sahip bir user var mi kontrolu yapmali miyim emin degilim, zaten giris yapabildiysek user vardir vs. bir hata alirsak bu ihtimal aklimizda bulunsun.

            const updatedUser = await userModel.deleteUser(userId);
            return res.status(200).json({ success: true, message: 'User is deleted successfully.' });
        } catch (err) {
            next(err);
        }
    }
}

export const userController = new UserController();