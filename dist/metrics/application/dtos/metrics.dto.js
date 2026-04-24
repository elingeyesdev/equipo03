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
exports.CreateMetricDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateMetricDto {
    userId;
    gymId;
    measuredBy;
    weightKg;
    heightCm;
    bodyFatPercentage;
    waistCm;
    chestCm;
    bicepsCm;
    thighCm;
    notes;
}
exports.CreateMetricDto = CreateMetricDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'ID del usuario' }),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateMetricDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 1, description: 'ID del gimnasio donde se tomó' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateMetricDto.prototype, "gymId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 1, description: 'ID del entrenador que registró' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateMetricDto.prototype, "measuredBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 78.5 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateMetricDto.prototype, "weightKg", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 175.0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateMetricDto.prototype, "heightCm", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 15.2, description: '% grasa corporal' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateMetricDto.prototype, "bodyFatPercentage", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 40.0, description: 'Cintura cm' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateMetricDto.prototype, "waistCm", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 100.0, description: 'Pecho cm' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateMetricDto.prototype, "chestCm", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 37.5, description: 'Bíceps cm' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateMetricDto.prototype, "bicepsCm", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 60.0, description: 'Muslo cm' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateMetricDto.prototype, "thighCm", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Control mensual de composición corporal' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMetricDto.prototype, "notes", void 0);
//# sourceMappingURL=metrics.dto.js.map