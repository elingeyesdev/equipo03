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
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_training_entity_1 = require("../domain/user-training.entity");
const user_training_goals_entity_1 = require("../domain/user-training-goals.entity");
const user_training_preferences_entity_1 = require("../domain/user-training-preferences.entity");
const user_training_restriction_entity_1 = require("../domain/user-training-restriction.entity");
const emergency_contact_entity_1 = require("../domain/emergency-contact.entity");
const workout_session_entity_1 = require("../domain/workout-session.entity");
const workout_set_entity_1 = require("../domain/workout-set.entity");
let TrainingService = class TrainingService {
    utRepo;
    goalsRepo;
    prefsRepo;
    restRepo;
    ecRepo;
    sessionsRepo;
    setsRepo;
    constructor(utRepo, goalsRepo, prefsRepo, restRepo, ecRepo, sessionsRepo, setsRepo) {
        this.utRepo = utRepo;
        this.goalsRepo = goalsRepo;
        this.prefsRepo = prefsRepo;
        this.restRepo = restRepo;
        this.ecRepo = ecRepo;
        this.sessionsRepo = sessionsRepo;
        this.setsRepo = setsRepo;
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
        const { sets, ...sData } = data;
        const sessionData = sData;
        const session = await this.sessionsRepo.save(this.sessionsRepo.create(sessionData));
        if (sets?.length) {
            const items = sets.map((s) => this.setsRepo.create({ ...s, sessionId: session.id }));
            await this.setsRepo.save(items);
        }
        return this.findOneSession(session.id);
    }
    findAllSessions() { return this.sessionsRepo.find({ relations: ['routine', 'user', 'gym', 'sets', 'sets.routineExercise'], order: { startedAt: 'DESC' } }); }
    findSessionsByUser(userId) { return this.sessionsRepo.find({ where: { userId }, relations: ['routine', 'gym', 'sets'], order: { startedAt: 'DESC' } }); }
    async findOneSession(id) {
        const s = await this.sessionsRepo.findOne({ where: { id }, relations: ['routine', 'user', 'gym', 'sets', 'sets.routineExercise'] });
        if (!s)
            throw new common_1.NotFoundException(`Sesión ${id} no encontrada`);
        return s;
    }
    async updateSession(id, data) {
        const s = await this.findOneSession(id);
        if (data.status === 'COMPLETED' && !s.finishedAt)
            s.finishedAt = new Date();
        Object.assign(s, data);
        return this.sessionsRepo.save(s);
    }
    addSet(sessionId, data) { return this.setsRepo.save(this.setsRepo.create({ ...data, sessionId })); }
    removeSession(id) { return this.sessionsRepo.delete(id); }
};
exports.TrainingService = TrainingService;
exports.TrainingService = TrainingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_training_entity_1.UserTraining)),
    __param(1, (0, typeorm_1.InjectRepository)(user_training_goals_entity_1.UserTrainingGoals)),
    __param(2, (0, typeorm_1.InjectRepository)(user_training_preferences_entity_1.UserTrainingPreferences)),
    __param(3, (0, typeorm_1.InjectRepository)(user_training_restriction_entity_1.UserTrainingRestriction)),
    __param(4, (0, typeorm_1.InjectRepository)(emergency_contact_entity_1.EmergencyContact)),
    __param(5, (0, typeorm_1.InjectRepository)(workout_session_entity_1.WorkoutSession)),
    __param(6, (0, typeorm_1.InjectRepository)(workout_set_entity_1.WorkoutSet)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], TrainingService);
//# sourceMappingURL=training.service.js.map