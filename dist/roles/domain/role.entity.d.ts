import { RolePermission } from './role-permission.entity';
import { UserRole } from './user-role.entity';
export declare class Role {
    id: number;
    name: string;
    description: string;
    permissions: any;
    hierarchyLevel: number;
    isSystemRole: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    rolePermissions: RolePermission[];
    userRoles: UserRole[];
}
