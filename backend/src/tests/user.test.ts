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
        // Delete logs and totals first (foreign keys)
        await prisma.mealLog.deleteMany({ where: { userId: testUserId } });
        await prisma.mealTotals.deleteMany({ where: { userId: testUserId } });
        await prisma.waterLog.deleteMany({ where: { userId: testUserId } });
        await prisma.user.delete({ where: { id: testUserId } });
    }
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
