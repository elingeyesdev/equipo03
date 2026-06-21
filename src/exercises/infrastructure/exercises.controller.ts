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
  UseGuards,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { SuperAdminGuard } from '../../auth/infrastructure/guards/super-admin.guard';
import { ExercisesService } from '../application/exercises.service';
import {
  CreateExerciseDto,
  UpdateExerciseDto,
} from '../application/dtos/exercises.dto';

@ApiTags('Exercises')
@Controller('exercises')
@ApiBearerAuth('access-token')
export class ExercisesController {
  constructor(private readonly svc: ExercisesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar ejercicios (cualquier usuario autenticado)' })
  @ApiQuery({ name: 'muscleGroup', required: false })
  @ApiQuery({ name: 'difficultyLevel', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'exerciseType', required: false })
  findAll(
    @Query('muscleGroup') mg?: string,
    @Query('difficultyLevel') dl?: string,
    @Query('category') cat?: string,
    @Query('exerciseType') et?: string,
  ) {
    return this.svc.findAll({ muscleGroup: mg, difficultyLevel: dl, category: cat, exerciseType: et });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener ejercicio por ID (cualquier usuario autenticado)' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findOne(id);
  }

  @Post()
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Crear ejercicio (nivel >= 10)' })
  @ApiBody({ type: CreateExerciseDto })
  @ApiResponse({ status: 403, description: 'Nivel jerárquico insuficiente' })
  create(@Body() body: CreateExerciseDto) {
    return this.svc.create(body);
  }

  @Put(':id')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Actualizar ejercicio (nivel >= 10)' })
  @ApiBody({ type: UpdateExerciseDto })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateExerciseDto,
  ) {
    return this.svc.update(id, body);
  }

  @Patch(':id/image')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Subir/reemplazar imagen (nivel >= 10)' })
  @UseInterceptors(FileInterceptor('image'))
  updateImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('El campo "image" es requerido.');
    }
    return this.svc.updateExerciseImage(id, file.buffer);
  }

  @Delete(':id/image')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Eliminar imagen (nivel >= 10)' })
  deleteImage(@Param('id', ParseIntPipe) id: number) {
    return this.svc.deleteExerciseImage(id);
  }

  @Delete(':id')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Eliminar ejercicio (nivel >= 10)' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.svc.remove(id);
    return { message: 'Ejercicio eliminado' };
  }
}
