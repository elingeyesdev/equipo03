import { Repository } from 'typeorm';
import { Permission } from '../domain/permission.entity';
import { Role } from '../domain/role.entity';
import { RolePermission } from '../domain/role-permission.entity';
import { UserRole } from '../domain/user-role.entity';
export declare class RolesService {
    private permissionsRepo;
    private rolesRepo;
    private rpRepo;
    private urRepo;
    constructor(permissionsRepo: Repository<Permission>, rolesRepo: Repository<Role>, rpRepo: Repository<RolePermission>, urRepo: Repository<UserRole>);
    createPermission(data: Partial<Permission>): Promise<Permission>;
    findAllPermissions(): Promise<Permission[]>;
    createRole(data: Partial<Role>): Promise<Role>;
    findAllRoles(): Promise<Role[]>;
    findOneRole(id: number): Promise<Role>;
    assignPermissionToRole(roleId: number, permissionId: number, grantedBy?: number): Promise<RolePermission>;
    removePermissionFromRole(id: number): Promise<import("typeorm").DeleteResult>;
    assignRoleToUser(userId: number, roleId: number, gymId?: number, assignedBy?: number, expiresAt?: string): Promise<UserRole>;
    findUserRoles(userId: number): Promise<UserRole[]>;
    removeUserRole(id: number): Promise<import("typeorm").DeleteResult>;
}
