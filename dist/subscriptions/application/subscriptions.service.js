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
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const subscription_plan_entity_1 = require("../domain/subscription-plan.entity");
const user_subscription_entity_1 = require("../domain/user-subscription.entity");
const subscription_payment_entity_1 = require("../domain/subscription-payment.entity");
let SubscriptionsService = class SubscriptionsService {
    plansRepo;
    subsRepo;
    paymentsRepo;
    constructor(plansRepo, subsRepo, paymentsRepo) {
        this.plansRepo = plansRepo;
        this.subsRepo = subsRepo;
        this.paymentsRepo = paymentsRepo;
    }
    createPlan(data) { return this.plansRepo.save(this.plansRepo.create(data)); }
    findAllPlans() { return this.plansRepo.find(); }
    async findOnePlan(id) { const p = await this.plansRepo.findOne({ where: { id } }); if (!p)
        throw new common_1.NotFoundException(`Plan ${id} no encontrado`); return p; }
    createSubscription(data) { return this.subsRepo.save(this.subsRepo.create(data)); }
    findAllSubscriptions() { return this.subsRepo.find({ relations: ['user', 'plan', 'homeGym'] }); }
    findByUser(userId) { return this.subsRepo.find({ where: { userId }, relations: ['plan', 'homeGym'] }); }
    async findOneSubscription(id) { const s = await this.subsRepo.findOne({ where: { id }, relations: ['user', 'plan', 'homeGym'] }); if (!s)
        throw new common_1.NotFoundException(`Suscripción ${id} no encontrada`); return s; }
    async updateSubscription(id, data) { const s = await this.findOneSubscription(id); Object.assign(s, data); return this.subsRepo.save(s); }
    createPayment(data) { return this.paymentsRepo.save(this.paymentsRepo.create(data)); }
    findPaymentsBySubscription(subscriptionId) { return this.paymentsRepo.find({ where: { subscriptionId }, order: { paymentDate: 'DESC' } }); }
};
exports.SubscriptionsService = SubscriptionsService;
exports.SubscriptionsService = SubscriptionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(subscription_plan_entity_1.SubscriptionPlan)),
    __param(1, (0, typeorm_1.InjectRepository)(user_subscription_entity_1.UserSubscription)),
    __param(2, (0, typeorm_1.InjectRepository)(subscription_payment_entity_1.SubscriptionPayment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], SubscriptionsService);
//# sourceMappingURL=subscriptions.service.js.map