import { Controller, Get, Post, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { ActivitiesService } from '../application/activities.service';
import { CreateActivityDto, CreateActivityScheduleDto, RegisterAttendanceDto } from '../application/dtos/activities.dto';

@ApiTags('Activities')
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly svc: ActivitiesService) {}

  @Post() @UseGuards(JwtAuthGuard) @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Crear actividad' })
  @ApiBody({ type: CreateActivityDto })
  create(@Body() body: CreateActivityDto) { return this.svc.createActivity(body); }

  @Get() @ApiOperation({ summary: 'Listar actividades' })
  findAll(@Query('gymId') gymId?: number) { return this.svc.findAllActivities(gymId); }

  @Get(':id') @ApiOperation({ summary: 'Obtener actividad' })
  findOne(@Param('id', ParseIntPipe) id: number) { return this.svc.findOneActivity(id); }

  @Post(':id/schedules')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Crear horario de actividad' })
  @ApiBody({ type: CreateActivityScheduleDto })
  @ApiResponse({ status: 201, description: 'Horario creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 403, description: 'Sin permisos o instructor no válido' })
  @ApiResponse({ status: 409, description: 'Conflicto de horario u horario fuera de apertura de la sede' })
  createSchedule(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CreateActivityScheduleDto,
  ) {
    return this.svc.createSchedule(id, body);
  }

  @Get(':id/schedules') @ApiOperation({ summary: 'Horarios de una actividad' })
  findSchedules(@Param('id', ParseIntPipe) id: number) { return this.svc.findSchedulesByActivity(id); }

  @Post('schedules/:scheduleId/attendance') @UseGuards(JwtAuthGuard) @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Registrar asistencia' })
  @ApiBody({ type: RegisterAttendanceDto })
  registerAttendance(@Param('scheduleId', ParseIntPipe) sid: number, @Body() body: RegisterAttendanceDto) { return this.svc.registerAttendance({ ...body, gymActivityScheduleId: sid }); }

  @Get('schedules/:scheduleId/attendance') @UseGuards(JwtAuthGuard) @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Asistencias de un horario' })
  findAttendances(@Param('scheduleId', ParseIntPipe) sid: number) { return this.svc.findAttendances(sid); }
}
