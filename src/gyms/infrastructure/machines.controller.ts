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
  ForbiddenException,
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
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { AdminLevelGuard } from '../../auth/infrastructure/guards/admin-level.guard';
import { MachinesService } from '../application/machines.service';
import { CreateMachineDto, UpdateMachineDto } from '../application/dtos/machines.dto';
import type { RequestWithUser } from '../../common/security/gym-scope';

@ApiTags('Machines')
@Controller('machines')
@UseGuards(JwtAuthGuard, AdminLevelGuard)
@ApiBearerAuth('access-token')
export class MachinesController {
  constructor(private readonly svc: MachinesService) {}

  private assertWriteAccess(req: RequestWithUser): void {
    const level = req.user?.level ?? 0;
    if (level < 5) {
      throw new ForbiddenException(
        'Se requiere nivel jerárquico >= 5 para gestionar máquinas.',
      );
    }
  }

  @Get()
  @ApiOperation({
    summary:
      'Listar máquinas. Nivel >=10: todas. Nivel 5: su marca. Nivel 4: su sucursal.',
  })
  @ApiQuery({ name: 'gymId', required: false, example: 11 })
  @ApiResponse({ status: 200 })
  findAll(@Query('gymId') rawGymId?: string) {
    const gymId = rawGymId ? Number(rawGymId) : undefined;
    return this.svc.findAll(gymId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener máquina por ID' })
  @ApiParam({ name: 'id', example: 'uuid' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Registrar nueva máquina (nivel >= 5)' })
  @ApiBody({ type: CreateMachineDto })
  @ApiResponse({ status: 201 })
  @ApiResponse({ status: 403, description: 'Nivel < 5 o gymId ajeno' })
  create(@Req() req: RequestWithUser, @Body() body: CreateMachineDto) {
    this.assertWriteAccess(req);
    return this.svc.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar datos de una máquina (nivel >= 5)' })
  @ApiParam({ name: 'id', example: 'uuid' })
  @ApiBody({ type: UpdateMachineDto })
  update(
    @Req() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateMachineDto,
  ) {
    this.assertWriteAccess(req);
    return this.svc.update(id, body);
  }

  @Patch(':id/image')
  @ApiOperation({ summary: 'Subir/reemplazar imagen (nivel >= 5)' })
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
    this.assertWriteAccess(req);
    if (!file) {
      throw new BadRequestException('El campo "image" es requerido.');
    }
    return this.svc.updateImage(id, file.buffer);
  }

  @Delete(':id/image')
  @ApiOperation({ summary: 'Eliminar imagen (nivel >= 5)' })
  @ApiParam({ name: 'id', example: 'uuid' })
  deleteImage(
    @Req() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    this.assertWriteAccess(req);
    return this.svc.deleteImage(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar máquina (nivel >= 5)' })
  @ApiParam({ name: 'id', example: 'uuid' })
  remove(
    @Req() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    this.assertWriteAccess(req);
    return this.svc.remove(id);
  }
}
