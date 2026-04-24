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
exports.UpdateRoutineDto = exports.CreateRoutineDto = exports.RoutineExerciseItemDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
class RoutineExerciseItemDto {
    exerciseId;
    orderPosition;
    setsRecommended;
    repsRecommended;
    weightRecommendedKg;
    restSecondsBetweenSets;
    notes;
}
exports.RoutineExerciseItemDto = RoutineExerciseItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'ID del ejercicio del catálogo' }),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], RoutineExerciseItemDto.prototype, "exerciseId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0 }),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], RoutineExerciseItemDto.prototype, "orderPosition", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 4 }),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], RoutineExerciseItemDto.prototype, "setsRecommended", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '8-12' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RoutineExerciseItemDto.prototype, "repsRecommended", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 60.0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], RoutineExerciseItemDto.prototype, "weightRecommendedKg", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 90 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], RoutineExerciseItemDto.prototype, "restSecondsBetweenSets", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Controlar el negativo' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RoutineExerciseItemDto.prototype, "notes", void 0);
class CreateRoutineDto {
    name;
    description;
    trainerId;
    assignedUserId;
    gymId;
    difficultyLevel;
    durationWeeks;
    isTemplate;
    exercises;
}
exports.CreateRoutineDto = CreateRoutineDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Rutina Push - Día A' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRoutineDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Pecho, hombros y tríceps' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRoutineDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'ID del entrenador' }),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateRoutineDto.prototype, "trainerId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 2, description: 'ID del usuario asignado' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateRoutineDto.prototype, "assignedUserId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 1, description: 'ID del gimnasio' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateRoutineDto.prototype, "gymId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'INTERMEDIO' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRoutineDto.prototype, "difficultyLevel", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 8 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateRoutineDto.prototype, "durationWeeks", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateRoutineDto.prototype, "isTemplate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: [RoutineExerciseItemDto],
        example: [
            { exerciseId: 1, orderPosition: 0, setsRecommended: 4, repsRecommended: '8-12', weightRecommendedKg: 60, restSecondsBetweenSets: 90 },
            { exerciseId: 2, orderPosition: 1, setsRecommended: 3, repsRecommended: '10-15', weightRecommendedKg: 40, restSecondsBetweenSets: 60 },
        ],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => RoutineExerciseItemDto),
    __metadata("design:type", Array)
], CreateRoutineDto.prototype, "exercises", void 0);
class UpdateRoutineDto {
    name;
    description;
    difficultyLevel;
    isActive;
    exercises;
}
exports.UpdateRoutineDto = UpdateRoutineDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Rutina Pull - Día B' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateRoutineDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Espalda y bíceps' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateRoutineDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'AVANZADO' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateRoutineDto.prototype, "difficultyLevel", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateRoutineDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: [RoutineExerciseItemDto],
        example: [
            { exerciseId: 3, orderPosition: 0, setsRecommended: 3, repsRecommended: '12', weightRecommendedKg: 50, restSecondsBetweenSets: 75 },
        ],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => RoutineExerciseItemDto),
    __metadata("design:type", Array)
], UpdateRoutineDto.prototype, "exercises", void 0);
//# sourceMappingURL=routines.dto.js.map