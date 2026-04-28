"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrainingService = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_training_entity_1 = require("../domain/user-training.entity");
const user_training_goals_entity_1 = require("../domain/user-training-goals.entity");
const user_training_preferences_entity_1 = require("../domain/user-training-preferences.entity");
const user_training_restriction_entity_1 = require("../domain/user-training-restriction.entity");
const emergency_contact_entity_1 = require("../domain/emergency-contact.entity");
const workout_session_entity_1 = require("../domain/workout-session.entity");
const workout_set_entity_1 = require("../domain/workout-set.entity");
const gym_scope_1 = require("../../common/security/gym-scope");
let TrainingService = class TrainingService {
    utRepo;
    goalsRepo;
    prefsRepo;
    restRepo;
    ecRepo;
    sessionsRepo;
    setsRepo;
    request;
    constructor(utRepo, goalsRepo, prefsRepo, restRepo, ecRepo, sessionsRepo, setsRepo, request) {
        this.utRepo = utRepo;
        this.goalsRepo = goalsRepo;
        this.prefsRepo = prefsRepo;
        this.restRepo = restRepo;
        this.ecRepo = ecRepo;
        this.sessionsRepo = sessionsRepo;
        this.setsRepo = setsRepo;
        this.request = request;
    }
    managerGymId() {
        return (0, gym_scope_1.getManagerGymId)(this.request);
    }
    async createTrainingProfile(userId, goals, prefs) {
        const ut = await this.utRepo.save(this.utRepo.create({ userId }));
        if (goals)
            await this.goalsRepo.save(this.goalsRepo.create({ ...goals, userTrainingId: ut.id }));
        if (prefs)
            await this.prefsRepo.save(this.prefsRepo.create({ ...prefs, userTrainingId: ut.id }));
        return this.getTrainingProfile(userId);
    }
    async getTrainingProfile(userId) {
        const ut = await this.utRepo.findOne({ where: { userId }, relations: ['goals', 'preferences'] });
        if (!ut)
            throw new common_1.NotFoundException(`Perfil de entrenamiento no encontrado para usuario ${userId}`);
        return ut;
    }
    createRestriction(data) { return this.restRepo.save(this.restRepo.create(data)); }
    findRestriction(userId) { return this.restRepo.findOne({ where: { userId } }); }
    createEmergencyContact(data) { return this.ecRepo.save(this.ecRepo.create(data)); }
    findEmergencyContacts(userId) { return this.ecRepo.find({ where: { userId } }); }
    removeEmergencyContact(id) { return this.ecRepo.delete(id); }
    async createSession(data) {
        const mg = this.managerGymId();
        const { sets, ...sData } = data;
        const sessionData = { ...sData };
        if (mg !== null) {
            if (sessionData.gymId !== undefined && sessionData.gymId !== null && Number(sessionData.gymId) !== mg) {
                throw new common_1.ForbiddenException('No puede registrar sesiones para otra sucursal');
            }
            sessionData.gymId = mg;
        }
        const session = await this.sessionsRepo.save(this.sessionsRepo.create(sessionData));
        if (sets?.length) {
            const items = sets.map((s) => this.setsRepo.create({ ...s, sessionId: session.id }));
            await this.setsRepo.save(items);
        }
        return this.findOneSession(session.id);
    }
    findAllSessions() {
        const mg = this.managerGymId();
        const qb = this.sessionsRepo.createQueryBuilder('session')
            .leftJoinAndSelect('session.routine', 'routine')
            .leftJoinAndSelect('session.user', 'user')
            .leftJoinAndSelect('session.gym', 'gym')
            .leftJoinAndSelect('session.sets', 'sets')
            .leftJoinAndSelect('sets.routineExercise', 'routineExercise')
            .orderBy('session.started_at', 'DESC');
        if (mg !== null) {
            qb.andWhere('session.gym_id = :gymId', { gymId: mg });
        }
        return qb.getMany();
    }
    findSessionsByUser(userId) {
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
    async findOneSession(id) {
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
        if (s)
            return s;
        if (mg !== null) {
            const exists = await this.sessionsRepo.exist({ where: { id } });
            if (exists)
                throw new common_1.ForbiddenException('No tiene permisos para acceder a esta sesión');
        }
        throw new common_1.NotFoundException(`Sesión ${id} no encontrada`);
    }
    async updateSession(id, data) {
        const s = await this.findOneSession(id);
        const mg = this.managerGymId();
        if (mg !== null && data.gymId !== undefined && data.gymId !== null && Number(data.gymId) !== mg) {
            throw new common_1.ForbiddenException('No puede mover la sesión a otra sucursal');
        }
        if (data.status === 'COMPLETED' && !s.finishedAt)
            s.finishedAt = new Date();
        Object.assign(s, data);
        return this.sessionsRepo.save(s);
    }
    async addSet(sessionId, data) {
        await this.findOneSession(sessionId);
        return this.setsRepo.save(this.setsRepo.create({ ...data, sessionId }));
    }
    async removeSession(id) {
        await this.findOneSession(id);
        return this.sessionsRepo.delete(id);
    }
};
exports.TrainingService = TrainingService;
exports.TrainingService = TrainingService = __decorate([
    (0, common_1.Injectable)({ scope: common_1.Scope.REQUEST }),
    __param(0, (0, typeorm_1.InjectRepository)(user_training_entity_1.UserTraining)),
    __param(1, (0, typeorm_1.InjectRepository)(user_training_goals_entity_1.UserTrainingGoals)),
    __param(2, (0, typeorm_1.InjectRepository)(user_training_preferences_entity_1.UserTrainingPreferences)),
    __param(3, (0, typeorm_1.InjectRepository)(user_training_restriction_entity_1.UserTrainingRestriction)),
    __param(4, (0, typeorm_1.InjectRepository)(emergency_contact_entity_1.EmergencyContact)),
    __param(5, (0, typeorm_1.InjectRepository)(workout_session_entity_1.WorkoutSession)),
    __param(6, (0, typeorm_1.InjectRepository)(workout_set_entity_1.WorkoutSet)),
    __param(7, (0, common_1.Inject)(core_1.REQUEST)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository, Object])
], TrainingService);
//# sourceMappingURL=training.service.js.map