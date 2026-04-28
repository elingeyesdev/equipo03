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
exports.CheckinsService = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const check_in_entity_1 = require("../domain/check-in.entity");
const gym_scope_1 = require("../../common/security/gym-scope");
let CheckinsService = class CheckinsService {
    repo;
    request;
    constructor(repo, request) {
        this.repo = repo;
        this.request = request;
    }
    getManagerGymId() {
        return (0, gym_scope_1.getManagerGymId)(this.request);
    }
    ensureManagerCanAccessGym(gymId) {
        const managerGymId = this.getManagerGymId();
        if (managerGymId !== null && managerGymId !== gymId) {
            throw new common_1.ForbiddenException('No tiene permisos para acceder a otra sucursal');
        }
    }
    create(data) { return this.repo.save(this.repo.create(data)); }
    findAll() {
        const managerGymId = this.getManagerGymId();
        const qb = this.repo
            .createQueryBuilder('checkIn')
            .leftJoinAndSelect('checkIn.user', 'user')
            .leftJoinAndSelect('checkIn.gym', 'gym')
            .orderBy('checkIn.check_in_time', 'DESC');
        if (managerGymId !== null) {
            qb.andWhere('checkIn.gym_id = :gymId', { gymId: managerGymId });
        }
        return qb.getMany();
    }
    findByUser(userId) {
        const managerGymId = this.getManagerGymId();
        const qb = this.repo
            .createQueryBuilder('checkIn')
            .leftJoinAndSelect('checkIn.gym', 'gym')
            .where('checkIn.user_id = :userId', { userId })
            .orderBy('checkIn.check_in_time', 'DESC');
        if (managerGymId !== null) {
            qb.andWhere('checkIn.gym_id = :gymId', { gymId: managerGymId });
        }
        return qb.getMany();
    }
    findByGym(gymId) {
        this.ensureManagerCanAccessGym(gymId);
        return this.repo
            .createQueryBuilder('checkIn')
            .leftJoinAndSelect('checkIn.user', 'user')
            .where('checkIn.gym_id = :gymId', { gymId })
            .orderBy('checkIn.check_in_time', 'DESC')
            .getMany();
    }
    async findOne(id) {
        const managerGymId = this.getManagerGymId();
        const qb = this.repo
            .createQueryBuilder('checkIn')
            .leftJoinAndSelect('checkIn.user', 'user')
            .leftJoinAndSelect('checkIn.gym', 'gym')
            .where('checkIn.id = :id', { id });
        if (managerGymId !== null) {
            qb.andWhere('checkIn.gym_id = :gymId', { gymId: managerGymId });
        }
        const c = await qb.getOne();
        if (c)
            return c;
        if (managerGymId !== null) {
            const exists = await this.repo.exist({ where: { id } });
            if (exists) {
                throw new common_1.ForbiddenException('No tiene permisos para acceder a este check-in');
            }
        }
        throw new common_1.NotFoundException(`Check-in ${id} no encontrado`);
    }
    async checkOut(id) { const c = await this.findOne(id); c.checkOutTime = new Date(); return this.repo.save(c); }
};
exports.CheckinsService = CheckinsService;
exports.CheckinsService = CheckinsService = __decorate([
    (0, common_1.Injectable)({ scope: common_1.Scope.REQUEST }),
    __param(0, (0, typeorm_1.InjectRepository)(check_in_entity_1.CheckIn)),
    __param(1, (0, common_1.Inject)(core_1.REQUEST)),
    __metadata("design:paramtypes", [typeorm_2.Repository, Object])
], CheckinsService);
//# sourceMappingURL=checkins.service.js.map