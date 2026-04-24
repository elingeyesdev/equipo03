"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../auth/infrastructure/guards/jwt-auth.guard");
const roles_service_1 = require("../application/roles.service");
const roles_dto_1 = require("../application/dtos/roles.dto");
let RolesController = class RolesController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    createPermission(body) { return this.svc.createPermission(body); }
    findAllPermissions() { return this.svc.findAllPermissions(); }
    createRole(body) { return this.svc.createRole(body); }
    findAllRoles() { return this.svc.findAllRoles(); }
    findOneRole(id) { return this.svc.findOneRole(id); }
    assignPermission(roleId, permId) {
        return this.svc.assignPermissionToRole(roleId, permId);
    }
    assignRole(body) {
        return this.svc.assignRoleToUser(body.userId, body.roleId, body.gymId, body.assignedBy, body.expiresAt);
    }
    findUserRoles(userId) { return this.svc.findUserRoles(userId); }
    removeUserRole(id) { return this.svc.removeUserRole(id); }
};
exports.RolesController = RolesController;
__decorate([
    (0, common_1.Post)('permissions'),
    (0, swagger_1.ApiOperation)({ summary: 'Crear permiso' }),
    (0, swagger_1.ApiBody)({ type: roles_dto_1.CreatePermissionDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [roles_dto_1.CreatePermissionDto]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "createPermission", null);
__decorate([
    (0, common_1.Get)('permissions'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar permisos' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "findAllPermissions", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Crear rol' }),
    (0, swagger_1.ApiBody)({ type: roles_dto_1.CreateRoleDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [roles_dto_1.CreateRoleDto]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "createRole", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar roles' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "findAllRoles", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener rol por ID' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "findOneRole", null);
__decorate([
    (0, common_1.Post)(':roleId/permissions/:permissionId'),
    (0, swagger_1.ApiOperation)({ summary: 'Asignar permiso a rol' }),
    __param(0, (0, common_1.Param)('roleId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('permissionId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "assignPermission", null);
__decorate([
    (0, common_1.Post)('assign'),
    (0, swagger_1.ApiOperation)({ summary: 'Asignar rol a usuario' }),
    (0, swagger_1.ApiBody)({ type: roles_dto_1.AssignRoleDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [roles_dto_1.AssignRoleDto]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "assignRole", null);
__decorate([
    (0, common_1.Get)('user/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Roles de un usuario' }),
    __param(0, (0, common_1.Param)('userId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "findUserRoles", null);
__decorate([
    (0, common_1.Delete)('user-role/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Remover rol de usuario' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "removeUserRole", null);
exports.RolesController = RolesController = __decorate([
    (0, swagger_1.ApiTags)('Roles & Permissions'),
    (0, common_1.Controller)('roles'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    __metadata("design:paramtypes", [roles_service_1.RolesService])
], RolesController);
//# sourceMappingURL=roles.controller.js.map