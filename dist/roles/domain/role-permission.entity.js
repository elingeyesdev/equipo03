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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolePermission = void 0;
const typeorm_1 = require("typeorm");
const role_entity_1 = require("./role.entity");
const permission_entity_1 = require("./permission.entity");
const user_entity_1 = require("../../users/domain/user.entity");
let RolePermission = class RolePermission {
    id;
    roleId;
    permissionId;
    grantedAt;
    grantedBy;
    role;
    permission;
    grantedByUser;
};
exports.RolePermission = RolePermission;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], RolePermission.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'role_id' }),
    __metadata("design:type", Number)
], RolePermission.prototype, "roleId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'permission_id' }),
    __metadata("design:type", Number)
], RolePermission.prototype, "permissionId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'granted_at' }),
    __metadata("design:type", Date)
], RolePermission.prototype, "grantedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'granted_by', nullable: true }),
    __metadata("design:type", Number)
], RolePermission.prototype, "grantedBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => role_entity_1.Role, (r) => r.rolePermissions, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'role_id' }),
    __metadata("design:type", role_entity_1.Role)
], RolePermission.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => permission_entity_1.Permission, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'permission_id' }),
    __metadata("design:type", permission_entity_1.Permission)
], RolePermission.prototype, "permission", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'granted_by' }),
    __metadata("design:type", user_entity_1.User)
], RolePermission.prototype, "grantedByUser", void 0);
exports.RolePermission = RolePermission = __decorate([
    (0, typeorm_1.Entity)('role_permissions')
], RolePermission);
//# sourceMappingURL=role-permission.entity.js.map