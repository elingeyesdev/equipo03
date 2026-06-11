import { Controller, Get, Post, Put, Body, Param, Req, UseGuards, ParseIntPipe, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CheckinsService } from '../application/checkins.service';
import { CreateCheckInDto } from '../application/dtos/checkins.dto';
import type { RequestWithUser } from '../../common/security/gym-scope';

@ApiTags('Check-ins')
@Controller('checkins')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class CheckinsController {
  constructor(private readonly svc: CheckinsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('GERENTE', 'SUPER_ADMIN', 'RECEPCIONISTA')
  @ApiOperation({ summary: 'Registrar ingreso de personal. gymId extraído del JWT del GERENTE.' })
  @ApiBody({ type: CreateCheckInDto })
  create(@Req() req: RequestWithUser, @Body() body: CreateCheckInDto) {
    const gymId = req.user!.gymId;
    if (!gymId) throw new ForbiddenException('GERENTE sin sede asignada en el token.');
    return this.svc.createCheckIn(body.userId, gymId, body.method);
  }

  @Get('history')
  @ApiOperation({ summary: 'Historial de auditoría. GERENTE: solo su sede. USER: solo el propio.' })
  getHistory() {
    return this.svc.findAllHistory();
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'GERENTE', 'RECEPCIONISTA')
  @ApiOperation({ summary: 'Listar check-ins. GERENTE/RECEPCIONISTA: filtrado a su sede.' })
  findAll(@Req() req: RequestWithUser) {
    const role  = req.user?.role?.toUpperCase();
    const gymId = req.user?.gymId;
    if (role === 'RECEPCIONISTA' && gymId) {
      return this.svc.findByGym(Number(gymId));
    }
    return this.svc.findAll();
  }

  @Get('user/:userId')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'GERENTE', 'RECEPCIONISTA')
  @ApiOperation({ summary: 'Check-ins de un usuario específico' })
  findByUser(@Param('userId', ParseIntPipe) uid: number) {
    return this.svc.findByUser(uid);
  }

  @Get('gym/:gymId')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'GERENTE', 'RECEPCIONISTA')
  @ApiOperation({ summary: 'Check-ins de una sede específica' })
  findByGym(@Param('gymId', ParseIntPipe) gid: number) {
    return this.svc.findByGym(gid);
  }

  @Put(':id/checkout')
  @UseGuards(RolesGuard)
  @Roles('GERENTE', 'SUPER_ADMIN', 'RECEPCIONISTA')
  @ApiOperation({ summary: 'Registrar salida' })
  checkOut(@Param('id', ParseIntPipe) id: number) {
    return this.svc.checkOut(id);
  }
}
