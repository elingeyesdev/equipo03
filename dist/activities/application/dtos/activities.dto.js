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
exports.RegisterAttendanceDto = exports.CreateActivityScheduleDto = exports.CreateActivityDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateActivityDto {
    gymId;
    name;
    description;
    defaultDurationMin;
}
exports.CreateActivityDto = CreateActivityDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'ID del gimnasio' }),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateActivityDto.prototype, "gymId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Spinning' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateActivityDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Clase de ciclismo indoor de alta intensidad' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateActivityDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 45 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateActivityDto.prototype, "defaultDurationMin", void 0);
class CreateActivityScheduleDto {
    instructorId;
    dayOfWeek;
    startTime;
    endTime;
    maxAttendees;
    isRecurring;
}
exports.CreateActivityScheduleDto = CreateActivityScheduleDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 1, description: 'ID del instructor' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateActivityScheduleDto.prototype, "instructorId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'LUNES' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateActivityScheduleDto.prototype, "dayOfWeek", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '07:00' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateActivityScheduleDto.prototype, "startTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '07:45' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateActivityScheduleDto.prototype, "endTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 25 }),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateActivityScheduleDto.prototype, "maxAttendees", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateActivityScheduleDto.prototype, "isRecurring", void 0);
class RegisterAttendanceDto {
    userId;
    status;
}
exports.RegisterAttendanceDto = RegisterAttendanceDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'ID del usuario' }),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], RegisterAttendanceDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'CONFIRMED' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterAttendanceDto.prototype, "status", void 0);
//# sourceMappingURL=activities.dto.js.map