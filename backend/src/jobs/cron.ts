import cron from 'node-cron';
import prisma from '../config/prisma';
import { notificationService } from '../services/notification.service';
import { ChallengeParticipant } from '@prisma/client';

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
                            "Meydan Okuma Bitiyor!",
                            `"${challenge.title}" adlı meydan okumanızın bitmesine sadece ${daysLeft} gün kaldı. Acele edin!`
                        );
                    }
                }
            }

            console.log('[Cron] Expiring challenges check completed.');
        } catch (error) {
            console.error('[Cron] Error running expiring challenges job:', error);
        }
    });

    console.log('[Cron] Cron jobs initialized.');
};
