import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiConsumes,
} from '@nestjs/swagger';
import { AdminLevelGuard } from '../../auth/infrastructure/guards/admin-level.guard';
import { MachinesService } from '../application/machines.service';
import { CreateMachineDto, UpdateMachineDto } from '../application/dtos/machines.dto';
import type { RequestWithUser } from '../../common/security/gym-scope';

/**
 * MachinesController
 *
 * GET  /machines         → JwtAuthGuard global (cualquier nivel ≥ 1). Lee máquinas
 *                          filtradas por gymId y status sin exponer datos cruzados.
 * POST / PUT / PATCH / DELETE → AdminLevelGuard (level ≥ 4) para mutaciones.
 */
@ApiTags('Machines')
@Controller('machines')
@ApiBearerAuth('access-token')
export class MachinesController {
  constructor(private readonly svc: MachinesService) {}

  // ── READ ────────────────────────────────────────────────────────────────────
  // El guard global JwtAuthGuard ya valida el JWT; aquí NO aplicamos AdminLevelGuard
  // para que los clientes (level 1) puedan consultar el inventario de una sede.

  @Get()
  @ApiOperation({
    summary:
      'Listar máquinas. ' +
      'level ≥ 10: todas. level 5: su marca. level 4: su sucursal. ' +
      'level 1-3: requiere gymId explícito; devuelve solo esa sucursal.',
  })
  @ApiQuery({ name: 'gymId',  required: false, example: 11 })
  @ApiQuery({ name: 'status', required: false, enum: ['AVAILABLE', 'MAINTENANCE'], example: 'AVAILABLE' })
  @ApiResponse({ status: 200 })
  findAll(
    @Req() req: RequestWithUser,
    @Query('gymId')  rawGymId?: string,
    @Query('status') status?:   string,
  ) {
    const gymId = rawGymId ? Number(rawGymId) : undefined;
    return this.svc.findAll(gymId, req.user!, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener máquina por ID' })
  @ApiParam({ name: 'id', example: 'uuid' })
  findOne(@Req() req: RequestWithUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.findOne(id, req.user!);
  }

  // ── WRITE — requieren AdminLevelGuard (level ≥ 4) ───────────────────────────

  @Post()
  @UseGuards(AdminLevelGuard)
  @ApiOperation({ summary: 'Registrar nueva máquina (level ≥ 4)' })
  @ApiBody({ type: CreateMachineDto })
  @ApiResponse({ status: 201 })
  @ApiResponse({ status: 403, description: 'gymId fuera de jurisdicción' })
  create(@Req() req: RequestWithUser, @Body() body: CreateMachineDto) {
    return this.svc.create(body, req.user!);
  }

  @Put(':id')
  @UseGuards(AdminLevelGuard)
  @ApiOperation({ summary: 'Actualizar datos de una máquina (level ≥ 4)' })
  @ApiParam({ name: 'id', example: 'uuid' })
  @ApiBody({ type: UpdateMachineDto })
  update(
    @Req() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateMachineDto,
  ) {
    return this.svc.update(id, body, req.user!);
  }

  @Patch(':id/image')
  @UseGuards(AdminLevelGuard)
  @ApiOperation({ summary: 'Subir/reemplazar imagen (level ≥ 4)' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', example: 'uuid' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { image: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('image'))
  updateImage(
    @Req() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('El campo "image" es requerido.');
    return this.svc.updateImage(id, file.buffer, req.user!);
  }

  @Delete(':id/image')
  @UseGuards(AdminLevelGuard)
  @ApiOperation({ summary: 'Eliminar imagen (level ≥ 4)' })
  @ApiParam({ name: 'id', example: 'uuid' })
  deleteImage(
    @Req() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.svc.deleteImage(id, req.user!);
  }

  @Delete(':id')
  @UseGuards(AdminLevelGuard)
  @ApiOperation({ summary: 'Eliminar máquina (level ≥ 4)' })
  @ApiParam({ name: 'id', example: 'uuid' })
  remove(
    @Req() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.svc.remove(id, req.user!);
  }
}
