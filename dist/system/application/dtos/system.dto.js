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
exports.UpdateSettingDto = exports.CreateSettingDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateSettingDto {
    settingKey;
    settingValue;
    category;
}
exports.CreateSettingDto = CreateSettingDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'max_check_ins_per_day' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSettingDto.prototype, "settingKey", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: { value: 3, description: 'Máximo de check-ins por día por usuario' } }),
    __metadata("design:type", Object)
], CreateSettingDto.prototype, "settingValue", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'system' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSettingDto.prototype, "category", void 0);
class UpdateSettingDto {
    settingValue;
    updatedBy;
}
exports.UpdateSettingDto = UpdateSettingDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: { value: 5, description: 'Actualizado a 5 check-ins' } }),
    __metadata("design:type", Object)
], UpdateSettingDto.prototype, "settingValue", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 1, description: 'ID del usuario que actualiza' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], UpdateSettingDto.prototype, "updatedBy", void 0);
//# sourceMappingURL=system.dto.js.map