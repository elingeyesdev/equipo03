import { Controller, Get, Post, Delete, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesService } from '../application/roles.service';
import { CreatePermissionDto, CreateRoleDto, AssignRoleDto } from '../application/dtos/roles.dto';

@ApiTags('Roles & Permissions')
@Controller('roles')
@UseGuards(JwtAuthGuard) @ApiBearerAuth('access-token')
export class RolesController {
  constructor(private readonly svc: RolesService) {}

  @Post('permissions')
  @ApiOperation({ summary: 'Crear permiso' })
  @ApiBody({ type: CreatePermissionDto })
  createPermission(@Body() body: CreatePermissionDto) { return this.svc.createPermission(body); }

  @Get('permissions')
  @ApiOperation({ summary: 'Listar permisos' })
  findAllPermissions() { return this.svc.findAllPermissions(); }

  @Post()
  @ApiOperation({ summary: 'Crear rol' })
  @ApiBody({ type: CreateRoleDto })
  createRole(@Body() body: CreateRoleDto) { return this.svc.createRole(body); }

  @Get()
  @ApiOperation({ summary: 'Listar roles' })
  findAllRoles() { return this.svc.findAllRoles(); }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener rol por ID' })
  findOneRole(@Param('id', ParseIntPipe) id: number) { return this.svc.findOneRole(id); }

  @Post(':roleId/permissions/:permissionId')
  @ApiOperation({ summary: 'Asignar permiso a rol' })
  assignPermission(@Param('roleId', ParseIntPipe) roleId: number, @Param('permissionId', ParseIntPipe) permId: number) {
    return this.svc.assignPermissionToRole(roleId, permId);
  }

  @Post('assign')
  @ApiOperation({ summary: 'Asignar rol a usuario' })
  @ApiBody({ type: AssignRoleDto })
  assignRole(@Body() body: AssignRoleDto) {
    return this.svc.assignRoleToUser(body.userId, body.roleId, body.gymId, body.assignedBy, body.expiresAt);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Roles de un usuario' })
  findUserRoles(@Param('userId', ParseIntPipe) userId: number) { return this.svc.findUserRoles(userId); }

  @Delete('user-role/:id')
  @ApiOperation({ summary: 'Remover rol de usuario' })
  removeUserRole(@Param('id', ParseIntPipe) id: number) { return this.svc.removeUserRole(id); }
}
