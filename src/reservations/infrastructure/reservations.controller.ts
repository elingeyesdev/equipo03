import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  ParseIntPipe,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { AdminLevelGuard } from '../../auth/infrastructure/guards/admin-level.guard';
import { StaffLevelGuard } from '../../auth/infrastructure/guards/staff-level.guard';
import { ScannerGuard } from '../../auth/infrastructure/guards/scanner.guard';
import { ReservationsService } from '../application/reservations.service';
import {
  CreateReservationDto,
  CheckInReservationDto,
  CheckInByTokenDto,
  BulkStatusDto,
  WalkInDto,
} from '../application/dtos/reservations.dto';
import type { RequestWithUser } from '../../common/security/gym-scope';

@ApiTags('Reservations')
@Controller('reservations')
@ApiBearerAuth('access-token')
export class ReservationsController {
  constructor(private readonly svc: ReservationsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear reserva (cliente o admin level >= 4)' })
  @ApiBody({ type: CreateReservationDto })
  @ApiResponse({ status: 201, description: 'Reserva creada' })
  create(@Body() body: CreateReservationDto) {
    return this.svc.createReservation(body);
  }

  @Patch('bulk-status')
  @UseGuards(StaffLevelGuard)
  @ApiOperation({ summary: 'Marcar asistencia masiva: COMPLETADA o FALTO (level >= 3)' })
  @ApiBody({ type: BulkStatusDto })
  @ApiResponse({ status: 200 })
  async bulkStatus(@Body() body: BulkStatusDto) {
    await this.svc.bulkUpdateStatus(body.reservationIds, body.status);
    return { success: true };
  }

  @Post('walk-in')
  @UseGuards(StaffLevelGuard)
  @ApiOperation({ summary: 'Walk-in: crea reserva COMPLETADA sin validación de tiempo (level >= 3)' })
  @ApiBody({ type: WalkInDto })
  @ApiResponse({ status: 201 })
  async walkIn(@Body() body: WalkInDto) {
    const reservation = await this.svc.createWalkIn(body.userId, body.scheduleId);
    return { success: true, data: reservation };
  }

  @Get()
  @ApiOperation({ summary: 'Listar reservas (filtrado por nivel jerárquico)' })
  @ApiQuery({ name: 'date', required: false, example: '2026-05-25' })
  @ApiQuery({ name: 'status', required: false, example: 'CONFIRMADA' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'gymId', required: false, example: 36 })
  findAll(
    @Query('date') date?: string,
    @Query('status') status?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('gymId', new ParseIntPipe({ optional: true })) gymId?: number,
  ) {
    return this.svc.findAll({
      date,
      status,
      gymId,
      page: Number(page),
      limit: Math.min(Number(limit) || 20, 5000),
    });
  }

  @Get('me')
  @ApiOperation({ summary: 'Mis reservas (userId del JWT — aislamiento estricto)' })
  @ApiQuery({ name: 'date', required: false, example: '2026-05-25' })
  findMine(@Req() req: RequestWithUser, @Query('date') date?: string) {
    const raw = req.user?.userId;
    const userId = raw !== undefined && raw !== null ? Number(raw) : NaN;
    if (!userId || isNaN(userId)) {
      throw new UnauthorizedException('No se pudo extraer el ID del token.');
    }
    return this.svc.findByUser(userId, date);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Reservas de un usuario específico' })
  findByUser(@Param('userId', ParseIntPipe) uid: number, @Req() req: RequestWithUser) {
    const level = req.user?.level ?? 0;
    if (level <= 2) {
      const jwtId = Number(req.user?.userId);
      if (!jwtId || isNaN(jwtId)) throw new UnauthorizedException('Token inválido.');
      return this.svc.findByUser(jwtId);
    }
    return this.svc.findByUser(uid);
  }

  @Get('gym')
  @UseGuards(AdminLevelGuard)
  @ApiOperation({ summary: 'Auditoría de sede: reservas (level >= 4, auditoría global para level >= 10)' })
  @ApiQuery({ name: 'date', required: false, example: '2026-05-25' })
  findByGym(
    @Query('date') date?: string,
    @Query('status') status?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.svc.findAll({
      date,
      status,
      page: Number(page),
      limit: Math.min(Number(limit) || 20, 5000),
    });
  }

  @Get('validate')
  @UseGuards(AdminLevelGuard)
  @ApiOperation({ summary: 'Validar token QR de reserva (level >= 4)' })
  @ApiQuery({ name: 'token', type: 'string' })
  validateToken(@Query('token') token: string) {
    return this.svc.findByToken(token);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener reserva por ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findOne(id);
  }

  @Get(':id/qr-token')
  @ApiOperation({ summary: 'JWT efímero (3 min) para QR de check-in (solo dueño)' })
  getQrToken(@Param('id', ParseIntPipe) id: number) {
    return this.svc.getQrToken(id);
  }

  /** @deprecated — usar POST /check-in/token */
  @Patch(':id/check-in')
  @UseGuards(ScannerGuard)
  @ApiOperation({ summary: '[DEPRECATED] Check-in por ID — usar /check-in/token' })
  @ApiBody({ type: CheckInReservationDto })
  @ApiResponse({ status: 403, description: 'Level >= 10 bloqueado; level 4-5 valida jurisdicción' })
  checkIn(@Param('id', ParseIntPipe) id: number) {
    return this.svc.checkInReservation(id);
  }

  @Post('check-in/token')
  @UseGuards(ScannerGuard)
  @ApiOperation({ summary: 'Check-in por QR token — operadores de sucursal (level >= 4)' })
  @ApiBody({ type: CheckInByTokenDto })
  @ApiResponse({ status: 403, description: 'Operador intenta hacer check-in en sucursal ajena' })
  @ApiResponse({ status: 409, description: 'Reserva futura — se puede forzar con forceCheckIn=true' })
  checkInByToken(@Body() body: CheckInByTokenDto) {
    return this.svc.checkInByToken(body.token, body.forceCheckIn ?? false);
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: 'Cancelar reserva' })
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.svc.cancel(id);
  }

  @Put(':id/confirm')
  @UseGuards(ScannerGuard)
  @ApiOperation({ summary: 'Confirmar ingreso (level 4-5, rechaza level >= 10)' })
  confirm(@Param('id', ParseIntPipe) id: number) {
    return this.svc.confirm(id);
  }
}
