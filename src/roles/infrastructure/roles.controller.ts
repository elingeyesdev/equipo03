import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AdminLevelGuard } from '../../auth/infrastructure/guards/admin-level.guard';
import { SuperAdminGuard } from '../../auth/infrastructure/guards/super-admin.guard';
import { RolesService } from '../application/roles.service';
import {
  CreatePermissionDto,
  CreateRoleDto,
  UpdateRoleDto,
  AssignRoleDto,
} from '../application/dtos/roles.dto';

@ApiTags('Roles & Permissions')
@Controller('roles')
@ApiBearerAuth('access-token')
export class RolesController {
  constructor(private readonly svc: RolesService) {}

  @Post('permissions')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Crear permiso (level >= 10)' })
  @ApiBody({ type: CreatePermissionDto })
  createPermission(@Body() body: CreatePermissionDto) {
    return this.svc.createPermission(body);
  }

  @Get('permissions')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Listar permisos (level >= 10)' })
  findAllPermissions() {
    return this.svc.findAllPermissions();
  }

  @Post()
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Crear rol (level >= 10)' })
  @ApiBody({ type: CreateRoleDto })
  createRole(@Body() body: CreateRoleDto) {
    return this.svc.createRole(body);
  }

  @Get()
  @UseGuards(AdminLevelGuard)
  @ApiOperation({ summary: 'Listar roles (level >= 4)' })
  findAllRoles() {
    return this.svc.findAllRoles();
  }

  @Get(':id')
  @UseGuards(AdminLevelGuard)
  @ApiOperation({ summary: 'Obtener rol por ID (level >= 4)' })
  findOneRole(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findOneRole(id);
  }

  @Post(':roleId/permissions/:permissionId')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Asignar permiso a rol (level >= 10)' })
  assignPermission(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Param('permissionId', ParseIntPipe) permId: number,
  ) {
    return this.svc.assignPermissionToRole(roleId, permId);
  }

  @Post('assign')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Asignar rol a usuario (level >= 10)' })
  @ApiBody({ type: AssignRoleDto })
  assignRole(@Body() body: AssignRoleDto) {
    return this.svc.assignRoleToUser(
      body.userId,
      body.roleId,
      body.gymId,
      body.assignedBy,
      body.expiresAt,
    );
  }

  @Get('user/:userId')
  @UseGuards(AdminLevelGuard)
  @ApiOperation({ summary: 'Roles de un usuario (level >= 4)' })
  findUserRoles(@Param('userId', ParseIntPipe) userId: number) {
    return this.svc.findUserRoles(userId);
  }

  @Patch(':id')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Actualizar rol (level >= 10)' })
  @ApiBody({ type: UpdateRoleDto })
  updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateRoleDto,
  ) {
    return this.svc.updateRole(id, body);
  }

  @Delete('user-role/:id')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Remover rol de usuario (level >= 10)' })
  removeUserRole(@Param('id', ParseIntPipe) id: number) {
    return this.svc.removeUserRole(id);
  }

  @Delete(':id')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Eliminar rol (level >= 10)' })
  removeRole(@Param('id', ParseIntPipe) id: number) {
    return this.svc.removeRole(id);
  }
}
