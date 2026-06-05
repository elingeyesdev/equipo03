import { Injectable, Logger } from '@nestjs/common';

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

    const payload = [
      {
        to: pushToken,
        title,
        body,
        data: data ?? {},
      },
    ];

    try {
      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        this.logger.error(
          `Expo push failed [HTTP ${res.status}] token=${pushToken}`,
        );
      }
    } catch (err) {
      this.logger.error(
        `Expo push error token=${pushToken}: ${(err as Error).message}`,
      );
    }
  }
}
