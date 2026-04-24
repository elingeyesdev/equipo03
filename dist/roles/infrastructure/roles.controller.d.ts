import { RolesService } from '../application/roles.service';
import { CreatePermissionDto, CreateRoleDto, AssignRoleDto } from '../application/dtos/roles.dto';
export declare class RolesController {
    private readonly svc;
    constructor(svc: RolesService);
    createPermission(body: CreatePermissionDto): Promise<import("../domain/permission.entity").Permission>;
    findAllPermissions(): Promise<import("../domain/permission.entity").Permission[]>;
    createRole(body: CreateRoleDto): Promise<import("../domain/role.entity").Role>;
    findAllRoles(): Promise<import("../domain/role.entity").Role[]>;
    findOneRole(id: number): Promise<import("../domain/role.entity").Role>;
    assignPermission(roleId: number, permId: number): Promise<import("../domain/role-permission.entity").RolePermission>;
    assignRole(body: AssignRoleDto): Promise<import("../domain/user-role.entity").UserRole>;
    findUserRoles(userId: number): Promise<import("../domain/user-role.entity").UserRole[]>;
    removeUserRole(id: number): Promise<import("typeorm").DeleteResult>;
}
