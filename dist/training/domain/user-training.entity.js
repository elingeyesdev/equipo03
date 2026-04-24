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
exports.UserTraining = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/domain/user.entity");
const user_training_goals_entity_1 = require("./user-training-goals.entity");
const user_training_preferences_entity_1 = require("./user-training-preferences.entity");
let UserTraining = class UserTraining {
    id;
    userId;
    createdAt;
    user;
    goals;
    preferences;
};
exports.UserTraining = UserTraining;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], UserTraining.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'user_id', unique: true }),
    __metadata("design:type", Number)
], UserTraining.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], UserTraining.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], UserTraining.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => user_training_goals_entity_1.UserTrainingGoals, (g) => g.userTraining, { cascade: true }),
    __metadata("design:type", user_training_goals_entity_1.UserTrainingGoals)
], UserTraining.prototype, "goals", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => user_training_preferences_entity_1.UserTrainingPreferences, (p) => p.userTraining, { cascade: true }),
    __metadata("design:type", user_training_preferences_entity_1.UserTrainingPreferences)
], UserTraining.prototype, "preferences", void 0);
exports.UserTraining = UserTraining = __decorate([
    (0, typeorm_1.Entity)('user_training')
], UserTraining);
//# sourceMappingURL=user-training.entity.js.map