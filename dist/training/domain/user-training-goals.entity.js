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
exports.UserTrainingGoals = void 0;
const typeorm_1 = require("typeorm");
const user_training_entity_1 = require("./user-training.entity");
let UserTrainingGoals = class UserTrainingGoals {
    id;
    userTrainingId;
    primaryGoal;
    experienceLevel;
    userTraining;
};
exports.UserTrainingGoals = UserTrainingGoals;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], UserTrainingGoals.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'user_training_id', unique: true }),
    __metadata("design:type", Number)
], UserTrainingGoals.prototype, "userTrainingId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, name: 'primary_goal' }),
    __metadata("design:type", String)
], UserTrainingGoals.prototype, "primaryGoal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 30, name: 'experience_level' }),
    __metadata("design:type", String)
], UserTrainingGoals.prototype, "experienceLevel", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => user_training_entity_1.UserTraining, (ut) => ut.goals, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_training_id' }),
    __metadata("design:type", user_training_entity_1.UserTraining)
], UserTrainingGoals.prototype, "userTraining", void 0);
exports.UserTrainingGoals = UserTrainingGoals = __decorate([
    (0, typeorm_1.Entity)('user_training_goals')
], UserTrainingGoals);
//# sourceMappingURL=user-training-goals.entity.js.map