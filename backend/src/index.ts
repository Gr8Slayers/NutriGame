// src/index.ts
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import multer from 'multer';

import prisma from './config/prisma'; // 🔹 PRİSMA BAĞLANTISI

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import foodRoutes from './routes/food.routes';
import socialRoutes from './routes/social.routes';
import { authMiddleware } from './middleware/auth.middleware';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Uploads klasörünü public olarak sun
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Resim yükleme endpoint'i
const storage = multer.diskStorage({
    destination: path.join(__dirname, '..', 'uploads'),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname) || '.jpg';
        cb(null, `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
    },
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (_req, file, cb) => {
        if (['image/jpeg', 'image/png', 'image/jpg'].includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Yalnızca JPEG ve PNG desteklenmektedir.'));
        }
    },
});

app.post('/api/upload', authMiddleware, upload.single('image'), (req: any, res: any) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Dosya yüklenemedi.' });
    }
    const host = req.headers.host || `localhost:${port}`;
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const imageUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
    return res.status(200).json({ success: true, imageUrl });
});

prisma.$connect()
  .then(() => console.log('📦 Database bağlantısı başarılı'))
  .catch((err: any) => console.error('❌ Database bağlantı hatası:', err));

// Health Check
app.get('/api', (req, res) => {
  res.json({ message: 'Nutrigame API Çalışıyor!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/social', socialRoutes);

// Server başlat
app.listen(port, () => {
  console.log(`
╔══════════════════════════════════════════╗
    🎮 NutriGame Backend Server Started
    🚀 Server: http://localhost:${port}
    📱 Network: http://[YOUR_IP]:${port}
╚══════════════════════════════════════════╝`
  );
});
