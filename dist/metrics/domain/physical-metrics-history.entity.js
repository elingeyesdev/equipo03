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
exports.PhysicalMetricsHistory = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/domain/user.entity");
const gym_entity_1 = require("../../gyms/domain/gym.entity");
let PhysicalMetricsHistory = class PhysicalMetricsHistory {
    id;
    userId;
    recordedAt;
    gymId;
    weightKg;
    bodyFatPercentage;
    muscleMassKg;
    waistCm;
    chestCm;
    notes;
    user;
    gym;
};
exports.PhysicalMetricsHistory = PhysicalMetricsHistory;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], PhysicalMetricsHistory.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'user_id' }),
    __metadata("design:type", Number)
], PhysicalMetricsHistory.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'recorded_at' }),
    __metadata("design:type", Date)
], PhysicalMetricsHistory.prototype, "recordedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'gym_id', nullable: true }),
    __metadata("design:type", Number)
], PhysicalMetricsHistory.prototype, "gymId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, name: 'weight_kg', nullable: true }),
    __metadata("design:type", Number)
], PhysicalMetricsHistory.prototype, "weightKg", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 4, scale: 2, name: 'body_fat_percentage', nullable: true }),
    __metadata("design:type", Number)
], PhysicalMetricsHistory.prototype, "bodyFatPercentage", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, name: 'muscle_mass_kg', nullable: true }),
    __metadata("design:type", Number)
], PhysicalMetricsHistory.prototype, "muscleMassKg", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 4, scale: 2, name: 'waist_cm', nullable: true }),
    __metadata("design:type", Number)
], PhysicalMetricsHistory.prototype, "waistCm", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 4, scale: 2, name: 'chest_cm', nullable: true }),
    __metadata("design:type", Number)
], PhysicalMetricsHistory.prototype, "chestCm", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], PhysicalMetricsHistory.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], PhysicalMetricsHistory.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => gym_entity_1.Gym, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'gym_id' }),
    __metadata("design:type", gym_entity_1.Gym)
], PhysicalMetricsHistory.prototype, "gym", void 0);
exports.PhysicalMetricsHistory = PhysicalMetricsHistory = __decorate([
    (0, typeorm_1.Entity)('physical_metrics_history')
], PhysicalMetricsHistory);
//# sourceMappingURL=physical-metrics-history.entity.js.map