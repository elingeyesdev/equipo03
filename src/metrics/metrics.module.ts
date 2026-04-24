import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PhysicalMetricsHistory } from './domain/physical-metrics-history.entity';
import { MetricsService } from './application/metrics.service';
import { MetricsController } from './infrastructure/metrics.controller';
@Module({
  imports: [TypeOrmModule.forFeature([PhysicalMetricsHistory])],
  controllers: [MetricsController],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}
