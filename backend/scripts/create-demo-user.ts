import prisma from '../src/config/prisma';
import bcrypt from 'bcryptjs';

async function createDemoUser() {
    console.log("🚀 Creating NutriGame Demo User...");

    const username = "NutriChamp";
    const email = "demo@nutrigame.com";
    const password = "demo123";

    try {
        // 1. Clean up existing demo user
        await prisma.user.deleteMany({ where: { username } });

        // 2. Create User
        const user = await prisma.user.create({
            data: {
                username,
                email,
                password,
                profile: {
                    create: {
                        age: 25,
                        gender: "Male",
                        weight: 75,
                        height: 180,
                        target_weight: 70,
                        reason_to_diet: "Get fit and healthy",
                        avatar_url: "../assets/avatars/av5.png"
                    }
                },
                streak: {
                    create: {
                        currentStreak: 30,
                        longestStreak: 45,
                        totalPoints: 1250,
                        lastActiveDate: new Date()
                    }
                }
            }
        });

        console.log(`✅ User ${username} created! (ID: ${user.id})`);

        // 3. Create Badges
        console.log("🏅 Awarding premium badges...");
        const badgesToAward = [
            // Water
            { name: 'First Drop', desc: 'Water achievement Level 1', icon: 'water_1' },
            { name: 'Oasis Explorer', desc: 'Water achievement Level 2', icon: 'water_2' },
            { name: 'Hydration Master', desc: 'Water achievement Level 3', icon: 'water_3' },
            // Sugar
            { name: 'Bitter Truth', desc: 'Sugar achievement Level 1', icon: 'sugar_1' },
            { name: 'Sugar Detox', desc: 'Sugar achievement Level 2', icon: 'sugar_2' },
            { name: 'Sweet-proof', desc: 'Sugar achievement Level 3', icon: 'sugar_3' },
            // Move
            { name: 'First Step', desc: 'Move achievement Level 1', icon: 'move_1' },
            { name: 'Fitness Addict', desc: 'Move achievement Level 2', icon: 'move_2' },
            { name: 'Marathon Spirit', desc: 'Move achievement Level 3', icon: 'move_3' },
            // Streak
            { name: 'Iron Will', desc: 'Streak achievement Level 1', icon: 'streak_1' },
            { name: 'Steel Dicipline', desc: 'Streak achievement Level 2', icon: 'streak_2' },
            { name: 'Diamond Focus', desc: 'Streak achievement Level 3', icon: 'streak_3' },
        ];

        for (const b of badgesToAward) {
            const badge = await prisma.badge.upsert({
                where: { name: b.name },
                update: { iconName: b.icon },
                create: { name: b.name, description: b.desc, iconName: b.icon }
            });

            await prisma.userBadge.create({
                data: { userId: user.id, badgeId: badge.id }
            });
        }

        // 4. Create Social Connections
        console.log("👥 Setting up social network...");
        const otherUsers = await prisma.user.findMany({
            where: { NOT: { id: user.id } },
            take: 5
        });

        for (const other of otherUsers) {
            // Demo follows them
            await prisma.userFollow.upsert({
                where: { followerId_followingId: { followerId: user.id, followingId: other.id } },
                update: {},
                create: { followerId: user.id, followingId: other.id }
            });
            // They follow Demo
            await prisma.userFollow.upsert({
                where: { followerId_followingId: { followerId: other.id, followingId: user.id } },
                update: {},
                create: { followerId: other.id, followingId: user.id }
            });
        }

        // 5. Create some dummy recipe posts
        console.log("🥗 Creating demo recipes...");
        await prisma.post.create({
            data: {
                userId: user.id,
                caption: "Morning healthy bowl! 🍓",
                isRecipe: true,
                recipeTitle: "Berry Blast Oatmeal",
                recipeIngredients: "Oats, Milk, Berries, Honey",
                recipeInstructions: "1. Boil milk. 2. Add oats. 3. Top with berries.",
                recipeCalories: 350,
                recipePrepTime: 10
            }
        });

        console.log("\n✨ Demo setup complete!");
        console.log("------------------------");
        console.log(`Username: ${username}`);
        console.log(`Email:    ${email}`);
        console.log(`Password: demo123`);
        console.log("------------------------\n");

    } catch (error) {
        console.error("❌ Error creating demo user:", error);
    } finally {
        await prisma.$disconnect();
    }
}

createDemoUser();
