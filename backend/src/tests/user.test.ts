/**
 * NutriGame User Profile & Daily Targets Test Suite
 * Covers: TC-01 (Verify recommended calorie plan generation)
 */

import request from 'supertest';
import express from 'express';
import { Router } from 'express';
import prisma from '../config/prisma';

// Import actual routes and helpers
import authRoutes from '../routes/auth.routes';
import userRoutes from '../routes/user.routes';
import { calculateDailyTargets } from '../models/user.model';

const app = express();
app.use(express.json());

// Mount the routes perfectly matching the real app
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

// ─── Test Context variables ───────────────────────────────────────────────────
const TEST_PREFIX = 'jest_usertest_';
let userToken = '';
let testUserId: number;

const testUser = {
    username: `${TEST_PREFIX}user_${Date.now()}`,
    email: `${TEST_PREFIX}${Date.now()}@testmail.com`,
    password: 'TestPassword123!',
    age: 25,
    gender: 'male',
    height: 175,
    weight: 70,
    target_weight: 65,
    reason_to_diet: 'Weight Loss',
    avatar_url: 'https://example.com/avatar.png',
    activity_level: 'Lightly Active'
};

// ─── Setup & Teardown ─────────────────────────────────────────────────────────

beforeAll(async () => {
    // 1. Create a test user directly via API and get token
    await request(app).post('/api/auth/register').send(testUser);
    const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password });

    userToken = loginRes.body.token;

    // Find the exact user ID from DB for cleanup
    const dbUser = await prisma.user.findUnique({ where: { email: testUser.email } });
    if (dbUser) testUserId = Number(dbUser.id);
});

afterAll(async () => {
    if (testUserId) {
        await prisma.postComment.deleteMany({ where: { userId: testUserId } });
        await prisma.postLike.deleteMany({ where: { userId: testUserId } });
        await prisma.userFollow.deleteMany({ where: { OR: [{ followerId: testUserId }, { followingId: testUserId }] } });
        await prisma.challengeParticipant.deleteMany({ where: { userId: testUserId } });
        await prisma.userBadge.deleteMany({ where: { userId: testUserId } });
        await prisma.post.deleteMany({ where: { userId: testUserId } });
        await prisma.challenge.deleteMany({ where: { creatorId: testUserId } });
        await prisma.mealLog.deleteMany({ where: { userId: testUserId } });
        await prisma.mealTotals.deleteMany({ where: { userId: testUserId } });
        await prisma.waterLog.deleteMany({ where: { userId: testUserId } });
        await prisma.user.delete({ where: { id: testUserId } });
    }
    await prisma.badge.deleteMany({ where: { name: { startsWith: TEST_PREFIX } } });
    await prisma.$disconnect();
});

// ═════════════════════════════════════════════════════════════════════════════
// 1️⃣  UNIT TESTING — Calorie Plan Generation (TC-01)
// ═════════════════════════════════════════════════════════════════════════════
describe('🔬 Unit Tests — Calorie Plan Generation (TC-01)', () => {
    it('TC-01: calculates daily targets correctly for Male, 70kg, 175cm, 25yr, Weight Loss', () => {
        // user inputs weight (70kg), height (175cm), age (25), and goal (Weight Loss)
        const targets = calculateDailyTargets(25, 'male', 70, 175, 'Lightly Active', 'Weight Loss');

        // BMR = (10 * 70) + (6.25 * 175) - (5 * 25) + 5
        // BMR = 700 + 1093.75 - 125 + 5 = 1673.75
        // TDEE (Lightly Active 1.375) = 1673.75 * 1.375 = 2301 (rounded)
        // Weight loss = TDEE - 500 = 1801

        expect(targets.tdee).toBeGreaterThanOrEqual(1800);
        expect(targets.tdee).toBeLessThanOrEqual(1802); // allowing slight rounding differences

        // Water calculation: 70kg * 33ml = 2310ml
        expect(targets.water_ml).toBe(2310);

        // Meal split: 25% Breakfast, 35% Lunch, 30% Dinner, 10% Snack
        expect(targets.breakfast).toBe(Math.round(targets.tdee * 0.25));
        expect(targets.lunch).toBe(Math.round(targets.tdee * 0.35));
        expect(targets.dinner).toBe(Math.round(targets.tdee * 0.30));
        expect(targets.snack).toBe(Math.round(targets.tdee * 0.10));
    });

    it('calculates minimum 1200 kcal for extreme weight loss cases (Women)', () => {
        // Female, 50kg, 150cm, 50yr, Weight Loss, Sedentary
        const targets = calculateDailyTargets(50, 'female', 50, 150, 'Sedentary', 'Weight Loss');
        expect(targets.tdee).toBe(1200); // Should hit the 1200 kcal floor for women
    });

    it('calculates minimum 1500 kcal for extreme weight loss cases (Men)', () => {
        // Male, 50kg, 150cm, 50yr, Weight Loss, Sedentary
        const targets = calculateDailyTargets(50, 'male', 50, 150, 'Sedentary', 'Weight Loss');
        expect(targets.tdee).toBe(1500); // Should hit the 1500 kcal floor for men
    });

    it('calculates weight gain targets correctly (+300 kcal)', () => {
        // Male, 60kg, 180cm, 20yr, Muscle Gain, Very Active
        const targets = calculateDailyTargets(20, 'male', 60, 180, 'Very Active', 'Increasing Muscle Mass');

        // BMR = 600 + 1125 - 100 + 5 = 1630
        // TDEE = 1630 * 1.725 = 2812
        // Goal = +300 = 3112
        expect(targets.tdee).toBeGreaterThanOrEqual(3111);
        expect(targets.tdee).toBeLessThanOrEqual(3113);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 1.5️⃣  UNIT TESTING — All Matrix Combinations (Goal x Activity)
// ═════════════════════════════════════════════════════════════════════════════
describe('🔬 Unit Tests — All Combinations of Goal and Activity Level', () => {
    // 25 yr old male, 70kg, 175cm. BMR = 1673.75
    const baseAge = 25, baseGender = 'male', baseWeight = 70, baseHeight = 175;
    const expectedBaseBmr = 1673.75;

    const activityLevels = [
        { label: 'Sedentary', multiplier: 1.2 },
        { label: 'Lightly Active', multiplier: 1.375 },
        { label: 'Moderately Active', multiplier: 1.55 },
        { label: 'Very Active', multiplier: 1.725 },
        { label: 'Extra Active', multiplier: 1.9 },
    ];

    const goals = [
        { label: 'Weight Loss', adjustment: -500 },
        { label: 'Increasing Muscle Mass', adjustment: +300 },
        { label: 'Maintain Weight', adjustment: 0 },
        { label: 'Be Fit', adjustment: 0 },
        { label: 'Healthy Life', adjustment: 0 },
    ];

    const testCases: any[] = [];
    for (const a of activityLevels) {
        for (const g of goals) {
            let expectedTdee = Math.round(expectedBaseBmr * a.multiplier) + g.adjustment;
            const minCap = baseGender === 'male' ? 1500 : 1200;
            if (expectedTdee < minCap) expectedTdee = minCap; // minimum cap
            testCases.push([a.label, g.label, expectedTdee]);
        }
    }

    test.each(testCases)(
        'Activity: %s | Goal: %s -> Expected TDEE: %i kcal',
        (activityLevel, goal, expectedTdee) => {
            const targets = calculateDailyTargets(
                baseAge, baseGender, baseWeight, baseHeight, activityLevel, goal
            );

            // Allow ±1 kcal difference due to potential floating point rounding
            expect(Math.abs(targets.tdee - expectedTdee)).toBeLessThanOrEqual(1);
        }
    );
});

// ═════════════════════════════════════════════════════════════════════════════
// 2️⃣  INTEGRATION TESTING — User Profile Endpoints
// ═════════════════════════════════════════════════════════════════════════════
describe('🔗 Integration Tests — User Data Endpoints', () => {
    it('GET /api/user/profile should return user data', async () => {
        const res = await request(app)
            .get('/api/user/profile')
            .set('Authorization', `Bearer ${userToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.username).toBe(testUser.username);
        expect(res.body.data.weight).toBe(testUser.weight);
    });

    it('GET /api/user/daily_targets should return customized calorie plan based on DB profile', async () => {
        const res = await request(app)
            .get('/api/user/daily_targets')
            .set('Authorization', `Bearer ${userToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        // Dönen objenin doğru yapıya sahip olduğunu doğruluyoruz
        expect(res.body.data).toHaveProperty('tdee');
        expect(res.body.data).toHaveProperty('breakfast');
        expect(res.body.data).toHaveProperty('lunch');
        expect(res.body.data).toHaveProperty('water_ml');

        // Based on test user: 70kg, Male, 175cm, 25, default 'Moderately Active' (1.55), Weight Loss
        // BMR = 1673.75 -> TDEE = 1673.75 * 1.55 = 2594.3 -> Weight loss (-500) = 2094.3
        // With the male minimum cap at 1500, this stays at 2094.
        expect(res.body.data.tdee).toBeGreaterThanOrEqual(2093);
        expect(res.body.data.tdee).toBeLessThanOrEqual(2095);

        // Su ihtiyacı: 70kg * 33ml = 2310ml
        expect(res.body.data.water_ml).toBe(2310);
    });

    it('PATCH /api/user/profile should update user profile and return new targets', async () => {
        const res = await request(app)
            .patch('/api/user/profile')
            .set('Authorization', `Bearer ${userToken}`)
            .send({ weight: 75, reason_to_diet: 'Maintain Weight' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        // Fetch profile to verify updates
        const getRes = await request(app)
            .get('/api/user/profile')
            .set('Authorization', `Bearer ${userToken}`);
        expect(getRes.body.data.weight).toBe(75);
        expect(getRes.body.data.reason_to_diet).toBe('Maintain Weight');

        // Now daily targets should have changed
        const resTargets = await request(app)
            .get('/api/user/daily_targets')
            .set('Authorization', `Bearer ${userToken}`);

        // New BMR for 75kg, 175cm, 25, Male = 1723.75
        // TDEE = 1723.75 * 1.55 ('Moderately Active') = 2672. Maintain weight means no -500 reduction.
        expect(resTargets.body.data.tdee).toBeGreaterThanOrEqual(2670);
        expect(resTargets.body.data.tdee).toBeLessThanOrEqual(2673);
        expect(resTargets.body.data.water_ml).toBe(75 * 33); // 2475
    });

    it('TC-07: Verify user profile storage (FR-07) - Dietary Preference & Avatar', async () => {
        // Edit profile to change Dietary Preference to "Weight Loss" and save a new avatar.
        const res = await request(app)
            .patch('/api/user/profile')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                reason_to_diet: 'Weight Loss',
                avatar_url: '../assets/avatars/av3.png'
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        // Profile page reflects "Weight Loss" preference and avatar is displayed.
        const getRes = await request(app)
            .get('/api/user/profile')
            .set('Authorization', `Bearer ${userToken}`);

        expect(getRes.body.data.reason_to_diet).toBe('Weight Loss');
        expect(getRes.body.data.avatar_url).toBe('../assets/avatars/av3.png');
    });
});

it('DELETE /api/user/profile should completely delete the user account and associated data', async () => {
    const createdBadge = await prisma.badge.create({
        data: {
            name: `${TEST_PREFIX}badge_${Date.now()}`,
            description: 'Temporary test badge',
            iconName: 'trophy',
        },
    });

    const createdChallenge = await prisma.challenge.create({
        data: {
            title: `${TEST_PREFIX}challenge_${Date.now()}`,
            type: 'steps',
            startDate: new Date(),
            endDate: new Date(Date.now() + 86_400_000),
            status: 'active',
            creatorId: testUserId,
            description: 'Temporary test challenge',
            goalValue: 5000,
        },
    });

    const ownPost = await prisma.post.create({
        data: {
            userId: testUserId,
            caption: 'Temporary test post',
        },
    });

    const likedPost = await prisma.post.create({
        data: {
            userId: 987654321,
            caption: 'External post for delete-account test',
        },
    });

    await prisma.$transaction([
        prisma.mealLog.create({
            data: {
                userId: testUserId,
                date: new Date(),
                meal_category: 'Breakfast',
                p_count: 1,
                food_id: 1,
                food_name: 'Test Food',
                p_unit: 'portion',
                t_amount: 1,
                t_calorie: 100,
                t_protein: 10,
                t_fat: 5,
                t_carb: 10,
            },
        }),
        prisma.mealTotals.create({
            data: {
                userId: testUserId,
                date: new Date(),
                meal_category: 'Breakfast',
                t_calorie: 100,
                t_protein: 10,
                t_fat: 5,
                t_carb: 10,
            },
        }),
        prisma.waterLog.create({
            data: {
                userId: testUserId,
                date: new Date(),
                amount: 250,
                portion_name: 'Glass',
            },
        }),
        prisma.userFollow.create({
            data: {
                followerId: testUserId,
                followingId: 987654321,
            },
        }),
        prisma.userFollow.create({
            data: {
                followerId: 987654320,
                followingId: testUserId,
            },
        }),
        prisma.challengeParticipant.create({
            data: {
                challengeId: createdChallenge.id,
                userId: testUserId,
                role: 'creator',
                status: 'active',
            },
        }),
        prisma.userBadge.create({
            data: {
                userId: testUserId,
                badgeId: createdBadge.id,
            },
        }),
        prisma.postLike.create({
            data: {
                postId: ownPost.id,
                userId: 987654319,
            },
        }),
        prisma.postComment.create({
            data: {
                postId: ownPost.id,
                userId: 987654318,
                text: 'Temporary comment on own post',
            },
        }),
        prisma.postLike.create({
            data: {
                postId: likedPost.id,
                userId: testUserId,
            },
        }),
        prisma.postComment.create({
            data: {
                postId: likedPost.id,
                userId: testUserId,
                text: 'Temporary comment by test user',
            },
        }),
    ]);

    const deleteRes = await request(app)
        .delete('/api/user/profile')
        .set('Authorization', `Bearer ${userToken}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);
    expect(deleteRes.body.message).toBe('User is deleted successfully.');

    // 2. Silinen hesaba tekrar erişmeye çalış (404 veya 401 dönmeli)
    const getRes = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${userToken}`);

    expect([401, 404]).toContain(getRes.status);
    expect(getRes.body.success).toBe(false);

    // 3. Veritabanını doğrudan kontrol et (Gerçekten silinmiş mi?)
    const dbUserAfterDelete = await prisma.user.findUnique({
        where: { id: testUserId }
    });

    expect(dbUserAfterDelete).toBeNull(); // Veritabanında artık böyle bir ID olmamalı

    // (Opsiyonel ama önerilen) - İlişkili tabloların da (Cascade) silindiğinden emin ol
    const userMealLogs = await prisma.mealLog.findMany({ where: { userId: testUserId } });
    expect(userMealLogs.length).toBe(0);

    const userMealTotals = await prisma.mealTotals.findMany({ where: { userId: testUserId } });
    expect(userMealTotals.length).toBe(0);

    const userWaterLogs = await prisma.waterLog.findMany({ where: { userId: testUserId } });
    expect(userWaterLogs.length).toBe(0);

    const userFollows = await prisma.userFollow.findMany({
        where: {
            OR: [{ followerId: testUserId }, { followingId: testUserId }],
        },
    });
    expect(userFollows.length).toBe(0);

    const userParticipants = await prisma.challengeParticipant.findMany({ where: { userId: testUserId } });
    expect(userParticipants.length).toBe(0);

    const userBadges = await prisma.userBadge.findMany({ where: { userId: testUserId } });
    expect(userBadges.length).toBe(0);

    const userPosts = await prisma.post.findMany({ where: { userId: testUserId } });
    expect(userPosts.length).toBe(0);

    const userChallenges = await prisma.challenge.findMany({ where: { creatorId: testUserId } });
    expect(userChallenges.length).toBe(0);

    const userLikes = await prisma.postLike.findMany({ where: { userId: testUserId } });
    expect(userLikes.length).toBe(0);

    const userComments = await prisma.postComment.findMany({ where: { userId: testUserId } });
    expect(userComments.length).toBe(0);

    const likesOnOwnPost = await prisma.postLike.findMany({ where: { postId: ownPost.id } });
    expect(likesOnOwnPost.length).toBe(0);

    const commentsOnOwnPost = await prisma.postComment.findMany({ where: { postId: ownPost.id } });
    expect(commentsOnOwnPost.length).toBe(0);

    // afterAll kancasının hata vermemesi için testUserId'yi sıfırlıyoruz
    testUserId = 0;

});
