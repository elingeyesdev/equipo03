import { Inject, Injectable, ForbiddenException, NotFoundException, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { UserTraining } from '../domain/user-training.entity';
import { UserTrainingGoals } from '../domain/user-training-goals.entity';
import { UserTrainingPreferences } from '../domain/user-training-preferences.entity';
import { UserTrainingRestriction } from '../domain/user-training-restriction.entity';
import { EmergencyContact } from '../domain/emergency-contact.entity';
import { WorkoutSession } from '../domain/workout-session.entity';
import { WorkoutSet } from '../domain/workout-set.entity';
import { UserSubscription } from '../../subscriptions/domain/user-subscription.entity';
import { getManagerGymId, type RequestWithUser } from '../../common/security/gym-scope';

@Injectable({ scope: Scope.REQUEST })
export class TrainingService {
  constructor(
    @InjectRepository(UserTraining) private utRepo: Repository<UserTraining>,
    @InjectRepository(UserTrainingGoals) private goalsRepo: Repository<UserTrainingGoals>,
    @InjectRepository(UserTrainingPreferences) private prefsRepo: Repository<UserTrainingPreferences>,
    @InjectRepository(UserTrainingRestriction) private restRepo: Repository<UserTrainingRestriction>,
    @InjectRepository(EmergencyContact) private ecRepo: Repository<EmergencyContact>,
    @InjectRepository(WorkoutSession) private sessionsRepo: Repository<WorkoutSession>,
    @InjectRepository(WorkoutSet) private setsRepo: Repository<WorkoutSet>,
    @InjectRepository(UserSubscription) private subsRepo: Repository<UserSubscription>,
    @Inject(REQUEST) private readonly request: RequestWithUser,
  ) {}

  private managerGymId(): number | null {
    return getManagerGymId(this.request);
  }

  // ── User Training Profile ────────────────────────
  async createTrainingProfile(userId: number, goals?: any, prefs?: any) {
    const ut = await this.utRepo.save(this.utRepo.create({ userId }));
    if (goals) await this.goalsRepo.save(this.goalsRepo.create({ ...goals, userTrainingId: ut.id }));
    if (prefs) await this.prefsRepo.save(this.prefsRepo.create({ ...prefs, userTrainingId: ut.id }));
    return this.getTrainingProfile(userId);
  }
  async getTrainingProfile(userId: number) {
    const ut = await this.utRepo.findOne({ where: { userId }, relations: ['goals', 'preferences'] });
    if (!ut) throw new NotFoundException(`Perfil de entrenamiento no encontrado para usuario ${userId}`);
    return ut;
  }

  // ── Restrictions ─────────────────────────────────
  createRestriction(data: Partial<UserTrainingRestriction>) { return this.restRepo.save(this.restRepo.create(data)); }
  findRestriction(userId: number) { return this.restRepo.findOne({ where: { userId } }); }

  // ── Emergency Contacts ───────────────────────────
  createEmergencyContact(data: Partial<EmergencyContact>) { return this.ecRepo.save(this.ecRepo.create(data)); }
  findEmergencyContacts(userId: number) { return this.ecRepo.find({ where: { userId } }); }
  removeEmergencyContact(id: number) { return this.ecRepo.delete(id); }

  // ── Workout Sessions ─────────────────────────────
  async saveCompletedSession(userId: number, data: any) {
    const mg = this.managerGymId();

    let gymId: number | null;
    if (mg !== null) {
      gymId = mg;
    } else if (data.gymId) {
      gymId = Number(data.gymId);
    } else {
      const sub = await this.subsRepo.findOne({
        where: { userId, status: 'ACTIVO' },
        order: { createdAt: 'DESC' },
      });
      gymId = sub?.homeGymId ?? null;
    }

    const now = new Date();
    const session = await this.sessionsRepo.save(
      this.sessionsRepo.create({
        userId,
        gymId,
        routineId: data.routineId ?? null,
        sportType: data.sportType ?? null,
        durationSeconds: data.durationSeconds ?? null,
        caloriesBurned: data.caloriesBurned ?? null,
        notes: data.notes ?? null,
        status: 'FINISHED',
        startedAt: now,
        finishedAt: now,
      }),
    );

    if (data.sets?.length) {
      const items = (data.sets as any[]).map((s) =>
        this.setsRepo.create({ ...s, sessionId: session.id } as DeepPartial<WorkoutSet>),
      );
      await this.setsRepo.save(items);
    }

    return this.findOneSession(session.id);
  }

  async createSession(data: any) {
    const mg = this.managerGymId();
    const { sets, ...sData } = data;
    const sessionData: DeepPartial<WorkoutSession> = { ...sData };

    if (mg !== null) {
      if (sessionData.gymId !== undefined && sessionData.gymId !== null && Number(sessionData.gymId) !== mg) {
        throw new ForbiddenException('No puede registrar sesiones para otra sucursal');
      }
      sessionData.gymId = mg;
    }

    const session = await this.sessionsRepo.save(this.sessionsRepo.create(sessionData));
    if (sets?.length) {
      const items = sets.map((s: any) => this.setsRepo.create({ ...s, sessionId: session.id } as DeepPartial<WorkoutSet>));
      await this.setsRepo.save(items);
    }
    return this.findOneSession(session.id);
  }

  findAllSessions(userId: number) {
    const mg = this.managerGymId();
    const qb = this.sessionsRepo.createQueryBuilder('session')
      .leftJoinAndSelect('session.routine', 'routine')
      .leftJoinAndSelect('session.user', 'user')
      .leftJoinAndSelect('session.gym', 'gym')
      .leftJoinAndSelect('session.sets', 'sets')
      .leftJoinAndSelect('sets.routineExercise', 'routineExercise')
      .where('session.user_id = :userId', { userId })
      .orderBy('session.started_at', 'DESC');

    if (mg !== null) {
      qb.andWhere('session.gym_id = :gymId', { gymId: mg });
    }

    return qb.getMany();
  }

  findSessionsByUser(userId: number) {
    const mg = this.managerGymId();
    const qb = this.sessionsRepo.createQueryBuilder('session')
      .leftJoinAndSelect('session.routine', 'routine')
      .leftJoinAndSelect('session.gym', 'gym')
      .leftJoinAndSelect('session.sets', 'sets')
      .where('session.user_id = :userId', { userId })
      .orderBy('session.started_at', 'DESC');

    if (mg !== null) {
      qb.andWhere('session.gym_id = :gymId', { gymId: mg });
    }

    return qb.getMany();
  }

  async findOneSession(id: number) {
    const mg = this.managerGymId();
    const qb = this.sessionsRepo.createQueryBuilder('session')
      .leftJoinAndSelect('session.routine', 'routine')
      .leftJoinAndSelect('session.user', 'user')
      .leftJoinAndSelect('session.gym', 'gym')
      .leftJoinAndSelect('session.sets', 'sets')
      .leftJoinAndSelect('sets.routineExercise', 'routineExercise')
      .where('session.id = :id', { id });

    if (mg !== null) {
      qb.andWhere('session.gym_id = :gymId', { gymId: mg });
    }

    const s = await qb.getOne();
    if (s) return s;

    if (mg !== null) {
      const exists = await this.sessionsRepo.exist({ where: { id } });
      if (exists) throw new ForbiddenException('No tiene permisos para acceder a esta sesión');
    }

    throw new NotFoundException(`Sesión ${id} no encontrada`);
  }

  async updateSession(id: number, data: any) {
    const s = await this.findOneSession(id);
    const mg = this.managerGymId();

    if (mg !== null && data.gymId !== undefined && data.gymId !== null && Number(data.gymId) !== mg) {
      throw new ForbiddenException('No puede mover la sesión a otra sucursal');
    }

    if (data.status === 'COMPLETED' && !s.finishedAt) s.finishedAt = new Date();
    Object.assign(s, data);
    return this.sessionsRepo.save(s);
  }

  async addSet(sessionId: number, data: any) {
    await this.findOneSession(sessionId);
    return this.setsRepo.save(this.setsRepo.create({ ...data, sessionId }));
  }

  async removeSession(id: number) {
    await this.findOneSession(id);
    return this.sessionsRepo.delete(id);
  }
}

