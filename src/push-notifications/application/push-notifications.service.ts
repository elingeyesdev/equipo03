import { Injectable, Logger } from '@nestjs/common';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_BATCH_LIMIT = 100;

const EXPO_HEADERS = {
  Accept: 'application/json',
  'Accept-encoding': 'gzip, deflate',
  'Content-Type': 'application/json',
} as const;

@Injectable()
export class PushNotificationsService {
  private readonly logger = new Logger(PushNotificationsService.name);

  async sendPushMessage(
    pushToken: string,
    title: string,
    body: string,
    data?: any,
  ): Promise<void> {
    if (!pushToken) return;
    await this.sendPushBatch([pushToken], title, body, data);
  }

  async sendPushBatch(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    const valid = tokens.filter(Boolean);
    if (!valid.length) return;

    // Expo limita 100 mensajes por request; chunking automático
    for (let i = 0; i < valid.length; i += EXPO_BATCH_LIMIT) {
      const chunk = valid.slice(i, i + EXPO_BATCH_LIMIT);
      const messages = chunk.map((token) => ({
        to: token,
        title,
        body,
        data: data ?? {},
        sound: 'default',
        priority: 'high',
        channelId: 'default',
      }));

      try {
        const res = await fetch(EXPO_PUSH_URL, {
          method: 'POST',
          headers: EXPO_HEADERS,
          body: JSON.stringify(messages),
        });
        if (!res.ok) {
          this.logger.error(`Expo push batch HTTP ${res.status} (${chunk.length} tokens)`);
        }
      } catch (err) {
        this.logger.error(`Expo push batch error: ${(err as Error).message}`);
      }
    }
  }
}
