import { Controller, Get, Post, Put, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { ReservationsService } from '../application/reservations.service';
import { CreateReservationDto } from '../application/dtos/reservations.dto';

@ApiTags('Reservations')
@Controller('reservations')
@UseGuards(JwtAuthGuard) @ApiBearerAuth('access-token')
export class ReservationsController {
  constructor(private readonly svc: ReservationsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear reserva' })
  @ApiBody({ type: CreateReservationDto })
  @ApiResponse({ status: 201, description: 'Reserva creada' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 403, description: 'Sin permiso para esta sede' })
  @ApiResponse({ status: 409, description: 'Cupo agotado o reserva duplicada' })
  create(@Body() body: CreateReservationDto) {
    return this.svc.create(body);
  }

  @Get() @ApiOperation({ summary: 'Listar reservas' })
  findAll() { return this.svc.findAll(); }

  @Get('user/:userId') @ApiOperation({ summary: 'Reservas de usuario' })
  findByUser(@Param('userId', ParseIntPipe) uid: number) { return this.svc.findByUser(uid); }

  @Get(':id') @ApiOperation({ summary: 'Obtener reserva' })
  findOne(@Param('id', ParseIntPipe) id: number) { return this.svc.findOne(id); }

  @Put(':id/cancel') @ApiOperation({ summary: 'Cancelar reserva' })
  cancel(@Param('id', ParseIntPipe) id: number) { return this.svc.cancel(id); }
}
