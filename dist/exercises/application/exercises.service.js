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
exports.ExercisesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const exercise_catalog_entity_1 = require("../domain/exercise-catalog.entity");
let ExercisesService = class ExercisesService {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    create(data) { return this.repo.save(this.repo.create(data)); }
    findAll(filters) {
        const qb = this.repo.createQueryBuilder('e');
        if (filters?.muscleGroup)
            qb.andWhere('e.muscle_group ILIKE :mg', { mg: `%${filters.muscleGroup}%` });
        if (filters?.difficultyLevel)
            qb.andWhere('e.difficulty_level = :dl', { dl: filters.difficultyLevel });
        return qb.andWhere('e.is_active = true').orderBy('e.name', 'ASC').getMany();
    }
    async findOne(id) {
        const e = await this.repo.findOne({ where: { id } });
        if (!e)
            throw new common_1.NotFoundException(`Ejercicio ${id} no encontrado`);
        return e;
    }
    async update(id, data) {
        const e = await this.findOne(id);
        Object.assign(e, data);
        return this.repo.save(e);
    }
    async remove(id) {
        const r = await this.repo.delete(id);
        if (r.affected === 0)
            throw new common_1.NotFoundException(`Ejercicio ${id} no encontrado`);
    }
};
exports.ExercisesService = ExercisesService;
exports.ExercisesService = ExercisesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(exercise_catalog_entity_1.ExerciseCatalog)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ExercisesService);
//# sourceMappingURL=exercises.service.js.map