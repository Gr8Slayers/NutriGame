# Hugging Face Space - YOLOv8n Food Detection Integration

Bu klasör, Hugging Face Space üzerinde çalışan YOLOv8n modelini Node.js'den kullanmak için gerekli entegrasyon kodlarını içerir.

## 📦 Kurulum

```bash
npm install
```

### Gerekli Paketler
- `@gradio/client` - Gradio API client
- `axios` - HTTP istekleri
- `form-data` - Multipart form data
- `eventsource` - Server-sent events
- `express` - Backend API server
- `multer` - File upload handling

## 🚀 Kullanım

### 1. CLI ile Test (hf-gradio-api.js)

**Tek resim:**
```bash
node hf-gradio-api.js path/to/image.jpg
```

**Birden fazla resim:**
```bash
node hf-gradio-api.js img1.jpg img2.jpg img3.jpg
```

**Örnek:**
```bash
node hf-gradio-api.js D:\Desktop\Bitirme\NutriGame\ai_service\mock_data\banana.jpg
```

**Çıktı:**
```json
{
  "success": true,
  "detections": [
    { "class": "banana", "confidence": 0.86 }
  ],
  "raw_text": "Detected items:\n• banana: 86.0%",
  "annotated_image": {
    "url": "https://nceyda-yolo-food-det.hf.space/gradio_api/file=/tmp/gradio/...",
    "orig_name": "image.webp"
  },
  "source": "huggingface"
}
```

### 2. Backend API Server (backend-integration.js)

**Sunucuyu başlat:**
```bash
node backend-integration.js
```

Server `http://localhost:3001` adresinde çalışmaya başlar.

#### API Endpoints

##### Health Check
```bash
GET http://localhost:3001/api/health
```

##### Tek Resim Analizi
```bash
POST http://localhost:3001/api/analyze-food
Content-Type: multipart/form-data

Body:
- image: [file]
```

**Örnek (curl):**
```bash
curl -X POST http://localhost:3001/api/analyze-food \
  -F "image=@banana.jpg"
```

**Örnek (PowerShell):**
```powershell
$response = Invoke-WebRequest -Uri "http://localhost:3001/api/analyze-food" `
  -Method Post `
  -Form @{ image = Get-Item "banana.jpg" }
$response.Content | ConvertFrom-Json
```

**Response:**
```json
{
  "success": true,
  "detections": [
    { "class": "banana", "confidence": 0.86 }
  ],
  "summary": {
    "total_items": 1,
    "items": "banana"
  },
  "annotated_image_url": "https://nceyda-yolo-food-det.hf.space/gradio_api/file=/tmp/gradio/...",
  "raw_text": "Detected items:\n• banana: 86.0%",
  "source": "huggingface"
}
```

##### Batch Analizi (Maksimum 10 resim)
```bash
POST http://localhost:3001/api/analyze-batch
Content-Type: multipart/form-data

Body:
- images: [file1]
- images: [file2]
- images: [file3]
```

**Örnek (curl):**
```bash
curl -X POST http://localhost:3001/api/analyze-batch \
  -F "images=@banana.jpg" \
  -F "images=@pizza.jpg" \
  -F "images=@apple.jpg"
```

**Response:**
```json
{
  "success": true,
  "total_images": 3,
  "results": [
    {
      "filename": "banana.jpg",
      "success": true,
      "detections": [
        { "class": "banana", "confidence": 0.86 }
      ],
      "summary": {
        "total_items": 1,
        "items": "banana"
      },
      "annotated_image_url": "https://..."
    },
    {
      "filename": "pizza.jpg",
      "success": true,
      "detections": [
        { "class": "pizza", "confidence": 0.879 }
      ],
      "summary": {
        "total_items": 1,
        "items": "pizza"
      },
      "annotated_image_url": "https://..."
    }
  ]
}
```

### 3. Kod İçinde Kullanım

```javascript
import { analyzeFoodFromHF, analyzeBatchFromHF } from './hf-gradio-api.js';

// Tek resim
const result = await analyzeFoodFromHF('path/to/image.jpg');
console.log(result.detections);

// Birden fazla resim
const results = await analyzeBatchFromHF(['img1.jpg', 'img2.jpg']);
results.forEach(result => {
    console.log(result.detections);
});
```

## 🔧 Nasıl Çalışır?

1. **Upload**: Resim Gradio Space'e yüklenir (`/gradio_api/upload`)
2. **Queue**: İşlem kuyruğa eklenir (`/gradio_api/queue/join`)
3. **Results**: Server-sent events ile sonuçlar alınır (`/gradio_api/queue/data`)

## 📊 Performans

- **İlk istek**: ~5-10 saniye
- **Sonraki istekler**: ~5-10 saniye
- **Cold start**: Yok (Space her zaman aktif)
- **Rate limiting**: Var (arka arkaya çok fazla istek gönderme)

## ⚠️ Önemli Notlar

- Space **public** olmalı (private ise token gerekir)
- Rate limiting var, çok fazla istek göndermeyin
- Annotated image URL geçici (birkaç saat sonra silinir)
- Batch işlemlerinde her resim arasında 2 saniye bekleme var

## 📝 Dosya Yapısı

```
huggingface/
├── hf-gradio-api.js        # Ana API client (CLI kullanımı)
├── backend-integration.js   # Express.js backend wrapper
├── package.json             # Node.js dependencies
├── INTEGRATION.md           # Bu dosya (detaylı kullanım)
├── README.md                # Space metadata
├── app.py                   # Gradio Space Python kodu
└── requirements.txt         # Python dependencies
```

## 🔗 Hugging Face Space

- **URL**: https://huggingface.co/spaces/nceyda/yolo-food-det
- **Model**: YOLOv8n (nano)
- **Dataset**: COCO (80 classes)
- **Framework**: Gradio 4.44.0

## 🐛 Hata Ayıklama

**Sorun**: "Space metadata could not be loaded"
- **Çözüm**: Space'in public olduğundan emin ol

**Sorun**: "Timeout waiting for results"
- **Çözüm**: Space'in çalıştığını kontrol et, timeout süresini artır

**Sorun**: Rate limiting
- **Çözüm**: İstekler arasında daha uzun bekleme süresi ekle

## 📄 Lisans

AGPL-3.0 (YOLOv8 lisansı)
