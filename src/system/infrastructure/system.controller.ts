import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { SystemService } from '../application/system.service';
import { CreateSettingDto, UpdateSettingDto } from '../application/dtos/system.dto';

@ApiTags('System')
@Controller('system/settings')
@UseGuards(JwtAuthGuard) @ApiBearerAuth('access-token')
export class SystemController {
  constructor(private readonly svc: SystemService) {}

  @Post() @ApiOperation({ summary: 'Crear configuración del sistema' })
  @ApiBody({ type: CreateSettingDto })
  create(@Body() body: CreateSettingDto) { return this.svc.create(body); }

  @Get() @ApiOperation({ summary: 'Listar configuraciones' })
  findAll() { return this.svc.findAll(); }

  @Get(':key') @ApiOperation({ summary: 'Obtener configuración por clave' })
  findByKey(@Param('key') key: string) { return this.svc.findByKey(key); }

  @Put(':key') @ApiOperation({ summary: 'Actualizar configuración' })
  @ApiBody({ type: UpdateSettingDto })
  update(@Param('key') key: string, @Body() body: UpdateSettingDto) { return this.svc.update(key, body.settingValue, body.updatedBy); }

  @Delete(':id') @ApiOperation({ summary: 'Eliminar configuración' })
  remove(@Param('id', ParseIntPipe) id: number) { return this.svc.remove(id); }
}
