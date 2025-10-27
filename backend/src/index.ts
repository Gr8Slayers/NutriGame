import express from 'express';
import dotenv from 'dotenv';

// .env dosyasındaki değişkenleri yükle
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Gelen istekleri JSON olarak işle
app.use(express.json());

// Basit bir test endpoint'i
app.get('/api', (req, res) => {
  res.json({ message: 'Nutrigame API Çalışıyor!' });
});

app.listen(port, () => {
  console.log(`🚀 Sunucu http://localhost:${port} adresinde başlatıldı`);
});
