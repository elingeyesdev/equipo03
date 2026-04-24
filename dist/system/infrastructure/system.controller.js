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
exports.SystemController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../auth/infrastructure/guards/jwt-auth.guard");
const system_service_1 = require("../application/system.service");
const system_dto_1 = require("../application/dtos/system.dto");
let SystemController = class SystemController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    create(body) { return this.svc.create(body); }
    findAll() { return this.svc.findAll(); }
    findByKey(key) { return this.svc.findByKey(key); }
    update(key, body) { return this.svc.update(key, body.settingValue, body.updatedBy); }
    remove(id) { return this.svc.remove(id); }
};
exports.SystemController = SystemController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Crear configuración del sistema' }),
    (0, swagger_1.ApiBody)({ type: system_dto_1.CreateSettingDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [system_dto_1.CreateSettingDto]),
    __metadata("design:returntype", void 0)
], SystemController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar configuraciones' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SystemController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':key'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener configuración por clave' }),
    __param(0, (0, common_1.Param)('key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SystemController.prototype, "findByKey", null);
__decorate([
    (0, common_1.Put)(':key'),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar configuración' }),
    (0, swagger_1.ApiBody)({ type: system_dto_1.UpdateSettingDto }),
    __param(0, (0, common_1.Param)('key')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, system_dto_1.UpdateSettingDto]),
    __metadata("design:returntype", void 0)
], SystemController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Eliminar configuración' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], SystemController.prototype, "remove", null);
exports.SystemController = SystemController = __decorate([
    (0, swagger_1.ApiTags)('System'),
    (0, common_1.Controller)('system/settings'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    __metadata("design:paramtypes", [system_service_1.SystemService])
], SystemController);
//# sourceMappingURL=system.controller.js.map