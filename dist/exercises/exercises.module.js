"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExercisesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const exercise_catalog_entity_1 = require("./domain/exercise-catalog.entity");
const exercises_service_1 = require("./application/exercises.service");
const exercises_controller_1 = require("./infrastructure/exercises.controller");
let ExercisesModule = class ExercisesModule {
};
exports.ExercisesModule = ExercisesModule;
exports.ExercisesModule = ExercisesModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([exercise_catalog_entity_1.ExerciseCatalog])],
        controllers: [exercises_controller_1.ExercisesController],
        providers: [exercises_service_1.ExercisesService],
        exports: [exercises_service_1.ExercisesService],
    })
], ExercisesModule);
//# sourceMappingURL=exercises.module.js.map