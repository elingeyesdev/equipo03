export declare class CreatePermissionDto {
    code: string;
    name: string;
    description?: string;
    resource: string;
    action: string;
}
export declare class CreateRoleDto {
    name: string;
    description?: string;
    permissions?: any;
    hierarchyLevel?: number;
    isSystemRole?: boolean;
}
export declare class AssignRoleDto {
    userId: number;
    roleId: number;
    gymId?: number;
    assignedBy?: number;
    expiresAt?: string;
}
