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
  @Roles('INSTRUCTOR')
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
  @Roles('INSTRUCTOR')
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
  @Roles('INSTRUCTOR')
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
