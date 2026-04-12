import { PrismaClient } from '@prisma/client';
import { dailyProgressModel } from '../models/dailyprogress.model';

const prisma = new PrismaClient();

async function runDailyProgressTests() {
    console.log("===============================================");
    console.log("📈 NUTRIGAME DAILY PROGRESS DB TESTS");
    console.log("===============================================\n");

    const testUsername = "progress_tester_e2e_123";
    const testEmail = "progress_tester@test.com";

    try {
        // --- 1. CLEANUP ---
        console.log("[1] Cleaning up existing test user...");
        await prisma.user.deleteMany({
            where: { username: testUsername }
        });

        // --- 2. CREATE TEST USER ---
        console.log("[2] Creating test user...");
        const user = await prisma.user.create({
            data: {
                username: testUsername,
                email: testEmail,
                password: "password123",
            }
        });
        console.log(`    ✅ Created user: ${user.username} (ID: ${user.id})`);

        // --- 3. TEST INITIAL UPSERT (Weight & Mood) ---
        console.log("\n[3] Testing Initial Upsert (Weight & Mood)...");
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const initialData = {
            currentWeight: 75.5,
            mood: "good",
            movement: 5000
        };

        const firstResult = await dailyProgressModel.upsertProgress(user.id, today, initialData);
        console.log(`    ✅ Data saved: Weight=${firstResult.currentWeight}, Mood=${firstResult.mood}, Movement=${firstResult.movement}`);

        if (firstResult.currentWeight !== 75.5 || firstResult.mood !== "good") {
            throw new Error("Initial data mismatch in database!");
        }

        // --- 4. TEST UPDATE (Update only weight) ---
        console.log("\n[4] Testing Update via Upsert (Changing weight only)...");
        const updateData = {
            currentWeight: 74.8
            // mood is not provided, should stay "good"
        };

        const secondResult = await dailyProgressModel.upsertProgress(user.id, today, updateData);
        console.log(`    ✅ Data updated: New Weight=${secondResult.currentWeight}, Mood Still=${secondResult.mood}`);

        if (secondResult.currentWeight !== 74.8 || secondResult.mood !== "good") {
            throw new Error("Update logic failed or mood was accidentally cleared!");
        }

        // --- 5. TEST RETRIEVAL ---
        console.log("\n[5] Testing Retrieval (Weekly Progress)...");
        const weeklyData = await dailyProgressModel.getWeeklyProgress(user.id);
        const todayEntry = weeklyData.find(d => 
            d.date.toISOString().split('T')[0] === today.toISOString().split('T')[0]
        );

        console.log(`    ✅ Weekly fetch returned ${weeklyData.length} records.`);
        if (!todayEntry) throw new Error("Today's record NOT found in weekly summary!");
        console.log(`    🔍 Record for today: ${todayEntry.currentWeight}kg, Mood: ${todayEntry.mood}`);

        console.log(`\n🎉 DAILY PROGRESS DB FLOW VERIFIED SUCCESSFULLY! 🎉\n`);

    } catch (error) {
        console.error(`\n❌ DB TEST FAILED:`, error);
    } finally {
        // --- CLEANUP ---
        console.log(`\n🧹 Cleaning up test data...`);
        try {
            await prisma.user.deleteMany({
                where: { username: testUsername }
            });
            console.log(`    ✅ Deleted test user and progress logs.`);
        } catch (e) {
            console.error(`    ⚠️ Cleanup failed:`, e);
        }
        await prisma.$disconnect();
    }
}

runDailyProgressTests();
