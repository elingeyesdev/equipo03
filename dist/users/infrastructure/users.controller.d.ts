import { UsersService } from '../application/users.service';
import { CreateUserDto, UpdateUserDto } from '../application/dtos/users.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(body: CreateUserDto): Promise<import("../domain/user.entity").User>;
    findAll(): Promise<import("../domain/user.entity").User[]>;
    findOne(id: number): Promise<import("../domain/user.entity").User>;
    update(id: number, body: UpdateUserDto): Promise<import("../domain/user.entity").User>;
    remove(id: number): Promise<{
        message: string;
    }>;
}
