import { SystemService } from '../application/system.service';
import { CreateSettingDto, UpdateSettingDto } from '../application/dtos/system.dto';
export declare class SystemController {
    private readonly svc;
    constructor(svc: SystemService);
    create(body: CreateSettingDto): Promise<import("../domain/system-setting.entity").SystemSetting>;
    findAll(): Promise<import("../domain/system-setting.entity").SystemSetting[]>;
    findByKey(key: string): Promise<import("../domain/system-setting.entity").SystemSetting>;
    update(key: string, body: UpdateSettingDto): Promise<import("../domain/system-setting.entity").SystemSetting>;
    remove(id: number): Promise<import("typeorm").DeleteResult>;
}
