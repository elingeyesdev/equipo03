import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Gym } from '../domain/gym.entity';
import { GymLocation } from '../domain/gym-location.entity';
import { GymSchedule } from '../domain/gym-schedule.entity';

@Injectable()
export class GymsService {
  constructor(
    @InjectRepository(Gym) private gymsRepo: Repository<Gym>,
    @InjectRepository(GymLocation) private locRepo: Repository<GymLocation>,
    @InjectRepository(GymSchedule) private schedRepo: Repository<GymSchedule>,
  ) {}

  async create(data: any) {
    const { location, schedules, ...gymData } = data;
    const gymEntity = this.gymsRepo.create(gymData as Partial<Gym>);
    const gym = await this.gymsRepo.save(gymEntity) as Gym;
    if (location) await this.locRepo.save(this.locRepo.create({ ...location, gymId: gym.id }));
    if (schedules?.length) {
      const items = schedules.map((s: any) => this.schedRepo.create({ ...s, gymId: gym.id }));
      await this.schedRepo.save(items);
    }
    return this.findOne(gym.id);
  }

  findAll() { return this.gymsRepo.find({ relations: ['location', 'schedules'], where: { isActive: true } }); }

  async findOne(id: number) {
    const gym = await this.gymsRepo.findOne({ where: { id }, relations: ['location', 'schedules', 'activities'] });
    if (!gym) throw new NotFoundException(`Gimnasio ${id} no encontrado`);
    return gym;
  }

  async update(id: number, data: any) {
    const gym = await this.findOne(id);
    Object.assign(gym, data);
    return this.gymsRepo.save(gym);
  }

  async remove(id: number) {
    const r = await this.gymsRepo.delete(id);
    if (r.affected === 0) throw new NotFoundException(`Gimnasio ${id} no encontrado`);
  }

  // ── Schedules ─────────────────────────────────────
  addSchedule(gymId: number, data: any) { return this.schedRepo.save(this.schedRepo.create({ ...data, gymId })); }
  findSchedules(gymId: number) { return this.schedRepo.find({ where: { gymId } }); }
  removeSchedule(id: number) { return this.schedRepo.delete(id); }

  // ── Location ──────────────────────────────────────
  async updateLocation(gymId: number, data: any) {
    let loc = await this.locRepo.findOne({ where: { gymId } });
    if (loc) { Object.assign(loc, data); return this.locRepo.save(loc); }
    return this.locRepo.save(this.locRepo.create({ ...data, gymId }));
  }
}
