// src/controllers/auth.controller.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { userModel } from '../models/user.model';

// .env dosyasından JWT secret al
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

export class AuthController {
    async register(req: Request, res: Response, next: NextFunction) {
        try {
            const { username, email, password, age, gender, height, weight, target_weight, reason_to_diet, avatar_url } = req.body;
            if (!username || !email || !password || !age || !gender || !height || !weight) {
                return res.status(400).json({ success: false, message: 'Zorunlu alanları doldurunuz.' });
            }

            const existingUser = await userModel.findUser(email, username);
            if (existingUser) {
                return res.status(409).json({ success: false, message: 'Bu email ya da username zaten kayıtlı.' });
            }

            //const hashedPassword = await bcrypt.hash(password, 10);
            await userModel.createUser(username, email, password, age, gender, height, weight, target_weight, reason_to_diet, avatar_url);
            return res.status(201).json({ success: true, message: 'Kayıt başarılı.' });
        } catch (error) {
            next(error);
        }
    }

    async login(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, username, password } = req.body;
            if (!(email || username) || !password) {
                return res.status(400).json({ success: false, message: 'Email/username ve şifre gerekli.' });
            }
            const user = await userModel.findUser(email, username);
            if (!user) {
                return res.status(401).json({ success: false, message: 'Geçersiz email/username veya şifre.' });
            }
            const passwordMatch = user.password == password;/*await bcrypt.compare(password, user.password);*/
            if (!passwordMatch) {
                return res.status(401).json({ success: false, message: 'Geçersiz email/username veya şifre.' });
            }
            // JWT token oluştur
            const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
            return res.status(200).json({
                success: true,
                message: 'Giriş başarılı.',
                token,
                user: {}
            });
        } catch (error) {
            next(error);
        }
    }
}

export const authController = new AuthController();