import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Req,
  UseGuards,
  ParseIntPipe,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AdminLevelGuard } from '../../auth/infrastructure/guards/admin-level.guard';
import { ScannerGuard } from '../../auth/infrastructure/guards/scanner.guard';
import { CheckinsService } from '../application/checkins.service';
import { CreateCheckInDto } from '../application/dtos/checkins.dto';
import type { RequestWithUser } from '../../common/security/gym-scope';

@ApiTags('Check-ins')
@Controller('checkins')
@ApiBearerAuth('access-token')
export class CheckinsController {
  constructor(private readonly svc: CheckinsService) {}

  @Post()
  @UseGuards(ScannerGuard)
  @ApiOperation({ summary: 'Registrar ingreso de personal (level 4-5, rechaza level >= 10)' })
  @ApiBody({ type: CreateCheckInDto })
  create(@Req() req: RequestWithUser, @Body() body: CreateCheckInDto) {
    const gymId = req.user!.gymId;
    if (!gymId)
      throw new ForbiddenException('Usuario sin sede asignada en el token.');
    return this.svc.createCheckIn(body.userId, gymId, body.method);
  }

  @Get('history')
  @ApiOperation({ summary: 'Historial de auditoría de check-ins' })
  getHistory() {
    return this.svc.findAllHistory();
  }

  @Get()
  @UseGuards(AdminLevelGuard)
  @ApiOperation({ summary: 'Listar check-ins (level >= 10 sin filtro, level 4-5 filtrado a su sede)' })
  findAll(@Req() req: RequestWithUser) {
    const level = req.user?.level ?? 0;
    const gymId = req.user?.gymId;
    if (level < 10 && gymId) {
      return this.svc.findByGym(Number(gymId));
    }
    return this.svc.findAll();
  }

  @Get('user/:userId')
  @UseGuards(AdminLevelGuard)
  @ApiOperation({ summary: 'Check-ins de un usuario específico (level >= 4)' })
  findByUser(@Param('userId', ParseIntPipe) uid: number) {
    return this.svc.findByUser(uid);
  }

  @Get('gym/:gymId')
  @UseGuards(AdminLevelGuard)
  @ApiOperation({ summary: 'Check-ins de una sede específica (level >= 4)' })
  findByGym(@Param('gymId', ParseIntPipe) gid: number) {
    return this.svc.findByGym(gid);
  }

  @Put(':id/checkout')
  @UseGuards(ScannerGuard)
  @ApiOperation({ summary: 'Registrar salida (level 4-5, rechaza level >= 10)' })
  checkOut(@Param('id', ParseIntPipe) id: number) {
    return this.svc.checkOut(id);
  }
}
