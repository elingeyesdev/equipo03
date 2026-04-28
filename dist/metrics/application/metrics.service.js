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
exports.MetricsService = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const physical_metrics_history_entity_1 = require("../domain/physical-metrics-history.entity");
const gym_scope_1 = require("../../common/security/gym-scope");
let MetricsService = class MetricsService {
    repo;
    request;
    constructor(repo, request) {
        this.repo = repo;
        this.request = request;
    }
    managerGymId() {
        return (0, gym_scope_1.getManagerGymId)(this.request);
    }
    create(data) {
        const mg = this.managerGymId();
        const merged = { ...data };
        if (mg !== null && merged.gymId !== undefined && merged.gymId !== null && Number(merged.gymId) !== mg) {
            throw new common_1.ForbiddenException('No puede registrar métricas para otra sucursal');
        }
        if (mg !== null && (merged.gymId === undefined || merged.gymId === null)) {
            merged.gymId = mg;
        }
        return this.repo.save(this.repo.create(merged));
    }
    findAll() {
        const mg = this.managerGymId();
        const qb = this.repo
            .createQueryBuilder('pmh')
            .leftJoinAndSelect('pmh.user', 'user')
            .leftJoinAndSelect('pmh.gym', 'gym')
            .orderBy('pmh.recorded_at', 'DESC');
        if (mg !== null) {
            qb.andWhere('pmh.gym_id = :gymId', { gymId: mg });
        }
        return qb.getMany();
    }
    findByUser(userId) {
        const mg = this.managerGymId();
        const qb = this.repo
            .createQueryBuilder('pmh')
            .where('pmh.user_id = :userId', { userId })
            .orderBy('pmh.recorded_at', 'DESC');
        if (mg !== null) {
            qb.andWhere('pmh.gym_id = :gymId', { gymId: mg });
        }
        return qb.getMany();
    }
    async findLatest(userId) {
        const mg = this.managerGymId();
        const qb = this.repo
            .createQueryBuilder('pmh')
            .where('pmh.user_id = :userId', { userId })
            .orderBy('pmh.recorded_at', 'DESC');
        if (mg !== null) {
            qb.andWhere('pmh.gym_id = :gymId', { gymId: mg });
        }
        const m = await qb.getOne();
        if (!m)
            throw new common_1.NotFoundException(`No hay métricas para usuario ${userId}`);
        return m;
    }
    async findOne(id) {
        const mg = this.managerGymId();
        const qb = this.repo
            .createQueryBuilder('pmh')
            .leftJoinAndSelect('pmh.user', 'user')
            .leftJoinAndSelect('pmh.gym', 'gym')
            .where('pmh.id = :id', { id });
        if (mg !== null) {
            qb.andWhere('pmh.gym_id = :gymId', { gymId: mg });
        }
        const m = await qb.getOne();
        if (m)
            return m;
        if (mg !== null) {
            const exists = await this.repo.exist({ where: { id } });
            if (exists)
                throw new common_1.ForbiddenException('No tiene permisos para acceder a esta medición');
        }
        throw new common_1.NotFoundException(`Métrica ${id} no encontrada`);
    }
    async remove(id) {
        await this.findOne(id);
        const r = await this.repo.delete(id);
        if (r.affected === 0)
            throw new common_1.NotFoundException(`Métrica ${id} no encontrada`);
    }
};
exports.MetricsService = MetricsService;
exports.MetricsService = MetricsService = __decorate([
    (0, common_1.Injectable)({ scope: common_1.Scope.REQUEST }),
    __param(0, (0, typeorm_1.InjectRepository)(physical_metrics_history_entity_1.PhysicalMetricsHistory)),
    __param(1, (0, common_1.Inject)(core_1.REQUEST)),
    __metadata("design:paramtypes", [typeorm_2.Repository, Object])
], MetricsService);
//# sourceMappingURL=metrics.service.js.map