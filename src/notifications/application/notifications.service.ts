import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationTemplate } from '../domain/notification-template.entity';
import { Notification } from '../domain/notification.entity';
import { UserNotificationPreference } from '../domain/user-notification-preference.entity';
@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationTemplate)
    private templatesRepo: Repository<NotificationTemplate>,
    @InjectRepository(Notification) private notifRepo: Repository<Notification>,
    @InjectRepository(UserNotificationPreference)
    private prefsRepo: Repository<UserNotificationPreference>,
  ) {}

  createTemplate(data: Partial<NotificationTemplate>) {
    return this.templatesRepo.save(this.templatesRepo.create(data));
  }
  findAllTemplates() {
    return this.templatesRepo.find();
  }

  send(data: Partial<Notification>) {
    return this.notifRepo.save(this.notifRepo.create(data));
  }
  findByUser(userId: number) {
    return this.notifRepo.find({
      where: { userId },
      relations: ['template'],
      order: { sentAt: 'DESC' },
      take: 50,
    });
  }
  async markAsRead(id: number) {
    await this.notifRepo.update(id, { readAt: new Date(), status: 'READ' });
    return this.notifRepo.findOne({ where: { id } });
  }

  async getPreferences(userId: number) {
    let p = await this.prefsRepo.findOne({ where: { userId } });
    if (!p) p = await this.prefsRepo.save(this.prefsRepo.create({ userId }));
    return p;
  }
  async updatePreferences(userId: number, data: any) {
    let p = await this.prefsRepo.findOne({ where: { userId } });
    if (!p) p = this.prefsRepo.create({ userId });
    Object.assign(p, data);
    return this.prefsRepo.save(p);
  }
}
