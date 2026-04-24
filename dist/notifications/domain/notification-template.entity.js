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
exports.NotificationTemplate = void 0;
const typeorm_1 = require("typeorm");
let NotificationTemplate = class NotificationTemplate {
    id;
    type;
    titleTemplate;
    bodyTemplate;
};
exports.NotificationTemplate = NotificationTemplate;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], NotificationTemplate.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, unique: true }),
    __metadata("design:type", String)
], NotificationTemplate.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, name: 'title_template' }),
    __metadata("design:type", String)
], NotificationTemplate.prototype, "titleTemplate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'body_template' }),
    __metadata("design:type", String)
], NotificationTemplate.prototype, "bodyTemplate", void 0);
exports.NotificationTemplate = NotificationTemplate = __decorate([
    (0, typeorm_1.Entity)('notification_templates')
], NotificationTemplate);
//# sourceMappingURL=notification-template.entity.js.map