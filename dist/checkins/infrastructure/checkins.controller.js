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
exports.CheckinsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../auth/infrastructure/guards/jwt-auth.guard");
const checkins_service_1 = require("../application/checkins.service");
const checkins_dto_1 = require("../application/dtos/checkins.dto");
let CheckinsController = class CheckinsController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    create(body) { return this.svc.create(body); }
    findAll() { return this.svc.findAll(); }
    findByUser(uid) { return this.svc.findByUser(uid); }
    findByGym(gid) { return this.svc.findByGym(gid); }
    checkOut(id) { return this.svc.checkOut(id); }
};
exports.CheckinsController = CheckinsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Registrar check-in' }),
    (0, swagger_1.ApiBody)({ type: checkins_dto_1.CreateCheckInDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [checkins_dto_1.CreateCheckInDto]),
    __metadata("design:returntype", void 0)
], CheckinsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar check-ins' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CheckinsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('user/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Check-ins de usuario' }),
    __param(0, (0, common_1.Param)('userId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], CheckinsController.prototype, "findByUser", null);
__decorate([
    (0, common_1.Get)('gym/:gymId'),
    (0, swagger_1.ApiOperation)({ summary: 'Check-ins de gimnasio' }),
    __param(0, (0, common_1.Param)('gymId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], CheckinsController.prototype, "findByGym", null);
__decorate([
    (0, common_1.Put)(':id/checkout'),
    (0, swagger_1.ApiOperation)({ summary: 'Registrar check-out' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], CheckinsController.prototype, "checkOut", null);
exports.CheckinsController = CheckinsController = __decorate([
    (0, swagger_1.ApiTags)('Check-ins'),
    (0, common_1.Controller)('checkins'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    __metadata("design:paramtypes", [checkins_service_1.CheckinsService])
], CheckinsController);
//# sourceMappingURL=checkins.controller.js.map