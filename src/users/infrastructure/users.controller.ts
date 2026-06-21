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
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AdminLevelGuard } from '../../auth/infrastructure/guards/admin-level.guard';
import { SuperAdminGuard } from '../../auth/infrastructure/guards/super-admin.guard';
import { StaffLevelGuard } from '../../auth/infrastructure/guards/staff-level.guard';
import { UsersService } from '../application/users.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UpdateProfileDto,
  UpdatePushTokenDto,
  SaveMetricsDto,
} from '../application/dtos/users.dto';
import type { RequestWithUser } from '../../common/security/gym-scope';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(AdminLevelGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Crear usuario con perfil completo' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'Usuario creado' })
  @ApiResponse({ status: 401, description: 'Token inválido o ausente' })
  @ApiResponse({ status: 403, description: 'Nivel jerárquico insuficiente o escalada de privilegios' })
  create(@Req() req: RequestWithUser, @Body() body: CreateUserDto) {
    return this.usersService.create(body, req.user!);
  }

  @Get()
  @UseGuards(AdminLevelGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary:
      'Listar usuarios. level >= 5: toda la marca. level 4: solo su sede. level >= 10: sin filtro.',
  })
  @ApiQuery({ name: 'role', required: false, example: 'INSTRUCTOR' })
  @ApiQuery({
    name: 'gymId',
    required: false,
    example: 1,
    description: 'Solo nivel >= 10',
  })
  @ApiResponse({ status: 200 })
  @ApiResponse({
    status: 403,
    description: 'Nivel jerárquico insuficiente (>= 4)',
  })
  findAll(
    @Req() req: RequestWithUser,
    @Query('role') role?: string,
    @Query('gymId') rawGymId?: string,
  ) {
    const authUser = req.user!;
    const level = authUser.level ?? 0;
    const gymId =
      level >= 10
        ? (rawGymId != null ? Number(rawGymId) : undefined)
        : (authUser.gymId ?? undefined);
    return this.usersService.findAll({ role, gymId });
  }

  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary:
      'Perfil del usuario autenticado (incluye birthDate y última métrica)',
  })
  @ApiResponse({ status: 200 })
  async getMe(@Req() req: RequestWithUser) {
    const userId = Number(req.user!.userId);
    const user = await this.usersService.findOne(userId);
    const dto = this.usersService.toPublicDto(user);
    const birthDate = user.profile?.dateOfBirth ?? null;
    const age = birthDate
      ? Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : null;
    return {
      ...dto,
      birthDate,
      age,
      profile: dto.profile ? { ...dto.profile, birthDate, age } : null,
    };
  }

  @Get(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Obtener usuario por ID' })
  @ApiParam({ name: 'id', example: 1 })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.findOne(id);
    return this.usersService.toPublicDto(user);
  }

  @Put(':id')
  @UseGuards(AdminLevelGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Actualizar datos del usuario' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'Usuario actualizado' })
  @ApiResponse({ status: 403, description: 'Nivel jerárquico insuficiente o escalada de privilegios' })
  update(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateUserDto,
  ) {
    return this.usersService.update(id, body, req.user!);
  }

  @Patch('me/profile')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Actualizar perfil propio (+ métricas si rol USER/MEMBER)',
  })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({ status: 200 })
  @ApiResponse({
    status: 400,
    description: 'GERENTE no puede enviar métricas físicas',
  })
  updateMyProfile(@Req() req: RequestWithUser, @Body() body: UpdateProfileDto) {
    const { userId, role, gymId } = req.user!;
    return this.usersService.updateMyProfile(
      Number(userId),
      role?.toUpperCase() ?? '',
      gymId ?? undefined,
      body,
    );
  }

  @Post('me/metrics')
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Guardar métricas: actualiza height_cm en perfil e inserta peso en historial',
  })
  @ApiBody({ type: SaveMetricsDto })
  @ApiResponse({ status: 201, schema: { example: { success: true } } })
  saveMyMetrics(@Req() req: RequestWithUser, @Body() body: SaveMetricsDto) {
    const { userId, gymId } = req.user!;
    return this.usersService.saveMyMetrics(
      Number(userId),
      gymId ?? undefined,
      body.weightKg,
      body.heightCm,
      body.edad,
    );
  }

  @Get('me/metrics/latest')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Última métrica física del usuario autenticado' })
  @ApiResponse({ status: 200 })
  getLatestMetrics(@Req() req: RequestWithUser) {
    return this.usersService.getLatestMetrics(Number(req.user!.userId));
  }

  @Get('me/metrics')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Historial completo de métricas físicas del usuario autenticado',
  })
  @ApiResponse({
    status: 200,
    description: 'Array de registros ordenados por fecha DESC',
  })
  getMetricsHistory(@Req() req: RequestWithUser) {
    return this.usersService.getMetricsHistory(Number(req.user!.userId));
  }

  @Patch('me/push-token')
  @UseGuards(StaffLevelGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary:
      'Registrar token push del dispositivo (Expo) para el usuario autenticado',
  })
  @ApiBody({ type: UpdatePushTokenDto })
  @ApiResponse({ status: 200, description: 'Token registrado' })
  @ApiResponse({ status: 401, description: 'Token JWT inválido' })
  @ApiResponse({ status: 403, description: 'Nivel jerárquico insuficiente (>= 3)' })
  savePushToken(@Req() req: RequestWithUser, @Body() body: UpdatePushTokenDto) {
    return this.usersService.savePushToken(
      Number(req.user!.userId),
      body.token,
    );
  }

  @Delete('me/push-token')
  @UseGuards(StaffLevelGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Eliminar token push del dispositivo del usuario autenticado',
  })
  @ApiResponse({ status: 200, description: 'Token eliminado' })
  @ApiResponse({ status: 403, description: 'Nivel jerárquico insuficiente (>= 3)' })
  clearPushToken(@Req() req: RequestWithUser) {
    return this.usersService.clearPushToken(Number(req.user!.userId));
  }

  @Delete(':id')
  @UseGuards(SuperAdminGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Eliminar usuario' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiResponse({ status: 403, description: 'Nivel jerárquico insuficiente (>= 10)' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.usersService.remove(id);
    return { message: 'Usuario eliminado' };
  }
}
