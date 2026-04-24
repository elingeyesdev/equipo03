import { Repository } from 'typeorm';
import { SystemSetting } from '../domain/system-setting.entity';
export declare class SystemService {
    private repo;
    constructor(repo: Repository<SystemSetting>);
    create(data: Partial<SystemSetting>): Promise<SystemSetting>;
    findAll(): Promise<SystemSetting[]>;
    findByKey(key: string): Promise<SystemSetting>;
    update(key: string, value: any, updatedBy?: number): Promise<SystemSetting>;
    remove(id: number): Promise<import("typeorm").DeleteResult>;
}
