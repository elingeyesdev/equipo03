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
exports.RolesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const permission_entity_1 = require("../domain/permission.entity");
const role_entity_1 = require("../domain/role.entity");
const role_permission_entity_1 = require("../domain/role-permission.entity");
const user_role_entity_1 = require("../domain/user-role.entity");
let RolesService = class RolesService {
    permissionsRepo;
    rolesRepo;
    rpRepo;
    urRepo;
    constructor(permissionsRepo, rolesRepo, rpRepo, urRepo) {
        this.permissionsRepo = permissionsRepo;
        this.rolesRepo = rolesRepo;
        this.rpRepo = rpRepo;
        this.urRepo = urRepo;
    }
    createPermission(data) { return this.permissionsRepo.save(this.permissionsRepo.create(data)); }
    findAllPermissions() { return this.permissionsRepo.find(); }
    createRole(data) { return this.rolesRepo.save(this.rolesRepo.create(data)); }
    findAllRoles() { return this.rolesRepo.find({ relations: ['rolePermissions', 'rolePermissions.permission'] }); }
    async findOneRole(id) {
        const role = await this.rolesRepo.findOne({ where: { id }, relations: ['rolePermissions', 'rolePermissions.permission'] });
        if (!role)
            throw new common_1.NotFoundException(`Rol ${id} no encontrado`);
        return role;
    }
    assignPermissionToRole(roleId, permissionId, grantedBy) {
        return this.rpRepo.save(this.rpRepo.create({ roleId, permissionId, grantedBy }));
    }
    removePermissionFromRole(id) { return this.rpRepo.delete(id); }
    assignRoleToUser(userId, roleId, gymId, assignedBy, expiresAt) {
        return this.urRepo.save(this.urRepo.create({ userId, roleId, gymId, assignedBy, expiresAt: expiresAt ? new Date(expiresAt) : undefined }));
    }
    findUserRoles(userId) { return this.urRepo.find({ where: { userId }, relations: ['role', 'gym'] }); }
    removeUserRole(id) { return this.urRepo.delete(id); }
};
exports.RolesService = RolesService;
exports.RolesService = RolesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(permission_entity_1.Permission)),
    __param(1, (0, typeorm_1.InjectRepository)(role_entity_1.Role)),
    __param(2, (0, typeorm_1.InjectRepository)(role_permission_entity_1.RolePermission)),
    __param(3, (0, typeorm_1.InjectRepository)(user_role_entity_1.UserRole)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], RolesService);
//# sourceMappingURL=roles.service.js.map