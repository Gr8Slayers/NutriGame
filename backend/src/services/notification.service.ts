import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import prisma from '../config/prisma';

class NotificationService {
    private expo: Expo;

    constructor() {
        this.expo = new Expo();
    }

    /**
     * Sends a push notification to a specific user id.
     * @param userId The ID of the user to send the notification to.
     * @param title The title of the push notification.
     * @param body The body message of the push notification.
     * @param data Optional map of data to be sent with the notification.
     */
    public async sendPushNotification(userId: number, title: string, body: string, data?: any): Promise<void> {
        try {
            // İlk olarak DB'ye in-app listesinde görünmesi için kaydedelim
            await prisma.notification.create({
                data: {
                    userId,
                    title,
                    message: body
                }
            });

            // Find the user's expo push token
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { expoPushToken: true }
            });

            if (!user || !user.expoPushToken) {
                console.log(`[Notification Service] User ${userId} does not have a push token.`);
                return;
            }

            const token = user.expoPushToken;

            // Check that all your push tokens appear to be valid Expo push tokens
            if (!Expo.isExpoPushToken(token)) {
                console.error(`[Notification Service] Push token ${token} is not a valid Expo push token`);
                return;
            }

            const message: ExpoPushMessage = {
                to: token,
                sound: 'default',
                title: title,
                body: body,
                data: data ? data : { withSome: 'data' },
            };

            // The Expo push notification service accepts batches of notifications.
            const chunks = this.expo.chunkPushNotifications([message]);
            const tickets = [];

            // Send the chunks to the Expo push notification service
            for (let chunk of chunks) {
                try {
                    let ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
                    tickets.push(...ticketChunk);
                } catch (error) {
                    console.error('[Notification Service] Error sending push chunk:', error);
                }
            }
        } catch (error) {
            console.error('[Notification Service] Error fetching user push token:', error);
        }
    }
}

export const notificationService = new NotificationService();
