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
exports.GymActivityAttendance = void 0;
const typeorm_1 = require("typeorm");
const gym_activity_schedule_entity_1 = require("./gym-activity-schedule.entity");
const user_entity_1 = require("../../users/domain/user.entity");
let GymActivityAttendance = class GymActivityAttendance {
    id;
    gymActivityScheduleId;
    userId;
    checkInTime;
    checkOutTime;
    status;
    gymActivitySchedule;
    user;
};
exports.GymActivityAttendance = GymActivityAttendance;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], GymActivityAttendance.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'gym_activity_schedule_id' }),
    __metadata("design:type", Number)
], GymActivityAttendance.prototype, "gymActivityScheduleId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'user_id' }),
    __metadata("design:type", Number)
], GymActivityAttendance.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'check_in_time' }),
    __metadata("design:type", Date)
], GymActivityAttendance.prototype, "checkInTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'check_out_time', nullable: true }),
    __metadata("design:type", Date)
], GymActivityAttendance.prototype, "checkOutTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'CONFIRMED' }),
    __metadata("design:type", String)
], GymActivityAttendance.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => gym_activity_schedule_entity_1.GymActivitySchedule, (s) => s.attendances, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'gym_activity_schedule_id' }),
    __metadata("design:type", gym_activity_schedule_entity_1.GymActivitySchedule)
], GymActivityAttendance.prototype, "gymActivitySchedule", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], GymActivityAttendance.prototype, "user", void 0);
exports.GymActivityAttendance = GymActivityAttendance = __decorate([
    (0, typeorm_1.Entity)('gym_activity_attendance')
], GymActivityAttendance);
//# sourceMappingURL=gym-activity-attendance.entity.js.map