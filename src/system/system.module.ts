import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemSetting } from './domain/system-setting.entity';
import { SystemService } from './application/system.service';
import { SystemController } from './infrastructure/system.controller';
@Module({
  imports: [TypeOrmModule.forFeature([SystemSetting])],
  controllers: [SystemController],
  providers: [SystemService],
  exports: [SystemService],
})
export class SystemModule {}
