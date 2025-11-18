# NutriGame Backend - Proje Yapısı ve Katman Açıklamaları

## Şema

```
backend/
├── src/
│ ├── controllers/
│ │ └── auth.controller.ts
│ ├── models/
│ │ └── user.model.ts
│ ├── routes/
│ │ └── auth.routes.ts
│ └── index.ts
├── package.json
├── tsconfig.json
└── .env
```

## Açıklamalar

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

---

## Kısaca Akış

1. Frontend'den bir istek geldiğinde, önce **routes** tan uygun controller fonksiyonuna yönlendirilir.
2. **Controller**, işi için gerekli verileri **model** üzerinden veritabanından çeker ya da günceller.
3. Controller sonucu doğrudan **HTTP yanıtı** olarak frontend'e döner.
