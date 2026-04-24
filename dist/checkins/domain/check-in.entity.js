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
exports.CheckIn = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/domain/user.entity");
const gym_entity_1 = require("../../gyms/domain/gym.entity");
let CheckIn = class CheckIn {
    id;
    userId;
    gymId;
    checkInTime;
    checkOutTime;
    method;
    status;
    user;
    gym;
};
exports.CheckIn = CheckIn;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], CheckIn.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'user_id' }),
    __metadata("design:type", Number)
], CheckIn.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'gym_id' }),
    __metadata("design:type", Number)
], CheckIn.prototype, "gymId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'check_in_time', default: () => 'now()' }),
    __metadata("design:type", Date)
], CheckIn.prototype, "checkInTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'check_out_time', nullable: true }),
    __metadata("design:type", Date)
], CheckIn.prototype, "checkOutTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20 }),
    __metadata("design:type", String)
], CheckIn.prototype, "method", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'COMPLETED' }),
    __metadata("design:type", String)
], CheckIn.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], CheckIn.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => gym_entity_1.Gym, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'gym_id' }),
    __metadata("design:type", gym_entity_1.Gym)
], CheckIn.prototype, "gym", void 0);
exports.CheckIn = CheckIn = __decorate([
    (0, typeorm_1.Entity)('check_ins')
], CheckIn);
//# sourceMappingURL=check-in.entity.js.map