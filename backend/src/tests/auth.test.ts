/**
 * NutriGame Auth Test Suite
 * Covers: Unit | Integration | System | Performance | User (Acceptance) Testing
 */

import request from 'supertest';
import express from 'express';
import { Router } from 'express';
import prisma from '../config/prisma';

// ─── App setup (server.listen olmadan sadece express app) ─────────────────────
import { authController } from '../controllers/auth.controller';

const app = express();
app.use(express.json());

const authRouter = Router();
authRouter.post('/register', (req, res, next) => authController.register(req, res, next));
authRouter.post('/login', (req, res, next) => authController.login(req, res, next));
app.use('/api/auth', authRouter);

// ─── Test helpers ─────────────────────────────────────────────────────────────
const TEST_PREFIX = 'jest_test_';
const testUser = {
  username: `${TEST_PREFIX}user_${Date.now()}`,
  email: `${TEST_PREFIX}${Date.now()}@testmail.com`,
  password: 'Test1234!',
  age: 25,
  gender: 'female',
  height: 165,
  weight: 60,
  target_weight: 55,
  reason_to_diet: 'Weight Loss',
  avatar_url: 'https://example.com/avatar.png',
  activity_level: 'Moderately Active',
  goal_duration_months: 6,
};

// ─── Cleanup ──────────────────────────────────────────────────────────────────
afterAll(async () => {
  // Tüm testlerde oluşturulan test_ prefix'li kayıtları temizle
  await prisma.user.deleteMany({
    where: { username: { startsWith: TEST_PREFIX } },
  });
  await prisma.$disconnect();
});

// ═════════════════════════════════════════════════════════════════════════════
// 1️⃣  UNIT TESTING — Controller katmanı izole test (DB'ye gitmez)
// ═════════════════════════════════════════════════════════════════════════════
describe('🔬 Unit Tests — AuthController', () => {

  describe('register()', () => {
    it('zorunlu alan eksikse 400 döner', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'onlyusername' }); // email, password yok
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('email eksikse 400 döner', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'u', password: 'p', age: 20, gender: 'male', height: 170, weight: 70 });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('body tamamen boşsa 400 döner', async () => {
      const res = await request(app).post('/api/auth/register').send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('login()', () => {
    it('şifre eksikse 400 döner', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('email ve username ikisi de eksikse 400 döner', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'somepassword' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('body tamamen boşsa 400 döner', async () => {
      const res = await request(app).post('/api/auth/login').send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 2️⃣  INTEGRATION TESTING — Controller + DB birlikte çalışıyor mu?
// ═════════════════════════════════════════════════════════════════════════════
describe('🔗 Integration Tests — Auth + Database', () => {

  it('register: başarılı kayıt → 201 + DB\'de kayıt oluşmuş', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    // DB'de gerçekten oluştu mu?
    const dbUser = await prisma.user.findUnique({
      where: { email: testUser.email },
      include: { profile: true },
    });
    expect(dbUser).not.toBeNull();
    expect(dbUser!.username).toBe(testUser.username);
    expect(dbUser!.profile).not.toBeNull();
  });

  it('login: kayıtlı user email + şifre ile giriş → 200 + token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(typeof res.body.token).toBe('string');
    expect(res.body.token.length).toBeGreaterThan(10);
  });

  it('login: kayıtlı user username ile giriş → 200 + token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: testUser.username, password: testUser.password });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  it('duplicate register: aynı email ile tekrar kayıt → 409', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...testUser, username: `${TEST_PREFIX}other_${Date.now()}` });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 3️⃣  SYSTEM TESTING — Uçtan uca kullanıcı akışı
// ═════════════════════════════════════════════════════════════════════════════
describe('🌐 System Tests — End-to-End Auth Flow', () => {

  it('tam akış: kayıt → giriş → token doğrulama', async () => {
    const sysUser = {
      ...testUser,
      username: `${TEST_PREFIX}sys_${Date.now()}`,
      email: `${TEST_PREFIX}sys_${Date.now()}@test.com`,
    };

    // Adım 1: Kayıt ol
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send(sysUser);
    expect(registerRes.status).toBe(201);

    // Adım 2: Giriş yap
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: sysUser.email, password: sysUser.password });
    expect(loginRes.status).toBe(200);

    // Adım 3: Token alındı ve geçerli format?
    const { token } = loginRes.body;
    expect(token).toBeDefined();
    // JWT formatı: üç noktayla ayrılmış parça
    const parts = token.split('.');
    expect(parts.length).toBe(3);
  });

  it('tam akış: hatalı şifre ile giriş → 401 ve token yok', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'WrongPassword!' });

    expect(loginRes.status).toBe(401);
    expect(loginRes.body.success).toBe(false);
    expect(loginRes.body.token).toBeUndefined();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 4️⃣  PERFORMANCE TESTING — Yük altında yanıt süresi
// ═════════════════════════════════════════════════════════════════════════════
describe('⚡ Performance Tests — Response Time & Concurrency', () => {

  it('tek login isteği 2 saniyeden kısa sürmeli', async () => {
    const start = Date.now();
    await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(2000);
    console.log(`    ⏱  Tek login süresi: ${duration}ms`);
  });

  it('10 eş zamanlı login isteği → hepsi 5 saniyede tamamlanmalı', async () => {
    const start = Date.now();

    const requests = Array.from({ length: 10 }, () =>
      request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password })
    );

    const responses = await Promise.all(requests);
    const duration = Date.now() - start;

    // Hepsi başarılı mı?
    responses.forEach((res, i) => {
      expect(res.status).toBe(200);
    });

    // Toplam süre 5 saniyenin altında mı?
    expect(duration).toBeLessThan(5000);
    console.log(`    ⏱  10 eş zamanlı login toplam: ${duration}ms (ortalama: ${Math.round(duration / 10)}ms)`);
  });

  it('10 eş zamanlı register isteği farklı kullanıcılar → 5 saniyede tamamlanmalı', async () => {
    const start = Date.now();

    const requests = Array.from({ length: 10 }, (_, i) =>
      request(app)
        .post('/api/auth/register')
        .send({
          ...testUser,
          username: `${TEST_PREFIX}perf_${Date.now()}_${i}`,
          email: `${TEST_PREFIX}perf_${Date.now()}_${i}@test.com`,
        })
    );

    const responses = await Promise.all(requests);
    const duration = Date.now() - start;

    responses.forEach(res => {
      expect([201, 409]).toContain(res.status); // 201 başarılı, 409 duplicate
    });

    expect(duration).toBeLessThan(5000);
    console.log(`    ⏱  10 eş zamanlı register toplam: ${duration}ms`);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 5️⃣  USER (ACCEPTANCE) TESTING — Gerçek kullanıcı senaryoları
// ═════════════════════════════════════════════════════════════════════════════
describe('👤 User Acceptance Tests — Real-World Scenarios', () => {

  describe('Kayıt (Register) Senaryoları', () => {
    it('Senaryo: Kullanıcı tüm bilgileri eksiksiz girer → başarıyla kayıt olur', async () => {
      const user = {
        ...testUser,
        username: `${TEST_PREFIX}acc_${Date.now()}`,
        email: `${TEST_PREFIX}acc_${Date.now()}@test.com`,
      };
      const res = await request(app).post('/api/auth/register').send(user);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('Senaryo: Kullanıcı zaten kayıtlı email ile tekrar kayıt olmaya çalışır → hata alır', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...testUser, username: `${TEST_PREFIX}dup2_${Date.now()}` });
      expect(res.status).toBe(409);
      expect(res.body.message).toContain('zaten kayıtlı');
    });

    it('Senaryo: Kullanıcı zaten kullandığı username ile kayıt olmaya çalışır → hata alır', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...testUser, email: `different_${Date.now()}@test.com` });
      expect(res.status).toBe(409);
    });

    it('Senaryo: Kullanıcı şifreyi boş bırakır → hata alır', async () => {
      const { password, ...withoutPassword } = testUser;
      const res = await request(app)
        .post('/api/auth/register')
        .send(withoutPassword);
      expect(res.status).toBe(400);
    });
  });

  describe('Giriş (Login) Senaryoları', () => {
    it('Senaryo: Doğru email + şifre ile giriş → başarılı + token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
    });

    it('Senaryo: Doğru username + şifre ile giriş → başarılı + token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: testUser.username, password: testUser.password });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
    });

    it('Senaryo: Kullanıcı yanlış şifre girer → giriş reddedilir', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'YanlisŞifre123' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.token).toBeUndefined();
    });

    it('Senaryo: Kayıtsız email ile giriş → kullanıcı bulunamadı hatası', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'kayitsiz@example.com', password: 'herhangi123' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('Senaryo: Şifre alanı boş bırakılır → hata alır', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: '' });
      expect(res.status).toBe(400);
    });
  });
});
