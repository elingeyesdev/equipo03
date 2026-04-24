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
exports.Gym = void 0;
const typeorm_1 = require("typeorm");
const gym_location_entity_1 = require("./gym-location.entity");
const gym_schedule_entity_1 = require("./gym-schedule.entity");
const gym_activity_entity_1 = require("../../activities/domain/gym-activity.entity");
let Gym = class Gym {
    id;
    name;
    description;
    maxCapacity;
    isActive;
    isOpen;
    createdAt;
    updatedAt;
    location;
    schedules;
    activities;
};
exports.Gym = Gym;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Gym.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 150 }),
    __metadata("design:type", String)
], Gym.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Gym.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'max_capacity' }),
    __metadata("design:type", Number)
], Gym.prototype, "maxCapacity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'is_active', default: true }),
    __metadata("design:type", Boolean)
], Gym.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'is_open', default: true }),
    __metadata("design:type", Boolean)
], Gym.prototype, "isOpen", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Gym.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'updated_at', nullable: true }),
    __metadata("design:type", Date)
], Gym.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => gym_location_entity_1.GymLocation, (loc) => loc.gym, { cascade: true }),
    __metadata("design:type", gym_location_entity_1.GymLocation)
], Gym.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => gym_schedule_entity_1.GymSchedule, (s) => s.gym, { cascade: true }),
    __metadata("design:type", Array)
], Gym.prototype, "schedules", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => gym_activity_entity_1.GymActivity, (a) => a.gym),
    __metadata("design:type", Array)
], Gym.prototype, "activities", void 0);
exports.Gym = Gym = __decorate([
    (0, typeorm_1.Entity)('gyms')
], Gym);
//# sourceMappingURL=gym.entity.js.map