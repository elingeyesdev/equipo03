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
exports.GymsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const gym_entity_1 = require("../domain/gym.entity");
const gym_location_entity_1 = require("../domain/gym-location.entity");
const gym_schedule_entity_1 = require("../domain/gym-schedule.entity");
let GymsService = class GymsService {
    gymsRepo;
    locRepo;
    schedRepo;
    constructor(gymsRepo, locRepo, schedRepo) {
        this.gymsRepo = gymsRepo;
        this.locRepo = locRepo;
        this.schedRepo = schedRepo;
    }
    async create(data) {
        const { location, schedules, ...gymData } = data;
        const gymEntity = this.gymsRepo.create(gymData);
        const gym = await this.gymsRepo.save(gymEntity);
        if (location)
            await this.locRepo.save(this.locRepo.create({ ...location, gymId: gym.id }));
        if (schedules?.length) {
            const items = schedules.map((s) => this.schedRepo.create({ ...s, gymId: gym.id }));
            await this.schedRepo.save(items);
        }
        return this.findOne(gym.id);
    }
    async findAll() {
        const gyms = await this.gymsRepo.find({ relations: ['location', 'schedules'], where: { isActive: true } });
        return gyms.map(gym => this.mapGymToDto(gym));
    }
    async findOne(id) {
        const gym = await this.gymsRepo.findOne({ where: { id }, relations: ['location', 'schedules', 'activities'] });
        if (!gym)
            throw new common_1.NotFoundException(`Gimnasio ${id} no encontrado`);
        return this.mapGymToDto(gym);
    }
    mapGymToDto(gym) {
        if (gym.location) {
            gym.location.latitude = Number(gym.location.latitude);
            gym.location.longitude = Number(gym.location.longitude);
        }
        return {
            ...gym,
            aforoActual: Math.floor(Math.random() * ((gym.maxCapacity || 100) / 2)),
            imagenUrl: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=1000&auto=format&fit=crop',
            rating: Number((Math.random() * (5.0 - 4.0) + 4.0).toFixed(1)),
            resenasCount: Math.floor(Math.random() * 500) + 50,
            servicios: ['Musculación', 'Cardio', 'Zumba'],
            beneficios: ['Duchas', 'AC', 'Estacionamiento'],
            telefono: '+591 3 3456789',
        };
    }
    async update(id, data) {
        const gym = await this.findOne(id);
        Object.assign(gym, data);
        return this.gymsRepo.save(gym);
    }
    async remove(id) {
        const r = await this.gymsRepo.delete(id);
        if (r.affected === 0)
            throw new common_1.NotFoundException(`Gimnasio ${id} no encontrado`);
    }
    addSchedule(gymId, data) { return this.schedRepo.save(this.schedRepo.create({ ...data, gymId })); }
    findSchedules(gymId) { return this.schedRepo.find({ where: { gymId } }); }
    removeSchedule(id) { return this.schedRepo.delete(id); }
    async updateLocation(gymId, data) {
        let loc = await this.locRepo.findOne({ where: { gymId } });
        if (loc) {
            Object.assign(loc, data);
            return this.locRepo.save(loc);
        }
        return this.locRepo.save(this.locRepo.create({ ...data, gymId }));
    }
};
exports.GymsService = GymsService;
exports.GymsService = GymsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(gym_entity_1.Gym)),
    __param(1, (0, typeorm_1.InjectRepository)(gym_location_entity_1.GymLocation)),
    __param(2, (0, typeorm_1.InjectRepository)(gym_schedule_entity_1.GymSchedule)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], GymsService);
//# sourceMappingURL=gyms.service.js.map