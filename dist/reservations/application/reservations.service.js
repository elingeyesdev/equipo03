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
exports.ReservationsService = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const reservation_entity_1 = require("../domain/reservation.entity");
const gym_activity_schedule_entity_1 = require("../../activities/domain/gym-activity-schedule.entity");
const gym_scope_1 = require("../../common/security/gym-scope");
let ReservationsService = class ReservationsService {
    repo;
    scheduleRepo;
    request;
    constructor(repo, scheduleRepo, request) {
        this.repo = repo;
        this.scheduleRepo = scheduleRepo;
        this.request = request;
    }
    managerGymId() {
        return (0, gym_scope_1.getManagerGymId)(this.request);
    }
    async resolveScheduleGymId(gymActivityScheduleId) {
        const schedule = await this.scheduleRepo.findOne({
            where: { id: gymActivityScheduleId },
            relations: ['gymActivity'],
        });
        if (!schedule?.gymActivity)
            throw new common_1.NotFoundException(`Horario ${gymActivityScheduleId} no encontrado`);
        return schedule.gymActivity.gymId;
    }
    async create(data) {
        const mg = this.managerGymId();
        if (mg !== null && data?.gymActivityScheduleId != null) {
            const gid = await this.resolveScheduleGymId(Number(data.gymActivityScheduleId));
            if (gid !== mg)
                throw new common_1.ForbiddenException('No puede crear reservas en otra sucursal');
        }
        return this.repo.save(this.repo.create(data));
    }
    findAll() {
        const mg = this.managerGymId();
        const qb = this.repo
            .createQueryBuilder('reservation')
            .leftJoinAndSelect('reservation.user', 'user')
            .leftJoinAndSelect('reservation.gymActivitySchedule', 'schedule')
            .leftJoinAndSelect('schedule.gymActivity', 'activity')
            .orderBy('reservation.created_at', 'DESC');
        if (mg !== null) {
            qb.andWhere('activity.gym_id = :gymId', { gymId: mg });
        }
        return qb.getMany();
    }
    findByUser(userId) {
        const mg = this.managerGymId();
        const qb = this.repo
            .createQueryBuilder('reservation')
            .leftJoinAndSelect('reservation.gymActivitySchedule', 'schedule')
            .leftJoinAndSelect('schedule.gymActivity', 'activity')
            .where('reservation.user_id = :userId', { userId })
            .orderBy('reservation.reservation_date', 'DESC');
        if (mg !== null) {
            qb.andWhere('activity.gym_id = :gymId', { gymId: mg });
        }
        return qb.getMany();
    }
    async findOne(id) {
        const mg = this.managerGymId();
        const qb = this.repo
            .createQueryBuilder('reservation')
            .leftJoinAndSelect('reservation.user', 'user')
            .leftJoinAndSelect('reservation.gymActivitySchedule', 'schedule')
            .leftJoinAndSelect('schedule.gymActivity', 'activity')
            .where('reservation.id = :id', { id });
        if (mg !== null) {
            qb.andWhere('activity.gym_id = :gymId', { gymId: mg });
        }
        const r = await qb.getOne();
        if (r)
            return r;
        if (mg !== null) {
            const exists = await this.repo.exist({ where: { id } });
            if (exists)
                throw new common_1.ForbiddenException('No tiene permisos para acceder a esta reserva');
        }
        throw new common_1.NotFoundException(`Reserva ${id} no encontrada`);
    }
    async cancel(id) {
        const r = await this.findOne(id);
        r.status = 'CANCELLED';
        r.cancelledAt = new Date();
        return this.repo.save(r);
    }
};
exports.ReservationsService = ReservationsService;
exports.ReservationsService = ReservationsService = __decorate([
    (0, common_1.Injectable)({ scope: common_1.Scope.REQUEST }),
    __param(0, (0, typeorm_1.InjectRepository)(reservation_entity_1.Reservation)),
    __param(1, (0, typeorm_1.InjectRepository)(gym_activity_schedule_entity_1.GymActivitySchedule)),
    __param(2, (0, common_1.Inject)(core_1.REQUEST)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository, Object])
], ReservationsService);
//# sourceMappingURL=reservations.service.js.map