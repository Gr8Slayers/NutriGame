/**
 * NutriGame Challenge Test Suite
 * Covers: Unit | Integration | System | Performance | User (Acceptance) Testing
 * FR-14: Challenge oluşturma, kabul/red, progress takibi, ödül alma
 */

import request from 'supertest';
import express from 'express';
import prisma from '../config/prisma';
import authRoutes from '../routes/auth.routes';
import gamificationRoutes from '../routes/gamification.routes';
import { performance } from 'perf_hooks';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/gamification', gamificationRoutes);

const TEST_PREFIX = 'chall_test_';
const uniqueSuffix = Date.now();

const userA = {
    username: `${TEST_PREFIX}creator_${uniqueSuffix}`,
    email: `${TEST_PREFIX}creator${uniqueSuffix}@test.com`,
    password: 'Password123!',
    age: 25, gender: 'male', weight: 75, height: 180,
    target_weight: 70, reason_to_diet: 'Weight Loss',
    avatar_url: 'https://example.com/a.png',
};

const userB = {
    username: `${TEST_PREFIX}invitee_${uniqueSuffix}`,
    email: `${TEST_PREFIX}invitee${uniqueSuffix}@test.com`,
    password: 'Password123!',
    age: 28, gender: 'female', weight: 60, height: 165,
    target_weight: 58, reason_to_diet: 'Healthy Eating',
    avatar_url: 'https://example.com/b.png',
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
    if (userIdA) {
        await prisma.challengeParticipant.deleteMany({ where: { userId: userIdA } });
        await prisma.streak.deleteMany({ where: { userId: userIdA } });
    }
    if (userIdB) {
        await prisma.challengeParticipant.deleteMany({ where: { userId: userIdB } });
        await prisma.streak.deleteMany({ where: { userId: userIdB } });
    }
    await prisma.challenge.deleteMany({ where: { creatorId: userIdA } });
    if (userIdA) await prisma.user.delete({ where: { id: userIdA } });
    if (userIdB) await prisma.user.delete({ where: { id: userIdB } });
    await prisma.$disconnect();
});

// ═════════════════════════════════════════════════════════════════════════════
// 1️⃣  UNIT TESTING — Validation
// ═════════════════════════════════════════════════════════════════════════════
describe('🔬 Unit Tests — Challenge Validation', () => {

    it('TC-14.1: Eksik alan (title yok) → 400', async () => {
        const res = await request(app)
            .post('/api/gamification/challenge/create')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ type: 'water', targetUserId: 999, endDate: '2026-12-31' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('TC-14.2: Geçersiz type → 400', async () => {
        const res = await request(app)
            .post('/api/gamification/challenge/create')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ title: 'Test', type: 'invalid_type', targetUserId: 999, endDate: '2026-12-31' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('TC-14.3: Kendine challenge atmak → 400', async () => {
        const res = await request(app)
            .post('/api/gamification/challenge/create')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ title: 'Self challenge', type: 'water', targetUserId: userIdA, endDate: '2026-12-31' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('TC-14.4: Token olmadan istek → 401', async () => {
        const res = await request(app)
            .post('/api/gamification/challenge/create')
            .send({ title: 'No auth', type: 'water', targetUserId: 999, endDate: '2026-12-31' });

        expect(res.status).toBe(401);
    });

    it('TC-14.5: Geçersiz endDate formatı → 400', async () => {
        const res = await request(app)
            .post('/api/gamification/challenge/create')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ title: 'Bad Date', type: 'sugar', targetUserId: userIdB, endDate: 'not-a-date' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 2️⃣  INTEGRATION TESTING — Challenge CRUD
// ═════════════════════════════════════════════════════════════════════════════
describe('🔗 Integration Tests — Challenge CRUD', () => {
    let createdChallengeId: string;

    it('TC-14.6: Challenge başarıyla oluşturulur → 201', async () => {
        const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const res = await request(app)
            .post('/api/gamification/challenge/create')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ title: 'Water Challenge', type: 'water', targetUserId: userIdB, endDate });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.title).toBe('Water Challenge');
        expect(res.body.data.type).toBe('water');
        expect(res.body.data.participants.length).toBe(2);
        createdChallengeId = String(res.body.data.id);
    });

    it('TC-14.7: Creator GET /challenges → active listede görünür', async () => {
        const res = await request(app)
            .get('/api/gamification/challenges')
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.activeChallenges.length).toBeGreaterThanOrEqual(1);
    });

    it('TC-14.8: Invitee GET /challenges → invites listesinde görünür', async () => {
        const res = await request(app)
            .get('/api/gamification/challenges')
            .set('Authorization', `Bearer ${tokenB}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.invites.length).toBeGreaterThanOrEqual(1);

        const invite = res.body.data.invites.find((i: any) => i.id === createdChallengeId);
        expect(invite).toBeDefined();
        expect(invite.type).toBe('water');
    });

    it('TC-14.9: Challenge progress endpoint çalışıyor', async () => {
        const res = await request(app)
            .get(`/api/gamification/challenge/progress?challengeId=${createdChallengeId}`)
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('progress');
        expect(res.body.data).toHaveProperty('durationDays');
        expect(res.body.data.progress).toBeGreaterThanOrEqual(0);
        expect(res.body.data.progress).toBeLessThanOrEqual(100);
    });

    it('TC-14.10: Katılımcı olmayan GET progress → 403', async () => {
        // userC yok, ama başka challenge ID ile test ediyoruz
        const fakeId = 9999999;
        const res = await request(app)
            .get(`/api/gamification/challenge/progress?challengeId=${fakeId}`)
            .set('Authorization', `Bearer ${tokenA}`);

        expect([403, 404]).toContain(res.status);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 3️⃣  SYSTEM TESTING — E2E Challenge Akışı
// ═════════════════════════════════════════════════════════════════════════════
describe('🌐 System Tests — E2E Challenge Flow (FR-14)', () => {
    let e2eChallengeId: string;

    it('Step 1: User A, User B\'ye challenge atar', async () => {
        const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const res = await request(app)
            .post('/api/gamification/challenge/create')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ title: 'E2E Calorie Challenge', type: 'calorie', targetUserId: userIdB, endDate });

        expect(res.status).toBe(201);
        e2eChallengeId = String(res.body.data.id);
    });

    it('Step 2: User B gelen davet listesinde challenge\'ı görür', async () => {
        const res = await request(app)
            .get('/api/gamification/challenges')
            .set('Authorization', `Bearer ${tokenB}`);

        const invite = res.body.data.invites.find((i: any) => i.id === e2eChallengeId);
        expect(invite).toBeDefined();
        expect(invite.title).toBe('E2E Calorie Challenge');
    });

    it('Step 3: User B challenge\'ı kabul eder → status active olur', async () => {
        const res = await request(app)
            .post('/api/gamification/challenge/respond')
            .set('Authorization', `Bearer ${tokenB}`)
            .send({ challengeId: e2eChallengeId, accept: true });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        const participant = res.body.data.participants.find((p: any) => p.userId === userIdB);
        expect(participant.status).toBe('accepted');
        expect(res.body.data.status).toBe('active');
    });

    it('Step 4: Her iki kullanıcı da active listede challenge\'ı görür', async () => {
        const [resA, resB] = await Promise.all([
            request(app).get('/api/gamification/challenges').set('Authorization', `Bearer ${tokenA}`),
            request(app).get('/api/gamification/challenges').set('Authorization', `Bearer ${tokenB}`),
        ]);

        const challengeA = resA.body.data.activeChallenges.find((c: any) => c.id === e2eChallengeId);
        const challengeB = resB.body.data.activeChallenges.find((c: any) => c.id === e2eChallengeId);

        expect(challengeA).toBeDefined();
        expect(challengeB).toBeDefined();
    });

    it('Step 5: Progress 100 olmadan ödül alma → 400', async () => {
        const res = await request(app)
            .post('/api/gamification/challenge/complete')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ challengeId: e2eChallengeId });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('progress');
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 4️⃣  SYSTEM TEST — Challenge Reddetme Akışı
// ═════════════════════════════════════════════════════════════════════════════
describe('🌐 System Tests — Challenge Decline Flow', () => {
    let declineChallengeId: string;

    it('User A yeni bir challenge atar', async () => {
        const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const res = await request(app)
            .post('/api/gamification/challenge/create')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ title: 'Decline Test', type: 'sugar', targetUserId: userIdB, endDate });

        expect(res.status).toBe(201);
        declineChallengeId = String(res.body.data.id);
    });

    it('User B challenge\'ı reddeder', async () => {
        const res = await request(app)
            .post('/api/gamification/challenge/respond')
            .set('Authorization', `Bearer ${tokenB}`)
            .send({ challengeId: declineChallengeId, accept: false });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        const participant = res.body.data.participants.find((p: any) => p.userId === userIdB);
        expect(participant.status).toBe('declined');
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 5️⃣  PERFORMANCE TESTING
// ═════════════════════════════════════════════════════════════════════════════
describe('⚡ Performance Tests — Challenge API Latency', () => {

    it('POST /challenge/create 1 saniyeden kısa sürmeli', async () => {
        const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const start = performance.now();
        const res = await request(app)
            .post('/api/gamification/challenge/create')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ title: 'Perf Test Challenge', type: 'step', targetUserId: userIdB, endDate });
        const elapsed = performance.now() - start;

        expect(res.status).toBe(201);
        expect(elapsed).toBeLessThan(1000);
        console.log(`    ⏱  Challenge create: ${elapsed.toFixed(2)}ms`);
    });

    it('GET /challenges 2 saniyeden kısa sürmeli', async () => {
        const start = performance.now();
        const res = await request(app)
            .get('/api/gamification/challenges')
            .set('Authorization', `Bearer ${tokenA}`);
        const elapsed = performance.now() - start;

        expect(res.status).toBe(200);
        expect(elapsed).toBeLessThan(2000);
        console.log(`    ⏱  Get challenges: ${elapsed.toFixed(2)}ms`);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 6️⃣  USER ACCEPTANCE TESTING — Gerçek Kullanıcı Senaryoları
// ═════════════════════════════════════════════════════════════════════════════
describe('👤 User Acceptance Tests — Challenge Scenarios', () => {

    it('Senaryo: Kullanıcı tüm geçerli type\'ları kullanarak challenge oluşturabilir', async () => {
        const validTypes = ['calorie', 'water', 'sugar', 'step'];
        const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        for (const type of validTypes) {
            const res = await request(app)
                .post('/api/gamification/challenge/create')
                .set('Authorization', `Bearer ${tokenA}`)
                .send({ title: `${type} challenge`, type, targetUserId: userIdB, endDate });

            expect(res.status).toBe(201);
            expect(res.body.data.type).toBe(type);
        }
    });

    it('Senaryo: Challenge progress 0-100 aralığında döner', async () => {
        const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const createRes = await request(app)
            .post('/api/gamification/challenge/create')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ title: 'Progress Range Test', type: 'calorie', targetUserId: userIdB, endDate });

        const cId = String(createRes.body.data.id);
        const progressRes = await request(app)
            .get(`/api/gamification/challenge/progress?challengeId=${cId}`)
            .set('Authorization', `Bearer ${tokenA}`);

        expect(progressRes.status).toBe(200);
        const { progress } = progressRes.body.data;
        expect(progress).toBeGreaterThanOrEqual(0);
        expect(progress).toBeLessThanOrEqual(100);
    });
});
