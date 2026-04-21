export type ExpoPushMessage = {
  to: string | string[];
  title?: string;
  body?: string;
  data?: any;
  sound?: string;
};

export class Expo {
  static isExpoPushToken(_token: string): boolean {
    return true;
  }

  chunkPushNotifications(messages: ExpoPushMessage[]): ExpoPushMessage[][] {
    return messages.length ? [messages] : [];
  }

  async sendPushNotificationsAsync(_messages: ExpoPushMessage[]): Promise<any[]> {
    return [];
  }
}
