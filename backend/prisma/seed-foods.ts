
import { PrismaClient } from '@prisma/client';
import { FALLBACK_FOODS } from '../src/data/fallback-foods';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding food items from FALLBACK_FOODS...');

  // Mevcut max food_id yi bul
  const maxRecord = await prisma.foodLookup.findFirst({
    orderBy: { food_id: 'desc' },
    select: { food_id: true }
  });
  let nextId = (maxRecord?.food_id ?? 0) + 1;

  let addedCount = 0;
  let skippedCount = 0;

  for (const food of FALLBACK_FOODS) {
    // Aynı isimde gıda var mı kontrol et
    const existing = await prisma.foodLookup.findFirst({
      where: { 
        food_name: { 
          equals: food.food_name, 
          mode: 'insensitive' 
        } 
      }
    });

    if (!existing) {
      await prisma.foodLookup.create({
        data: {
          food_id: nextId++,
          food_name: food.food_name,
          p_unit: food.p_unit,
          p_amount: food.p_amount,
          p_calorie: food.p_calorie,
          p_protein: food.p_protein,
          p_fat: food.p_fat,
          p_carb: food.p_carb
        }
      });
      addedCount++;
    } else {
      skippedCount++;
    }
  }

  console.log(`Seeding completed: ${addedCount} added, ${skippedCount} skipped.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
