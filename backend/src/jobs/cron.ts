import cron from 'node-cron';
import prisma from '../config/prisma';
import { notificationService } from '../services/notification.service';

export const startCronJobs = () => {
    // Run everyday at 00:00 (midnight server time)
    cron.schedule('0 0 * * *', async () => {
        console.log('[Cron] Checking for expiring challenges...');
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Calculate the date 5 days and 1 day from now
            const inFiveDays = new Date(today);
            inFiveDays.setDate(inFiveDays.getDate() + 5);

            const inOneDay = new Date(today);
            inOneDay.setDate(inOneDay.getDate() + 1);

            // Fetch active challenges
            const activeChallenges = await prisma.challenge.findMany({
                where: { status: 'active' },
                include: { participants: true }
            });

            for (const challenge of activeChallenges) {
                const endDate = new Date(challenge.endDate);
                endDate.setHours(0, 0, 0, 0);

                const timeDiff = endDate.getTime() - today.getTime();
                const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

                if (daysLeft === 5 || daysLeft === 1) {
                    for (const participant of challenge.participants) {
                        await notificationService.sendPushNotification(
                            participant.userId,
                            "Challenge is ending!",
                            `"${challenge.title}" challenge will end in ${daysLeft} days. Hurry up!`
                        );
                    }
                }
            }

            // Süresi dolmuş (deadline'ı geçmiş) tüm meydan okumaları tamamen sil
            const deletionResult = await prisma.challenge.deleteMany({
                where: {
                    endDate: {
                        lt: today
                    }
                }
            });

            if (deletionResult.count > 0) {
                console.log(`[Cron] ${deletionResult.count} expired challenges were deleted.`);
            }

            console.log('[Cron] Expiring challenges check completed.');
        } catch (error) {
            console.error('[Cron] Error running expiring challenges job:', error);
        }
    });

    // Lunch reminder — every day at 12:00
    cron.schedule('0 12 * * *', async () => {
        console.log('[Cron] Sending lunch reminders...');
        try {
            const today = new Date();
            const startOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0));
            const endOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 23, 59, 59));

            // Find users who have not logged any meal today
            const usersWhoLogged = await prisma.mealLog.findMany({
                where: { date: { gte: startOfDay, lte: endOfDay } },
                select: { userId: true },
                distinct: ['userId'],
            });
            const loggedUserIds = usersWhoLogged.map(u => u.userId);

            const usersToRemind = await prisma.user.findMany({
                where: {
                    expoPushToken: { not: null },
                    id: { notIn: loggedUserIds },
                },
                select: { id: true },
            });

            for (const user of usersToRemind) {
                await notificationService.sendPushNotification(
                    user.id,
                    "Don't forget to log your meals!",
                    "You haven't logged anything today. Keep your streak going!"
                );
            }
            console.log(`[Cron] Lunch reminder sent to ${usersToRemind.length} users.`);
        } catch (error) {
            console.error('[Cron] Error sending lunch reminders:', error);
        }
    });

    // Dinner reminder — every day at 18:00
    cron.schedule('0 18 * * *', async () => {
        console.log('[Cron] Sending dinner reminders...');
        try {
            const today = new Date();
            const startOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0));
            const endOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 23, 59, 59));

            // Find users who have not logged dinner or snack yet today
            const usersWhoLoggedDinner = await prisma.mealLog.findMany({
                where: {
                    date: { gte: startOfDay, lte: endOfDay },
                    meal_category: { in: ['dinner', 'snack'] },
                },
                select: { userId: true },
                distinct: ['userId'],
            });
            const loggedDinnerIds = usersWhoLoggedDinner.map(u => u.userId);

            const usersToRemind = await prisma.user.findMany({
                where: {
                    expoPushToken: { not: null },
                    id: { notIn: loggedDinnerIds },
                },
                select: { id: true },
            });

            for (const user of usersToRemind) {
                await notificationService.sendPushNotification(
                    user.id,
                    "Time to log your dinner!",
                    "Don't forget to track your evening meals for a complete daily record."
                );
            }
            console.log(`[Cron] Dinner reminder sent to ${usersToRemind.length} users.`);
        } catch (error) {
            console.error('[Cron] Error sending dinner reminders:', error);
        }
    });

    console.log('[Cron] Cron jobs initialized.');
};
