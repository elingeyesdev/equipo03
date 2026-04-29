import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { UsersService } from '../../users/application/users.service';
import { UserRole } from '../../roles/domain/user-role.entity';
export declare class AuthService {
    private readonly usersService;
    private readonly jwtService;
    private readonly userRolesRepo;
    constructor(usersService: UsersService, jwtService: JwtService, userRolesRepo: Repository<UserRole>);
    private buildJwtPayload;
    register(data: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
    }): Promise<{
        user: {
            id: number;
            email: string;
            profile: import("../../users/domain/user-profile.entity").UserProfile;
        };
        accessToken: string;
    }>;
    login(data: {
        email: string;
        password: string;
    }): Promise<{
        user: {
            id: number;
            email: string;
            profile: import("../../users/domain/user-profile.entity").UserProfile;
        };
        accessToken: string;
    }>;
    validateUser(userId: number): Promise<import("../../users/domain/user.entity").User>;
}
