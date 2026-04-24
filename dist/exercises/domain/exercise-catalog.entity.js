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
exports.ExerciseCatalog = void 0;
const typeorm_1 = require("typeorm");
let ExerciseCatalog = class ExerciseCatalog {
    id;
    name;
    description;
    muscleGroup;
    secondaryMuscleGroups;
    equipmentRequired;
    difficultyLevel;
    videoUrl;
    imageUrl;
    isActive;
    createdAt;
    updatedAt;
};
exports.ExerciseCatalog = ExerciseCatalog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ExerciseCatalog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 150, unique: true }),
    __metadata("design:type", String)
], ExerciseCatalog.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ExerciseCatalog.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, name: 'muscle_group' }),
    __metadata("design:type", String)
], ExerciseCatalog.prototype, "muscleGroup", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'secondary_muscle_groups', nullable: true }),
    __metadata("design:type", Array)
], ExerciseCatalog.prototype, "secondaryMuscleGroups", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, name: 'equipment_required', nullable: true }),
    __metadata("design:type", String)
], ExerciseCatalog.prototype, "equipmentRequired", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 30, name: 'difficulty_level' }),
    __metadata("design:type", String)
], ExerciseCatalog.prototype, "difficultyLevel", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, name: 'video_url', nullable: true }),
    __metadata("design:type", String)
], ExerciseCatalog.prototype, "videoUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, name: 'image_url', nullable: true }),
    __metadata("design:type", String)
], ExerciseCatalog.prototype, "imageUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'is_active', default: true }),
    __metadata("design:type", Boolean)
], ExerciseCatalog.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ExerciseCatalog.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'updated_at', nullable: true }),
    __metadata("design:type", Date)
], ExerciseCatalog.prototype, "updatedAt", void 0);
exports.ExerciseCatalog = ExerciseCatalog = __decorate([
    (0, typeorm_1.Entity)('exercise_catalog')
], ExerciseCatalog);
//# sourceMappingURL=exercise-catalog.entity.js.map