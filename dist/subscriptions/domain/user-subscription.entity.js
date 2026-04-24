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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSubscription = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/domain/user.entity");
const subscription_plan_entity_1 = require("./subscription-plan.entity");
const gym_entity_1 = require("../../gyms/domain/gym.entity");
let UserSubscription = class UserSubscription {
    id;
    userId;
    planId;
    homeGymId;
    status;
    startDate;
    endDate;
    autoRenew;
    createdAt;
    updatedAt;
    user;
    plan;
    homeGym;
};
exports.UserSubscription = UserSubscription;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], UserSubscription.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'user_id' }),
    __metadata("design:type", Number)
], UserSubscription.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'plan_id' }),
    __metadata("design:type", Number)
], UserSubscription.prototype, "planId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'home_gym_id', nullable: true }),
    __metadata("design:type", Number)
], UserSubscription.prototype, "homeGymId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20 }),
    __metadata("design:type", String)
], UserSubscription.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'start_date' }),
    __metadata("design:type", Date)
], UserSubscription.prototype, "startDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'end_date' }),
    __metadata("design:type", Date)
], UserSubscription.prototype, "endDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'auto_renew', default: false }),
    __metadata("design:type", Boolean)
], UserSubscription.prototype, "autoRenew", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], UserSubscription.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'updated_at', nullable: true }),
    __metadata("design:type", Date)
], UserSubscription.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], UserSubscription.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => subscription_plan_entity_1.SubscriptionPlan, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'plan_id' }),
    __metadata("design:type", subscription_plan_entity_1.SubscriptionPlan)
], UserSubscription.prototype, "plan", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => gym_entity_1.Gym, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'home_gym_id' }),
    __metadata("design:type", gym_entity_1.Gym)
], UserSubscription.prototype, "homeGym", void 0);
exports.UserSubscription = UserSubscription = __decorate([
    (0, typeorm_1.Entity)('user_subscriptions')
], UserSubscription);
//# sourceMappingURL=user-subscription.entity.js.map