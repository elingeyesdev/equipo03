import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WaitlistEntry } from '../domain/waitlist-entry.entity';
@Injectable()
export class WaitlistService {
  constructor(@InjectRepository(WaitlistEntry) private repo: Repository<WaitlistEntry>) {}
  create(data: Partial<WaitlistEntry>) { return this.repo.save(this.repo.create(data)); }
  findBySchedule(gymActivityScheduleId: number) { return this.repo.find({ where: { gymActivityScheduleId, status: 'WAITING' }, relations: ['user'], order: { positionInQueue: 'ASC' } }); }
  findByUser(userId: number) { return this.repo.find({ where: { userId }, relations: ['gymActivitySchedule'], order: { createdAt: 'DESC' } }); }
  async updateStatus(id: number, status: string) { await this.repo.update(id, { status, ...(status === 'ASSIGNED' ? { assignedAt: new Date() } : {}) }); return this.repo.findOne({ where: { id } }); }
  remove(id: number) { return this.repo.delete(id); }
}
