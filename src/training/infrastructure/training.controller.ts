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
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import type { RequestWithUser } from '../../common/security/gym-scope';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { TrainingService } from '../application/training.service';
import {
  CreateTrainingProfileDto,
  CreateRestrictionDto,
  CreateEmergencyContactDto,
  CreateSessionDto,
  UpdateSessionDto,
  AddSetDto,
  SaveCompletedSessionDto,
} from '../application/dtos/training.dto';

@ApiTags('Training')
@Controller('training')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class TrainingController {
  constructor(private readonly svc: TrainingService) {}

  @Post('profile')
  @ApiOperation({ summary: 'Crear perfil de entrenamiento' })
  @ApiBody({ type: CreateTrainingProfileDto })
  createProfile(@Body() body: CreateTrainingProfileDto) {
    return this.svc.createTrainingProfile(
      body.userId,
      body.goals,
      body.preferences,
    );
  }

  @Get('profile/:userId')
  @ApiOperation({ summary: 'Obtener perfil de entrenamiento' })
  getProfile(@Param('userId', ParseIntPipe) uid: number) {
    return this.svc.getTrainingProfile(uid);
  }

  @Post('restrictions')
  @ApiOperation({ summary: 'Crear restricción' })
  @ApiBody({ type: CreateRestrictionDto })
  createRestriction(@Body() body: CreateRestrictionDto) {
    return this.svc.createRestriction(body);
  }

  @Get('restrictions/:userId')
  @ApiOperation({ summary: 'Restricciones de usuario' })
  findRestriction(@Param('userId', ParseIntPipe) uid: number) {
    return this.svc.findRestriction(uid);
  }

  @Post('emergency-contacts')
  @ApiOperation({ summary: 'Crear contacto de emergencia' })
  @ApiBody({ type: CreateEmergencyContactDto })
  createEC(@Body() body: CreateEmergencyContactDto) {
    return this.svc.createEmergencyContact(body);
  }

  @Get('emergency-contacts/:userId')
  @ApiOperation({ summary: 'Contactos de emergencia' })
  findECs(@Param('userId', ParseIntPipe) uid: number) {
    return this.svc.findEmergencyContacts(uid);
  }

  @Delete('emergency-contacts/:id')
  @ApiOperation({ summary: 'Eliminar contacto' })
  removeEC(@Param('id', ParseIntPipe) id: number) {
    return this.svc.removeEmergencyContact(id);
  }

  @Post('sessions')
  @ApiOperation({ summary: 'Iniciar sesión de entrenamiento' })
  @ApiBody({ type: CreateSessionDto })
  createSession(@Req() req: RequestWithUser, @Body() body: CreateSessionDto) {
    body.userId = Number(req.user!.userId);
    return this.svc.createSession(body);
  }

  @Post('sessions/completed')
  @ApiOperation({
    summary: 'Guardar entrenamiento completado de un solo golpe',
  })
  @ApiBody({ type: SaveCompletedSessionDto })
  saveCompleted(
    @Req() req: RequestWithUser,
    @Body() body: SaveCompletedSessionDto,
  ) {
    return this.svc.saveCompletedSession(Number(req.user!.userId), body);
  }

  @Get('sessions')
  @ApiOperation({
    summary: 'Listar mis sesiones paginadas (más recientes primero)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 50,
    description: 'Máx registros (default 50)',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    example: 0,
    description: 'Registros a saltar (default 0)',
  })
  findSessions(
    @Req() req: RequestWithUser,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const take = Math.min(limit ? parseInt(limit, 10) : 50, 100);
    const skip = offset ? parseInt(offset, 10) : 0;
    return this.svc.findAllSessions(Number(req.user!.userId), take, skip);
  }

  @Get('sessions/user/:userId')
  @ApiOperation({
    summary: 'Sesiones de usuario (USER solo puede ver las propias). Soporta ?routineId=X',
  })
  @ApiQuery({ name: 'routineId', required: false, description: 'Filtrar por rutina asignada' })
  findByUser(
    @Req() req: RequestWithUser,
    @Param('userId', ParseIntPipe) uid: number,
    @Query('routineId') routineId?: string,
  ) {
    const role = req.user?.role?.toUpperCase();
    const selfId = Number(req.user!.userId);
    if (role === 'USER' || role === 'CLIENTE') {
      if (selfId !== uid) {
        throw new ForbiddenException(
          'Solo puedes consultar tus propias sesiones.',
        );
      }
    }
    const rid = routineId ? parseInt(routineId, 10) : undefined;
    return this.svc.findSessionsByUser(uid, rid);
  }

  @Get('sessions/strength-records')
  @ApiOperation({
    summary: 'Récords de fuerza por ejercicio (gráfico de hipertrofia)',
    description:
      'Devuelve el historial de peso máximo levantado por ejercicio. ' +
      'Formato: [{ exerciseId, exerciseName, muscleGroup, history: [{ date, maxWeightKg, totalSets }] }]',
  })
  getStrengthRecords(@Req() req: RequestWithUser) {
    return this.svc.getStrengthRecords(Number(req.user!.userId));
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Obtener sesión' })
  findOneSession(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findOneSession(id);
  }

  @Put('sessions/:id')
  @ApiOperation({ summary: 'Actualizar/finalizar sesión' })
  @ApiBody({ type: UpdateSessionDto })
  updateSession(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateSessionDto,
  ) {
    return this.svc.updateSession(id, body);
  }

  @Post('sessions/:id/sets')
  @ApiOperation({ summary: 'Agregar serie completada' })
  @ApiBody({ type: AddSetDto })
  addSet(@Param('id', ParseIntPipe) id: number, @Body() body: AddSetDto) {
    return this.svc.addSet(id, body);
  }
}
