import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { RoutinesService } from '../application/routines.service';
import {
  CreateRoutineDto,
  UpdateRoutineDto,
} from '../application/dtos/routines.dto';
import type { RequestWithUser } from '../../common/security/gym-scope';

@ApiTags('Routines')
@Controller('routines')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class RoutinesController {
  constructor(private readonly svc: RoutinesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear rutina con ejercicios' })
  @ApiBody({ type: CreateRoutineDto })
  create(@Body() body: CreateRoutineDto) {
    return this.svc.create(body);
  }

  @Get()
  @ApiOperation({ summary: 'Listar rutinas' })
  findAll(@Query('isTemplate') isTemplate?: string) {
    const filter =
      isTemplate === 'true' ? true : isTemplate === 'false' ? false : undefined;
    return this.svc.findAll(filter);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Rutinas asignadas a usuario' })
  findByUser(@Param('userId', ParseIntPipe) uid: number) {
    return this.svc.findByUser(uid);
  }

  @Get('trainer/:trainerId')
  @ApiOperation({ summary: 'Rutinas creadas por entrenador' })
  findByTrainer(@Param('trainerId', ParseIntPipe) tid: number) {
    return this.svc.findByTrainer(tid);
  }

  @Get('my-students')
  @ApiOperation({ summary: 'Listar alumnos del entrenador autenticado' })
  getMyStudents(@Req() req: RequestWithUser) {
    return this.svc.getMyStudents(Number(req.user!.userId));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener rutina' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar rutina' })
  @ApiBody({ type: UpdateRoutineDto })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateRoutineDto,
  ) {
    return this.svc.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar rutina' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.svc.remove(id);
    return { message: 'Rutina eliminada' };
  }
}
