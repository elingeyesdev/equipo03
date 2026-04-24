import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { UserTraining } from '../domain/user-training.entity';
import { UserTrainingGoals } from '../domain/user-training-goals.entity';
import { UserTrainingPreferences } from '../domain/user-training-preferences.entity';
import { UserTrainingRestriction } from '../domain/user-training-restriction.entity';
import { EmergencyContact } from '../domain/emergency-contact.entity';
import { WorkoutSession } from '../domain/workout-session.entity';
import { WorkoutSet } from '../domain/workout-set.entity';

@Injectable()
export class TrainingService {
  constructor(
    @InjectRepository(UserTraining) private utRepo: Repository<UserTraining>,
    @InjectRepository(UserTrainingGoals) private goalsRepo: Repository<UserTrainingGoals>,
    @InjectRepository(UserTrainingPreferences) private prefsRepo: Repository<UserTrainingPreferences>,
    @InjectRepository(UserTrainingRestriction) private restRepo: Repository<UserTrainingRestriction>,
    @InjectRepository(EmergencyContact) private ecRepo: Repository<EmergencyContact>,
    @InjectRepository(WorkoutSession) private sessionsRepo: Repository<WorkoutSession>,
    @InjectRepository(WorkoutSet) private setsRepo: Repository<WorkoutSet>,
  ) {}

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
  async createSession(data: any) {
    const { sets, ...sData } = data;
    const sessionData: DeepPartial<WorkoutSession> = sData;
    const session = await this.sessionsRepo.save(this.sessionsRepo.create(sessionData));
    if (sets?.length) { const items = sets.map((s: any) => this.setsRepo.create({ ...s, sessionId: session.id } as DeepPartial<WorkoutSet>)); await this.setsRepo.save(items); }
    return this.findOneSession(session.id);
  }
  findAllSessions() { return this.sessionsRepo.find({ relations: ['routine', 'user', 'gym', 'sets', 'sets.routineExercise'], order: { startedAt: 'DESC' } }); }
  findSessionsByUser(userId: number) { return this.sessionsRepo.find({ where: { userId }, relations: ['routine', 'gym', 'sets'], order: { startedAt: 'DESC' } }); }
  async findOneSession(id: number) {
    const s = await this.sessionsRepo.findOne({ where: { id }, relations: ['routine', 'user', 'gym', 'sets', 'sets.routineExercise'] });
    if (!s) throw new NotFoundException(`Sesión ${id} no encontrada`);
    return s;
  }
  async updateSession(id: number, data: any) {
    const s = await this.findOneSession(id);
    if (data.status === 'COMPLETED' && !s.finishedAt) s.finishedAt = new Date();
    Object.assign(s, data);
    return this.sessionsRepo.save(s);
  }
  addSet(sessionId: number, data: any) { return this.setsRepo.save(this.setsRepo.create({ ...data, sessionId })); }
  removeSession(id: number) { return this.sessionsRepo.delete(id); }
}
