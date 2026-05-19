import { Controller, Get, Post, Put, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { ReservationsService } from '../application/reservations.service';
import { CreateReservationDto } from '../application/dtos/reservations.dto';

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

  @Get()
  @ApiOperation({ summary: 'Listar reservas (filtrado por rol JWT)' })
  @ApiResponse({ status: 403, description: 'ENTRENADOR u otro rol sin permiso de listado' })
  findAll() {
    return this.svc.findAll();
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Reservas de usuario' })
  @ApiResponse({ status: 403, description: 'CLIENTE solo puede ver las propias' })
  findByUser(@Param('userId', ParseIntPipe) uid: number) {
    return this.svc.findByUser(uid);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener reserva' })
  @ApiResponse({ status: 403, description: 'Fuera del alcance del rol' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findOne(id);
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: 'Cancelar reserva' })
  @ApiResponse({ status: 403, description: 'Fuera del alcance del rol' })
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.svc.cancel(id);
  }
}
