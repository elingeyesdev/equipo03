"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivitiesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const gym_activity_entity_1 = require("./domain/gym-activity.entity");
const gym_activity_schedule_entity_1 = require("./domain/gym-activity-schedule.entity");
const gym_activity_attendance_entity_1 = require("./domain/gym-activity-attendance.entity");
const activities_service_1 = require("./application/activities.service");
const activities_controller_1 = require("./infrastructure/activities.controller");
let ActivitiesModule = class ActivitiesModule {
};
exports.ActivitiesModule = ActivitiesModule;
exports.ActivitiesModule = ActivitiesModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([gym_activity_entity_1.GymActivity, gym_activity_schedule_entity_1.GymActivitySchedule, gym_activity_attendance_entity_1.GymActivityAttendance])],
        controllers: [activities_controller_1.ActivitiesController],
        providers: [activities_service_1.ActivitiesService],
        exports: [activities_service_1.ActivitiesService],
    })
], ActivitiesModule);
//# sourceMappingURL=activities.module.js.map