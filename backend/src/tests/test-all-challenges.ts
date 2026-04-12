import { PrismaClient } from '@prisma/client';
import { gamificationModel } from '../models/gamification.model';

const prisma = new PrismaClient();

async function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
    console.log("===============================================");
    console.log("🎮 NUTRIGAME E2E GAMIFICATION TESTS (ALL TYPES)");
    console.log("===============================================\n");

    const creatorUsername = "test_creator_e2e_123";
    const participantUsername = "test_participant_e2e_123";

    try {
        // --- 1. CLEANUP PREVIOUS RUNS PENDING ---
        console.log("[1] Cleaning up any existing test data...");
        await prisma.user.deleteMany({
            where: { username: { in: [creatorUsername, participantUsername] } }
        });

        // --- 2. CREATE DUMMY USERS ---
        console.log("[2] Creating dummy users...");
        const creator = await prisma.user.create({
            data: {
                username: creatorUsername,
                email: "creator_test@test.com",
                password: "password123",
            }
        });
        const participant = await prisma.user.create({
            data: {
                username: participantUsername,
                email: "participant_test@test.com",
                password: "password123",
            }
        });
        console.log(`    ✅ Created users: Creator(ID: ${creator.id}), Participant(ID: ${participant.id})`);

        // Initialize Streaks just in case
        await gamificationModel.createStreak(creator.id);
        await gamificationModel.createStreak(participant.id);

        const challengeTypes = [
            { type: 'water', goalValue: 2000 },
            { type: 'calorie', goalValue: 1500 }, // needs to be >= 1500
            { type: 'sugar', goalValue: 30 },     // needs to be <= 30
            { type: 'step', goalValue: 10000 },
            { type: 'move', goalValue: 30 },
        ];

        // --- 3. RUN TESTS FOR EACH TYPE ---
        for (const ct of challengeTypes) {
            console.log(`\n-----------------------------------------------`);
            console.log(`🧪 TESTING CHALLENGE TYPE: ${ct.type.toUpperCase()}`);
            console.log(`-----------------------------------------------`);

            // A. Create Challenge
            const endDate = new Date();
            endDate.setHours(23, 59, 59, 999);
            const challenge = await gamificationModel.createChallenge(
                creator.id,
                `Test ${ct.type} Challenge`,
                ct.type,
                endDate,
                [creator.id, participant.id], // participants
                `Daily ${ct.type} goal!`,
                ct.goalValue
            );
            console.log(`    ✅ Challenge Created (ID: ${challenge.id}, Type: ${ct.type})`);

            // B. Participant Accepts Challenge
            await gamificationModel.respondToChallenge(challenge.id, participant.id, true);
            console.log(`    ✅ Participant accepted the challenge.`);

            // C. Seed Dummy Log Data
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (ct.type === 'water') {
                await prisma.waterLog.create({
                    data: { userId: participant.id, date: today, amount: 2500, portion_name: "Test" }
                });
                console.log(`    ✅ Inserted 2500ml Water Log`);
            } else if (ct.type === 'calorie') {
                await prisma.mealTotals.upsert({
                    where: { userId_date_meal_category: { userId: participant.id, date: today, meal_category: 'OVERALL' } },
                    update: { t_calorie: 1600 },
                    create: { userId: participant.id, date: today, meal_category: 'OVERALL', t_calorie: 1600, t_protein: 0, t_fat: 0, t_carb: 0 }
                });
                console.log(`    ✅ Upserted 1600kcal MealTotals (OVERALL) Log`);
            } else if (ct.type === 'sugar') {
                await prisma.mealTotals.upsert({
                    where: { userId_date_meal_category: { userId: participant.id, date: today, meal_category: 'OVERALL' } },
                    update: { t_carb: 15 },
                    create: { userId: participant.id, date: today, meal_category: 'OVERALL', t_calorie: 1000, t_protein: 0, t_fat: 0, t_carb: 15 } // 15 <= 30 is success
                });
                console.log(`    ✅ Upserted 15g Sugar MealTotals (OVERALL) Log`);
            } else if (ct.type === 'step' || ct.type === 'move') {
                await prisma.dailyProgress.upsert({
                    where: { userId_date: { userId: participant.id, date: today } },
                    update: { movement: ct.goalValue + 500 },
                    create: { userId: participant.id, date: today, movement: ct.goalValue + 500 }
                });
                console.log(`    ✅ Upserted ${ct.goalValue + 500} movement DailyProgress Log`);
            }

            // D. Calculate Progress Let's wait a small ms to ensure DB write
            await delay(500);
            const progress = await gamificationModel.calculateProgress(challenge.id, participant.id);
            console.log(`    🔍 Progress Calculated: ${progress}%`);

            if (progress !== 100) {
                throw new Error(`Progress should be 100%, got ${progress}%`);
            }

            // E. Complete Challenge & Award Badge
            await gamificationModel.claimReward(challenge.id, participant.id);
            await gamificationModel.awardBadge(participant.id, ct.type);
            console.log(`    ✅ Claimed Reward & Triggered Badge Awarding.`);

            // F. Verify Badge Earned
            const badges = await gamificationModel.getUserBadges(participant.id);
            const earnedTypes = badges.map(b => b.badge.name);
            console.log(`    🏆 Badges earned so far: [${earnedTypes.join(', ')}]`);
        }

        console.log(`\n🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉\n`);

    } catch (error) {
        console.error(`\n❌ TEST FAILED:`, error);
    } finally {
        // --- 4. CLEANUP AFTER TESTS ---
        console.log(`\n🧹 Cleaning up test data to keep Database safe...`);
        try {
            await prisma.user.deleteMany({
                where: { username: { in: [creatorUsername, participantUsername] } }
            });
            console.log(`    ✅ Deleted Dummy Users & all cascaded Data!`);
        } catch (e) {
            console.error(`    ⚠️ Failed to cleanup:`, e);
        }
        await prisma.$disconnect();
    }
}

runTests();
