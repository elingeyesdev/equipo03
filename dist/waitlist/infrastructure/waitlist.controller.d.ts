import { WaitlistService } from '../application/waitlist.service';
import { CreateWaitlistEntryDto, UpdateWaitlistStatusDto } from '../application/dtos/waitlist.dto';
export declare class WaitlistController {
    private readonly svc;
    constructor(svc: WaitlistService);
    create(body: CreateWaitlistEntryDto): Promise<import("../domain/waitlist-entry.entity").WaitlistEntry>;
    findBySchedule(sid: number): Promise<import("../domain/waitlist-entry.entity").WaitlistEntry[]>;
    findByUser(uid: number): Promise<import("../domain/waitlist-entry.entity").WaitlistEntry[]>;
    updateStatus(id: number, body: UpdateWaitlistStatusDto): Promise<import("../domain/waitlist-entry.entity").WaitlistEntry | null>;
    remove(id: number): Promise<import("typeorm").DeleteResult>;
}
