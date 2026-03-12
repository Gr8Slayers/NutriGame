/**
 * NutriGame Food & Meal Logging Test Suite
 * Covers: Unit | Integration | System Testing for Manual Log Entry
 */

import request from 'supertest';
import express from 'express';
import prisma from '../config/prisma';

// Import actual routes
import authRoutes from '../routes/auth.routes';
import foodRoutes from '../routes/food.routes';

const app = express();
app.use(express.json());

// Mount the routes perfectly matching the real app
app.use('/api/auth', authRoutes);
app.use('/api/food', foodRoutes);

// ─── Test Context variables ───────────────────────────────────────────────────
const TEST_PREFIX = 'jest_foodtest_';
let userToken = '';
let testUserId: number;

const uniqueSuffix = Date.now();
const testUser = {
    username: `${TEST_PREFIX}user_${uniqueSuffix}`,
    email: `${TEST_PREFIX}${uniqueSuffix}@testmail.com`,
    password: 'TestPassword123!',
    age: 30,
    gender: 'male',
    height: 180,
    weight: 75,
    target_weight: 70,
    reason_to_diet: 'Weight Loss',
    avatar_url: 'https://example.com/avatar.png',
};

const testFood = {
    food_id: 999999 + Math.floor(Math.random() * 1000), // Ensure unique
    food_name: `${TEST_PREFIX}Apple`,
    p_unit: 'piece',
    p_amount: 1,
    p_calorie: 95,
    p_protein: 0.5,
    p_fat: 0.3,
    p_carb: 25.1,
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

    // 2. Create a test food item in the FoodLookup table
    await prisma.foodLookup.create({
        data: testFood,
    });
});

afterAll(async () => {
    if (testUserId) {
        // Delete logs and totals
        await prisma.mealLog.deleteMany({ where: { userId: testUserId } });
        await prisma.mealTotals.deleteMany({ where: { userId: testUserId } });
        await prisma.waterLog.deleteMany({ where: { userId: testUserId } });
        await prisma.user.delete({ where: { id: testUserId } });
    }

    // Delete the test food
    await prisma.foodLookup.delete({ where: { food_id: testFood.food_id } });

    await prisma.$disconnect();
});

// ═════════════════════════════════════════════════════════════════════════════
// 1️⃣  UNIT & INTEGRATION TESTING — Food Controller & Validation
// ═════════════════════════════════════════════════════════════════════════════
describe('🔗 Integration Tests — Manual Meal Logging', () => {

    describe('GET /api/food/search_food', () => {
        it('returns 400 if food_name is missing', async () => {
            const res = await request(app)
                .get('/api/food/search_food')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('finds the test food by exact name or substring', async () => {
            const res = await request(app)
                .get(`/api/food/search_food?food_name=${testFood.food_name}`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.length).toBeGreaterThanOrEqual(1);
            expect(res.body.data[0].food_name).toBe(testFood.food_name);
        });

        it('returns 404 if food is not found', async () => {
            const res = await request(app)
                .get(`/api/food/search_food?food_name=NonExistentFoodRandom123`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
        });
    });

    describe('POST /api/food/add_to_meal', () => {
        it('returns 400 if required fields are missing', async () => {
            const res = await request(app)
                .post('/api/food/add_to_meal')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ meal_category: 'Breakfast' }); // Missing date, food_id, p_count

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('returns 400 for invalid date format', async () => {
            const res = await request(app)
                .post('/api/food/add_to_meal')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    date: '02-12-2026', // wrong format
                    meal_category: 'Breakfast',
                    food_id: testFood.food_id,
                    p_count: 1
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Invalid format');
        });

        it('returns 404 if food_id does not exist in DB', async () => {
            const res = await request(app)
                .post('/api/food/add_to_meal')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    date: '2026-03-10',
                    meal_category: 'Breakfast',
                    food_id: 11111111, // fake id
                    p_count: 1
                });

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
        });
    });

});

// ═════════════════════════════════════════════════════════════════════════════
// 2️⃣  SYSTEM TESTING — End-to-End Manual Logging Flow
// ═════════════════════════════════════════════════════════════════════════════
describe('🌐 System Tests — End-to-End Meal Logging Flow', () => {
    const testDate = '2026-03-10';
    let createdMealLogId: number | undefined;

    it('Step 1: Add a food to a meal (Breakfast)', async () => {
        const res = await request(app)
            .post('/api/food/add_to_meal')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                date: testDate,
                meal_category: 'Breakfast',
                food_id: testFood.food_id,
                p_count: 2  // Multiplying portions by 2
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('Step 2: Fetch meal logs and verify the added item exists', async () => {
        const res = await request(app)
            .get(`/api/food/get_meal_log?date=${testDate}&meal_category=Breakfast`)
            .set('Authorization', `Bearer ${userToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.length).toBeGreaterThan(0);

        // Find the item we just added
        const loggedFood = res.body.data.find((item: any) => item.food_id === testFood.food_id);
        expect(loggedFood).toBeDefined();
        expect(loggedFood.p_count).toBe(2);
        expect(loggedFood.t_calorie).toBe(testFood.p_calorie * 2);

        // Save ID for deletion step later
        createdMealLogId = loggedFood.meal_log_id;
    });

    it('Step 3: Fetch meal total and ensure totals reflect the added item', async () => {
        const res = await request(app)
            .get(`/api/food/get_meal_total?date=${testDate}&meal_category=Breakfast`)
            .set('Authorization', `Bearer ${userToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        // Data should contain the totals (t_calorie, t_protein, etc)
        const data = res.body.data;
        expect(data.t_calorie).toBeGreaterThanOrEqual(testFood.p_calorie * 2);
    });

    it('Step 4: Fetch OVERALL meal total and ensure it was updated', async () => {
        const res = await request(app)
            .get(`/api/food/get_meal_total?date=${testDate}&meal_category=OVERALL`)
            .set('Authorization', `Bearer ${userToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        const data = res.body.data;
        expect(data.t_calorie).toBeGreaterThanOrEqual(testFood.p_calorie * 2);
    });

    it('Step 5: Delete the food from the meal log', async () => {
        expect(createdMealLogId).toBeDefined();

        const res = await request(app)
            .post('/api/food/delete_from_meal')
            .set('Authorization', `Bearer ${userToken}`)
            .send({ meal_log_id: createdMealLogId });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('Step 6: Fetch meal logs again and verify it is removed', async () => {
        const res = await request(app)
            .get(`/api/food/get_meal_log?date=${testDate}&meal_category=Breakfast`)
            .set('Authorization', `Bearer ${userToken}`);

        // If it's the only item, it might return 404, or return empty list
        if (res.status === 200) {
            const loggedFood = res.body.data.find((item: any) => item.meal_log_id === createdMealLogId);
            expect(loggedFood).toBeUndefined(); // shouldn't exist
        } else {
            expect(res.status).toBe(404);
        }
    });

    it('Step 7: Verify meal total was decremented properly', async () => {
        const res = await request(app)
            .get(`/api/food/get_meal_total?date=${testDate}&meal_category=Breakfast`)
            .set('Authorization', `Bearer ${userToken}`);

        // Because it was the only item, it should ideally be 0 or return 404 
        // The controller returns 200 with data=0 when not found or 0
        expect(res.status).toBe(200);
        // In our case the DB row might still exist but with 0 values, or our code returns 0
        if (res.body.data !== 0) {
            expect(res.body.data.t_calorie).toBe(0);
        } else {
            expect(res.body.data).toBe(0);
        }
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 3️⃣  PERFORMANCE TESTING — API Latency Checks
// ═════════════════════════════════════════════════════════════════════════════
describe('⚡ Performance Tests — API Latency', () => {
    // Set a baseline acceptable response time (in milliseconds)
    const MAX_RESPONSE_TIME_MS = 1000;

    it('GET /api/food/search_food should respond quickly', async () => {
        const start = performance.now();

        const res = await request(app)
            .get(`/api/food/search_food?food_name=${testFood.food_name}`)
            .set('Authorization', `Bearer ${userToken}`);

        const end = performance.now();
        const duration = end - start;

        expect(res.status).toBe(200);
        expect(duration).toBeLessThan(MAX_RESPONSE_TIME_MS);

        console.log(`Search Food Latency: ${duration.toFixed(2)}ms`);
    });

    it('POST /api/food/add_to_meal should process and save quickly', async () => {
        const start = performance.now();

        const res = await request(app)
            .post('/api/food/add_to_meal')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                date: '2026-03-11', // Using a different date to avoid interfering with system tests
                meal_category: 'Lunch',
                food_id: testFood.food_id,
                p_count: 1
            });

        const end = performance.now();
        const duration = end - start;

        expect(res.status).toBe(200);
        expect(duration).toBeLessThan(MAX_RESPONSE_TIME_MS);

        // Clean up the item we just added for the performance test
        if (res.body.data && res.body.data.meal_log_id) {
            await request(app)
                .post('/api/food/delete_from_meal')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ meal_log_id: res.body.data.meal_log_id });
        }
    });

    it('GET /api/food/get_meal_total should calculate totals quickly', async () => {
        const start = performance.now();

        const res = await request(app)
            .get(`/api/food/get_meal_total?date=2026-03-10&meal_category=OVERALL`)
            .set('Authorization', `Bearer ${userToken}`);

        const end = performance.now();
        const duration = end - start;

        expect(res.status).toBe(200);
        expect(duration).toBeLessThan(MAX_RESPONSE_TIME_MS);
    });
});

