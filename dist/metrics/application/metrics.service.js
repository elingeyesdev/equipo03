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
exports.MetricsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const physical_metrics_history_entity_1 = require("../domain/physical-metrics-history.entity");
let MetricsService = class MetricsService {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    create(data) { return this.repo.save(this.repo.create(data)); }
    findAll() { return this.repo.find({ relations: ['user', 'gym'], order: { recordedAt: 'DESC' } }); }
    findByUser(userId) { return this.repo.find({ where: { userId }, order: { recordedAt: 'DESC' } }); }
    async findLatest(userId) { const m = await this.repo.findOne({ where: { userId }, order: { recordedAt: 'DESC' } }); if (!m)
        throw new common_1.NotFoundException(`No hay métricas para usuario ${userId}`); return m; }
    async findOne(id) { const m = await this.repo.findOne({ where: { id }, relations: ['user', 'gym'] }); if (!m)
        throw new common_1.NotFoundException(`Métrica ${id} no encontrada`); return m; }
    async remove(id) { const r = await this.repo.delete(id); if (r.affected === 0)
        throw new common_1.NotFoundException(`Métrica ${id} no encontrada`); }
};
exports.MetricsService = MetricsService;
exports.MetricsService = MetricsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(physical_metrics_history_entity_1.PhysicalMetricsHistory)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], MetricsService);
//# sourceMappingURL=metrics.service.js.map