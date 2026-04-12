// src/index.ts
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import multer from 'multer';
import cors from 'cors';

import prisma from './config/prisma'; // 🔹 PRİSMA BAĞLANTISI

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import foodRoutes from './routes/food.routes';
import socialRoutes from './routes/social.routes';
import gamificationRoutes from './routes/gamification.routes';
import chatbotRoutes from './routes/chatbot.routes';
import foodRecognitionRoutes from './routes/food.recognition.routes';
import dailyProgressRoutes from './routes/dailyprogress.routes';
import imageRoutes from './routes/image.routes';
import { authMiddleware } from './middleware/auth.middleware';
import { startCronJobs } from './jobs/cron';

dotenv.config();

// Start background cron jobs
startCronJobs();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

app.use('/api/images', imageRoutes);
app.use('/api/upload', imageRoutes); // /api/upload points to the same route for convenience

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
app.use('/api/gamification', gamificationRoutes);
app.use('/api/chat', chatbotRoutes);
app.use('/api/scan', foodRecognitionRoutes);
app.use('/api/progress', dailyProgressRoutes);

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
