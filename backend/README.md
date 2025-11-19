# NutriGame Backend - Proje Yapısı ve Katman Açıklamaları

## Şema

```
backend/
├── src/
│ ├── config/
│ │ └── prisma.ts
│ ├── controllers/
│ │ └── auth.controller.ts
│ ├── models/
│ │ └── user.model.ts
│ ├── routes/
│ │ └── auth.routes.ts
│ └── index.ts
|
├── prisma/
│ └── schema.prisma
|
├── package.json
|
├── tsconfig.json
|
└── .env
```

## Açıklamalar

- **config/**
  Uygulama genelinde kullanılan yapılandırmalar burada bulunur.
  prisma.ts dosyası, Prisma veritabanı bağlantısını başlatır ve proje içinde tekrar tekrar bağlantı açılmasını önler.

- **controllers/**  
  Endpointlerin iş mantığını ve HTTP yanıtlarını barındırır.  
  Örneğin `auth.controller.ts`, kullanıcının kayıt ve giriş işlemlerini yönetir.

- **models/**  
  Veritabanı CRUD işlemlerinden sorumlu katmandır.  
  `user.model.ts` dosyasında kullanıcıyı bulma, oluşturma gibi database fonksiyonları yer alır.

- **routes/**  
  Tüm endpoint URL adreslerini ve hangi controller fonksiyonlarına yönleneceğini belirler.  
  `auth.routes.ts` dosyası örneğin POST `/api/auth/login` REST çağrısını, ilgili controller fonksiyonuna iletir.

- **index.ts**  
  Sunucunun başlama noktasıdır. Express uygulamasını yaratır, route'ları ekler ve sunucuyu dinlemeye başlatır.

- **prisma/**
  Veritabanı tablolarını temsil eden Prisma şema dosyası (schema.prisma) burada bulunur.
  Bu dosya üzerinden modeller tanımlanır ve prisma migrate ile veritabanına aktarılır.

- **.env**
  Veritabanı bağlantı adresi (DATABASE_URL), JWT_SECRET gibi gizli yapılandırma bilgilerini içerir.
  Güvenlik nedeniyle GitHub'a yüklenmez ve dotenv ile uygulama içine alınır.

---

## Kısaca Akış

1. Frontend'den bir istek geldiğinde, önce **routes** tan uygun controller fonksiyonuna yönlendirilir.
2. **Controller**, işi için gerekli verileri **model** üzerinden veritabanından çeker ya da günceller.
3. Controller sonucu doğrudan **HTTP yanıtı** olarak frontend'e döner.
