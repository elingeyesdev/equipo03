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
exports.UserTrainingRestriction = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/domain/user.entity");
let UserTrainingRestriction = class UserTrainingRestriction {
    id;
    userId;
    restrictionType;
    description;
    affectedBodyAreas;
    movementsToAvoid;
    requiresTrainerApproval;
    isActive;
    createdAt;
    updatedAt;
    user;
};
exports.UserTrainingRestriction = UserTrainingRestriction;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], UserTrainingRestriction.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'user_id', unique: true }),
    __metadata("design:type", Number)
], UserTrainingRestriction.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, name: 'restriction_type' }),
    __metadata("design:type", String)
], UserTrainingRestriction.prototype, "restrictionType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], UserTrainingRestriction.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'affected_body_areas', nullable: true }),
    __metadata("design:type", Array)
], UserTrainingRestriction.prototype, "affectedBodyAreas", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'movements_to_avoid', nullable: true }),
    __metadata("design:type", Array)
], UserTrainingRestriction.prototype, "movementsToAvoid", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'requires_trainer_approval', default: false }),
    __metadata("design:type", Boolean)
], UserTrainingRestriction.prototype, "requiresTrainerApproval", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'is_active', default: true }),
    __metadata("design:type", Boolean)
], UserTrainingRestriction.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], UserTrainingRestriction.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'updated_at', nullable: true }),
    __metadata("design:type", Date)
], UserTrainingRestriction.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], UserTrainingRestriction.prototype, "user", void 0);
exports.UserTrainingRestriction = UserTrainingRestriction = __decorate([
    (0, typeorm_1.Entity)('user_training_restrictions')
], UserTrainingRestriction);
//# sourceMappingURL=user-training-restriction.entity.js.map