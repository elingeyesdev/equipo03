import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ActivitiesService } from '../application/activities.service';
import {
  CreateActivityDto,
  UpdateActivityDto,
  CreateActivityScheduleDto,
  RegisterAttendanceDto,
} from '../application/dtos/activities.dto';

@ApiTags('Activities')
@Controller('activities')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class ActivitiesController {
  constructor(private readonly svc: ActivitiesService) {}

  // ── Catálogo (SUPER_ADMIN + GERENTE) ──────────────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'GERENTE')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Crear actividad (SUPER_ADMIN: global; GERENTE: su sede)',
  })
  @ApiBody({ type: CreateActivityDto })
  @ApiResponse({ status: 201, description: 'Actividad creada' })
  @ApiResponse({ status: 403, description: 'Rol sin permiso o sede ajena' })
  create(@Body() body: CreateActivityDto) {
    return this.svc.createActivity(body);
  }

  @Get()
  @ApiOperation({ summary: 'Listar actividades (incluye schedules por sede)' })
  findAll(@Query('gymId') gymId?: string) {
    return this.svc.findAllActivities(
      gymId !== undefined ? Number(gymId) : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener actividad' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findOneActivity(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'GERENTE')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Actualizar actividad (SUPER_ADMIN: global; GERENTE: su sede)',
  })
  @ApiBody({ type: UpdateActivityDto })
  @ApiResponse({ status: 200, description: 'Actividad actualizada' })
  @ApiResponse({ status: 403, description: 'Rol sin permiso o sede ajena' })
  @ApiResponse({ status: 404, description: 'Actividad no encontrada' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateActivityDto,
  ) {
    return this.svc.updateActivity(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'GERENTE')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Desactivar actividad (SUPER_ADMIN: global; GERENTE: su sede)',
  })
  @ApiResponse({ status: 200, description: 'Actividad desactivada' })
  @ApiResponse({ status: 403, description: 'Rol sin permiso o sede ajena' })
  @ApiResponse({ status: 404, description: 'Actividad no encontrada' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.svc.deleteActivity(id);
  }

  // ── Schedules ─────────────────────────────────────────────────────────────

  @Post(':id/schedules')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'GERENTE')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Crear horario de actividad' })
  @ApiBody({ type: CreateActivityScheduleDto })
  @ApiResponse({ status: 201, description: 'Horario creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos o instructor no válido',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflicto de horario u horario fuera de apertura de la sede',
  })
  createSchedule(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CreateActivityScheduleDto,
  ) {
    return this.svc.createSchedule(id, body);
  }

  @Get(':id/schedules')
  @ApiOperation({ summary: 'Horarios de una actividad' })
  findSchedules(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findSchedulesByActivity(id);
  }

  @Delete(':id/schedules/:scheduleId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'GERENTE')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Eliminar horario de actividad' })
  @ApiResponse({ status: 200, description: 'Horario eliminado' })
  @ApiResponse({ status: 404, description: 'Horario no encontrado' })
  deleteSchedule(
    @Param('id', ParseIntPipe) _actId: number,
    @Param('scheduleId', ParseIntPipe) scheduleId: number,
  ) {
    return this.svc.deleteSchedule(scheduleId);
  }

  // ── Asistencia ────────────────────────────────────────────────────────────

  @Post('schedules/:scheduleId/attendance')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Registrar asistencia' })
  @ApiBody({ type: RegisterAttendanceDto })
  registerAttendance(
    @Param('scheduleId', ParseIntPipe) sid: number,
    @Body() body: RegisterAttendanceDto,
  ) {
    return this.svc.registerAttendance({ ...body, gymActivityScheduleId: sid });
  }

  @Get('schedules/:scheduleId/attendance')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Asistencias de un horario' })
  findAttendances(@Param('scheduleId', ParseIntPipe) sid: number) {
    return this.svc.findAttendances(sid);
  }
}
