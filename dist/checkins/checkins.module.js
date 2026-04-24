"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckinsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const check_in_entity_1 = require("./domain/check-in.entity");
const checkins_service_1 = require("./application/checkins.service");
const checkins_controller_1 = require("./infrastructure/checkins.controller");
let CheckinsModule = class CheckinsModule {
};
exports.CheckinsModule = CheckinsModule;
exports.CheckinsModule = CheckinsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([check_in_entity_1.CheckIn])],
        controllers: [checkins_controller_1.CheckinsController],
        providers: [checkins_service_1.CheckinsService],
        exports: [checkins_service_1.CheckinsService],
    })
], CheckinsModule);
//# sourceMappingURL=checkins.module.js.map