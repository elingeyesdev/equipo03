import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SystemService } from '../application/system.service';
import { CreateSettingDto, UpdateSettingDto } from '../application/dtos/system.dto';

@ApiTags('System')
@Controller('system/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
@ApiBearerAuth('access-token')
@ApiResponse({ status: 403, description: 'Solo SUPER_ADMIN' })
export class SystemController {
  constructor(private readonly svc: SystemService) {}

  @Post()
  @ApiOperation({ summary: 'Crear configuración del sistema' })
  @ApiBody({ type: CreateSettingDto })
  create(@Body() body: CreateSettingDto) { return this.svc.create(body); }

  @Get()
  @ApiOperation({ summary: 'Listar configuraciones' })
  findAll() { return this.svc.findAll(); }

  @Get(':key')
  @ApiOperation({ summary: 'Obtener configuración por clave' })
  findByKey(@Param('key') key: string) { return this.svc.findByKey(key); }

  @Put(':key')
  @ApiOperation({ summary: 'Actualizar configuración' })
  @ApiBody({ type: UpdateSettingDto })
  update(@Param('key') key: string, @Body() body: UpdateSettingDto) {
    return this.svc.update(key, body.settingValue, body.updatedBy);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar configuración' })
  remove(@Param('id', ParseIntPipe) id: number) { return this.svc.remove(id); }
}
