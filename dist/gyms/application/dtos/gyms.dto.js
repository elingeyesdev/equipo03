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
exports.UpdateGymLocationDto = exports.CreateGymScheduleInputDto = exports.UpdateGymDto = exports.CreateGymDto = exports.CreateGymScheduleDto = exports.CreateGymLocationDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
class CreateGymLocationDto {
    address;
    city;
    latitude;
    longitude;
}
exports.CreateGymLocationDto = CreateGymLocationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Av. Monseñor Rivero #300, Santa Cruz' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateGymLocationDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Santa Cruz de la Sierra' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateGymLocationDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: -17.7833 }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateGymLocationDto.prototype, "latitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: -63.1821 }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateGymLocationDto.prototype, "longitude", void 0);
class CreateGymScheduleDto {
    dayOfWeek;
    opensAt;
    closesAt;
    isHoliday;
}
exports.CreateGymScheduleDto = CreateGymScheduleDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'LUNES', description: 'LUNES | MARTES | MIERCOLES | JUEVES | VIERNES | SABADO | DOMINGO' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateGymScheduleDto.prototype, "dayOfWeek", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '06:00', description: 'Hora apertura (HH:mm)' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateGymScheduleDto.prototype, "opensAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '22:00', description: 'Hora cierre (HH:mm)' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateGymScheduleDto.prototype, "closesAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateGymScheduleDto.prototype, "isHoliday", void 0);
class CreateGymDto {
    name;
    description;
    maxCapacity;
    location;
    schedules;
}
exports.CreateGymDto = CreateGymDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Corpus Gym - Sede Centro' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateGymDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Gimnasio premium con área de CrossFit, piscina y spa en el centro de Santa Cruz' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateGymDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 150, description: 'Capacidad máxima de personas simultáneas' }),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateGymDto.prototype, "maxCapacity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: CreateGymLocationDto,
        example: {
            address: 'Av. Monseñor Rivero #300, Santa Cruz',
            city: 'Santa Cruz de la Sierra',
            latitude: -17.7833,
            longitude: -63.1821,
        },
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => CreateGymLocationDto),
    __metadata("design:type", CreateGymLocationDto)
], CreateGymDto.prototype, "location", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: [CreateGymScheduleDto],
        example: [
            { dayOfWeek: 'LUNES', opensAt: '06:00', closesAt: '22:00' },
            { dayOfWeek: 'MARTES', opensAt: '06:00', closesAt: '22:00' },
            { dayOfWeek: 'SABADO', opensAt: '07:00', closesAt: '20:00' },
        ],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateGymScheduleDto),
    __metadata("design:type", Array)
], CreateGymDto.prototype, "schedules", void 0);
class UpdateGymDto {
    name;
    description;
    maxCapacity;
    isOpen;
}
exports.UpdateGymDto = UpdateGymDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Corpus Gym - Sede Norte' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateGymDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Nueva descripción actualizada del gimnasio' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateGymDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 200 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], UpdateGymDto.prototype, "maxCapacity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: true, description: 'true = abierto, false = cerrado' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateGymDto.prototype, "isOpen", void 0);
class CreateGymScheduleInputDto {
    dayOfWeek;
    opensAt;
    closesAt;
    isHoliday;
}
exports.CreateGymScheduleInputDto = CreateGymScheduleInputDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'MIERCOLES' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateGymScheduleInputDto.prototype, "dayOfWeek", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '06:00' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateGymScheduleInputDto.prototype, "opensAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '22:00' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateGymScheduleInputDto.prototype, "closesAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateGymScheduleInputDto.prototype, "isHoliday", void 0);
class UpdateGymLocationDto {
    address;
    city;
    latitude;
    longitude;
}
exports.UpdateGymLocationDto = UpdateGymLocationDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Av. Banzer Km 7, Santa Cruz' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateGymLocationDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Santa Cruz de la Sierra' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateGymLocationDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: -17.7650 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateGymLocationDto.prototype, "latitude", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: -63.1950 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateGymLocationDto.prototype, "longitude", void 0);
//# sourceMappingURL=gyms.dto.js.map