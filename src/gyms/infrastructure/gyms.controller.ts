import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiParam, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { GymsService } from '../application/gyms.service';
import {
  CreateGymDto,
  UpdateGymDto,
  CreateGymScheduleInputDto,
  UpdateGymLocationDto,
} from '../application/dtos/gyms.dto';

@ApiTags('Gyms')
@Controller('gyms')
export class GymsController {
  constructor(private readonly svc: GymsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Crear gimnasio con ubicación y horarios' })
  @ApiBody({ type: CreateGymDto })
  @ApiResponse({ status: 201, description: 'Gimnasio creado' })
  create(@Body() body: CreateGymDto) { return this.svc.create(body); }

  @Get()
  @ApiOperation({ summary: 'Listar gymnaisios activos' })
  findAll() { return this.svc.findAll(); }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener gimnasio por ID' })
  @ApiParam({ name: 'id', example: 1 })
  findOne(@Param('id', ParseIntPipe) id: number) { return this.svc.findOne(id); }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Actualizar datos del gimnasio' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiBody({ type: UpdateGymDto })
  @ApiResponse({ status: 200, description: 'Gimnasio actualizado' })
  update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateGymDto) { return this.svc.update(id, body); }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Eliminar gimnasio' })
  @ApiParam({ name: 'id', example: 1 })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.svc.remove(id);
    return { message: 'Gimnasio eliminado' };
  }

  @Post(':id/schedules')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Agregar horario al gimnasio' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiBody({ type: CreateGymScheduleInputDto })
  addSchedule(@Param('id', ParseIntPipe) id: number, @Body() body: CreateGymScheduleInputDto) {
    return this.svc.addSchedule(id, body);
  }

  @Get(':id/schedules')
  @ApiOperation({ summary: 'Listar horarios del gimnasio' })
  @ApiParam({ name: 'id', example: 1 })
  findSchedules(@Param('id', ParseIntPipe) id: number) { return this.svc.findSchedules(id); }

  @Put(':id/location')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Actualizar ubicación del gimnasio' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiBody({ type: UpdateGymLocationDto })
  updateLocation(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateGymLocationDto) {
    return this.svc.updateLocation(id, body);
  }
}
