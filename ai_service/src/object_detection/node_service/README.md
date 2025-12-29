# Food Detection Service

RT-DETR modeli ile yemek tespiti - Node.js gateway servisi.

## 🎯 Mimari

```
Client → Node.js Service → Inference API (Hugging Face / Render)
         (Port 3002)        (External service)
```

## ⚙️ Kurulum

```bash
npm install
cp .env.example .env
# .env dosyasını düzenle - INFERENCE_SERVICE_URL ekle
npm start
```

## 🔗 API Endpoints

### Health Check
```bash
GET /health
```

### Detect (File Upload)
```bash
POST /detect
Content-Type: multipart/form-data

Body:
- image: [file]
- confidence_threshold: 0.5 (optional)
```

### Detect (URL)
```bash
POST /detect-url
Content-Type: application/json

Body:
{
  "image_url": "https://example.com/image.jpg",
  "confidence_threshold": 0.5
}
```

## 📦 Deploy Seçenekleri

İki inference backend seçeneği:

### 1. Hugging Face Spaces (Önerilen)
- ✅ Ücretsiz GPU
- ✅ Daha hızlı
- ✅ Gradio UI + API

Deploy: [../huggingface/DEPLOY.md](../huggingface/DEPLOY.md)

### 2. Render.com
- ✅ Ücretsiz CPU
- ✅ Flask REST API
- ⚠️ Cold start (15dk idle sonrası)

Deploy: [../render/DEPLOY.md](../render/DEPLOY.md)

## 🧪 Test

```bash
# Health check
curl http://localhost:3002/health

# Test detection
curl -X POST http://localhost:3002/detect \
  -F "image=@test.jpg" \
  -F "confidence_threshold=0.5"
```

## 🚀 Sonraki Adımlar

1. ✅ Inference backend seç (Hugging Face veya Render)
2. ✅ Deploy et
3. ✅ URL'i `.env` dosyasına ekle
4. ✅ Node.js servisini çalıştır
5. ✅ Test et!
