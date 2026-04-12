import { PrismaClient } from '@prisma/client';
import { foodModel } from '../models/food.model';

const prisma = new PrismaClient();

async function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runFoodLibraryTests() {
    console.log("===============================================");
    console.log("🍏 NUTRIGAME FOOD LIBRARY & LOGGING TESTS");
    console.log("===============================================\n");

    const testUsername = "food_tester_e2e";
    const testEmail = "food_tester@test.com";

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

        // --- 3. TEST FOOD SEARCH & LOOKUP ---
        console.log("\n[3] Testing Food Lookup (Saving external food)...");
        const externalFood = {
            name: "Test Avocado Toast",
            unit: "piece",
            amount: 1,
            calories: 350,
            protein: 8,
            fat: 20,
            carb: 35
        };

        const savedFood = await foodModel.saveOffFoodToLookup(
            externalFood.name,
            externalFood.unit,
            externalFood.amount,
            externalFood.calories,
            externalFood.protein,
            externalFood.fat,
            externalFood.carb
        );
        console.log(`    ✅ Saved external food to lookup: ${savedFood.food_name} (ID: ${savedFood.food_id})`);

        // Verify search finds it
        const searchResults = await foodModel.searchFoodByName("Avocado");
        const foundInSearch = searchResults.some(f => f.food_name === externalFood.name);
        console.log(`    🔍 Search for "Avocado": ${foundInSearch ? 'Found' : 'Not Found'} (${searchResults.length} results)`);

        if (!foundInSearch) throw new Error("Food should have been found in search.");

        // --- 4. TEST MEAL LOGGING (ADD) ---
        console.log("\n[4] Testing Add to Meal...");
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const mealCategory = "breakfast";
        const portionCount = 2; // Eating 2 pieces

        const mealLog = await foodModel.addFoodToMealLog(
            user.id,
            today,
            mealCategory,
            portionCount,
            savedFood.food_id,
            savedFood.food_name,
            savedFood.p_unit,
            savedFood.p_amount * portionCount,
            savedFood.p_calorie * portionCount,
            savedFood.p_protein * portionCount,
            savedFood.p_fat * portionCount,
            savedFood.p_carb * portionCount
        );

        console.log(`    ✅ Logged ${portionCount}x ${savedFood.food_name} to ${mealCategory}`);
        console.log(`    📊 Log Values: ${mealLog.t_calorie} kcal, ${mealLog.t_protein}g P, ${mealLog.t_fat}g F, ${mealLog.t_carb}g C`);

        // --- 5. VERIFY TOTALS ---
        console.log("\n[5] Verifying Totals...");
        const totals = await foodModel.getMealTotalByDate(user.id, today, mealCategory);
        const overallTotals = await foodModel.getMealTotalByDate(user.id, today, "OVERALL");

        console.log(`    ✅ ${mealCategory.toUpperCase()} TOTAL: ${totals?.t_calorie} kcal`);
        console.log(`    ✅ OVERALL TOTAL: ${overallTotals?.t_calorie} kcal`);

        if (totals?.t_calorie !== mealLog.t_calorie || overallTotals?.t_calorie !== mealLog.t_calorie) {
            throw new Error(`Total calories mismatch! Expected ${mealLog.t_calorie}`);
        }

        // --- 6. TEST DELETION ---
        console.log("\n[6] Testing Delete from Meal...");
        const deleteRes = await foodModel.deleteFoodFromMealLog(user.id, mealLog.meal_log_id);
        
        if (deleteRes.success) {
            console.log(`    ✅ Food deleted successfully.`);
            
            const updatedTotals = await foodModel.getMealTotalByDate(user.id, today, "OVERALL");
            console.log(`    🔄 Updated OVERALL TOTAL: ${updatedTotals?.t_calorie} kcal`);
            
            if (updatedTotals?.t_calorie !== 0) {
                throw new Error(`Total calories should be 0 after deletion, got ${updatedTotals?.t_calorie}`);
            }
        } else {
            throw new Error(`Deletion failed: ${deleteRes.message}`);
        }

        // --- 7. WATER LOG TEST ---
        console.log("\n[7] Testing Water Logging...");
        const waterEntries = [
            { name: "Glass", amount: 250 },
            { name: "Bottle", amount: 500 }
        ];

        await foodModel.addtoWaterLog(user.id, today, waterEntries);
        const waterTotal = await foodModel.getWaterTotal(user.id, today);
        console.log(`    ✅ Water Logs added. Total: ${waterTotal.t_amount}ml (${waterTotal.logs.length} entries)`);

        if (waterTotal.t_amount !== 750) {
            throw new Error(`Water total mismatch! Expected 750, got ${waterTotal.t_amount}`);
        }

        console.log(`\n🎉 FOOD LIBRARY TESTS PASSED SUCCESSFULLY! 🎉\n`);

    } catch (error) {
        console.error(`\n❌ TEST FAILED:`, error);
    } finally {
        // --- CLEANUP ---
        console.log(`\n🧹 Cleaning up test data...`);
        try {
            await prisma.user.deleteMany({
                where: { username: testUsername }
            });
            console.log(`    ✅ Deleted test user and all related logs.`);
        } catch (e) {
            console.error(`    ⚠️ Cleanup failed:`, e);
        }
        await prisma.$disconnect();
    }
}

runFoodLibraryTests();
