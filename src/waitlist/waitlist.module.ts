import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WaitlistEntry } from './domain/waitlist-entry.entity';
import { WaitlistService } from './application/waitlist.service';
import { WaitlistController } from './infrastructure/waitlist.controller';
@Module({
  imports: [TypeOrmModule.forFeature([WaitlistEntry])],
  controllers: [WaitlistController],
  providers: [WaitlistService],
  exports: [WaitlistService],
})
export class WaitlistModule {}
