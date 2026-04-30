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
exports.ActivitiesService = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const gym_activity_entity_1 = require("../domain/gym-activity.entity");
const gym_activity_schedule_entity_1 = require("../domain/gym-activity-schedule.entity");
const gym_activity_attendance_entity_1 = require("../domain/gym-activity-attendance.entity");
const gym_scope_1 = require("../../common/security/gym-scope");
let ActivitiesService = class ActivitiesService {
    actRepo;
    schedRepo;
    attRepo;
    request;
    constructor(actRepo, schedRepo, attRepo, request) {
        this.actRepo = actRepo;
        this.schedRepo = schedRepo;
        this.attRepo = attRepo;
        this.request = request;
    }
    managerGymId() {
        return (0, gym_scope_1.getManagerGymId)(this.request);
    }
    resolveListGymFilter(managerGymId, requestedGymId) {
        if (managerGymId === null)
            return requestedGymId ?? undefined;
        if (requestedGymId !== undefined && requestedGymId !== null && Number(requestedGymId) !== managerGymId) {
            throw new common_1.ForbiddenException('No tiene permisos para consultar otra sucursal');
        }
        return managerGymId;
    }
    async createActivity(data) {
        const mg = this.managerGymId();
        const merged = { ...data };
        if (mg !== null)
            merged.gymId = mg;
        return this.actRepo.save(this.actRepo.create(merged));
    }
    findAllActivities(gymId) {
        const mg = this.managerGymId();
        const effective = this.resolveListGymFilter(mg, gymId === undefined ? undefined : Number(gymId));
        const qb = this.actRepo
            .createQueryBuilder('activity')
            .leftJoinAndSelect('activity.gym', 'gym')
            .leftJoinAndSelect('activity.schedules', 'schedules')
            .where('activity.is_active = :active', { active: true });
        if (effective !== undefined && effective !== null) {
            qb.andWhere('activity.gym_id = :gymId', { gymId: effective });
        }
        return qb.getMany();
    }
    async findOneActivity(id) {
        const mg = this.managerGymId();
        const a = await this.actRepo.findOne({
            where: { id },
            relations: ['gym', 'schedules', 'schedules.instructor'],
        });
        if (!a)
            throw new common_1.NotFoundException(`Actividad ${id} no encontrada`);
        if (mg !== null && Number(a.gymId) !== mg) {
            throw new common_1.ForbiddenException('No tiene permisos para acceder a esta actividad');
        }
        return a;
    }
    async assertActivityInManagerScope(gymActivityId) {
        const mg = this.managerGymId();
        const a = await this.actRepo.findOne({ where: { id: gymActivityId } });
        if (!a)
            throw new common_1.NotFoundException(`Actividad ${gymActivityId} no encontrada`);
        if (mg !== null && Number(a.gymId) !== mg) {
            throw new common_1.ForbiddenException('No tiene permisos para gestionar esta actividad');
        }
        return a;
    }
    async assertScheduleInManagerScope(scheduleId) {
        const mg = this.managerGymId();
        const s = await this.schedRepo.findOne({
            where: { id: scheduleId },
            relations: ['gymActivity'],
        });
        if (!s?.gymActivity)
            throw new common_1.NotFoundException(`Horario ${scheduleId} no encontrado`);
        if (mg !== null && Number(s.gymActivity.gymId) !== mg) {
            throw new common_1.ForbiddenException('No tiene permisos para gestionar este horario');
        }
        return s;
    }
    async createSchedule(data) {
        if (data.gymActivityId != null)
            await this.assertActivityInManagerScope(Number(data.gymActivityId));
        return this.schedRepo.save(this.schedRepo.create(data));
    }
    async findSchedulesByActivity(gymActivityId) {
        await this.assertActivityInManagerScope(gymActivityId);
        return this.schedRepo.find({ where: { gymActivityId }, relations: ['instructor'] });
    }
    async registerAttendance(data) {
        if (data.gymActivityScheduleId != null) {
            await this.assertScheduleInManagerScope(Number(data.gymActivityScheduleId));
        }
        return this.attRepo.save(this.attRepo.create(data));
    }
    async findAttendances(gymActivityScheduleId) {
        await this.assertScheduleInManagerScope(gymActivityScheduleId);
        return this.attRepo.find({ where: { gymActivityScheduleId }, relations: ['user'] });
    }
};
exports.ActivitiesService = ActivitiesService;
exports.ActivitiesService = ActivitiesService = __decorate([
    (0, common_1.Injectable)({ scope: common_1.Scope.REQUEST }),
    __param(0, (0, typeorm_1.InjectRepository)(gym_activity_entity_1.GymActivity)),
    __param(1, (0, typeorm_1.InjectRepository)(gym_activity_schedule_entity_1.GymActivitySchedule)),
    __param(2, (0, typeorm_1.InjectRepository)(gym_activity_attendance_entity_1.GymActivityAttendance)),
    __param(3, (0, common_1.Inject)(core_1.REQUEST)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository, Object])
], ActivitiesService);
//# sourceMappingURL=activities.service.js.map