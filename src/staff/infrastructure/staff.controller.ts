import { Controller, Get, Patch, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';

class UpdateAppointmentStatusDto {
  @IsString()
  @IsIn(['PENDIENTE', 'COMPLETADA', 'CANCELADA'])
  status!: string;
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
  @ApiOperation({ summary: 'Agenda de HOY para el entrenador/instructor autenticado' })
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
  @ApiOperation({ summary: 'Todas las citas del nutricionista autenticado (+ perfil paciente)' })
  @ApiQuery({ name: 'today', required: false, type: Boolean, description: 'true = solo HOY' })
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
