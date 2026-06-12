import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSetting } from '../domain/system-setting.entity';
@Injectable()
export class SystemService {
  constructor(
    @InjectRepository(SystemSetting) private repo: Repository<SystemSetting>,
  ) {}
  create(data: Partial<SystemSetting>) {
    return this.repo.save(this.repo.create(data));
  }
  findAll() {
    return this.repo.find();
  }
  async findByKey(key: string) {
    const s = await this.repo.findOne({ where: { settingKey: key } });
    if (!s) throw new NotFoundException(`Setting ${key} no encontrado`);
    return s;
  }
  async update(key: string, value: any, updatedBy?: number) {
    const s = await this.repo.findOne({ where: { settingKey: key } });
    if (!s) throw new NotFoundException(`Setting ${key} no encontrado`);
    s.settingValue = value;
    s.updatedBy = updatedBy ?? (null as any);
    s.updatedAt = new Date();
    return this.repo.save(s);
  }
  remove(id: number) {
    return this.repo.delete(id);
  }
}
