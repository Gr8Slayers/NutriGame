// prisma/seed-badges.ts
// Run: npx ts-node prisma/seed-badges.ts

import prisma from '../src/config/prisma';

const DEFAULT_BADGES = [
    { name: 'Water Warrior', description: 'Won a water challenge', iconName: 'water' },
    { name: 'Calorie Champion', description: 'Won a calorie challenge', iconName: 'flame' },
    { name: 'Sugar Crusher', description: 'Won a sugar challenge', iconName: 'nutrition' },
    { name: 'Step Master', description: 'Won a step challenge', iconName: 'walk' },
];

async function seedBadges() {
    for (const badge of DEFAULT_BADGES) {
        await prisma.badge.upsert({
            where: { name: badge.name },
            update: {},
            create: badge,
        });
    }
    console.log(`Seeded ${DEFAULT_BADGES.length} badges.`);
    await prisma.$disconnect();
}

seedBadges().catch(console.error);
