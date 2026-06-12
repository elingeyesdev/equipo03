import { Controller, Get, Post, Patch, Put, Body, Param, Query, Request, UseGuards, ParseIntPipe, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ReservationsService } from '../application/reservations.service';
import { CreateReservationDto, CheckInReservationDto, CheckInByTokenDto, BulkStatusDto, WalkInDto } from '../application/dtos/reservations.dto';

@ApiTags('Reservations')
@Controller('reservations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class ReservationsController {
  constructor(private readonly svc: ReservationsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear reserva (CLIENTE o GERENTE)' })
  @ApiBody({ type: CreateReservationDto })
  @ApiResponse({ status: 201, description: 'Reserva creada' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o targetUserId faltante (gerente)' })
  @ApiResponse({
    status: 403,
    description:
      'SUPER_ADMIN/ENTRENADOR no pueden crear; gerente en otra sede; rol sin permiso',
  })
  @ApiResponse({ status: 404, description: 'Horario o usuario objetivo no encontrado' })
  @ApiResponse({ status: 409, description: 'Cupo agotado o reserva duplicada' })
  create(@Body() body: CreateReservationDto) {
    return this.svc.createReservation(body);
  }

  @Patch('bulk-status')
  @UseGuards(RolesGuard)
  @Roles('INSTRUCTOR', 'ENTRENADOR', 'GERENTE', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Marcar asistencia masiva: COMPLETADA o FALTO' })
  @ApiBody({ type: BulkStatusDto })
  @ApiResponse({ status: 200 })
  async bulkStatus(@Body() body: BulkStatusDto) {
    await this.svc.bulkUpdateStatus(body.reservationIds, body.status);
    return { success: true };
  }

  @Post('walk-in')
  @UseGuards(RolesGuard)
  @Roles('INSTRUCTOR', 'ENTRENADOR', 'GERENTE', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Walk-in: crea reserva COMPLETADA sin validación de tiempo' })
  @ApiBody({ type: WalkInDto })
  @ApiResponse({ status: 201 })
  async walkIn(@Body() body: WalkInDto) {
    const reservation = await this.svc.createWalkIn(body.userId, body.scheduleId);
    return { success: true, data: reservation };
  }

  @Get()
  @ApiOperation({ summary: 'Listar reservas (filtrado por rol JWT)' })
  @ApiQuery({ name: 'date',   required: false, example: '2026-05-25',   description: 'Filtrar por fecha YYYY-MM-DD' })
  @ApiQuery({ name: 'status', required: false, example: 'CONFIRMADA',   description: 'Filtrar por estado exacto (CONFIRMADA|COMPLETADA|CANCELADA|PENDIENTE)' })
  @ApiQuery({ name: 'page',   required: false, example: 1,              description: 'Página (default 1)' })
  @ApiQuery({ name: 'limit',  required: false, example: 20,             description: 'Registros por página (default 20, máx 100)' })
  @ApiQuery({ name: 'gymId',  required: false, example: 36,             description: 'Filtrar por sede (gymId)' })
  @ApiResponse({ status: 403, description: 'ENTRENADOR u otro rol sin permiso de listado' })
  findAll(
    @Query('date')   date?: string,
    @Query('status') status?: string,
    @Query('page')   page  = 1,
    @Query('limit')  limit = 20,
    @Query('gymId', new ParseIntPipe({ optional: true })) gymId?: number,
  ) {
    return this.svc.findAll({
      date,
      status,
      gymId,
      page:  Number(page),
      limit: Math.min(Number(limit) || 20, 100),
    });
  }

  /**
   * GET /api/reservations/me
   * "Mis Reservas" — userId tomado EXCLUSIVAMENTE del JWT.
   * El cliente nunca puede inyectar un ID ajeno aquí.
   */
  @Get('me')
  @ApiOperation({ summary: 'Mis reservas (userId del JWT — aislamiento estricto)' })
  @ApiQuery({ name: 'date', required: false, example: '2026-05-25' })
  @ApiResponse({ status: 200, description: 'Reservas del usuario autenticado' })
  @ApiResponse({ status: 401, description: 'Token sin userId válido' })
  findMine(@Request() req: any, @Query('date') date?: string) {
    // Fallback: cubre req.user.userId (JwtStrategy actual), .id y .sub
    const raw = req.user?.userId ?? req.user?.id ?? req.user?.sub;
    const userId = raw !== undefined && raw !== null ? Number(raw) : NaN;

    if (!userId || isNaN(userId)) {
      throw new UnauthorizedException('No se pudo extraer el ID del token. Vuelve a iniciar sesión.');
    }

    return this.svc.findByUser(userId, date);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Reservas de usuario (GERENTE/SUPER_ADMIN pueden especificar ID)' })
  @ApiResponse({ status: 403, description: 'CLIENTE solo puede ver las propias' })
  findByUser(@Param('userId', ParseIntPipe) uid: number, @Request() req: any) {
    const role: string = (req.user?.role ?? '').toUpperCase();
    if (role === 'CLIENTE' || role === 'USER') {
      // CLIENTE nunca puede pedir reservas ajenas — fuerza JWT userId
      const raw = req.user?.userId ?? req.user?.id ?? req.user?.sub;
      const jwtId = raw !== undefined ? Number(raw) : NaN;
      if (!jwtId || isNaN(jwtId)) throw new UnauthorizedException('Token inválido.');
      return this.svc.findByUser(jwtId);
    }
    return this.svc.findByUser(uid);
  }

  /**
   * Ruta de auditoría de puerta para GERENTE y SUPER_ADMIN.
   * Devuelve reservas CONFIRMADA + COMPLETADA de la sede del gerente
   * con usuario, perfil, actividad e instructor ya populados.
   * El scope de gymId se aplica automáticamente desde el JWT (applyListScope).
   *
   * GET /api/reservations/gym
   * GET /api/reservations/gym?date=2026-05-25
   */
  @Get('gym')
  @UseGuards(RolesGuard)
  @Roles('GERENTE', 'SUPER_ADMIN', 'RECEPCIONISTA')
  @ApiOperation({
    summary: 'Auditoría de sede: reservas CONFIRMADA/COMPLETADA (GERENTE / SUPER_ADMIN)',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    example: '2026-05-25',
    description: 'Filtrar por fecha YYYY-MM-DD (opcional)',
  })
  @ApiResponse({ status: 200, description: 'Lista de reservas con usuario, actividad e instructor' })
  @ApiResponse({ status: 403, description: 'Rol sin permiso' })
  findByGym(
    @Query('date')   date?: string,
    @Query('status') status?: string,
    @Query('page')   page  = 1,
    @Query('limit')  limit = 20,
  ) {
    return this.svc.findAll({
      date,
      status,
      page:  Number(page),
      limit: Math.min(Number(limit) || 20, 100),
    });
  }

  @Get('validate')
  @UseGuards(RolesGuard)
  @Roles('GERENTE', 'SUPER_ADMIN', 'RECEPCIONISTA')
  @ApiOperation({ summary: 'Validar token QR de reserva' })
  @ApiQuery({ name: 'token', type: 'string', description: 'UUID de reserva' })
  @ApiResponse({ status: 200, description: 'Reserva validada exitosamente' })
  validateToken(@Query('token') token: string) {
    return this.svc.findByToken(token);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener reserva' })
  @ApiResponse({ status: 403, description: 'Fuera del alcance del rol' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findOne(id);
  }

  /**
   * Genera un JWT efímero (3 min) para usar como código QR de check-in.
   * Solo el dueño de la reserva puede pedirlo.
   * GET /api/reservations/:id/qr-token
   */
  @Get(':id/qr-token')
  @ApiOperation({ summary: 'Obtener JWT efímero (3 min) para QR de check-in (solo dueño de la reserva)' })
  @ApiResponse({ status: 200, description: '{ qrToken: string } — JWT que expira en 3 minutos' })
  @ApiResponse({ status: 400, description: 'Reserva no está CONFIRMADA' })
  @ApiResponse({ status: 403, description: 'La reserva no te pertenece' })
  @ApiResponse({ status: 404, description: 'Reserva no encontrada' })
  getQrToken(@Param('id', ParseIntPipe) id: number) {
    return this.svc.getQrToken(id);
  }

  /** @deprecated — vulnerable a race conditions. Usar POST /check-in/token */
  @Patch(':id/check-in')
  @UseGuards(RolesGuard)
  @Roles('GERENTE', 'SUPER_ADMIN', 'RECEPCIONISTA')
  @ApiOperation({ summary: '[DEPRECATED] Check-in por ID (usar /check-in/token)' })
  @ApiBody({ type: CheckInReservationDto })
  @ApiResponse({ status: 200, description: 'Check-in registrado, reserva marcada COMPLETADA' })
  @ApiResponse({ status: 400, description: 'Reserva no está CONFIRMADA' })
  @ApiResponse({ status: 403, description: 'Rol sin permiso o reserva de otra sucursal' })
  @ApiResponse({ status: 404, description: 'Reserva no encontrada' })
  checkIn(@Param('id', ParseIntPipe) id: number) {
    return this.svc.checkInReservation(id);
  }

  /**
   * Endpoint seguro de escaneo QR.
   * Recibe el token opaco del QR, aplica bloqueo pesimista y valida sede estrictamente.
   * POST /api/reservations/check-in/token
   */
  @Post('check-in/token')
  @UseGuards(RolesGuard)
  @Roles('GERENTE', 'SUPER_ADMIN', 'RECEPCIONISTA')
  @ApiOperation({ summary: 'Check-in por QR token — bloqueo pesimista, anti-fraude (GERENTE / SUPER_ADMIN)' })
  @ApiBody({ type: CheckInByTokenDto })
  @ApiResponse({ status: 201, description: 'Check-in registrado, reserva COMPLETADA' })
  @ApiResponse({ status: 400, description: 'Reserva no está CONFIRMADA' })
  @ApiResponse({ status: 403, description: 'QR de otra sucursal o rol sin permiso' })
  @ApiResponse({ status: 404, description: 'QR inválido o reserva no encontrada' })
  checkInByToken(@Body() body: CheckInByTokenDto) {
    return this.svc.checkInByToken(body.token);
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: 'Cancelar reserva' })
  @ApiResponse({ status: 403, description: 'Fuera del alcance del rol' })
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.svc.cancel(id);
  }

  @Put(':id/confirm')
  @UseGuards(RolesGuard)
  @Roles('GERENTE', 'SUPER_ADMIN', 'RECEPCIONISTA')
  @ApiOperation({ summary: 'Confirmar ingreso de una reserva (marca como COMPLETADA)' })
  @ApiResponse({ status: 200, description: 'Reserva actualizada a COMPLETADA' })
  @ApiResponse({ status: 400, description: 'Reserva ya completada o cancelada' })
  @ApiResponse({ status: 403, description: 'Rol sin permiso o de otra sucursal' })
  @ApiResponse({ status: 404, description: 'Reserva no encontrada' })
  confirm(@Param('id', ParseIntPipe) id: number) {
    return this.svc.confirm(id);
  }
}
