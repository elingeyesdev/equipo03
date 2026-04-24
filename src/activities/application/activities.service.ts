import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GymActivity } from '../domain/gym-activity.entity';
import { GymActivitySchedule } from '../domain/gym-activity-schedule.entity';
import { GymActivityAttendance } from '../domain/gym-activity-attendance.entity';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(GymActivity) private actRepo: Repository<GymActivity>,
    @InjectRepository(GymActivitySchedule) private schedRepo: Repository<GymActivitySchedule>,
    @InjectRepository(GymActivityAttendance) private attRepo: Repository<GymActivityAttendance>,
  ) {}

  createActivity(data: Partial<GymActivity>) { return this.actRepo.save(this.actRepo.create(data)); }
  findAllActivities(gymId?: number) { return gymId ? this.actRepo.find({ where: { gymId, isActive: true }, relations: ['schedules'] }) : this.actRepo.find({ where: { isActive: true }, relations: ['gym', 'schedules'] }); }
  async findOneActivity(id: number) { const a = await this.actRepo.findOne({ where: { id }, relations: ['gym', 'schedules', 'schedules.instructor'] }); if (!a) throw new NotFoundException(`Actividad ${id} no encontrada`); return a; }

  createSchedule(data: Partial<GymActivitySchedule>) { return this.schedRepo.save(this.schedRepo.create(data)); }
  findSchedulesByActivity(gymActivityId: number) { return this.schedRepo.find({ where: { gymActivityId }, relations: ['instructor'] }); }

  registerAttendance(data: Partial<GymActivityAttendance>) { return this.attRepo.save(this.attRepo.create(data)); }
  findAttendances(gymActivityScheduleId: number) { return this.attRepo.find({ where: { gymActivityScheduleId }, relations: ['user'] }); }
}
