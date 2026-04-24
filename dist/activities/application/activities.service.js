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
exports.ActivitiesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const gym_activity_entity_1 = require("../domain/gym-activity.entity");
const gym_activity_schedule_entity_1 = require("../domain/gym-activity-schedule.entity");
const gym_activity_attendance_entity_1 = require("../domain/gym-activity-attendance.entity");
let ActivitiesService = class ActivitiesService {
    actRepo;
    schedRepo;
    attRepo;
    constructor(actRepo, schedRepo, attRepo) {
        this.actRepo = actRepo;
        this.schedRepo = schedRepo;
        this.attRepo = attRepo;
    }
    createActivity(data) { return this.actRepo.save(this.actRepo.create(data)); }
    findAllActivities(gymId) { return gymId ? this.actRepo.find({ where: { gymId, isActive: true }, relations: ['schedules'] }) : this.actRepo.find({ where: { isActive: true }, relations: ['gym', 'schedules'] }); }
    async findOneActivity(id) { const a = await this.actRepo.findOne({ where: { id }, relations: ['gym', 'schedules', 'schedules.instructor'] }); if (!a)
        throw new common_1.NotFoundException(`Actividad ${id} no encontrada`); return a; }
    createSchedule(data) { return this.schedRepo.save(this.schedRepo.create(data)); }
    findSchedulesByActivity(gymActivityId) { return this.schedRepo.find({ where: { gymActivityId }, relations: ['instructor'] }); }
    registerAttendance(data) { return this.attRepo.save(this.attRepo.create(data)); }
    findAttendances(gymActivityScheduleId) { return this.attRepo.find({ where: { gymActivityScheduleId }, relations: ['user'] }); }
};
exports.ActivitiesService = ActivitiesService;
exports.ActivitiesService = ActivitiesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(gym_activity_entity_1.GymActivity)),
    __param(1, (0, typeorm_1.InjectRepository)(gym_activity_schedule_entity_1.GymActivitySchedule)),
    __param(2, (0, typeorm_1.InjectRepository)(gym_activity_attendance_entity_1.GymActivityAttendance)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ActivitiesService);
//# sourceMappingURL=activities.service.js.map