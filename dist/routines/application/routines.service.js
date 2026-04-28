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
const core_1 = require("@nestjs/core");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const routine_entity_1 = require("../domain/routine.entity");
const routine_exercise_entity_1 = require("../domain/routine-exercise.entity");
const gym_scope_1 = require("../../common/security/gym-scope");
let RoutinesService = class RoutinesService {
    routinesRepo;
    reRepo;
    request;
    constructor(routinesRepo, reRepo, request) {
        this.routinesRepo = routinesRepo;
        this.reRepo = reRepo;
        this.request = request;
    }
    managerGymId() {
        return (0, gym_scope_1.getManagerGymId)(this.request);
    }
    async create(data) {
        const mg = this.managerGymId();
        const { exercises, ...routineData } = data;
        const routineEntity = { ...routineData };
        if (mg !== null) {
            if (routineEntity.gymId !== undefined && routineEntity.gymId !== null && Number(routineEntity.gymId) !== mg) {
                throw new common_1.ForbiddenException('No puede crear rutinas para otra sucursal');
            }
            routineEntity.gymId = mg;
        }
        const routine = await this.routinesRepo.save(this.routinesRepo.create(routineEntity));
        if (exercises?.length) {
            const items = exercises.map((e, i) => this.reRepo.create({ ...e, routineId: routine.id, orderPosition: e.orderPosition ?? i }));
            await this.reRepo.save(items);
        }
        return this.findOne(routine.id);
    }
    findAll() {
        const mg = this.managerGymId();
        const qb = this.routinesRepo.createQueryBuilder('routine')
            .leftJoinAndSelect('routine.trainer', 'trainer')
            .leftJoinAndSelect('routine.assignedUser', 'assignedUser')
            .leftJoinAndSelect('routine.gym', 'gym')
            .leftJoinAndSelect('routine.exercises', 'exercises')
            .leftJoinAndSelect('exercises.exercise', 'exercise')
            .where('routine.is_active = :isActive', { isActive: true });
        if (mg !== null) {
            qb.andWhere('routine.gym_id = :gymId', { gymId: mg });
        }
        return qb.getMany();
    }
    findByUser(userId) {
        const mg = this.managerGymId();
        const qb = this.routinesRepo.createQueryBuilder('routine')
            .leftJoinAndSelect('routine.exercises', 'exercises')
            .leftJoinAndSelect('exercises.exercise', 'exercise')
            .where('routine.assigned_user_id = :userId', { userId })
            .andWhere('routine.is_active = :isActive', { isActive: true });
        if (mg !== null) {
            qb.andWhere('routine.gym_id = :gymId', { gymId: mg });
        }
        return qb.getMany();
    }
    findByTrainer(trainerId) {
        const mg = this.managerGymId();
        const qb = this.routinesRepo.createQueryBuilder('routine')
            .leftJoinAndSelect('routine.assignedUser', 'assignedUser')
            .leftJoinAndSelect('routine.exercises', 'exercises')
            .where('routine.trainer_id = :trainerId', { trainerId })
            .andWhere('routine.is_active = :isActive', { isActive: true });
        if (mg !== null) {
            qb.andWhere('routine.gym_id = :gymId', { gymId: mg });
        }
        return qb.getMany();
    }
    async findOne(id) {
        const mg = this.managerGymId();
        const qb = this.routinesRepo.createQueryBuilder('routine')
            .leftJoinAndSelect('routine.trainer', 'trainer')
            .leftJoinAndSelect('routine.assignedUser', 'assignedUser')
            .leftJoinAndSelect('routine.gym', 'gym')
            .leftJoinAndSelect('routine.exercises', 'exercises')
            .leftJoinAndSelect('exercises.exercise', 'exercise')
            .where('routine.id = :id', { id });
        if (mg !== null) {
            qb.andWhere('routine.gym_id = :gymId', { gymId: mg });
        }
        const r = await qb.getOne();
        if (r)
            return r;
        if (mg !== null) {
            const exists = await this.routinesRepo.exist({ where: { id } });
            if (exists)
                throw new common_1.ForbiddenException('No tiene permisos para acceder a esta rutina');
        }
        throw new common_1.NotFoundException(`Rutina ${id} no encontrada`);
    }
    async update(id, data) {
        const r = await this.findOne(id);
        const mg = this.managerGymId();
        const { exercises, ...rData } = data;
        if (mg !== null && rData.gymId !== undefined && rData.gymId !== null && Number(rData.gymId) !== mg) {
            throw new common_1.ForbiddenException('No puede mover la rutina a otra sucursal');
        }
        Object.assign(r, rData);
        await this.routinesRepo.save(r);
        if (exercises) {
            await this.reRepo.delete({ routineId: id });
            const items = exercises.map((e, i) => this.reRepo.create({ ...e, routineId: id, orderPosition: e.orderPosition ?? i }));
            await this.reRepo.save(items);
        }
        return this.findOne(id);
    }
    async remove(id) {
        await this.findOne(id);
        const r = await this.routinesRepo.delete(id);
        if (r.affected === 0)
            throw new common_1.NotFoundException(`Rutina ${id} no encontrada`);
    }
};
exports.RoutinesService = RoutinesService;
exports.RoutinesService = RoutinesService = __decorate([
    (0, common_1.Injectable)({ scope: common_1.Scope.REQUEST }),
    __param(0, (0, typeorm_1.InjectRepository)(routine_entity_1.Routine)),
    __param(1, (0, typeorm_1.InjectRepository)(routine_exercise_entity_1.RoutineExercise)),
    __param(2, (0, common_1.Inject)(core_1.REQUEST)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository, Object])
], RoutinesService);
//# sourceMappingURL=routines.service.js.map