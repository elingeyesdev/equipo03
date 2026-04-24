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
exports.WorkoutSession = void 0;
const typeorm_1 = require("typeorm");
const routine_entity_1 = require("../../routines/domain/routine.entity");
const user_entity_1 = require("../../users/domain/user.entity");
const gym_entity_1 = require("../../gyms/domain/gym.entity");
const workout_set_entity_1 = require("./workout-set.entity");
let WorkoutSession = class WorkoutSession {
    id;
    routineId;
    userId;
    gymId;
    startedAt;
    finishedAt;
    status;
    totalDurationMinutes;
    notes;
    routine;
    user;
    gym;
    sets;
};
exports.WorkoutSession = WorkoutSession;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], WorkoutSession.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'routine_id' }),
    __metadata("design:type", Number)
], WorkoutSession.prototype, "routineId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'user_id' }),
    __metadata("design:type", Number)
], WorkoutSession.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'gym_id' }),
    __metadata("design:type", Number)
], WorkoutSession.prototype, "gymId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'started_at', default: () => 'now()' }),
    __metadata("design:type", Date)
], WorkoutSession.prototype, "startedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'finished_at', nullable: true }),
    __metadata("design:type", Date)
], WorkoutSession.prototype, "finishedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'IN_PROGRESS' }),
    __metadata("design:type", String)
], WorkoutSession.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'total_duration_minutes', nullable: true }),
    __metadata("design:type", Number)
], WorkoutSession.prototype, "totalDurationMinutes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], WorkoutSession.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => routine_entity_1.Routine, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'routine_id' }),
    __metadata("design:type", routine_entity_1.Routine)
], WorkoutSession.prototype, "routine", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], WorkoutSession.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => gym_entity_1.Gym, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'gym_id' }),
    __metadata("design:type", gym_entity_1.Gym)
], WorkoutSession.prototype, "gym", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => workout_set_entity_1.WorkoutSet, (ws) => ws.session, { cascade: true }),
    __metadata("design:type", Array)
], WorkoutSession.prototype, "sets", void 0);
exports.WorkoutSession = WorkoutSession = __decorate([
    (0, typeorm_1.Entity)('workout_sessions')
], WorkoutSession);
//# sourceMappingURL=workout-session.entity.js.map