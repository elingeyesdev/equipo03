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
import { CreateUserDto, UpdateUserDto, UpdateProfileDto, UpdatePushTokenDto } from '../application/dtos/users.dto';
import type { RequestWithUser } from '../../common/security/gym-scope';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Crear usuario con perfil completo' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'Usuario creado' })
  create(@Body() body: CreateUserDto) {
    return this.usersService.create(body);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'GERENTE')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Listar usuarios. GERENTE: solo su sede. SUPER_ADMIN: filtro opcional.' })
  @ApiQuery({ name: 'role', required: false, example: 'INSTRUCTOR' })
  @ApiQuery({ name: 'gymId', required: false, example: 1, description: 'Solo SUPER_ADMIN' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 403, description: 'Solo SUPER_ADMIN o GERENTE' })
  findAll(
    @Req() req: RequestWithUser,
    @Query('role') role?: string,
    @Query('gymId') rawGymId?: string,
  ) {
    const authUser = req.user!;
    const roleUp = authUser.role?.toUpperCase();
    const gymId =
      roleUp === 'GERENTE'
        ? (authUser.gymId ?? undefined)
        : rawGymId != null
          ? Number(rawGymId)
          : undefined;
    return this.usersService.findAll({ role, gymId });
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
  @Roles('SUPER_ADMIN', 'GERENTE')
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

  @Get('me/metrics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Historial completo de métricas físicas del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Array de registros ordenados por fecha DESC' })
  getMetricsHistory(@Req() req: RequestWithUser) {
    return this.usersService.getMetricsHistory(Number(req.user!.userId));
  }

  @Patch('me/push-token')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Registrar token push del dispositivo (Expo) para el usuario autenticado' })
  @ApiBody({ type: UpdatePushTokenDto })
  @ApiResponse({ status: 200, description: 'Token registrado' })
  @ApiResponse({ status: 401, description: 'Token JWT inválido' })
  savePushToken(@Req() req: RequestWithUser, @Body() body: UpdatePushTokenDto) {
    return this.usersService.savePushToken(Number(req.user!.userId), body.token);
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
