// src/index.ts
import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Health Check
app.get('/api', (req, res) => {
    res.json({ message: 'Nutrigame API Çalışıyor!' });
});

app.use('/api/auth', authRoutes);

// Server başlat
app.listen(port, () => {
    console.log(`
╔══════════════════════════════════════════╗
    🎮 NutriGame Backend Server Started
    🚀 Server: http://localhost:${port}
    📱 Network: http://[YOUR_IP]:${port}
╚══════════════════════════════════════════╝`
    )
});