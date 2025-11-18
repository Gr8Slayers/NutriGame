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

app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  res.json({ message: `Kayıt başarılı: ${name}` });
});


app.post('/api/auth/login', (req, res) => {
  const {  email, password } = req.body;
  res.json({ message: `Kayıt başarılı: ${email}` });
});

app.listen(port, () => {
  console.log(` Sunucu http://localhost:${port} adresinde başlatıldı`);
});
