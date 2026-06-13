import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import {
  IsIn,
  IsString,
  IsInt,
  IsArray,
  ValidateNested,
  Matches,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import type { RequestWithUser } from '../../common/security/gym-scope';

class UpdateAppointmentStatusDto {
  @IsString()
  @IsIn(['PENDIENTE', 'COMPLETADA', 'CANCELADA'])
  status!: string;
}

const HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/;

class ScheduleSlotDto {
  @ApiProperty({ example: 1, description: '0=Dom, 1=Lun … 6=Sáb' })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @ApiProperty({ example: '08:00', description: 'Formato 24h HH:mm' })
  @Matches(HH_MM, {
    message: 'startTime debe tener formato HH:mm (24h), ej. 08:00',
  })
  startTime!: string;

  @ApiProperty({ example: '16:00', description: 'Formato 24h HH:mm' })
  @Matches(HH_MM, {
    message: 'endTime debe tener formato HH:mm (24h), ej. 16:00',
  })
  endTime!: string;
}

class AssignScheduleDto {
  @ApiProperty({ example: 2, description: 'ID de la sucursal' })
  @IsInt()
  gymId!: number;

  @ApiProperty({ type: [ScheduleSlotDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleSlotDto)
  schedules!: ScheduleSlotDto[];
}
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { StaffService } from '../application/staff.service';

@ApiTags('Staff')
@Controller('staff')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class StaffController {
  constructor(private readonly svc: StaffService) {}

  /**
   * Clases del entrenador/instructor para HOY.
   * Roles permitidos: ENTRENADOR, INSTRUCTOR, TRAINER.
   * GET /api/staff/agenda/classes
   */
  @Get('agenda/classes')
  @Roles('ENTRENADOR', 'INSTRUCTOR', 'TRAINER')
  @ApiOperation({
    summary: 'Agenda de HOY para el entrenador/instructor autenticado',
  })
  @ApiResponse({
    status: 200,
    description: 'Array de clases asignadas hoy al instructor',
    schema: {
      example: [
        {
          id: 3,
          startTime: '08:00',
          endTime: '09:00',
          className: 'Spinning',
          maxAttendees: 20,
          enrolledCount: 15,
        },
      ],
    },
  })
  @ApiResponse({ status: 403, description: 'Rol no permitido' })
  getTodayClasses() {
    return this.svc.getTodayClasses();
  }

  @Get('my-appointments')
  @Roles('NUTRICIONISTA', 'NUTRITIONIST')
  @ApiOperation({
    summary:
      'Todas las citas del nutricionista autenticado (+ perfil paciente)',
  })
  @ApiQuery({
    name: 'today',
    required: false,
    type: Boolean,
    description: 'true = solo HOY',
  })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 403, description: 'Rol no permitido' })
  getMyAppointments(@Query('today') today?: string) {
    return this.svc.getMyAppointments(today === 'true');
  }

  @Patch('appointments/:id/status')
  @Roles('NUTRICIONISTA', 'NUTRITIONIST')
  @ApiOperation({ summary: 'Actualizar estado de cita nutricional' })
  @ApiParam({ name: 'id', example: 7 })
  @ApiBody({ type: UpdateAppointmentStatusDto })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 403, description: 'No es su cita' })
  @ApiResponse({ status: 404, description: 'Cita no encontrada' })
  updateAppointmentStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateAppointmentStatusDto,
  ) {
    return this.svc.updateAppointmentStatus(id, body.status);
  }

  @Get('me/stats/attendance')
  @Roles('ENTRENADOR', 'INSTRUCTOR', 'TRAINER')
  @ApiOperation({
    summary:
      'Historial de asistencias reales (COMPLETADA) del instructor — últimos 30 días, agrupado por clase/horario',
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: [
        {
          scheduleId: 3,
          time: '08:00',
          className: 'Musculación Pro',
          totalCompleted: 45,
        },
        {
          scheduleId: 7,
          time: '18:00',
          className: 'Zumba',
          totalCompleted: 82,
        },
      ],
    },
  })
  @ApiResponse({ status: 403, description: 'Rol no permitido' })
  getAttendanceStats() {
    return this.svc.getAttendanceStats();
  }

  @Get('me/students')
  @Roles('ENTRENADOR', 'INSTRUCTOR', 'TRAINER')
  @ApiOperation({
    summary: 'Alumnos inscritos en las clases del instructor autenticado',
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: [
        {
          reservationId: 101,
          clientName: 'Aaron Sendoya',
          className: 'Zumba',
          startTime: '08:00',
          endTime: '09:00',
          reservationDate: '2026-06-12T00:00:00.000Z',
        },
      ],
    },
  })
  @ApiResponse({ status: 403, description: 'Rol no permitido' })
  getMyStudents() {
    return this.svc.getMyStudents();
  }

  @Get('me/schedules')
  @Roles('ENTRENADOR', 'INSTRUCTOR', 'TRAINER')
  @ApiOperation({
    summary:
      'Clases de HOY del instructor autenticado con inscritos y lista de alumnos',
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: [
        {
          id: 1,
          className: 'Zumba',
          gymName: 'Corpus Centro',
          dayOfWeek: 'LUNES',
          startTime: '08:00',
          endTime: '09:00',
          maxCapacity: 20,
          enrolledCount: 15,
          attendees: [{ id: 7, fullName: 'Ana García' }],
        },
      ],
    },
  })
  @ApiResponse({ status: 403, description: 'Rol no permitido' })
  getMySchedules() {
    return this.svc.getMySchedules();
  }

  @Get('me/weekly-schedules')
  @Roles('ENTRENADOR', 'INSTRUCTOR', 'TRAINER')
  @ApiOperation({
    summary:
      'Todos los horarios semanales del instructor (sin filtro de día) con aforo de hoy',
  })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 403, description: 'Rol no permitido' })
  getMyWeeklySchedules() {
    return this.svc.getMyWeeklySchedules();
  }

  @Get('catalog')
  @Roles('USER', 'CLIENTE')
  @ApiOperation({
    summary: 'Catálogo público de Entrenadores y Nutricionistas disponibles',
    description:
      'Devuelve nombre completo, rol, especialidad, avatar, enlace de contacto y sede. No expone datos sensibles.',
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: [
        {
          id: 12,
          fullName: 'Luis Mamani',
          role: 'ENTRENADOR',
          branchName: 'Corpus - Sede Norte',
          brandName: 'Corpus Gym',
          specialty: 'AVANZADO',
        },
      ],
    },
  })
  @ApiResponse({ status: 403, description: 'Solo clientes autenticados' })
  getCatalog() {
    return this.svc.getCatalog();
  }

  @Get('advisors/my-requests')
  @Roles('USER', 'CLIENTE')
  @ApiOperation({ summary: 'Solicitudes de asesoría enviadas por el cliente autenticado' })
  @ApiResponse({ status: 200 })
  getMyAdvisorRequests() {
    return this.svc.getMyAdvisorRequests();
  }

  @Get('advisors/my-plan')
  @Roles('USER', 'CLIENTE')
  @ApiOperation({ summary: 'Plan nutricional asignado al cliente por su asesor activo' })
  @ApiResponse({ status: 200, description: 'Devuelve el plan o null si no existe' })
  getMyPlan() {
    return this.svc.getMyPlan();
  }

  @Post('advisors/request')
  @Roles('USER', 'CLIENTE')
  @ApiOperation({ summary: 'Solicitar un asesor (Entrenador o Nutricionista)' })
  @ApiBody({
    schema: {
      example: { advisorId: 12 },
      properties: { advisorId: { type: 'integer' } },
      required: ['advisorId'],
    },
  })
  @ApiResponse({ status: 201, description: 'Solicitud creada con estado PENDING' })
  @ApiResponse({ status: 400, description: 'Solicitud inválida o duplicada activa' })
  @ApiResponse({ status: 409, description: 'Ya existe una solicitud pendiente o activa' })
  requestAdvisor(
    @Req() req: RequestWithUser,
    @Body('advisorId', ParseIntPipe) advisorId: number,
  ) {
    return this.svc.requestAdvisor(Number(req.user!.userId), advisorId);
  }

  @Get('advisors/requests')
  @Roles('ENTRENADOR', 'NUTRICIONISTA')
  @ApiOperation({ summary: 'Solicitudes de asesoría PENDIENTES recibidas por el asesor autenticado' })
  @ApiResponse({ status: 200 })
  getPendingAdvisorRequests() {
    return this.svc.getPendingAdvisorRequests();
  }

  @Patch('advisors/:id/accept')
  @Roles('ENTRENADOR', 'NUTRICIONISTA')
  @ApiOperation({ summary: 'Aceptar una solicitud de asesoría (solo el asesor destinatario)' })
  @ApiParam({ name: 'id', example: 1, description: 'ID de la relación client_advisors' })
  @ApiResponse({ status: 200, description: 'Relación cambiada a ACTIVE' })
  @ApiResponse({ status: 403, description: 'No eres el asesor destinatario' })
  @ApiResponse({ status: 404, description: 'Solicitud no encontrada' })
  acceptAdvisorship(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.svc.acceptAdvisorship(id, Number(req.user!.userId));
  }

  @Patch('advisors/:id/reject')
  @Roles('ENTRENADOR', 'NUTRICIONISTA')
  @ApiOperation({ summary: 'Rechazar una solicitud de asesoría' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiResponse({ status: 200, description: 'Relación cambiada a REJECTED' })
  rejectAdvisorship(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.svc.rejectAdvisorship(id, Number(req.user!.userId));
  }

  @Patch('advisors/:id/cancel')
  @Roles('USER', 'CLIENTE', 'ENTRENADOR', 'NUTRICIONISTA')
  @ApiOperation({ summary: 'Cancelar una asesoría activa (cliente o asesor)' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiResponse({ status: 200, description: 'Asesoría cancelada, plan y rutinas reiniciados' })
  @ApiResponse({ status: 403, description: 'No participas en esta asesoría' })
  @ApiResponse({ status: 400, description: 'La asesoría no está activa' })
  cancelAdvisorship(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.svc.cancelAdvisorship(id, Number(req.user!.userId));
  }

  @Get('advisors/active-clients')
  @Roles('ENTRENADOR', 'NUTRICIONISTA')
  @ApiOperation({ summary: 'Clientes con relación ACTIVE para el asesor autenticado' })
  @ApiResponse({ status: 200 })
  getActiveAdvisees() {
    return this.svc.getActiveAdvisees();
  }

  @Get('clients/:clientId')
  @Roles('ENTRENADOR', 'NUTRICIONISTA')
  @ApiOperation({ summary: 'Perfil + últimas métricas de un cliente (requiere relación ACTIVE)' })
  @ApiParam({ name: 'clientId', example: 5 })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 403, description: 'Sin relación activa con este cliente' })
  getClientProfile(@Param('clientId', ParseIntPipe) clientId: number) {
    return this.svc.getClientProfile(clientId);
  }

  @Post('clients/:clientId/plan')
  @Roles('ENTRENADOR', 'NUTRICIONISTA')
  @ApiOperation({ summary: 'Crear o actualizar plan nutricional del entrenador para un cliente' })
  @ApiParam({ name: 'clientId', example: 5 })
  @ApiBody({
    schema: {
      properties: {
        dailyKcal: { type: 'integer', example: 2200 },
        proteinG:  { type: 'number',  example: 150  },
        carbsG:    { type: 'number',  example: 250  },
        fatG:      { type: 'number',  example: 70   },
        planNotes: { type: 'string',  example: 'Evitar azúcares simples después de las 6pm.' },
        mealPlan:  { type: 'object',  example: { LUNES: { desayuno: 'Avena con frutas', almuerzo: 'Pollo con arroz', cena: 'Ensalada', merienda: 'Yogur' } } },
      },
    },
  })
  @ApiResponse({ status: 201 })
  upsertTrainerPlan(
    @Param('clientId', ParseIntPipe) clientId: number,
    @Body() body: {
      dailyKcal?: number;
      proteinG?:  number;
      carbsG?:    number;
      fatG?:      number;
      planNotes?: string;
    },
  ) {
    return this.svc.upsertTrainerPlan(clientId, body);
  }

  @Get('clients/:clientId/plan')
  @Roles('ENTRENADOR', 'NUTRICIONISTA')
  @ApiOperation({ summary: 'Obtener el plan nutricional guardado para un cliente' })
  @ApiParam({ name: 'clientId', example: 5 })
  @ApiResponse({ status: 200 })
  getTrainerPlan(@Param('clientId', ParseIntPipe) clientId: number) {
    return this.svc.getTrainerPlan(clientId);
  }

  @Post(':userId/schedules')
  @Roles('GERENTE', 'SUPER_ADMIN')
  @ApiOperation({
    summary: 'Asignar horario laboral a un empleado (reemplaza el existente)',
  })
  @ApiParam({ name: 'userId', example: 5 })
  @ApiBody({ type: AssignScheduleDto })
  @ApiResponse({ status: 201, description: 'Horario asignado' })
  @ApiResponse({
    status: 403,
    description: 'Sede fuera de la marca del gerente',
  })
  assignSchedule(
    @Req() req: RequestWithUser,
    @Param('userId', ParseIntPipe) targetUserId: number,
    @Body() body: AssignScheduleDto,
  ) {
    const isSuperAdmin = req.user!.role === 'SUPER_ADMIN';
    const managerGymId = Number(req.user!.gymId ?? req.user!.brandId);
    return this.svc.assignSchedule(
      managerGymId,
      targetUserId,
      body.gymId,
      body.schedules,
      isSuperAdmin,
    );
  }

  @Get(':userId/schedules')
  @Roles('GERENTE', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Ver horarios laborales de un empleado' })
  @ApiParam({ name: 'userId', example: 5 })
  @ApiResponse({ status: 200 })
  getSchedules(@Param('userId', ParseIntPipe) targetUserId: number) {
    return this.svc.getStaffSchedules(targetUserId);
  }

  /**
   * Citas nutricionales del nutricionista para HOY.
   * Roles permitidos: NUTRICIONISTA, NUTRITIONIST.
   * GET /api/staff/agenda/appointments
   */
  @Get('agenda/appointments')
  @Roles('NUTRICIONISTA', 'NUTRITIONIST')
  @ApiOperation({ summary: 'Agenda de HOY para el nutricionista autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Array de citas nutricionales de hoy',
    schema: {
      example: [
        {
          id: 7,
          startTime: '10:00',
          appointmentType: 'CONSULTA',
          status: 'PENDIENTE',
          patientName: 'Ana García',
        },
      ],
    },
  })
  @ApiResponse({ status: 403, description: 'Rol no permitido' })
  getTodayAppointments() {
    return this.svc.getTodayAppointments();
  }
}
