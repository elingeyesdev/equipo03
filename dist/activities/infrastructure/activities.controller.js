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
exports.ActivitiesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../auth/infrastructure/guards/jwt-auth.guard");
const activities_service_1 = require("../application/activities.service");
const activities_dto_1 = require("../application/dtos/activities.dto");
let ActivitiesController = class ActivitiesController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    create(body) { return this.svc.createActivity(body); }
    findAll(gymId) { return this.svc.findAllActivities(gymId); }
    findOne(id) { return this.svc.findOneActivity(id); }
    createSchedule(id, body) { return this.svc.createSchedule({ ...body, gymActivityId: id }); }
    findSchedules(id) { return this.svc.findSchedulesByActivity(id); }
    registerAttendance(sid, body) { return this.svc.registerAttendance({ ...body, gymActivityScheduleId: sid }); }
    findAttendances(sid) { return this.svc.findAttendances(sid); }
};
exports.ActivitiesController = ActivitiesController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Crear actividad' }),
    (0, swagger_1.ApiBody)({ type: activities_dto_1.CreateActivityDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [activities_dto_1.CreateActivityDto]),
    __metadata("design:returntype", void 0)
], ActivitiesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar actividades' }),
    __param(0, (0, common_1.Query)('gymId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ActivitiesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener actividad' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ActivitiesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':id/schedules'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Crear horario de actividad' }),
    (0, swagger_1.ApiBody)({ type: activities_dto_1.CreateActivityScheduleDto }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, activities_dto_1.CreateActivityScheduleDto]),
    __metadata("design:returntype", void 0)
], ActivitiesController.prototype, "createSchedule", null);
__decorate([
    (0, common_1.Get)(':id/schedules'),
    (0, swagger_1.ApiOperation)({ summary: 'Horarios de una actividad' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ActivitiesController.prototype, "findSchedules", null);
__decorate([
    (0, common_1.Post)('schedules/:scheduleId/attendance'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Registrar asistencia' }),
    (0, swagger_1.ApiBody)({ type: activities_dto_1.RegisterAttendanceDto }),
    __param(0, (0, common_1.Param)('scheduleId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, activities_dto_1.RegisterAttendanceDto]),
    __metadata("design:returntype", void 0)
], ActivitiesController.prototype, "registerAttendance", null);
__decorate([
    (0, common_1.Get)('schedules/:scheduleId/attendance'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Asistencias de un horario' }),
    __param(0, (0, common_1.Param)('scheduleId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ActivitiesController.prototype, "findAttendances", null);
exports.ActivitiesController = ActivitiesController = __decorate([
    (0, swagger_1.ApiTags)('Activities'),
    (0, common_1.Controller)('activities'),
    __metadata("design:paramtypes", [activities_service_1.ActivitiesService])
], ActivitiesController);
//# sourceMappingURL=activities.controller.js.map