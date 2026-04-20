// src/controllers/auth.controller.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { userModel } from '../models/user.model';
import { authLoginSchema, authRegisterSchema } from '../validation/schemas';
import { getValidationErrors, getValidationMessage } from '../validation/utils';

// .env dosyasından JWT secret al
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

export class AuthController {
    async register(req: Request, res: Response, next: NextFunction) {
        console.log('POST api/auth/register')
        try {
            const parsed = authRegisterSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({
                    success: false,
                    message: getValidationMessage(parsed.error, 'Zorunlu alanları doldurunuz.'),
                    errors: getValidationErrors(parsed.error),
                });
            }

            const { username, email, password, age, gender, height, weight, target_weight, reason_to_diet, avatar_url } = parsed.data;

            const existingUser = await userModel.findUser(email, username);
            if (existingUser) {
                return res.status(409).json({ success: false, message: 'Bu email ya da username zaten kayıtlı.' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            await userModel.createUser(
                username,
                email,
                hashedPassword,
                age,
                gender,
                height,
                weight,
                target_weight ?? weight,
                reason_to_diet ?? '',
                avatar_url ?? ''
            );
            return res.status(201).json({ success: true, message: 'Kayıt başarılı.' });
        } catch (error) {
            next(error);
        }
    }

    async login(req: Request, res: Response, next: NextFunction) {
        console.log('POST api/auth/login')
        try {
            const parsed = authLoginSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({
                    success: false,
                    message: getValidationMessage(parsed.error, 'Email/username ve şifre gerekli.'),
                    errors: getValidationErrors(parsed.error),
                });
            }

            const { email, username, password } = parsed.data;
            console.log(req.body);
            const user = await userModel.findUser(email ?? '', username ?? '');
            if (!user) {
                return res.status(401).json({ success: false, message: 'Geçersiz email/username veya şifre.' });
            }
            const passwordMatch = await bcrypt.compare(password, user.password);
            if (!passwordMatch) {
                return res.status(401).json({ success: false, message: 'Geçersiz email/username veya şifre.' });
            }
            // JWT token oluştur (BigInt'i string'e çevir - CockroachDB BigInt JSON serialize edemez)
            const token = jwt.sign({ userId: user.id.toString() }, JWT_SECRET, { expiresIn: '7d' });
            return res.status(200).json({
                success: true,
                message: 'Giriş başarılı.',
                token,
                user: { id: user.id.toString(), username: user.username, email: user.email }
            });
        } catch (error) {
            next(error);
        }
    }
}

export const authController = new AuthController();
