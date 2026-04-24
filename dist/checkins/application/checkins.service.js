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
exports.CheckinsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const check_in_entity_1 = require("../domain/check-in.entity");
let CheckinsService = class CheckinsService {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    create(data) { return this.repo.save(this.repo.create(data)); }
    findAll() { return this.repo.find({ relations: ['user', 'gym'], order: { checkInTime: 'DESC' } }); }
    findByUser(userId) { return this.repo.find({ where: { userId }, relations: ['gym'], order: { checkInTime: 'DESC' } }); }
    findByGym(gymId) { return this.repo.find({ where: { gymId }, relations: ['user'], order: { checkInTime: 'DESC' } }); }
    async findOne(id) { const c = await this.repo.findOne({ where: { id }, relations: ['user', 'gym'] }); if (!c)
        throw new common_1.NotFoundException(`Check-in ${id} no encontrado`); return c; }
    async checkOut(id) { const c = await this.findOne(id); c.checkOutTime = new Date(); return this.repo.save(c); }
};
exports.CheckinsService = CheckinsService;
exports.CheckinsService = CheckinsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(check_in_entity_1.CheckIn)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], CheckinsService);
//# sourceMappingURL=checkins.service.js.map