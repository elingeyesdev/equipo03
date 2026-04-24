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
exports.SystemSetting = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/domain/user.entity");
let SystemSetting = class SystemSetting {
    id;
    settingKey;
    settingValue;
    description;
    updatedAt;
    updatedBy;
    updatedByUser;
};
exports.SystemSetting = SystemSetting;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], SystemSetting.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, name: 'setting_key', unique: true }),
    __metadata("design:type", String)
], SystemSetting.prototype, "settingKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'setting_value' }),
    __metadata("design:type", Object)
], SystemSetting.prototype, "settingValue", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], SystemSetting.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'updated_at', default: () => 'now()' }),
    __metadata("design:type", Date)
], SystemSetting.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'updated_by', nullable: true }),
    __metadata("design:type", Number)
], SystemSetting.prototype, "updatedBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'updated_by' }),
    __metadata("design:type", user_entity_1.User)
], SystemSetting.prototype, "updatedByUser", void 0);
exports.SystemSetting = SystemSetting = __decorate([
    (0, typeorm_1.Entity)('system_settings')
], SystemSetting);
//# sourceMappingURL=system-setting.entity.js.map