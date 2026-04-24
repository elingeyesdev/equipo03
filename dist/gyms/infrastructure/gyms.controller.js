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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GymsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../auth/infrastructure/guards/jwt-auth.guard");
const gyms_service_1 = require("../application/gyms.service");
const gyms_dto_1 = require("../application/dtos/gyms.dto");
let GymsController = class GymsController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    create(body) { return this.svc.create(body); }
    findAll() { return this.svc.findAll(); }
    findOne(id) { return this.svc.findOne(id); }
    update(id, body) { return this.svc.update(id, body); }
    async remove(id) {
        await this.svc.remove(id);
        return { message: 'Gimnasio eliminado' };
    }
    addSchedule(id, body) {
        return this.svc.addSchedule(id, body);
    }
    findSchedules(id) { return this.svc.findSchedules(id); }
    updateLocation(id, body) {
        return this.svc.updateLocation(id, body);
    }
};
exports.GymsController = GymsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Crear gimnasio con ubicación y horarios' }),
    (0, swagger_1.ApiBody)({ type: gyms_dto_1.CreateGymDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Gimnasio creado' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [gyms_dto_1.CreateGymDto]),
    __metadata("design:returntype", void 0)
], GymsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar gymnaisios activos' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], GymsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener gimnasio por ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 1 }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], GymsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar datos del gimnasio' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 1 }),
    (0, swagger_1.ApiBody)({ type: gyms_dto_1.UpdateGymDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Gimnasio actualizado' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, gyms_dto_1.UpdateGymDto]),
    __metadata("design:returntype", void 0)
], GymsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Eliminar gimnasio' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 1 }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], GymsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/schedules'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Agregar horario al gimnasio' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 1 }),
    (0, swagger_1.ApiBody)({ type: gyms_dto_1.CreateGymScheduleInputDto }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, gyms_dto_1.CreateGymScheduleInputDto]),
    __metadata("design:returntype", void 0)
], GymsController.prototype, "addSchedule", null);
__decorate([
    (0, common_1.Get)(':id/schedules'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar horarios del gimnasio' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 1 }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], GymsController.prototype, "findSchedules", null);
__decorate([
    (0, common_1.Put)(':id/location'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar ubicación del gimnasio' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 1 }),
    (0, swagger_1.ApiBody)({ type: gyms_dto_1.UpdateGymLocationDto }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, gyms_dto_1.UpdateGymLocationDto]),
    __metadata("design:returntype", void 0)
], GymsController.prototype, "updateLocation", null);
exports.GymsController = GymsController = __decorate([
    (0, swagger_1.ApiTags)('Gyms'),
    (0, common_1.Controller)('gyms'),
    __metadata("design:paramtypes", [gyms_service_1.GymsService])
], GymsController);
//# sourceMappingURL=gyms.controller.js.map