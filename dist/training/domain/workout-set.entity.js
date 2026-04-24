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
exports.WorkoutSet = void 0;
const typeorm_1 = require("typeorm");
const workout_session_entity_1 = require("./workout-session.entity");
const routine_exercise_entity_1 = require("../../routines/domain/routine-exercise.entity");
let WorkoutSet = class WorkoutSet {
    id;
    sessionId;
    routineExerciseId;
    setNumber;
    repsCompleted;
    weightUsedKg;
    restTakenSeconds;
    completedAt;
    ratingPerceivedExertion;
    session;
    routineExercise;
};
exports.WorkoutSet = WorkoutSet;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], WorkoutSet.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'session_id' }),
    __metadata("design:type", Number)
], WorkoutSet.prototype, "sessionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'routine_exercise_id' }),
    __metadata("design:type", Number)
], WorkoutSet.prototype, "routineExerciseId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'set_number' }),
    __metadata("design:type", Number)
], WorkoutSet.prototype, "setNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'reps_completed' }),
    __metadata("design:type", Number)
], WorkoutSet.prototype, "repsCompleted", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, name: 'weight_used_kg', nullable: true }),
    __metadata("design:type", Number)
], WorkoutSet.prototype, "weightUsedKg", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'rest_taken_seconds', nullable: true }),
    __metadata("design:type", Number)
], WorkoutSet.prototype, "restTakenSeconds", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'completed_at' }),
    __metadata("design:type", Date)
], WorkoutSet.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'rating_perceived_exertion', nullable: true }),
    __metadata("design:type", Number)
], WorkoutSet.prototype, "ratingPerceivedExertion", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => workout_session_entity_1.WorkoutSession, (ws) => ws.sets, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'session_id' }),
    __metadata("design:type", workout_session_entity_1.WorkoutSession)
], WorkoutSet.prototype, "session", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => routine_exercise_entity_1.RoutineExercise, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'routine_exercise_id' }),
    __metadata("design:type", routine_exercise_entity_1.RoutineExercise)
], WorkoutSet.prototype, "routineExercise", void 0);
exports.WorkoutSet = WorkoutSet = __decorate([
    (0, typeorm_1.Entity)('workout_sets')
], WorkoutSet);
//# sourceMappingURL=workout-set.entity.js.map