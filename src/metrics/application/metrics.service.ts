import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PhysicalMetricsHistory } from '../domain/physical-metrics-history.entity';
@Injectable()
export class MetricsService {
  constructor(@InjectRepository(PhysicalMetricsHistory) private repo: Repository<PhysicalMetricsHistory>) {}
  create(data: Partial<PhysicalMetricsHistory>) { return this.repo.save(this.repo.create(data)); }
  findAll() { return this.repo.find({ relations: ['user', 'gym'], order: { recordedAt: 'DESC' } }); }
  findByUser(userId: number) { return this.repo.find({ where: { userId }, order: { recordedAt: 'DESC' } }); }
  async findLatest(userId: number) { const m = await this.repo.findOne({ where: { userId }, order: { recordedAt: 'DESC' } }); if (!m) throw new NotFoundException(`No hay métricas para usuario ${userId}`); return m; }
  async findOne(id: number) { const m = await this.repo.findOne({ where: { id }, relations: ['user', 'gym'] }); if (!m) throw new NotFoundException(`Métrica ${id} no encontrada`); return m; }
  async remove(id: number) { const r = await this.repo.delete(id); if (r.affected === 0) throw new NotFoundException(`Métrica ${id} no encontrada`); }
}
