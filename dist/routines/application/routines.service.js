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
exports.RoutinesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const routine_entity_1 = require("../domain/routine.entity");
const routine_exercise_entity_1 = require("../domain/routine-exercise.entity");
let RoutinesService = class RoutinesService {
    routinesRepo;
    reRepo;
    constructor(routinesRepo, reRepo) {
        this.routinesRepo = routinesRepo;
        this.reRepo = reRepo;
    }
    async create(data) {
        const { exercises, ...routineData } = data;
        const routineEntity = routineData;
        const routine = await this.routinesRepo.save(this.routinesRepo.create(routineEntity));
        if (exercises?.length) {
            const items = exercises.map((e, i) => this.reRepo.create({ ...e, routineId: routine.id, orderPosition: e.orderPosition ?? i }));
            await this.reRepo.save(items);
        }
        return this.findOne(routine.id);
    }
    findAll() { return this.routinesRepo.find({ where: { isActive: true }, relations: ['trainer', 'assignedUser', 'gym', 'exercises', 'exercises.exercise'] }); }
    findByUser(userId) { return this.routinesRepo.find({ where: { assignedUserId: userId, isActive: true }, relations: ['exercises', 'exercises.exercise'] }); }
    findByTrainer(trainerId) { return this.routinesRepo.find({ where: { trainerId, isActive: true }, relations: ['assignedUser', 'exercises'] }); }
    async findOne(id) {
        const r = await this.routinesRepo.findOne({ where: { id }, relations: ['trainer', 'assignedUser', 'gym', 'exercises', 'exercises.exercise'] });
        if (!r)
            throw new common_1.NotFoundException(`Rutina ${id} no encontrada`);
        return r;
    }
    async update(id, data) {
        const r = await this.findOne(id);
        const { exercises, ...rData } = data;
        Object.assign(r, rData);
        await this.routinesRepo.save(r);
        if (exercises) {
            await this.reRepo.delete({ routineId: id });
            const items = exercises.map((e, i) => this.reRepo.create({ ...e, routineId: id, orderPosition: e.orderPosition ?? i }));
            await this.reRepo.save(items);
        }
        return this.findOne(id);
    }
    async remove(id) { const r = await this.routinesRepo.delete(id); if (r.affected === 0)
        throw new common_1.NotFoundException(`Rutina ${id} no encontrada`); }
};
exports.RoutinesService = RoutinesService;
exports.RoutinesService = RoutinesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(routine_entity_1.Routine)),
    __param(1, (0, typeorm_1.InjectRepository)(routine_exercise_entity_1.RoutineExercise)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], RoutinesService);
//# sourceMappingURL=routines.service.js.map