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
exports.UpdateWaitlistStatusDto = exports.CreateWaitlistEntryDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateWaitlistEntryDto {
    userId;
    gymActivityScheduleId;
    positionInQueue;
}
exports.CreateWaitlistEntryDto = CreateWaitlistEntryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'ID del usuario' }),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateWaitlistEntryDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'ID del horario de actividad' }),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateWaitlistEntryDto.prototype, "gymActivityScheduleId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 1, description: 'Posición en la cola' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateWaitlistEntryDto.prototype, "positionInQueue", void 0);
class UpdateWaitlistStatusDto {
    status;
}
exports.UpdateWaitlistStatusDto = UpdateWaitlistStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'ASSIGNED', description: 'WAITING | ASSIGNED | EXPIRED | CANCELLED' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateWaitlistStatusDto.prototype, "status", void 0);
//# sourceMappingURL=waitlist.dto.js.map