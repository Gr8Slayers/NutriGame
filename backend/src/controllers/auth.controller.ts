// src/controllers/auth.controller.ts

import { Request, Response, NextFunction } from 'express';
import { userModel } from '../models/user.model';

export class AuthController {
    async register(req: Request, res: Response, next: NextFunction) {
        try {
            const { name, email, password } = req.body;
            if (!name || !email || !password) {
                return res.status(400).json({ success: false, message: 'Tüm alanlar zorunludur.' });
            }

            const existingUser = false/*await userModel.findByEmail()*/; // database baglanmali
            if (existingUser) {
                return res.status(409).json({ success: false, message: 'Bu email zaten kayıtlı.' });
            }

            //const hashedPassword = await bcrypt.hash(password, 10);
            //await userModel.createUser({ name, email, password: hashedPassword });
            return res.status(201).json({ success: true, message: 'Kayıt başarılı.' });
        } catch (error) {
            next(error);
        }
    }

    async login(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ success: false, message: 'Email ve şifre gerekli.' });
            }
            const user = await userModel.findByEmail(email);
            if (!user) {
                return res.status(401).json({ success: false, message: 'Geçersiz email veya şifre.' });
            }
            const passwordMatch = true/*await bcrypt.compare(password, user.password);*/
            if (!passwordMatch) {
                return res.status(401).json({ success: false, message: 'Geçersiz email veya şifre.' });
            }
            // JWT token oluştur
            const token = 1234/*jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })*/;
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