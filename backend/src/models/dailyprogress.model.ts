import prisma from '../config/prisma';

export const dailyProgressModel = {
    upsertProgress: async (userId: number, date: Date, data: { currentWeight?: number, mood?: string, totalCaloriesConsumed?: number, calorieGoal?: number, goalAchieved?: boolean }) => {
        const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));

        return await prisma.dailyProgress.upsert({
            where: {
                userId_date: {
                    userId: userId,
                    date: date
                }
            },
            update: cleanData,
            create: {
                userId: userId,
                date: date,
                ...cleanData
            }
        });
    },

    getWeeklyProgress: async (userId: number) => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        return await prisma.dailyProgress.findMany({
            where: {
                userId: userId,
                date: {
                    gte: sevenDaysAgo
                }
            },
            orderBy: {
                date: 'asc'
            }
        });
    }
}
