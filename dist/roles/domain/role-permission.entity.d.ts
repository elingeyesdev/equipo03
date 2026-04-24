import { Role } from './role.entity';
import { Permission } from './permission.entity';
import { User } from '../../users/domain/user.entity';
export declare class RolePermission {
    id: number;
    roleId: number;
    permissionId: number;
    grantedAt: Date;
    grantedBy: number;
    role: Role;
    permission: Permission;
    grantedByUser: User;
}
