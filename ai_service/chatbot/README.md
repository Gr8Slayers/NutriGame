# Mental Health Chatbot Service

Mental health desteği sağlayan AI chatbot servisi. Hugging Face API kullanarak [Mental-Health-FineTuned-Mistral-7B](https://huggingface.co/mradermacher/Mental-Health-FineTuned-Mistral-7B-Instruct-v0.2-i1-GGUF) modeli ile konuşur.

## 🔐 Özellikler

- ✅ Hugging Face Inference API ile remote model kullanımı (local indirme gerektirmez)
- ✅ **Kişisel veri maskeleme**: Email, telefon, URL, TC kimlik no, kredi kartı otomatik maskeler
- ✅ Konuşma geçmişi desteği (context-aware yanıtlar)
- ✅ Ayarlanabilir parametreler (temperature, max tokens)
- ✅ Express.js tabanlı REST API
- ✅ Detaylı test client

## 📋 Gereksinimler

- Node.js 18+ 
- npm veya yarn
- Hugging Face API Key (ücretsiz)

## 🚀 Kurulum

### 1. Dependencies Yükle

```powershell
cd D:\Desktop\Bitirme\NutriGame\ai_service\chatbot
npm install
```

### 2. Hugging Face API Key Al

1. [Hugging Face](https://huggingface.co/) hesabı oluştur (ücretsiz)
2. [Settings > Access Tokens](https://huggingface.co/settings/tokens) sayfasına git
3. "New token" butonuna tıkla
4. Token tipini "Read" olarak seç
5. Token'ı kopyala

### 3. Environment Ayarla

`.env.example` dosyasını `.env` olarak kopyala ve API key'ini ekle:

```powershell
Copy-Item .env.example .env
```

`.env` dosyasını aç ve API key'ini gir:

```
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxxxxxx
```

## 🎮 Kullanım

### Sunucuyu Başlat

```powershell
npm start
```

**Development mode (auto-reload):**
```powershell
npm run dev
```

Sunucu `http://localhost:8001` adresinde çalışacak.

### Test Client ile Test Et

**Otomatik testler:**
```powershell
npm test
```

**Interactive mode:**
```powershell
node test/testClient.js interactive
```

## 📡 API Endpoints

### `POST /chat`

Chatbot ile konuş

**Request:**
```json
{
  "message": "I'm feeling stressed about work",
  "mask_personal_data": true,
  "include_history": false,
  "max_new_tokens": 512,
  "temperature": 0.7,
  "top_p": 0.9
}
```

**Response:**
```json
{
  "response": "It's completely normal to feel stressed about work...",
  "masked_message": "I'm feeling stressed about work",
  "detected_entities": [],
  "has_personal_data": false
}
```

### `POST /clear-history`

Konuşma geçmişini temizle

### `GET /history`

Konuşma geçmişini getir

### `GET /health`

Servis sağlık kontrolü

## 🔒 Kişisel Veri Maskeleme

Servis otomatik olarak şu tür verileri maskeler:

- **Email adresleri**: `john@example.com` → `[EMAIL]`
- **Telefon numaraları**: `+90 555 123 4567` → `[TELEFON]`
- **URL'ler**: `https://example.com` → `[URL]`
- **TC Kimlik No**: `12345678901` → `[TC_NO]`
- **Kredi Kartı**: `1234 5678 9012 3456` → `[KART_NO]`

**Örnek:**

```python
# Giriş
"Hi, I'm John. Email: john@example.com, Phone: +90 555 123 4567"

# Maskelenmiş
"Hi, I'm John. Email: [EMAIL], Phone: [TELEFON]"
```

## 🛠️ JavaScript'ten Kullanım

```javascript
import { MentalHealthChatbot } from './chatbotService.js';

// Chatbot oluştur
const chatbot = new MentalHealthChatbot('your_hf_token');

// Konuş
const result = await chatbot.chat({
  message: "I'm feeling anxious",
  maskPersonalData: true,
  includeHistory: true
});

console.log(result.response);
```

## ⚙️ Parametreler

- **`message`**: Kullanıcı mesajı (required)
- **`maskPersonalData`**: Kişisel verileri maskele (default: `true`)
- **`includeHistory`**: Konuşma geçmişini dahil et (default: `false`)
- **`maxNewTokens`**: Maksimum yanıt uzunluğu (50-2048, default: 512)
- **`temperature`**: Yaratıcılık seviyesi (0.0-1.0, default: 0.7)
  - Düşük (0.3): Daha tutarlı ve odaklanmış
  - Yüksek (0.9): Daha yaratıcı ve çeşitli
- **`topP`**: Nucleus sampling (0.0-1.0, default: 0.9)

## 📝 Örnek Kullanım Senaryoları

### 1. Basit Sohbet
```javascript
const response = await chatbot.chat({
  message: "I'm feeling stressed"
});
```

### 2. Kişisel Veri ile
```javascript
const response = await chatbot.chat({
  message: "I'm John, email: john@example.com. I need help with anxiety.",
  maskPersonalData: true
});
// Email otomatik maskelenir
```

### 3. Konuşma Geçmişi ile
```javascript
const response1 = await chatbot.chat({
  message: "I have trouble sleeping",
  includeHistory: true
});

const response2 = await chatbot.chat({
  message: "What else can help?",
  includeHistory: true
});
// İkinci mesaj birinci mesajın context'ini bilir
```

## 🔍 Debugging

### Model Yükleniyor Hatası

İlk istekte model sunucuda yükleniyor olabilir. 503 hatası alırsanız:

```json
{
  "error": "Model yükleniyor. Tahmini bekleme süresi: 20 saniye"
}
```

Birkaç saniye bekleyip tekrar deneyin.

### API Key Hatası

```
Error: Hugging Face API key bulunamadı!
```

`.env` dosyasında `HUGGINGFACE_API_KEY` değişkenini kontrol edin.

## 📚 Dosya Yapısı

```
chatbot/
├── server.js              # Express server
├── chatbotService.js      # Chatbot servis sınıfı
├── privacyUtils.js        # Kişisel veri maskeleme
├── package.json           # Node.js dependencies
├── .env.example           # Environment template
├── .env                   # API key (gitignore'da)
├── .gitignore             # Git ignore rules
├── README.md              # Bu dosya
└── test/
    └── testClient.js      # Test client
```

## 🤝 Katkıda Bulunma

1. Yeni feature eklemek için PR açın
2. Bug bulursanız issue açın
3. Test coverage'ı artırın

## 📄 Lisans

MIT License

## 🔗 Kaynaklar

- [Hugging Face Model](https://huggingface.co/mradermacher/Mental-Health-FineTuned-Mistral-7B-Instruct-v0.2-i1-GGUF)
- [Express.js Documentation](https://expressjs.com/)
- [Hugging Face Inference API](https://huggingface.co/docs/api-inference/index)

---

**Not:** Bu servis Node.js/JavaScript kullanarak geliştirilmiştir ve Express.js framework'ü ile çalışır.
