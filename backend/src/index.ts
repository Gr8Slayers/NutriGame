// src/index.ts
import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import prisma from './config/prisma'; // 🔹 PRİSMA BAĞLANTISI

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

/*prisma.$connect()
  .then(() => console.log('📦 Database bağlantısı başarılı'))
  .catch((err: any) => console.error('❌ Database bağlantı hatası:', err));*/

// Health Check
app.get('/api', (req, res) => {
  res.json({ message: 'Nutrigame API Çalışıyor!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

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
