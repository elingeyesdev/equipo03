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
exports.GymActivitySchedule = void 0;
const typeorm_1 = require("typeorm");
const gym_activity_entity_1 = require("./gym-activity.entity");
const user_entity_1 = require("../../users/domain/user.entity");
const gym_activity_attendance_entity_1 = require("./gym-activity-attendance.entity");
let GymActivitySchedule = class GymActivitySchedule {
    id;
    gymActivityId;
    instructorId;
    dayOfWeek;
    startTime;
    endTime;
    maxAttendees;
    isRecurring;
    gymActivity;
    instructor;
    attendances;
};
exports.GymActivitySchedule = GymActivitySchedule;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], GymActivitySchedule.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'gym_activity_id' }),
    __metadata("design:type", Number)
], GymActivitySchedule.prototype, "gymActivityId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'instructor_id', nullable: true }),
    __metadata("design:type", Number)
], GymActivitySchedule.prototype, "instructorId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10, name: 'day_of_week' }),
    __metadata("design:type", String)
], GymActivitySchedule.prototype, "dayOfWeek", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'time', name: 'start_time' }),
    __metadata("design:type", String)
], GymActivitySchedule.prototype, "startTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'time', name: 'end_time' }),
    __metadata("design:type", String)
], GymActivitySchedule.prototype, "endTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'max_attendees' }),
    __metadata("design:type", Number)
], GymActivitySchedule.prototype, "maxAttendees", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'is_recurring', default: true }),
    __metadata("design:type", Boolean)
], GymActivitySchedule.prototype, "isRecurring", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => gym_activity_entity_1.GymActivity, (a) => a.schedules, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'gym_activity_id' }),
    __metadata("design:type", gym_activity_entity_1.GymActivity)
], GymActivitySchedule.prototype, "gymActivity", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'instructor_id' }),
    __metadata("design:type", user_entity_1.User)
], GymActivitySchedule.prototype, "instructor", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => gym_activity_attendance_entity_1.GymActivityAttendance, (att) => att.gymActivitySchedule),
    __metadata("design:type", Array)
], GymActivitySchedule.prototype, "attendances", void 0);
exports.GymActivitySchedule = GymActivitySchedule = __decorate([
    (0, typeorm_1.Entity)('gym_activity_schedule')
], GymActivitySchedule);
//# sourceMappingURL=gym-activity-schedule.entity.js.map