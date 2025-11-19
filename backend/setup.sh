#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " 🚀 NutriGame Supabase Bağlantı Kurulumu"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1️⃣ Node paketlerini yükle
echo "📦 Gerekli NPM paketleri yükleniyor..."
npm install

# 2️⃣ .env dosyasını Supabase bağlantısına göre oluştur
if [ ! -f .env ]; then
  echo "📝 Supabase için .env oluşturuluyor..."
  cat <<EOT >> .env
DATABASE_URL="postgresql://postgres:Gr8SlayersNutriGame@db.whkojsamejjicxukibpm.supabase.co:5432/postgres"
JWT_SECRET="Gr8SlayersNutriGame"
PORT=5000
EOT
  echo "✔ Supabase bağlantısı .env içine yazıldı!"
else
  echo "ℹ️ .env zaten var, atlanıyor."
fi

# 3️⃣ Prisma Client oluştur
echo "🛠 Prisma Client oluşturuluyor..."
npx prisma generate

# 4️⃣ Prisma'yı Supabase veritabanına uyguluyoruz
echo "🗄 Supabase veritabanına Prisma db push gönderiliyor..."
npx prisma db push

# 5️⃣ Build
echo "📦 Proje build ediliyor..."
npm run build

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " 🎉 Supabase bağlantısı tamamlandı!"
echo " 🚀 Sunucu başlatmak için: npm run dev"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
