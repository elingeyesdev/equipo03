"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrainingModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const user_training_entity_1 = require("./domain/user-training.entity");
const user_training_goals_entity_1 = require("./domain/user-training-goals.entity");
const user_training_preferences_entity_1 = require("./domain/user-training-preferences.entity");
const user_training_restriction_entity_1 = require("./domain/user-training-restriction.entity");
const emergency_contact_entity_1 = require("./domain/emergency-contact.entity");
const workout_session_entity_1 = require("./domain/workout-session.entity");
const workout_set_entity_1 = require("./domain/workout-set.entity");
const training_service_1 = require("./application/training.service");
const training_controller_1 = require("./infrastructure/training.controller");
let TrainingModule = class TrainingModule {
};
exports.TrainingModule = TrainingModule;
exports.TrainingModule = TrainingModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([user_training_entity_1.UserTraining, user_training_goals_entity_1.UserTrainingGoals, user_training_preferences_entity_1.UserTrainingPreferences, user_training_restriction_entity_1.UserTrainingRestriction, emergency_contact_entity_1.EmergencyContact, workout_session_entity_1.WorkoutSession, workout_set_entity_1.WorkoutSet])],
        controllers: [training_controller_1.TrainingController],
        providers: [training_service_1.TrainingService],
        exports: [training_service_1.TrainingService],
    })
], TrainingModule);
//# sourceMappingURL=training.module.js.map