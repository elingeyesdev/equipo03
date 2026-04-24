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
exports.WaitlistEntry = void 0;
const typeorm_1 = require("typeorm");
const reservation_entity_1 = require("../../reservations/domain/reservation.entity");
const user_entity_1 = require("../../users/domain/user.entity");
const gym_activity_schedule_entity_1 = require("../../activities/domain/gym-activity-schedule.entity");
let WaitlistEntry = class WaitlistEntry {
    id;
    reservationId;
    userId;
    gymActivityScheduleId;
    positionInQueue;
    status;
    notifiedAt;
    assignedAt;
    createdAt;
    reservation;
    user;
    gymActivitySchedule;
};
exports.WaitlistEntry = WaitlistEntry;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], WaitlistEntry.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'reservation_id', nullable: true }),
    __metadata("design:type", Number)
], WaitlistEntry.prototype, "reservationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'user_id' }),
    __metadata("design:type", Number)
], WaitlistEntry.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'gym_activity_schedule_id' }),
    __metadata("design:type", Number)
], WaitlistEntry.prototype, "gymActivityScheduleId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'position_in_queue' }),
    __metadata("design:type", Number)
], WaitlistEntry.prototype, "positionInQueue", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'WAITING' }),
    __metadata("design:type", String)
], WaitlistEntry.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'notified_at', nullable: true }),
    __metadata("design:type", Date)
], WaitlistEntry.prototype, "notifiedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'assigned_at', nullable: true }),
    __metadata("design:type", Date)
], WaitlistEntry.prototype, "assignedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], WaitlistEntry.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => reservation_entity_1.Reservation, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'reservation_id' }),
    __metadata("design:type", reservation_entity_1.Reservation)
], WaitlistEntry.prototype, "reservation", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], WaitlistEntry.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => gym_activity_schedule_entity_1.GymActivitySchedule, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'gym_activity_schedule_id' }),
    __metadata("design:type", gym_activity_schedule_entity_1.GymActivitySchedule)
], WaitlistEntry.prototype, "gymActivitySchedule", void 0);
exports.WaitlistEntry = WaitlistEntry = __decorate([
    (0, typeorm_1.Entity)('waitlist_entries')
], WaitlistEntry);
//# sourceMappingURL=waitlist-entry.entity.js.map