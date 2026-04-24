import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckIn } from './domain/check-in.entity';
import { CheckinsService } from './application/checkins.service';
import { CheckinsController } from './infrastructure/checkins.controller';
@Module({
  imports: [TypeOrmModule.forFeature([CheckIn])],
  controllers: [CheckinsController],
  providers: [CheckinsService],
  exports: [CheckinsService],
})
export class CheckinsModule {}
