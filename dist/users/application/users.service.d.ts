import { Repository } from 'typeorm';
import { User } from '../domain/user.entity';
import { UserProfile } from '../domain/user-profile.entity';
export declare class UsersService {
    private readonly usersRepo;
    private readonly profilesRepo;
    constructor(usersRepo: Repository<User>, profilesRepo: Repository<UserProfile>);
    create(data: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        phone?: string;
        dateOfBirth?: string;
        gender?: string;
    }): Promise<User>;
    findAll(): Promise<User[]>;
    findOne(id: number): Promise<User>;
    findByEmail(email: string): Promise<User | null>;
    update(id: number, data: Partial<{
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        phone: string;
        isActive: boolean;
    }>): Promise<User>;
    remove(id: number): Promise<void>;
}
