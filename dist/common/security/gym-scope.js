"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getManagerGymId = getManagerGymId;
exports.ensureManagerMatchesResourceGym = ensureManagerMatchesResourceGym;
const common_1 = require("@nestjs/common");
function getManagerGymId(req) {
    const user = req.user;
    if (!user || user.role !== 'GERENTE')
        return null;
    if (user.gymId === null || user.gymId === undefined) {
        throw new common_1.ForbiddenException('El gerente no tiene un gimnasio asignado');
    }
    return Number(user.gymId);
}
function ensureManagerMatchesResourceGym(managerGymId, resourceGymId) {
    if (managerGymId === null)
        return;
    if (resourceGymId === null || resourceGymId === undefined) {
        throw new common_1.ForbiddenException('No tiene permisos para acceder a este recurso');
    }
    if (Number(resourceGymId) !== managerGymId) {
        throw new common_1.ForbiddenException('No tiene permisos para acceder a otra sucursal');
    }
}
//# sourceMappingURL=gym-scope.js.map