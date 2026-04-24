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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GymLocation = void 0;
const typeorm_1 = require("typeorm");
const gym_entity_1 = require("./gym.entity");
let GymLocation = class GymLocation {
    id;
    gymId;
    address;
    city;
    latitude;
    longitude;
    gym;
};
exports.GymLocation = GymLocation;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], GymLocation.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'gym_id', unique: true }),
    __metadata("design:type", Number)
], GymLocation.prototype, "gymId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], GymLocation.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], GymLocation.prototype, "city", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 8 }),
    __metadata("design:type", Number)
], GymLocation.prototype, "latitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 11, scale: 8 }),
    __metadata("design:type", Number)
], GymLocation.prototype, "longitude", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => gym_entity_1.Gym, (g) => g.location, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'gym_id' }),
    __metadata("design:type", gym_entity_1.Gym)
], GymLocation.prototype, "gym", void 0);
exports.GymLocation = GymLocation = __decorate([
    (0, typeorm_1.Entity)('gym_location')
], GymLocation);
//# sourceMappingURL=gym-location.entity.js.map