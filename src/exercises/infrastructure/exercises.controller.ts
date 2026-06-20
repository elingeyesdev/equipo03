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
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../../auth/infrastructure/guards/super-admin.guard';
import { ExercisesService } from '../application/exercises.service';
import {
  CreateExerciseDto,
  UpdateExerciseDto,
} from '../application/dtos/exercises.dto';

@ApiTags('Exercises')
@Controller('exercises')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class ExercisesController {
  constructor(private readonly svc: ExercisesService) {}

  @Post()
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Crear ejercicio (Super Admin)' })
  @ApiBody({ type: CreateExerciseDto })
  create(@Body() body: CreateExerciseDto) {
    return this.svc.create(body);
  }

  @Get()
  @ApiOperation({ summary: 'Listar ejercicios' })
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
  @ApiOperation({ summary: 'Obtener ejercicio' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findOne(id);
  }

  @Put(':id')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Actualizar ejercicio (Super Admin)' })
  @ApiBody({ type: UpdateExerciseDto })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateExerciseDto,
  ) {
    return this.svc.update(id, body);
  }

  @Patch(':id/image')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Subir/reemplazar imagen (Super Admin)' })
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
  @ApiOperation({ summary: 'Eliminar imagen (Super Admin)' })
  deleteImage(@Param('id', ParseIntPipe) id: number) {
    return this.svc.deleteExerciseImage(id);
  }

  @Delete(':id')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Eliminar ejercicio (Super Admin)' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.svc.remove(id);
    return { message: 'Ejercicio eliminado' };
  }
}
