import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Crear ejercicio' })
  @ApiBody({ type: CreateExerciseDto })
  create(@Body() body: CreateExerciseDto) {
    return this.svc.create(body);
  }

  @Get()
  @ApiOperation({ summary: 'Listar ejercicios' })
  @ApiQuery({ name: 'muscleGroup', required: false })
  @ApiQuery({ name: 'difficultyLevel', required: false })
  findAll(
    @Query('muscleGroup') mg?: string,
    @Query('difficultyLevel') dl?: string,
  ) {
    return this.svc.findAll({ muscleGroup: mg, difficultyLevel: dl });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener ejercicio' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Actualizar ejercicio' })
  @ApiBody({ type: UpdateExerciseDto })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateExerciseDto,
  ) {
    return this.svc.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Eliminar ejercicio' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.svc.remove(id);
    return { message: 'Ejercicio eliminado' };
  }
}
