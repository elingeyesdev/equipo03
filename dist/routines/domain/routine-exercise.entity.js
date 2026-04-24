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
exports.RoutineExercise = void 0;
const typeorm_1 = require("typeorm");
const routine_entity_1 = require("./routine.entity");
const exercise_catalog_entity_1 = require("../../exercises/domain/exercise-catalog.entity");
let RoutineExercise = class RoutineExercise {
    id;
    routineId;
    exerciseId;
    orderPosition;
    setsRecommended;
    repsRecommended;
    weightRecommendedKg;
    restSecondsBetweenSets;
    notes;
    routine;
    exercise;
};
exports.RoutineExercise = RoutineExercise;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], RoutineExercise.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'routine_id' }),
    __metadata("design:type", Number)
], RoutineExercise.prototype, "routineId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'exercise_id' }),
    __metadata("design:type", Number)
], RoutineExercise.prototype, "exerciseId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'order_position' }),
    __metadata("design:type", Number)
], RoutineExercise.prototype, "orderPosition", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'sets_recommended' }),
    __metadata("design:type", Number)
], RoutineExercise.prototype, "setsRecommended", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, name: 'reps_recommended' }),
    __metadata("design:type", String)
], RoutineExercise.prototype, "repsRecommended", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, name: 'weight_recommended_kg', nullable: true }),
    __metadata("design:type", Number)
], RoutineExercise.prototype, "weightRecommendedKg", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'rest_seconds_between_sets', nullable: true }),
    __metadata("design:type", Number)
], RoutineExercise.prototype, "restSecondsBetweenSets", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], RoutineExercise.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => routine_entity_1.Routine, (r) => r.exercises, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'routine_id' }),
    __metadata("design:type", routine_entity_1.Routine)
], RoutineExercise.prototype, "routine", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => exercise_catalog_entity_1.ExerciseCatalog, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'exercise_id' }),
    __metadata("design:type", exercise_catalog_entity_1.ExerciseCatalog)
], RoutineExercise.prototype, "exercise", void 0);
exports.RoutineExercise = RoutineExercise = __decorate([
    (0, typeorm_1.Entity)('routine_exercises')
], RoutineExercise);
//# sourceMappingURL=routine-exercise.entity.js.map