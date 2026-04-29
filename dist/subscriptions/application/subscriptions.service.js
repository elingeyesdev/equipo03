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
exports.SubscriptionsService = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const subscription_plan_entity_1 = require("../domain/subscription-plan.entity");
const user_subscription_entity_1 = require("../domain/user-subscription.entity");
const subscription_payment_entity_1 = require("../domain/subscription-payment.entity");
const gym_scope_1 = require("../../common/security/gym-scope");
let SubscriptionsService = class SubscriptionsService {
    plansRepo;
    subsRepo;
    paymentsRepo;
    request;
    constructor(plansRepo, subsRepo, paymentsRepo, request) {
        this.plansRepo = plansRepo;
        this.subsRepo = subsRepo;
        this.paymentsRepo = paymentsRepo;
        this.request = request;
    }
    managerGymId() {
        return (0, gym_scope_1.getManagerGymId)(this.request);
    }
    createPlan(data) { return this.plansRepo.save(this.plansRepo.create(data)); }
    findAllPlans() { return this.plansRepo.find(); }
    async findOnePlan(id) { const p = await this.plansRepo.findOne({ where: { id } }); if (!p)
        throw new common_1.NotFoundException(`Plan ${id} no encontrado`); return p; }
    createSubscription(data) {
        const mg = this.managerGymId();
        const merged = { ...data };
        if (mg !== null) {
            if (merged.homeGymId !== undefined && merged.homeGymId !== null && Number(merged.homeGymId) !== mg) {
                throw new common_1.ForbiddenException('No puede asignar suscripciones a otra sucursal');
            }
            merged.homeGymId = mg;
        }
        return this.subsRepo.save(this.subsRepo.create(merged));
    }
    findAllSubscriptions() {
        const mg = this.managerGymId();
        const qb = this.subsRepo
            .createQueryBuilder('sub')
            .leftJoinAndSelect('sub.user', 'user')
            .leftJoinAndSelect('sub.plan', 'plan')
            .leftJoinAndSelect('sub.homeGym', 'homeGym');
        if (mg !== null) {
            qb.andWhere('sub.home_gym_id = :gymId', { gymId: mg });
        }
        return qb.getMany();
    }
    findByUser(userId) {
        const mg = this.managerGymId();
        const qb = this.subsRepo
            .createQueryBuilder('sub')
            .leftJoinAndSelect('sub.plan', 'plan')
            .leftJoinAndSelect('sub.homeGym', 'homeGym')
            .where('sub.user_id = :userId', { userId });
        if (mg !== null) {
            qb.andWhere('sub.home_gym_id = :gymId', { gymId: mg });
        }
        return qb.getMany();
    }
    async findOneSubscription(id) {
        const mg = this.managerGymId();
        const qb = this.subsRepo
            .createQueryBuilder('sub')
            .leftJoinAndSelect('sub.user', 'user')
            .leftJoinAndSelect('sub.plan', 'plan')
            .leftJoinAndSelect('sub.homeGym', 'homeGym')
            .where('sub.id = :id', { id });
        if (mg !== null) {
            qb.andWhere('sub.home_gym_id = :gymId', { gymId: mg });
        }
        const s = await qb.getOne();
        if (s)
            return s;
        if (mg !== null) {
            const exists = await this.subsRepo.exist({ where: { id } });
            if (exists)
                throw new common_1.ForbiddenException('No tiene permisos para acceder a esta suscripción');
        }
        throw new common_1.NotFoundException(`Suscripción ${id} no encontrada`);
    }
    async updateSubscription(id, data) {
        const mg = this.managerGymId();
        const s = await this.findOneSubscription(id);
        if (mg !== null && data?.homeGymId !== undefined && data?.homeGymId !== null && Number(data.homeGymId) !== mg) {
            throw new common_1.ForbiddenException('No puede mover la suscripción a otra sucursal');
        }
        Object.assign(s, data);
        return this.subsRepo.save(s);
    }
    createPayment(data) {
        return this.paymentsRepo.save(this.paymentsRepo.create(data));
    }
    async findPaymentsBySubscription(subscriptionId) {
        await this.findOneSubscription(subscriptionId);
        return this.paymentsRepo.find({ where: { subscriptionId }, order: { paymentDate: 'DESC' } });
    }
};
exports.SubscriptionsService = SubscriptionsService;
exports.SubscriptionsService = SubscriptionsService = __decorate([
    (0, common_1.Injectable)({ scope: common_1.Scope.REQUEST }),
    __param(0, (0, typeorm_1.InjectRepository)(subscription_plan_entity_1.SubscriptionPlan)),
    __param(1, (0, typeorm_1.InjectRepository)(user_subscription_entity_1.UserSubscription)),
    __param(2, (0, typeorm_1.InjectRepository)(subscription_payment_entity_1.SubscriptionPayment)),
    __param(3, (0, common_1.Inject)(core_1.REQUEST)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository, Object])
], SubscriptionsService);
//# sourceMappingURL=subscriptions.service.js.map