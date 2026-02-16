import { Expo } from 'expo-server-sdk';
import User from '../models/User';
import logger from '../config/logger';

const expo = new Expo();

export const sendPushNotification = async (userId: string, title: string, body: string, data?: any) => {
    try {
        const user = await User.findById(userId);
        if (!user || !user.pushToken) {
            // logger.warn(`No push token found for user ${userId}`);
            return;
        }

        if (!Expo.isExpoPushToken(user.pushToken)) {
            logger.error(`Push token ${user.pushToken} is not a valid Expo push token`);
            return;
        }

        const messages = [{
            to: user.pushToken,
            sound: 'default',
            title,
            body,
            data,
        }];

        const chunks = expo.chunkPushNotifications(messages as any);

        for (let chunk of chunks) {
            try {
                const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                // logger.info('Push notification sent', ticketChunk);
            } catch (error) {
                logger.error('Error sending push notification chunk', error);
            }
        }
    } catch (error) {
        logger.error('Error in sendPushNotification', error);
    }
};
