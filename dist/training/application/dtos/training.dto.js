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
exports.AddSetDto = exports.UpdateSessionDto = exports.CreateSessionDto = exports.CreateEmergencyContactDto = exports.CreateRestrictionDto = exports.CreateTrainingProfileDto = exports.CreateTrainingPreferencesDto = exports.CreateTrainingGoalsDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateTrainingGoalsDto {
    primaryGoal;
    experienceLevel;
}
exports.CreateTrainingGoalsDto = CreateTrainingGoalsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'GANANCIA_MUSCULAR' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTrainingGoalsDto.prototype, "primaryGoal", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'INTERMEDIO' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTrainingGoalsDto.prototype, "experienceLevel", void 0);
class CreateTrainingPreferencesDto {
    preferredTrainingTypes;
    priorityBodyAreas;
    availableDaysPerWeek;
}
exports.CreateTrainingPreferencesDto = CreateTrainingPreferencesDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: ['Musculación', 'HIIT'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], CreateTrainingPreferencesDto.prototype, "preferredTrainingTypes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: ['Pecho', 'Espalda'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], CreateTrainingPreferencesDto.prototype, "priorityBodyAreas", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 5 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateTrainingPreferencesDto.prototype, "availableDaysPerWeek", void 0);
class CreateTrainingProfileDto {
    userId;
    goals;
    preferences;
}
exports.CreateTrainingProfileDto = CreateTrainingProfileDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'ID del usuario' }),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateTrainingProfileDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: CreateTrainingGoalsDto,
        example: { primaryGoal: 'GANANCIA_MUSCULAR', experienceLevel: 'INTERMEDIO' },
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", CreateTrainingGoalsDto)
], CreateTrainingProfileDto.prototype, "goals", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: CreateTrainingPreferencesDto,
        example: { preferredTrainingTypes: ['Musculación', 'HIIT'], priorityBodyAreas: ['Pecho', 'Espalda'], availableDaysPerWeek: 5 },
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", CreateTrainingPreferencesDto)
], CreateTrainingProfileDto.prototype, "preferences", void 0);
class CreateRestrictionDto {
    userId;
    restrictionType;
    description;
    affectedBodyAreas;
    movementsToAvoid;
    requiresTrainerApproval;
}
exports.CreateRestrictionDto = CreateRestrictionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'ID del usuario' }),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateRestrictionDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'LESION' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRestrictionDto.prototype, "restrictionType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Hernia discal L4-L5' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRestrictionDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: ['Lumbar', 'Espalda baja'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], CreateRestrictionDto.prototype, "affectedBodyAreas", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: ['Peso muerto', 'Buenos días'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], CreateRestrictionDto.prototype, "movementsToAvoid", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateRestrictionDto.prototype, "requiresTrainerApproval", void 0);
class CreateEmergencyContactDto {
    userId;
    fullName;
    phone;
    relation;
    isPrimary;
}
exports.CreateEmergencyContactDto = CreateEmergencyContactDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'ID del usuario' }),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateEmergencyContactDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'María López' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEmergencyContactDto.prototype, "fullName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '+591 70012345' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEmergencyContactDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Madre' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEmergencyContactDto.prototype, "relation", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateEmergencyContactDto.prototype, "isPrimary", void 0);
class CreateSessionDto {
    routineId;
    userId;
    gymId;
    notes;
}
exports.CreateSessionDto = CreateSessionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'ID de la rutina' }),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateSessionDto.prototype, "routineId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'ID del usuario' }),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateSessionDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'ID del gimnasio' }),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateSessionDto.prototype, "gymId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Sesión de prueba' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSessionDto.prototype, "notes", void 0);
class UpdateSessionDto {
    status;
    totalDurationMinutes;
    notes;
}
exports.UpdateSessionDto = UpdateSessionDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'COMPLETED', description: 'IN_PROGRESS | COMPLETED | CANCELLED' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSessionDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 65 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], UpdateSessionDto.prototype, "totalDurationMinutes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Gran sesión, superé marcas' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSessionDto.prototype, "notes", void 0);
class AddSetDto {
    routineExerciseId;
    setNumber;
    repsCompleted;
    weightUsedKg;
    restTakenSeconds;
    ratingPerceivedExertion;
}
exports.AddSetDto = AddSetDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'ID del routine_exercise' }),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], AddSetDto.prototype, "routineExerciseId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], AddSetDto.prototype, "setNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 10 }),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], AddSetDto.prototype, "repsCompleted", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 80.5 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], AddSetDto.prototype, "weightUsedKg", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 90 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], AddSetDto.prototype, "restTakenSeconds", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 7, description: 'RPE 1-10' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], AddSetDto.prototype, "ratingPerceivedExertion", void 0);
//# sourceMappingURL=training.dto.js.map