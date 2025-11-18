import prisma from '../config/prisma';
import bcrypt from 'bcrypt';

async function runTests() {
  console.log('🚀 Test başlıyor...\n');

  // 1️⃣ Kullanıcı oluşturma (register test)
  const email = 'testuser@example.com';
  const password = '123456';
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
    },
  });

  console.log('🟢 Kullanıcı oluşturuldu:', newUser);

  // 2️⃣ Kullanıcıyı email ile bulma (login test)
  const foundUser = await prisma.user.findUnique({
    where: { email },
  });

  console.log('🔎 Kullanıcı bulundu:', foundUser);

  // 3️⃣ Şifre eşleşiyor mu kontrol et
  if (foundUser) {
    const isMatch = await bcrypt.compare(password, foundUser.password);
    console.log('🔐 Şifre doğrulama sonucu:', isMatch ? 'Doğru ✔' : 'Yanlış ❌');
  }

  // 4️⃣ Tüm kullanıcıları listele
  const users = await prisma.user.findMany();
  console.log('\n👥 Veritabanındaki tüm kullanıcılar:', users);

  console.log('\n🎯 Test tamamlandı!');
}

runTests()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
