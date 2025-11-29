// src/controllers/user.controller.ts

import { Request, Response, NextFunction } from 'express';
import { userModel } from '../models/user.model';

export class UserController {

    async updateProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id; // Assuming jwt/auth middleware sets req.user

            const { name, age, gender, weight, height, ...extra } = req.body; // sadece belli ozelliklerin degismesini mumkun kiliyor

            const updates: any = {};
            if (name) updates.name = name;
            if (age) updates.age = age;
            if (gender) updates.gender = gender;
            if (weight) updates.weight = weight;
            if (height) updates.height = height;

            if (Object.keys(updates).length === 0) {
                return res.status(400).json({ success: false, message: 'No data to update.' });
            }

            const updatedUser = await userModel.updateUserById(userId);
            return res.status(200).json({ success: true, user: req.user!.id/*updatedUser*/ });
        } catch (err) {
            next(err);
        }
    }

    async getProfile(req: Request, res: Response, next: NextFunction) {
    }

    async deleteAccount(req: Request, res: Response, next: NextFunction) {
    }
}

export const userController = new UserController();