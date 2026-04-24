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
exports.WaitlistService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const waitlist_entry_entity_1 = require("../domain/waitlist-entry.entity");
let WaitlistService = class WaitlistService {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    create(data) { return this.repo.save(this.repo.create(data)); }
    findBySchedule(gymActivityScheduleId) { return this.repo.find({ where: { gymActivityScheduleId, status: 'WAITING' }, relations: ['user'], order: { positionInQueue: 'ASC' } }); }
    findByUser(userId) { return this.repo.find({ where: { userId }, relations: ['gymActivitySchedule'], order: { createdAt: 'DESC' } }); }
    async updateStatus(id, status) { await this.repo.update(id, { status, ...(status === 'ASSIGNED' ? { assignedAt: new Date() } : {}) }); return this.repo.findOne({ where: { id } }); }
    remove(id) { return this.repo.delete(id); }
};
exports.WaitlistService = WaitlistService;
exports.WaitlistService = WaitlistService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(waitlist_entry_entity_1.WaitlistEntry)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], WaitlistService);
//# sourceMappingURL=waitlist.service.js.map