import { Repository } from 'typeorm';
import { WaitlistEntry } from '../domain/waitlist-entry.entity';
export declare class WaitlistService {
    private repo;
    constructor(repo: Repository<WaitlistEntry>);
    create(data: Partial<WaitlistEntry>): Promise<WaitlistEntry>;
    findBySchedule(gymActivityScheduleId: number): Promise<WaitlistEntry[]>;
    findByUser(userId: number): Promise<WaitlistEntry[]>;
    updateStatus(id: number, status: string): Promise<WaitlistEntry | null>;
    remove(id: number): Promise<import("typeorm").DeleteResult>;
}
