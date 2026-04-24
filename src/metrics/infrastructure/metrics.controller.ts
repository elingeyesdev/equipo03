import { Controller, Get, Post, Delete, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { MetricsService } from '../application/metrics.service';
import { CreateMetricDto } from '../application/dtos/metrics.dto';

@ApiTags('Metrics')
@Controller('metrics')
@UseGuards(JwtAuthGuard) @ApiBearerAuth('access-token')
export class MetricsController {
  constructor(private readonly svc: MetricsService) {}

  @Post() @ApiOperation({ summary: 'Registrar medición física' })
  @ApiBody({ type: CreateMetricDto })
  create(@Body() body: CreateMetricDto) { return this.svc.create(body); }

  @Get() @ApiOperation({ summary: 'Listar métricas' })
  findAll() { return this.svc.findAll(); }

  @Get('user/:userId') @ApiOperation({ summary: 'Historial de métricas de usuario' })
  findByUser(@Param('userId', ParseIntPipe) uid: number) { return this.svc.findByUser(uid); }

  @Get('user/:userId/latest') @ApiOperation({ summary: 'Última medición del usuario' })
  findLatest(@Param('userId', ParseIntPipe) uid: number) { return this.svc.findLatest(uid); }

  @Get(':id') @ApiOperation({ summary: 'Obtener métrica por ID' })
  findOne(@Param('id', ParseIntPipe) id: number) { return this.svc.findOne(id); }

  @Delete(':id') @ApiOperation({ summary: 'Eliminar métrica' })
  async remove(@Param('id', ParseIntPipe) id: number) { await this.svc.remove(id); return { message: 'Métrica eliminada' }; }
}
