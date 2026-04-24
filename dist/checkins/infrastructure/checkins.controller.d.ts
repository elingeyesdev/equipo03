import { CheckinsService } from '../application/checkins.service';
import { CreateCheckInDto } from '../application/dtos/checkins.dto';
export declare class CheckinsController {
    private readonly svc;
    constructor(svc: CheckinsService);
    create(body: CreateCheckInDto): Promise<import("../domain/check-in.entity").CheckIn>;
    findAll(): Promise<import("../domain/check-in.entity").CheckIn[]>;
    findByUser(uid: number): Promise<import("../domain/check-in.entity").CheckIn[]>;
    findByGym(gid: number): Promise<import("../domain/check-in.entity").CheckIn[]>;
    checkOut(id: number): Promise<import("../domain/check-in.entity").CheckIn>;
}
