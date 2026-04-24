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
exports.TrainingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../auth/infrastructure/guards/jwt-auth.guard");
const training_service_1 = require("../application/training.service");
const training_dto_1 = require("../application/dtos/training.dto");
let TrainingController = class TrainingController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    createProfile(body) { return this.svc.createTrainingProfile(body.userId, body.goals, body.preferences); }
    getProfile(uid) { return this.svc.getTrainingProfile(uid); }
    createRestriction(body) { return this.svc.createRestriction(body); }
    findRestriction(uid) { return this.svc.findRestriction(uid); }
    createEC(body) { return this.svc.createEmergencyContact(body); }
    findECs(uid) { return this.svc.findEmergencyContacts(uid); }
    removeEC(id) { return this.svc.removeEmergencyContact(id); }
    createSession(body) { return this.svc.createSession(body); }
    findSessions() { return this.svc.findAllSessions(); }
    findByUser(uid) { return this.svc.findSessionsByUser(uid); }
    findOneSession(id) { return this.svc.findOneSession(id); }
    updateSession(id, body) { return this.svc.updateSession(id, body); }
    addSet(id, body) { return this.svc.addSet(id, body); }
};
exports.TrainingController = TrainingController;
__decorate([
    (0, common_1.Post)('profile'),
    (0, swagger_1.ApiOperation)({ summary: 'Crear perfil de entrenamiento' }),
    (0, swagger_1.ApiBody)({ type: training_dto_1.CreateTrainingProfileDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [training_dto_1.CreateTrainingProfileDto]),
    __metadata("design:returntype", void 0)
], TrainingController.prototype, "createProfile", null);
__decorate([
    (0, common_1.Get)('profile/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener perfil de entrenamiento' }),
    __param(0, (0, common_1.Param)('userId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], TrainingController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Post)('restrictions'),
    (0, swagger_1.ApiOperation)({ summary: 'Crear restricción' }),
    (0, swagger_1.ApiBody)({ type: training_dto_1.CreateRestrictionDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [training_dto_1.CreateRestrictionDto]),
    __metadata("design:returntype", void 0)
], TrainingController.prototype, "createRestriction", null);
__decorate([
    (0, common_1.Get)('restrictions/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Restricciones de usuario' }),
    __param(0, (0, common_1.Param)('userId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], TrainingController.prototype, "findRestriction", null);
__decorate([
    (0, common_1.Post)('emergency-contacts'),
    (0, swagger_1.ApiOperation)({ summary: 'Crear contacto de emergencia' }),
    (0, swagger_1.ApiBody)({ type: training_dto_1.CreateEmergencyContactDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [training_dto_1.CreateEmergencyContactDto]),
    __metadata("design:returntype", void 0)
], TrainingController.prototype, "createEC", null);
__decorate([
    (0, common_1.Get)('emergency-contacts/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Contactos de emergencia' }),
    __param(0, (0, common_1.Param)('userId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], TrainingController.prototype, "findECs", null);
__decorate([
    (0, common_1.Delete)('emergency-contacts/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Eliminar contacto' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], TrainingController.prototype, "removeEC", null);
__decorate([
    (0, common_1.Post)('sessions'),
    (0, swagger_1.ApiOperation)({ summary: 'Iniciar sesión de entrenamiento' }),
    (0, swagger_1.ApiBody)({ type: training_dto_1.CreateSessionDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [training_dto_1.CreateSessionDto]),
    __metadata("design:returntype", void 0)
], TrainingController.prototype, "createSession", null);
__decorate([
    (0, common_1.Get)('sessions'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar sesiones' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TrainingController.prototype, "findSessions", null);
__decorate([
    (0, common_1.Get)('sessions/user/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Sesiones de usuario' }),
    __param(0, (0, common_1.Param)('userId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], TrainingController.prototype, "findByUser", null);
__decorate([
    (0, common_1.Get)('sessions/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener sesión' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], TrainingController.prototype, "findOneSession", null);
__decorate([
    (0, common_1.Put)('sessions/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar/finalizar sesión' }),
    (0, swagger_1.ApiBody)({ type: training_dto_1.UpdateSessionDto }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, training_dto_1.UpdateSessionDto]),
    __metadata("design:returntype", void 0)
], TrainingController.prototype, "updateSession", null);
__decorate([
    (0, common_1.Post)('sessions/:id/sets'),
    (0, swagger_1.ApiOperation)({ summary: 'Agregar serie completada' }),
    (0, swagger_1.ApiBody)({ type: training_dto_1.AddSetDto }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, training_dto_1.AddSetDto]),
    __metadata("design:returntype", void 0)
], TrainingController.prototype, "addSet", null);
exports.TrainingController = TrainingController = __decorate([
    (0, swagger_1.ApiTags)('Training'),
    (0, common_1.Controller)('training'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    __metadata("design:paramtypes", [training_service_1.TrainingService])
], TrainingController);
//# sourceMappingURL=training.controller.js.map