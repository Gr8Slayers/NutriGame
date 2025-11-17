NutriGame Backend - Dosya Yapısı ve Katmanlar

Şema:
-------
backend/
├── src/
│   ├── controllers/
│   │   └── auth.controller.ts   # Giriş/kayıt işlemlerinin iş mantığı ve HTTP işlemleri
│   ├── models/
│   │   └── user.model.ts        # Veritabanında kullanıcı (User) ile ilgili tüm işlemler
│   ├── routes/
│   │   └── auth.routes.ts       # Auth endpointlerinin (register, login) adres tanımları
│   └── index.ts                 # Uygulama giriş dosyası, server başlatma ve temel ayarlar
├── package.json                 # Proje bağımlılıklarını ve scriptlerini tanımlar
├── tsconfig.json                # TypeScript yapılandırması
└── .env                         # Ortama özel değişkenler (örn. PORT, SECRET)

Açıklamalar:
------------
controllers/  →  Her bir endpoint (ör: auth) için iş mantığı ve HTTP'ye yanıt döner. Burada login ve register işlemleri yapılır.
models/       →  Veritabanı işlemlerini yönetir. Örneğin user.model.ts kullanıcı oluşturma, veritabanında kullanıcıyı arama gibi tüm database işlemlerini içerir.
routes/       →  API endpoint adreslerini (hangi URL neye yönlendirir?) tanımlar. Örneğin POST /api/auth/login çağrısını ilgili controller fonksiyonuna yönlendirir.
index.ts      →  Uygulamanın başlama noktasıdır. Express serverı başlatır, route'ları ekler, middleware ve error handler tanımlar.

Diğer dosyalar:
package.json      →  Projedeki bağımlılıkları, scriptleri ve temel bilgileri tutar.
tsconfig.json     →  TypeScript ayarları yer alır.
.env              →  (Varsa) Ortama/çevreye özel (PORT, SECRET gibi) değişkenler burada tutulur.

Kısacası: 
- FRONTEND'den gelen istek önce ROUTES dosyasına, sonra ilgili CONTROLLER'a yönlenir.
- CONTROLLER işini yapmak için (kullanıcıyı bul, şifreyi kontrol et, json yanıt hazırla vs.) MODELS katmanındaki fonksiyonları çağırır.
- Sonuç controller'dan frontend'e döner.
