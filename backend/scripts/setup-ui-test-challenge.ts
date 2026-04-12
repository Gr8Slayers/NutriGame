import prisma from '../src/config/prisma';

async function setupUITest() {
    console.log("🛠 Setting up UI Test Challenge for NutriChamp...");

    // 1. Find the Demo User
    const user = await prisma.user.findUnique({
        where: { username: 'NutriChamp' }
    });

    if (!user) {
        console.error("❌ NutriChamp not found. Please run scripts/create-demo-user.ts first.");
        return;
    }

    // 2. Clear old test challenges to avoid clutter
    await prisma.challengeParticipant.deleteMany({
        where: { 
            userId: user.id,
            challenge: { title: 'TEST: Popup Denemesi' }
        }
    });

    await prisma.challenge.deleteMany({
        where: { title: 'TEST: Popup Denemesi' }
    });

    // 3. Create a Water Challenge that is only 1 day long (today)
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const challenge = await prisma.challenge.create({
        data: {
            creatorId: user.id,
            title: 'TEST: Popup Denemesi',
            description: 'Bu bir test meydan okumasıdır. Ödülü al diyerek yeni popupı görebilirsiniz!',
            type: 'water',
            goalValue: 2000,
            startDate: startDate,
            endDate: endDate,
            status: 'active',
            participants: {
                create: {
                    userId: user.id,
                    role: 'creator',
                    status: 'accepted'
                }
            }
        }
    });

    // 4. Record progress that meets the goal
    const today = new Date();
    today.setHours(0,0,0,0);

    // Give them 2500ml of water today
    await prisma.waterLog.create({
        data: {
            userId: user.id,
            amount: 2500,
            date: today,
            portion_name: 'Test'
        }
    });

    console.log(`✅ Challenge created (ID: ${challenge.id})`);
    console.log(`✅ Goal met for NutriChamp. Log in and go to "TEST: Popup Denemesi" to claim!`);
    
    await prisma.$disconnect();
}

setupUITest().catch(console.error);
