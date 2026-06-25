import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation } from '../domain/reservation.entity';
import { PushNotificationsService } from '../../push-notifications/application/push-notifications.service';

@Injectable()
export class ReservationRemindersService {
  private readonly logger = new Logger(ReservationRemindersService.name);

  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepo: Repository<Reservation>,
    private readonly pushService: PushNotificationsService,
  ) {}

  @Cron('*/15 * * * *')
  async handleUpcomingClassReminders(): Promise<void> {
    const now         = new Date();
    const windowStart = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const windowEnd   = new Date(now.getTime() + 2.25 * 60 * 60 * 1000);

    // Incluye hoy y el día de windowEnd (cubre el borde de medianoche)
    const dates = [...new Set([
      now.toISOString().split('T')[0],
      windowEnd.toISOString().split('T')[0],
    ])];

    const candidates = await this.reservationRepo
      .createQueryBuilder('r')
      .innerJoinAndSelect('r.user', 'u')
      .leftJoinAndSelect('r.activity', 'a')
      .where('r.status = :status', { status: 'CONFIRMADA' })
      .andWhere('r.reminderSent = false')
      .andWhere('r.startTime IS NOT NULL')
      .andWhere('r.reservationDate IN (:...dates)', { dates })
      .getMany();

    if (candidates.length === 0) return;

    this.logger.log(`[reminders] Evaluando ${candidates.length} reserva(s) candidatas...`);

    for (const reservation of candidates) {
      // Normalizar reservationDate a 'YYYY-MM-DD'
      const dateStr = reservation.reservationDate instanceof Date
        ? reservation.reservationDate.toISOString().split('T')[0]
        : String(reservation.reservationDate).split('T')[0];

      // startTime puede ser 'HH:mm' o 'HH:mm:ss'
      const [hh, mm] = (reservation.startTime ?? '00:00').split(':').map(Number);
      const classTime = new Date(`${dateStr}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00`);

      if (classTime < windowStart || classTime > windowEnd) continue;

      try {
        const pushToken = reservation.user?.pushToken;
        if (pushToken) {
          const activityName = reservation.activity?.name ?? 'tu clase';
          const timeLabel    = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
          await this.pushService.sendPushMessage(
            pushToken,
            'Recordatorio de clase',
            `Tu clase de ${activityName} comienza a las ${timeLabel}. Te esperamos.`,
            { type: 'RESERVATION_REMINDER', reservationId: reservation.id },
          );
        }

        reservation.reminderSent = true;
        await this.reservationRepo.save(reservation);
        this.logger.log(`[reminders] Recordatorio enviado para reserva #${reservation.id}`);
      } catch (err) {
        this.logger.error(`[reminders] Error en reserva #${reservation.id}:`, err);
      }
    }
  }
}
