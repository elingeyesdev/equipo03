import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation } from '../domain/reservation.entity';
@Injectable()
export class ReservationsService {
  constructor(@InjectRepository(Reservation) private repo: Repository<Reservation>) {}
  create(data: any) { return this.repo.save(this.repo.create(data)); }
  findAll() { return this.repo.find({ relations: ['user', 'gymActivitySchedule'], order: { createdAt: 'DESC' } }); }
  findByUser(userId: number) { return this.repo.find({ where: { userId }, relations: ['gymActivitySchedule'], order: { reservationDate: 'DESC' } }); }
  async findOne(id: number) { const r = await this.repo.findOne({ where: { id }, relations: ['user', 'gymActivitySchedule'] }); if (!r) throw new NotFoundException(`Reserva ${id} no encontrada`); return r; }
  async cancel(id: number) { const r = await this.findOne(id); r.status = 'CANCELLED'; r.cancelledAt = new Date(); return this.repo.save(r); }
}
