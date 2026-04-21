/**
 * NutriGame User Search Test Suite
 * Covers: Unit | Integration | System | Performance Testing
 * FR-09: Kullanıcı arama, takip etme ve challenge için kullanıcı bulma
 */

import request from 'supertest';
import express from 'express';
import prisma from '../config/prisma';
import authRoutes from '../routes/auth.routes';
import userRoutes from '../routes/user.routes';
import socialRoutes from '../routes/social.routes';
import { performance } from 'perf_hooks';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/social', socialRoutes);

const TEST_PREFIX = 'search_test_';
const uniqueSuffix = Date.now().toString(36);

const userA = {
    username: `${TEST_PREFIX}alice_${uniqueSuffix}`,
    email: `${TEST_PREFIX}alice${uniqueSuffix}@test.com`,
    password: 'Password123!',
    age: 25, gender: 'female', weight: 60, height: 165,
    target_weight: 58, reason_to_diet: 'Healthy Eating',
    avatar_url: 'https://example.com/alice.png',
};

const userB = {
    username: `${TEST_PREFIX}bob_${uniqueSuffix}`,
    email: `${TEST_PREFIX}bob${uniqueSuffix}@test.com`,
    password: 'Password123!',
    age: 30, gender: 'male', weight: 80, height: 180,
    target_weight: 75, reason_to_diet: 'Weight Loss',
    avatar_url: 'https://example.com/bob.png',
};

let tokenA: string;
let tokenB: string;
let userIdA: number;
let userIdB: number;

// ─── Setup & Teardown ─────────────────────────────────────────────────────────

beforeAll(async () => {
    await request(app).post('/api/auth/register').send(userA);
    await request(app).post('/api/auth/register').send(userB);

    const loginA = await request(app).post('/api/auth/login').send({ email: userA.email, password: userA.password });
    const loginB = await request(app).post('/api/auth/login').send({ email: userB.email, password: userB.password });

    tokenA = loginA.body.token;
    tokenB = loginB.body.token;

    const dbA = await prisma.user.findUnique({ where: { email: userA.email } });
    const dbB = await prisma.user.findUnique({ where: { email: userB.email } });
    if (dbA) userIdA = dbA.id;
    if (dbB) userIdB = dbB.id;
});

afterAll(async () => {
    try {
        if (userIdA) {
            await prisma.userFollow.deleteMany({ where: { OR: [{ followerId: userIdA }, { followingId: userIdA }] } });
            await prisma.user.delete({ where: { id: userIdA } });
        }
        if (userIdB) {
            await prisma.userFollow.deleteMany({ where: { OR: [{ followerId: userIdB }, { followingId: userIdB }] } });
            await prisma.user.delete({ where: { id: userIdB } });
        }
    } catch (e) {
        // Cleanup hatası test sonuçlarını etkilemesin
    }
});

// ═════════════════════════════════════════════════════════════════════════════
// 1️⃣  UNIT TESTING — Validation
// ═════════════════════════════════════════════════════════════════════════════
describe('🔬 Unit Tests — User Search Validation', () => {

    it('TC-09.1: query param eksik → 400', async () => {
        const res = await request(app)
            .get('/api/user/search')
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('TC-09.2: Boş string query → 400', async () => {
        const res = await request(app)
            .get('/api/user/search?query=')
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('TC-09.3: Token olmadan istek → 401', async () => {
        const res = await request(app)
            .get('/api/user/search?query=test');

        expect(res.status).toBe(401);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 2️⃣  INTEGRATION TESTING — Arama Sonuçları
// ═════════════════════════════════════════════════════════════════════════════
describe('🔗 Integration Tests — User Search Results', () => {

    it('TC-09.4: Prefix ile arama → kayıtlı kullanıcı döner', async () => {
        const res = await request(app)
            .get(`/api/user/search?query=${TEST_PREFIX}bob`)
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);

        const found = res.body.data.find((u: any) => u.username === userB.username);
        expect(found).toBeDefined();
        expect(found.id).toBeDefined();
        expect(found).toHaveProperty('isFollowing');
        expect(found).toHaveProperty('username');
    });

    it('TC-09.5: Arama sonuçları kendi hesabını içermez', async () => {
        const res = await request(app)
            .get(`/api/user/search?query=${TEST_PREFIX}`)
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.status).toBe(200);
        const self = res.body.data.find((u: any) => u.username === userA.username);
        expect(self).toBeUndefined();
    });

    it('TC-09.6: Olmayan kullanıcı için arama → boş dizi döner', async () => {
        const res = await request(app)
            .get('/api/user/search?query=xzy_nonexistent_zzz_9999')
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveLength(0);
    });

    it('TC-09.7: Case-insensitive arama çalışıyor', async () => {
        const upperQuery = userB.username.slice(0, 8).toUpperCase();
        const res = await request(app)
            .get(`/api/user/search?query=${upperQuery}`)
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.status).toBe(200);
        const found = res.body.data.find((u: any) => u.username === userB.username);
        expect(found).toBeDefined();
    });

    it('TC-09.8: isFollowing başlangıçta false döner', async () => {
        const res = await request(app)
            .get(`/api/user/search?query=${userB.username}`)
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.status).toBe(200);
        const found = res.body.data.find((u: any) => u.username === userB.username);
        expect(found).toBeDefined();
        expect(found.isFollowing).toBe(false);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 3️⃣  SYSTEM TESTING — E2E: Ara → Takip Et → Tekrar Ara
// ═════════════════════════════════════════════════════════════════════════════
describe('🌐 System Tests — E2E Search & Follow Flow (FR-09)', () => {

    it('Step 1: User A, User B\'yi arar ve bulur', async () => {
        const res = await request(app)
            .get(`/api/user/search?query=${userB.username}`)
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.status).toBe(200);
        const found = res.body.data.find((u: any) => u.username === userB.username);
        expect(found).toBeDefined();
        expect(found.isFollowing).toBe(false);
    });

    it('Step 2: User A, User B\'yi takip eder', async () => {
        const res = await request(app)
            .post(`/api/social/follow/${userIdB}`)
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('Step 3: Takip sonrası arama → isFollowing: true döner', async () => {
        const res = await request(app)
            .get(`/api/user/search?query=${userB.username}`)
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.status).toBe(200);
        const found = res.body.data.find((u: any) => u.username === userB.username);
        expect(found).toBeDefined();
        expect(found.isFollowing).toBe(true);
    });

    it('Step 4: Takipten çık → isFollowing: false döner', async () => {
        await request(app)
            .delete(`/api/social/follow/${userIdB}`)
            .set('Authorization', `Bearer ${tokenA}`);

        const res = await request(app)
            .get(`/api/user/search?query=${userB.username}`)
            .set('Authorization', `Bearer ${tokenA}`);

        const found = res.body.data.find((u: any) => u.username === userB.username);
        expect(found).toBeDefined();
        expect(found.isFollowing).toBe(false);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 4️⃣  PERFORMANCE TESTING
// ═════════════════════════════════════════════════════════════════════════════
describe('⚡ Performance Tests — Search API Latency', () => {

    it('Tek arama isteği 1 saniyeden kısa sürmeli', async () => {
        const start = performance.now();
        const res = await request(app)
            .get(`/api/user/search?query=${TEST_PREFIX}`)
            .set('Authorization', `Bearer ${tokenA}`);
        const elapsed = performance.now() - start;

        expect(res.status).toBe(200);
        expect(elapsed).toBeLessThan(1000);
        console.log(`    ⏱  User search: ${elapsed.toFixed(2)}ms`);
    });

    it('5 eş zamanlı arama isteği 3 saniyede tamamlanmalı', async () => {
        const start = performance.now();
        const requests = Array.from({ length: 5 }, () =>
            request(app)
                .get(`/api/user/search?query=${TEST_PREFIX}`)
                .set('Authorization', `Bearer ${tokenA}`)
        );
        const responses = await Promise.all(requests);
        const elapsed = performance.now() - start;

        responses.forEach(res => expect(res.status).toBe(200));
        expect(elapsed).toBeLessThan(3000);
        console.log(`    ⏱  5 eş zamanlı search: ${elapsed.toFixed(2)}ms`);
    });
});
