import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
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
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { AdminLevelGuard } from '../../auth/infrastructure/guards/admin-level.guard';
import { SuperAdminGuard } from '../../auth/infrastructure/guards/super-admin.guard';
import { GymsService } from '../application/gyms.service';
import {
  CreateGymDto,
  UpdateGymDto,
  CreateGymScheduleInputDto,
  UpdateGymLocationDto,
} from '../application/dtos/gyms.dto';
import type { RequestWithUser } from '../../common/security/gym-scope';

@ApiTags('Gyms')
@Controller('gyms')
@ApiBearerAuth('access-token')
export class GymsController {
  constructor(private readonly svc: GymsService) {}

  // ── Rutas estáticas PRIMERO (antes de /:id) ────────────────────────────────

  @Post()
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Crear gimnasio con ubicación y horarios' })
  @ApiBody({ type: CreateGymDto })
  @ApiResponse({ status: 201 })
  @ApiResponse({ status: 403, description: 'Solo SUPER_ADMIN' })
  create(@Body() body: CreateGymDto) {
    return this.svc.create(body);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar sucursales físicas activas. GERENTE: solo la suya.',
  })
  @ApiQuery({ name: 'lat', required: false, example: -17.7833 })
  @ApiQuery({ name: 'lng', required: false, example: -63.1821 })
  @ApiQuery({ name: 'radius', required: false, example: 10 })
  findAll(
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('radius') radius?: string,
  ) {
    return this.svc.findAll(
      lat ? parseFloat(lat) : undefined,
      lng ? parseFloat(lng) : undefined,
      radius ? parseFloat(radius) : undefined,
    );
  }

  @Get('locations')
  @ApiOperation({ summary: 'Todas las ubicaciones GPS de sucursales (para detección por Haversine)' })
  findAllLocations() {
    return this.svc.findAllLocations();
  }

  @Get('brands')
  @UseGuards(AdminLevelGuard)
  @ApiOperation({
    summary: 'Listar Marcas corporativas (parentId IS NULL) — panel admin. Gerente (5): solo la suya. Recepcionista (4): solo la de su sede.',
  })
  @ApiResponse({ status: 200, description: 'Array de marcas activas' })
  findBrands() {
    return this.svc.findBrands();
  }

  @Get('frequent')
  @ApiOperation({
    summary:
      'Sedes más visitadas del cliente autenticado con aforo en tiempo real',
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: [
        {
          gymId: 3,
          name: 'Reyes Gym - Sede Norte',
          visitCount: 12,
          aforo: { current: 18, max: 50, percent: 36, label: 'Tranquilo' },
        },
      ],
    },
  })
  getFrequentGyms(@Req() req: RequestWithUser) {
    return this.svc.getFrequentGyms(Number(req.user!.userId));
  }

  @Get('me/dashboard-stats')
  @UseGuards(AdminLevelGuard)
  @ApiOperation({
    summary: 'Estadísticas de HOY para la sede del gerente/recepcionista',
  })
  @ApiQuery({ name: 'gymId', required: false, description: 'Solo nivel >= 10' })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        capacity: 100,
        occupancy: 12,
        totalToday: 28,
        pending: 16,
        completed: 12,
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Solo nivel administrativo (>= 4)',
  })
  getDashboardStats(
    @Req() req: RequestWithUser,
    @Query('gymId') rawGymId?: string,
  ) {
    const level = req.user?.level ?? 0;
    const gymId = req.user?.gymId;
    // Operador local (level 4): solo puede ver stats de su propia sede
    if (level < 5 && gymId) {
      return this.svc.getDashboardStats(Number(gymId));
    }
    return this.svc.getDashboardStats(
      rawGymId !== undefined ? Number(rawGymId) : undefined,
    );
  }

  @Delete('schedules/:scheduleId')
  @UseGuards(AdminLevelGuard)
  @ApiOperation({ summary: 'Eliminar horario de gimnasio' })
  @ApiParam({ name: 'scheduleId', example: 1 })
  @ApiResponse({
    status: 403,
    description: 'Solo nivel administrativo (>= 4)',
  })
  async removeSchedule(@Param('scheduleId', ParseIntPipe) scheduleId: number) {
    await this.svc.removeSchedule(scheduleId);
    return { message: 'Horario eliminado' };
  }

  // ── Rutas con parámetro dinámico (:id) DESPUÉS ────────────────────────────

  @Get(':id')
  @ApiOperation({ summary: 'Obtener gimnasio por ID' })
  @ApiParam({ name: 'id', example: 1 })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findOne(id);
  }

  @Put(':id')
  @UseGuards(AdminLevelGuard)
  @ApiOperation({
    summary: 'Actualizar datos del gimnasio. Nivel >= 5: solo su sucursal.',
  })
  @ApiParam({ name: 'id', example: 1 })
  @ApiBody({ type: UpdateGymDto })
  @ApiResponse({ status: 403, description: 'Solo nivel administrativo (>= 4)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateGymDto,
  ) {
    return this.svc.update(id, body);
  }

  @Delete(':id')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Eliminar gimnasio' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiResponse({ status: 403, description: 'Solo SUPER_ADMIN' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.svc.remove(id);
    return { message: 'Gimnasio eliminado' };
  }

  @Post(':id/schedules')
  @UseGuards(AdminLevelGuard)
  @ApiOperation({ summary: 'Agregar horario al gimnasio' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiBody({ type: CreateGymScheduleInputDto })
  @ApiResponse({
    status: 403,
    description: 'Solo nivel administrativo (>= 4)',
  })
  addSchedule(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CreateGymScheduleInputDto,
  ) {
    return this.svc.addSchedule(id, body);
  }

  @Get(':id/schedules')
  @ApiOperation({ summary: 'Listar horarios del gimnasio' })
  @ApiParam({ name: 'id', example: 1 })
  findSchedules(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findSchedules(id);
  }

  @Get(':id/occupancy')
  @ApiOperation({ summary: 'Estadísticas de ocupación por reservas completadas' })
  @ApiParam({ name: 'id', example: 11 })
  @ApiQuery({ name: 'period', required: false, enum: ['day', 'week', 'month', 'year'], description: 'Período (default: day)' })
  getOccupancy(
    @Param('id', ParseIntPipe) id: number,
    @Query('period') period?: 'day' | 'week' | 'month' | 'year',
  ) {
    return this.svc.getOccupancyStats(id, period || 'day');
  }

  @Put(':id/location')
  @UseGuards(AdminLevelGuard)
  @ApiOperation({ summary: 'Actualizar ubicación del gimnasio' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiBody({ type: UpdateGymLocationDto })
  @ApiResponse({ status: 403, description: 'Solo nivel administrativo (>= 4)' })
  updateLocation(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateGymLocationDto,
  ) {
    return this.svc.updateLocation(id, body);
  }
}
