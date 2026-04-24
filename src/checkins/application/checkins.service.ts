import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CheckIn } from '../domain/check-in.entity';
@Injectable()
export class CheckinsService {
  constructor(@InjectRepository(CheckIn) private repo: Repository<CheckIn>) {}
  create(data: Partial<CheckIn>) { return this.repo.save(this.repo.create(data)); }
  findAll() { return this.repo.find({ relations: ['user', 'gym'], order: { checkInTime: 'DESC' } }); }
  findByUser(userId: number) { return this.repo.find({ where: { userId }, relations: ['gym'], order: { checkInTime: 'DESC' } }); }
  findByGym(gymId: number) { return this.repo.find({ where: { gymId }, relations: ['user'], order: { checkInTime: 'DESC' } }); }
  async findOne(id: number) { const c = await this.repo.findOne({ where: { id }, relations: ['user', 'gym'] }); if (!c) throw new NotFoundException(`Check-in ${id} no encontrado`); return c; }
  async checkOut(id: number) { const c = await this.findOne(id); c.checkOutTime = new Date(); return this.repo.save(c); }
}
