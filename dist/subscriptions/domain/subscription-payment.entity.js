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
exports.SubscriptionPayment = void 0;
const typeorm_1 = require("typeorm");
const user_subscription_entity_1 = require("./user-subscription.entity");
let SubscriptionPayment = class SubscriptionPayment {
    id;
    subscriptionId;
    amount;
    paymentDate;
    method;
    status;
    subscription;
};
exports.SubscriptionPayment = SubscriptionPayment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], SubscriptionPayment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'subscription_id' }),
    __metadata("design:type", Number)
], SubscriptionPayment.prototype, "subscriptionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], SubscriptionPayment.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'payment_date' }),
    __metadata("design:type", Date)
], SubscriptionPayment.prototype, "paymentDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 30, nullable: true }),
    __metadata("design:type", String)
], SubscriptionPayment.prototype, "method", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20 }),
    __metadata("design:type", String)
], SubscriptionPayment.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_subscription_entity_1.UserSubscription, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'subscription_id' }),
    __metadata("design:type", user_subscription_entity_1.UserSubscription)
], SubscriptionPayment.prototype, "subscription", void 0);
exports.SubscriptionPayment = SubscriptionPayment = __decorate([
    (0, typeorm_1.Entity)('subscription_payments')
], SubscriptionPayment);
//# sourceMappingURL=subscription-payment.entity.js.map