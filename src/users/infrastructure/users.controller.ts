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
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UsersService } from '../application/users.service';
import { CreateUserDto, UpdateUserDto, UpdateProfileDto, UpdatePushTokenDto, SaveMetricsDto } from '../application/dtos/users.dto';
import type { RequestWithUser } from '../../common/security/gym-scope';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'GERENTE')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Crear usuario con perfil completo' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'Usuario creado' })
  @ApiResponse({ status: 401, description: 'Token inválido o ausente' })
  @ApiResponse({ status: 403, description: 'Solo SUPER_ADMIN o GERENTE' })
  create(@Body() body: CreateUserDto) {
    return this.usersService.create(body);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'GERENTE', 'RECEPCIONISTA')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Listar usuarios. GERENTE/RECEPCIONISTA: solo su sede. SUPER_ADMIN: filtro opcional.' })
  @ApiQuery({ name: 'role', required: false, example: 'INSTRUCTOR' })
  @ApiQuery({ name: 'gymId', required: false, example: 1, description: 'Solo SUPER_ADMIN' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 403, description: 'Solo SUPER_ADMIN, GERENTE o RECEPCIONISTA' })
  findAll(
    @Req() req: RequestWithUser,
    @Query('role') role?: string,
    @Query('gymId') rawGymId?: string,
  ) {
    const authUser = req.user!;
    const roleUp = authUser.role?.toUpperCase();
    const gymId =
      (roleUp === 'GERENTE' || roleUp === 'RECEPCIONISTA')
        ? (authUser.gymId ?? undefined)
        : rawGymId != null
          ? Number(rawGymId)
          : undefined;
    return this.usersService.findAll({ role, gymId });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Perfil del usuario autenticado (incluye birthDate y última métrica)' })
  @ApiResponse({ status: 200 })
  async getMe(@Req() req: RequestWithUser) {
    const userId  = Number(req.user!.userId);
    const user    = await this.usersService.findOne(userId);
    const dto     = this.usersService.toPublicDto(user);
    const birthDate = user.profile?.dateOfBirth ?? null;
    return {
      ...dto,
      birthDate,
      profile: dto.profile ? { ...dto.profile, birthDate } : null,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Obtener usuario por ID' })
  @ApiParam({ name: 'id', example: 1 })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.findOne(id);
    return this.usersService.toPublicDto(user);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'GERENTE', 'RECEPCIONISTA')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Actualizar datos del usuario' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'Usuario actualizado' })
  @ApiResponse({ status: 403, description: 'Solo SUPER_ADMIN o GERENTE' })
  update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateUserDto) {
    return this.usersService.update(id, body);
  }

  @Patch('me/profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Actualizar perfil propio (+ métricas si rol USER/MEMBER)' })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 400, description: 'GERENTE no puede enviar métricas físicas' })
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Guardar métricas: actualiza height_cm en perfil e inserta peso en historial' })
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Última métrica física del usuario autenticado' })
  @ApiResponse({ status: 200 })
  getLatestMetrics(@Req() req: RequestWithUser) {
    return this.usersService.getLatestMetrics(Number(req.user!.userId));
  }

  @Get('me/metrics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Historial completo de métricas físicas del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Array de registros ordenados por fecha DESC' })
  getMetricsHistory(@Req() req: RequestWithUser) {
    return this.usersService.getMetricsHistory(Number(req.user!.userId));
  }

  // TODO: [ESCALABILIDAD] Si en el futuro se requiere notificar a otros roles, agrégalos a este array.
  @Patch('me/push-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('GERENTE', 'INSTRUCTOR', 'ENTRENADOR', 'NUTRICIONISTA')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Registrar token push del dispositivo (Expo) para el usuario autenticado' })
  @ApiBody({ type: UpdatePushTokenDto })
  @ApiResponse({ status: 200, description: 'Token registrado' })
  @ApiResponse({ status: 401, description: 'Token JWT inválido' })
  @ApiResponse({ status: 403, description: 'Solo roles operativos' })
  savePushToken(@Req() req: RequestWithUser, @Body() body: UpdatePushTokenDto) {
    return this.usersService.savePushToken(Number(req.user!.userId), body.token);
  }

  // TODO: [ESCALABILIDAD] Si en el futuro se requiere notificar a otros roles, agrégalos a este array.
  @Delete('me/push-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('GERENTE', 'INSTRUCTOR', 'ENTRENADOR', 'NUTRICIONISTA')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Eliminar token push del dispositivo del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Token eliminado' })
  @ApiResponse({ status: 403, description: 'Solo roles operativos' })
  clearPushToken(@Req() req: RequestWithUser) {
    return this.usersService.clearPushToken(Number(req.user!.userId));
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Eliminar usuario' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiResponse({ status: 403, description: 'Solo SUPER_ADMIN' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.usersService.remove(id);
    return { message: 'Usuario eliminado' };
  }
}
