# NutriCoach Chatbot Service

NutriGame uygulamasının AI destekli beslenme koçu servisi. Google Gemini API kullanılarak geliştirilmiştir. Kullanıcılara beslenme, diyet, hidrasyon ve sağlıklı yaşam konularında motivasyonel ve kanıta dayalı destek sunar.

---

## Özellikler

- **Gemini 2.0 Flash** modeli ile bağlamsal sohbet
- **Streaming** desteği (Server-Sent Events)
- **Konuşma geçmişi** önbelleğe alma (session bazlı, 1 saat TTL)
- **Rate limiting** – kullanıcı başına dakikada maksimum 10 mesaj
- **PII filtreleme** – mesajlar Gemini'ye gönderilmeden önce e-posta, telefon, TC kimlik no gibi kişisel veriler temizlenir
- **Konu kısıtlaması** – chatbot yalnızca beslenme ve sağlıklı yaşam sorularını yanıtlar

---

## Kurulum

```bash
cd ai_service/src/chatbot
npm install
```

### Ortam Değişkenleri

`.env.example` dosyasını kopyalayarak `.env` oluşturun:

```bash
cp .env.example .env
```

`.env` içeriği:

```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3001
MAX_MESSAGES_PER_MINUTE=10
MAX_MESSAGE_LENGTH=2000
CONVERSATION_TTL_MS=3600000
```

---

## Çalıştırma

```bash
# Production
npm start

# Geliştirme (hot-reload)
npm run dev
```

Servis varsayılan olarak `http://localhost:3001` adresinde çalışır.

---

## API Referansı

### `POST /api/chat`
Tam yanıt döndüren standart sohbet isteği.

**Request Body:**
```json
{
  "userId": "user-123",
  "chatId": "optional-existing-chat-id",
  "message": "Kilo vermek için kahvaltıda ne yemeliyim?"
}
```

**Response `200`:**
```json
{
  "chatId": "550e8400-e29b-41d4-a716-446655440000",
  "response": "Kilo verme sürecinde ideal bir kahvaltı..."
}
```

**Hata Yanıtları:**

| Kod | Açıklama |
|-----|----------|
| `400` | Geçersiz veya boş mesaj |
| `429` | Rate limit aşıldı (`retryAfterMs` alanı döner) |
| `503` | Gemini API geçici olarak kullanılamıyor |

---

### `POST /api/chat/stream`
Yanıtı Server-Sent Events (SSE) akışıyla gönderir.

**Request Body:** `/api/chat` ile aynı.

**SSE Olayları:**
```
data: {"chunk": "Kilo verme"}
data: {"chunk": " sürecinde..."}
data: {"done": true, "chatId": "550e8400-..."}
```

Hata durumunda:
```
data: {"error": "AI service temporarily unavailable."}
```

---

### `GET /api/chat/history/:chatId`
Bir oturumun konuşma geçmişini döndürür.

**Response `200`:**
```json
{
  "chatId": "550e8400-...",
  "history": [
    {
      "role": "user",
      "parts": [{ "text": "Kilo vermek için ne yemeliyim?" }]
    },
    {
      "role": "model",
      "parts": [{ "text": "Kilo verme sürecinde..." }]
    }
  ]
}
```

---

### `POST /api/chat/new`
Yeni boş bir konuşma oturumu oluşturur.

**Response `201`:**
```json
{
  "chatId": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

### `DELETE /api/chat/:chatId`
Bir konuşma oturumunu önbellekten siler.

**Response `200`:**
```json
{ "success": true }
```

---

### `GET /health`
Servisin çalışıp çalışmadığını kontrol eder.

**Response `200`:**
```json
{ "status": "ok", "service": "nutrigame-chatbot" }
```

---

## Test

Servisin çalıştığından emin olduktan sonra:

```bash
node test/testClient.js
```

Test senaryoları:
1. Health check
2. Yeni oturum oluşturma
3. Standart sohbet (beslenme sorusu)
4. Geçmiş getirme
5. Konu dışı soru (yönlendirme testi)
6. Streaming sohbet
7. Boş mesaj validasyonu
8. Oturum silme

---

## Dosya Yapısı

```
chatbot/
├── server.js          # Express sunucu ve route tanımları
├── chatbotService.js  # Gemini entegrasyonu, önbellek, rate limiter
├── privacyUtils.js    # PII filtreleme yardımcı fonksiyonları
├── package.json
├── .env               # Ortam değişkenleri (git'e eklenmez)
├── .env.example       # Örnek ortam değişkenleri
├── .gitignore
└── test/
    └── testClient.js  # Manuel entegrasyon testi
```

---

## Mimari Notlar

- **Konuşma önbelleği** sunucu belleğinde tutulur (Map). TTL süresi dolmuş oturumlar her dakika temizlenir. Üretim ortamında Redis ile değiştirilebilir.
- **Rate limiting** iki katmanlıdır: Express `express-rate-limit` (genel) + `chatbotService` içinde kullanıcı bazlı dakika penceresi.
- **PII filtreleme** Gemini'ye gönderilmeden önce `privacyUtils.js` tarafından uygulanır; hem yeni mesajlar hem de geçmiş sanitize edilir (OWASP MASVS uyumu).
- **Konu kısıtlaması** sistem prompt'u ile sağlanır. Konu dışı sorularda chatbot kullanıcıyı sağlık konularına yönlendirir.
