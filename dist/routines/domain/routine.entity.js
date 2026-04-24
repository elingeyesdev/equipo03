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
exports.Routine = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/domain/user.entity");
const gym_entity_1 = require("../../gyms/domain/gym.entity");
const routine_exercise_entity_1 = require("./routine-exercise.entity");
let Routine = class Routine {
    id;
    name;
    description;
    trainerId;
    assignedUserId;
    gymId;
    difficultyLevel;
    durationWeeks;
    isTemplate;
    isActive;
    createdAt;
    updatedAt;
    trainer;
    assignedUser;
    gym;
    exercises;
};
exports.Routine = Routine;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Routine.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 150 }),
    __metadata("design:type", String)
], Routine.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Routine.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'trainer_id' }),
    __metadata("design:type", Number)
], Routine.prototype, "trainerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'assigned_user_id', nullable: true }),
    __metadata("design:type", Number)
], Routine.prototype, "assignedUserId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'gym_id', nullable: true }),
    __metadata("design:type", Number)
], Routine.prototype, "gymId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 30, name: 'difficulty_level' }),
    __metadata("design:type", String)
], Routine.prototype, "difficultyLevel", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'duration_weeks', nullable: true }),
    __metadata("design:type", Number)
], Routine.prototype, "durationWeeks", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'is_template', default: false }),
    __metadata("design:type", Boolean)
], Routine.prototype, "isTemplate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'is_active', default: true }),
    __metadata("design:type", Boolean)
], Routine.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Routine.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'updated_at', nullable: true }),
    __metadata("design:type", Date)
], Routine.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'trainer_id' }),
    __metadata("design:type", user_entity_1.User)
], Routine.prototype, "trainer", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'assigned_user_id' }),
    __metadata("design:type", user_entity_1.User)
], Routine.prototype, "assignedUser", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => gym_entity_1.Gym, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'gym_id' }),
    __metadata("design:type", gym_entity_1.Gym)
], Routine.prototype, "gym", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => routine_exercise_entity_1.RoutineExercise, (re) => re.routine, { cascade: true }),
    __metadata("design:type", Array)
], Routine.prototype, "exercises", void 0);
exports.Routine = Routine = __decorate([
    (0, typeorm_1.Entity)('routines')
], Routine);
//# sourceMappingURL=routine.entity.js.map