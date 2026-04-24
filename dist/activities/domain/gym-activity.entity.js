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
exports.GymActivity = void 0;
const typeorm_1 = require("typeorm");
const gym_entity_1 = require("../../gyms/domain/gym.entity");
const gym_activity_schedule_entity_1 = require("./gym-activity-schedule.entity");
let GymActivity = class GymActivity {
    id;
    gymId;
    name;
    description;
    defaultDurationMin;
    isActive;
    gym;
    schedules;
};
exports.GymActivity = GymActivity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], GymActivity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'gym_id' }),
    __metadata("design:type", Number)
], GymActivity.prototype, "gymId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], GymActivity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], GymActivity.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'default_duration_min', nullable: true }),
    __metadata("design:type", Number)
], GymActivity.prototype, "defaultDurationMin", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'is_active', default: true }),
    __metadata("design:type", Boolean)
], GymActivity.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => gym_entity_1.Gym, (g) => g.activities, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'gym_id' }),
    __metadata("design:type", gym_entity_1.Gym)
], GymActivity.prototype, "gym", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => gym_activity_schedule_entity_1.GymActivitySchedule, (s) => s.gymActivity),
    __metadata("design:type", Array)
], GymActivity.prototype, "schedules", void 0);
exports.GymActivity = GymActivity = __decorate([
    (0, typeorm_1.Entity)('gym_activity')
], GymActivity);
//# sourceMappingURL=gym-activity.entity.js.map