import {
  Inject,
  Injectable,
  ForbiddenException,
  BadRequestException,
  Scope,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Visit } from '../domain/visit.entity';
import { type RequestWithUser } from '../../common/security/gym-scope';
import { CreateVisitDto } from './dtos/create-visit.dto';

@Injectable({ scope: Scope.REQUEST })
export class VisitsService {
  constructor(
    @InjectRepository(Visit) private readonly repo: Repository<Visit>,
    @Inject(REQUEST) private readonly request: RequestWithUser,
  ) {}

  /** Extrae el userId autenticado. Solo CLIENTE puede acceder a este módulo. */
  private getClientUserId(): number {
    const user = this.request.user;
    if (!user?.userId) {
      throw new ForbiddenException('Sesión no válida.');
    }
    if ((user.level ?? 0) > 1) {
      throw new ForbiddenException(
        'Solo los clientes pueden registrar y consultar visitas GPS.',
      );
    }
    return Number(user.userId);
  }

  /**
   * POST /api/visits
   * Registra una visita física detectada por el GPS del cliente.
   */
  async create(dto: CreateVisitDto): Promise<Visit> {
    const userId = this.getClientUserId();

    if (dto.exitedAt && dto.enteredAt > dto.exitedAt) {
      throw new BadRequestException(
        'exitedAt no puede ser anterior a enteredAt.',
      );
    }

    const entity = this.repo.create({
      userId,
      gymId: dto.gymId,
      enteredAt: new Date(dto.enteredAt),
      exitedAt: dto.exitedAt ? new Date(dto.exitedAt) : null,
      durationMin: dto.durationMin ?? null,
    });

    return this.repo.save(entity);
  }

  /**
   * GET /api/visits/me
   * Devuelve el historial de visitas del cliente autenticado,
   * incluyendo el nombre del gimnasio, ordenadas de más reciente a más antigua.
   */
  async findMyVisits(): Promise<object[]> {
    const userId = this.getClientUserId();

    const visits = await this.repo
      .createQueryBuilder('visit')
      .innerJoinAndSelect('visit.gym', 'gym')
      .leftJoinAndSelect('gym.location', 'location')
      .where('visit.user_id = :userId', { userId })
      .andWhere('gym.isActive = true')
      .orderBy('visit.entered_at', 'DESC')
      .getMany();

    return visits.map((v) => ({
      id: v.id,
      gymId: v.gymId,
      enteredAt: v.enteredAt,
      exitedAt: v.exitedAt,
      durationMin: v.durationMin,
      createdAt: v.createdAt,
      gym: v.gym ? {
        id: v.gym.id,
        name: v.gym.name,
        location: v.gym.location ? {
          address: v.gym.location.address,
          latitude: Number(v.gym.location.latitude),
          longitude: Number(v.gym.location.longitude),
        } : undefined,
      } : undefined,
    }));
  }
}
