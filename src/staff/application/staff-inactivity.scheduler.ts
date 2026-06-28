import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientAdvisor } from '../domain/client-advisor.entity';
import { WorkoutSession } from '../../training/domain/workout-session.entity';
import { User } from '../../users/domain/user.entity';
import { PushNotificationsService } from '../../push-notifications/application/push-notifications.service';

@Injectable()
export class StaffInactivityScheduler {
  private readonly logger = new Logger(StaffInactivityScheduler.name);

  constructor(
    @InjectRepository(ClientAdvisor)
    private readonly advisorRepo: Repository<ClientAdvisor>,
    @InjectRepository(WorkoutSession)
    private readonly sessionRepo: Repository<WorkoutSession>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly pushSvc: PushNotificationsService,
  ) {}

  // Runs daily at 09:00 server time
  @Cron('0 9 * * *')
  async notifyTrainersAboutInactiveClients(): Promise<void> {
    this.logger.log('Inactivity check started');

    const activeRelations = await this.advisorRepo.find({
      where: { status: 'ACTIVE' },
      select: ['id', 'advisorId', 'clientId', 'targetSessionsPerWeek'],
    });

    if (!activeRelations.length) return;

    const clientIds = [...new Set(activeRelations.map((r) => r.clientId))];

    // Last session date per client
    const sessionStats = await this.sessionRepo
      .createQueryBuilder('ws')
      .select('ws.userId', 'clientId')
      .addSelect('MAX(ws.startedAt)', 'lastSessionAt')
      .where('ws.userId IN (:...clientIds)', { clientIds })
      .andWhere("ws.status IN ('COMPLETED', 'FINISHED')")
      .groupBy('ws.userId')
      .getRawMany<{ clientId: string; lastSessionAt: string | null }>();

    const lastSessionMap = new Map(
      sessionStats.map((s) => [Number(s.clientId), s.lastSessionAt ? new Date(s.lastSessionAt) : null]),
    );

    const NOW = Date.now();
    const DEFAULT_THRESHOLD_DAYS = 5;

    // Group inactive clients by advisor
    const advisorMap = new Map<number, string[]>();

    for (const rel of activeRelations) {
      const lastSession = lastSessionMap.get(rel.clientId) ?? null;
      const daysSince   = lastSession
        ? Math.floor((NOW - lastSession.getTime()) / 86_400_000)
        : 999;

      const thresholdDays = rel.targetSessionsPerWeek
        ? Math.round(7 / rel.targetSessionsPerWeek) + 1
        : DEFAULT_THRESHOLD_DAYS;

      if (daysSince < thresholdDays) continue;

      const list = advisorMap.get(rel.advisorId) ?? [];
      list.push(String(rel.clientId));
      advisorMap.set(rel.advisorId, list);
    }

    if (!advisorMap.size) {
      this.logger.log('No inactive clients found — no notifications sent');
      return;
    }

    const advisorIds = [...advisorMap.keys()];
    const advisors   = await this.userRepo.find({
      where: advisorIds.map((id) => ({ id })),
      select: ['id', 'pushToken'],
    });

    // Need client names for the notification body
    const allClientIds = [...new Set([...advisorMap.values()].flat().map(Number))];
    const clients      = await this.userRepo
      .createQueryBuilder('u')
      .select('u.id', 'id')
      .addSelect(
        `TRIM(CONCAT(COALESCE(prof.first_name, ''), ' ', COALESCE(prof.last_name, '')))`,
        'fullName',
      )
      .leftJoin('u.profile', 'prof')
      .where('u.id IN (:...allClientIds)', { allClientIds })
      .getRawMany<{ id: string; fullName: string }>();

    const clientNameMap = new Map(clients.map((c) => [Number(c.id), c.fullName?.trim() || `#${c.id}`]));

    let sent = 0;
    for (const advisor of advisors) {
      if (!advisor.pushToken) continue;

      const inactiveIds   = (advisorMap.get(advisor.id) ?? []).map(Number);
      const inactiveNames = inactiveIds.map((id) => clientNameMap.get(id) ?? `#${id}`);

      const count = inactiveNames.length;
      const body  = count === 1
        ? `${inactiveNames[0]} lleva varios días sin entrenar.`
        : `${inactiveNames.slice(0, 2).join(', ')}${count > 2 ? ` y ${count - 2} más` : ''} llevan varios días sin entrenar.`;

      try {
        await this.pushSvc.sendPushMessage(
          advisor.pushToken,
          'Alumnos inactivos',
          body,
          { type: 'INACTIVITY_ALERT', inactiveCount: count, clientIds: inactiveIds },
        );
        sent++;
      } catch (err) {
        this.logger.warn(`Push failed for advisor ${advisor.id}: ${err}`);
      }
    }

    this.logger.log(`Inactivity check done — ${sent} trainer(s) notified`);
  }
}
