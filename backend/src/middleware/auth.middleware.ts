// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// .env dosyasından JWT secret al
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

/**
 * TypeScript için Request tipini genişlet
 * req.user özelliğini tanımlıyoruz
 */
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: number;
            };
        }
    }
}

/**
 * Auth Middleware
 * JWT token'ı doğrular ve req.user'a kullanıcı ID'sini ekler
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
        // 1. Authorization header'ı al
        const authHeader = req.headers.authorization;

        // 2. Header var mı kontrol et
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'Authorization header bulunamadı. Lütfen giriş yapın.',
            });
        }

        // 3. "Bearer <token>" formatında mı kontrol et
        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Authorization header formatı hatalı. "Bearer <token>" olmalı.',
            });
        }

        // 4. Token'ı çıkar (Bearer kelimesini at)
        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token bulunamadı.',
            });
        }

        // 5. Token'ı doğrula ve içindeki veriyi al
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };

        // 6. req.user'a kullanıcı bilgilerini ekle
        req.user = {
            id: decoded.userId,
        };

        // 7. Bir sonraki middleware veya controller'a geç
        next();

    } catch (error: any) {
        // Token geçersiz veya süresi dolmuş
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Geçersiz token.',
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token süresi dolmuş. Lütfen tekrar giriş yapın.',
            });
        }

        // Diğer hatalar
        return res.status(500).json({
            success: false,
            message: 'Token doğrulanırken hata oluştu.',
        });
    }
}