import { Injectable, Logger, Optional } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, LessThan } from 'typeorm';
import { CheckIn } from '../domain/check-in.entity';
import { GymGateway } from '../../notifications/infrastructure/gym.gateway';

const AUTO_CHECKOUT_HOURS = 4;

@Injectable()
export class CheckinsSchedulerService {
  private readonly logger = new Logger(CheckinsSchedulerService.name);

  constructor(
    @InjectRepository(CheckIn) private readonly repo: Repository<CheckIn>,
    @Optional() private readonly gymGateway?: GymGateway,
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async autoCheckout(): Promise<void> {
    const cutoff = new Date(Date.now() - AUTO_CHECKOUT_HOURS * 60 * 60 * 1000);

    const stale = await this.repo.find({
      where: { checkOutTime: IsNull(), status: 'ACTIVO', checkInTime: LessThan(cutoff) },
      select: ['id', 'gymId'],
    });

    if (stale.length === 0) return;

    const ids = stale.map((c) => c.id);
    await this.repo
      .createQueryBuilder()
      .update(CheckIn)
      .set({ checkOutTime: () => 'NOW()', status: 'COMPLETADO' })
      .whereInIds(ids)
      .execute();

    const gymIds = [...new Set(stale.map((c) => c.gymId).filter(Boolean))];
    for (const gymId of gymIds) {
      const current = await this.repo.count({
        where: { gymId, checkOutTime: IsNull(), status: 'ACTIVO' },
      });
      this.gymGateway?.emitToGym(gymId, 'aforo_updated', { gymId, current });
    }

    this.logger.log(`Auto-checkout: ${stale.length} check-ins cerrados (>${AUTO_CHECKOUT_HOURS}h sin salida)`);
  }
}
