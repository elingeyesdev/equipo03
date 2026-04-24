import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../users/application/users.service';
export declare class AuthService {
    private readonly usersService;
    private readonly jwtService;
    constructor(usersService: UsersService, jwtService: JwtService);
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
