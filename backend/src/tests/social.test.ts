import request from 'supertest';
import express from 'express';
import prisma from '../config/prisma';
import authRoutes from '../routes/auth.routes';
import socialRoutes from '../routes/social.routes';
import { performance } from 'perf_hooks';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/social', socialRoutes);

const TEST_PREFIX = 'social_test_';
const uniqueSuffix = Date.now();

const userA = {
    username: `${TEST_PREFIX}alice_${uniqueSuffix}`,
    email: `${TEST_PREFIX}alice${uniqueSuffix}@test.com`,
    password: 'Password123!',
    age: 25,
    gender: 'female',
    weight: 60,
    height: 165,
    target_weight: 58,
    reason_to_diet: 'Healthy Eating',
    avatar_url: 'https://example.com/alice.png'
};

const userB = {
    username: `${TEST_PREFIX}bob_${uniqueSuffix}`,
    email: `${TEST_PREFIX}bob${uniqueSuffix}@test.com`,
    password: 'Password123!',
    age: 30,
    gender: 'male',
    weight: 80,
    height: 180,
    target_weight: 75,
    reason_to_diet: 'Weight Loss',
    avatar_url: 'https://example.com/bob.png'
};

let tokenA: string;
let tokenB: string;
let userIdA: number;
let userIdB: number;

beforeAll(async () => {
    // 1. Create Users
    await request(app).post('/api/auth/register').send(userA);
    await request(app).post('/api/auth/register').send(userB);

    // 2. Login and get tokens
    const loginA = await request(app).post('/api/auth/login').send({ email: userA.email, password: userA.password });
    const loginB = await request(app).post('/api/auth/login').send({ email: userB.email, password: userB.password });

    tokenA = loginA.body.token;
    tokenB = loginB.body.token;

    const dbUserA = await prisma.user.findUnique({ where: { email: userA.email } });
    const dbUserB = await prisma.user.findUnique({ where: { email: userB.email } });

    if (dbUserA) userIdA = dbUserA.id;
    if (dbUserB) userIdB = dbUserB.id;
});

afterAll(async () => {
    // Cleanup followers, likes, comments, posts, and finally users
    if (userIdA) {
        await prisma.userFollow.deleteMany({ where: { OR: [{ followerId: userIdA }, { followingId: userIdA }] } });
        await prisma.postLike.deleteMany({ where: { userId: userIdA } });
        await prisma.postComment.deleteMany({ where: { userId: userIdA } });
        await prisma.post.deleteMany({ where: { userId: userIdA } });
    }
    if (userIdB) {
        await prisma.userFollow.deleteMany({ where: { OR: [{ followerId: userIdB }, { followingId: userIdB }] } });
        await prisma.postLike.deleteMany({ where: { userId: userIdB } });
        await prisma.postComment.deleteMany({ where: { userId: userIdB } });
        await prisma.post.deleteMany({ where: { userId: userIdB } });
    }

    if (userIdA) await prisma.user.delete({ where: { id: userIdA } });
    if (userIdB) await prisma.user.delete({ where: { id: userIdB } });

    await prisma.$disconnect();
});

// ═════════════════════════════════════════════════════════════════════════════
// 1️⃣  UNIT & INTEGRATION TESTING — Social Validations
// ═════════════════════════════════════════════════════════════════════════════
describe('🔗 Integration Tests — Social Validations', () => {

    it('TC-INT-1: returns 400 when recipe details are missing for a recipe post', async () => {
        const res = await request(app)
            .post('/api/social/create_post')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({
                isRecipe: true,
                caption: 'Missing details',
                recipeDetails: { title: 'incomplete' } // missing ingredients, instructions, calories
            });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('TC-INT-2: returns 400 for empty comment text', async () => {
        const res = await request(app)
            .post('/api/social/comment/999999') // Dummy postId
            .set('Authorization', `Bearer ${tokenB}`)
            .send({ text: '  ' });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('boş olamaz');
    });

    it('TC-INT-3: returns 400 when user tries to follow themselves', async () => {
        const res = await request(app)
            .post(`/api/social/follow/${userIdA}`)
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('Kendinizi takip edemezsiniz');
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 2️⃣  SYSTEM TESTING — End-to-End Social Flow (FR-10, FR-11)
// ═════════════════════════════════════════════════════════════════════════════
describe('🌐 System Tests — E2E Social & Recipe Flow', () => {
    let sharedPostId: number;

    it('Step 1: User A shares a recipe (FR-11)', async () => {
        const res = await request(app)
            .post('/api/social/create_post')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({
                caption: 'Check out my healthy salad!',
                isRecipe: true,
                recipeDetails: {
                    title: 'Super Green Salad',
                    ingredients: 'Kale, Spinach, Avocado, Lemon',
                    instructions: 'Mix everything in a bowl and serve.',
                    calories: 250,
                    preparationTime: 10
                }
            });

        expect(res.status).toBe(201);
        expect(res.body.data.id).toBeDefined();
        sharedPostId = res.body.data.id;
    });

    it('Step 2: User B fetches feed and sees User A\'s post (FR-11)', async () => {
        const res = await request(app)
            .get('/api/social/get_feed')
            .set('Authorization', `Bearer ${tokenB}`);

        expect(res.status).toBe(200);
        const post = res.body.find((p: any) => Number(p.id) === sharedPostId);
        expect(post).toBeDefined();
        expect(post.username).toBe(userA.username);
        expect(post.isRecipe).toBe(true);
        expect(post.recipeDetails.title).toBe('Super Green Salad');
    });

    it('Step 3: User B follows User A', async () => {
        const res = await request(app)
            .post(`/api/social/follow/${userIdA}`)
            .set('Authorization', `Bearer ${tokenB}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('Step 4: User B likes User A\'s post', async () => {
        const res = await request(app)
            .post(`/api/social/like/${sharedPostId}`)
            .set('Authorization', `Bearer ${tokenB}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('Step 5: User B comments on User A\'s post (FR-10)', async () => {
        const commentText = 'This looks delicious! Thanks for sharing.';
        const res = await request(app)
            .post(`/api/social/comment/${sharedPostId}`)
            .set('Authorization', `Bearer ${tokenB}`)
            .send({ text: commentText });

        expect(res.status).toBe(201);
        expect(res.body.data.text).toBe(commentText);
    });

    it('Step 6: Verify comments list for the post (FR-10)', async () => {
        const res = await request(app)
            .get(`/api/social/comments/${sharedPostId}`)
            .set('Authorization', `Bearer ${tokenB}`);

        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeGreaterThanOrEqual(1);
        // DB column in comments might be number or string depending on model/driver
        const comment = res.body.data.find((c: any) => String(c.userId) === String(userIdB));
        expect(comment).toBeDefined();
        expect(comment.username).toBe(userB.username);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 3️⃣  PERFORMANCE TESTING — API Latency
// ═════════════════════════════════════════════════════════════════════════════
describe('⚡ Performance Tests — Social API Latency', () => {
    const MAX_LATENCY_MS = 1000;

    it('GET /api/social/get_feed responds under 1s', async () => {
        const start = performance.now();
        const res = await request(app)
            .get('/api/social/get_feed')
            .set('Authorization', `Bearer ${tokenB}`);
        const end = performance.now();

        expect(res.status).toBe(200);
        expect(end - start).toBeLessThan(MAX_LATENCY_MS);
        console.log(`Feed Latency: ${(end - start).toFixed(2)}ms`);
    });

    it('POST /api/social/create_post responds under 1s', async () => {
        const start = performance.now();
        const res = await request(app)
            .post('/api/social/create_post')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ caption: 'Latency test' });
        const end = performance.now();

        expect(res.status).toBe(201);
        expect(end - start).toBeLessThan(MAX_LATENCY_MS);
        console.log(`Post Creation Latency: ${(end - start).toFixed(2)}ms`);
    });
});