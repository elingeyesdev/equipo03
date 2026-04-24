import { AuthService } from '../application/auth.service';
import { RegisterDto, LoginDto } from '../application/dtos/auth.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(body: RegisterDto): Promise<{
        user: {
            id: number;
            email: string;
            profile: import("../../users/domain/user-profile.entity").UserProfile;
        };
        accessToken: string;
    }>;
    login(body: LoginDto): Promise<{
        user: {
            id: number;
            email: string;
            profile: import("../../users/domain/user-profile.entity").UserProfile;
        };
        accessToken: string;
    }>;
}
