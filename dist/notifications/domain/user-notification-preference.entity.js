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
exports.UserNotificationPreference = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/domain/user.entity");
let UserNotificationPreference = class UserNotificationPreference {
    id;
    userId;
    enablePush;
    reservationConfirmations;
    classReminders;
    cancellationsAlerts;
    promotionalContent;
    updatedAt;
    user;
};
exports.UserNotificationPreference = UserNotificationPreference;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], UserNotificationPreference.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'user_id', unique: true }),
    __metadata("design:type", Number)
], UserNotificationPreference.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'enable_push', default: true }),
    __metadata("design:type", Boolean)
], UserNotificationPreference.prototype, "enablePush", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'reservation_confirmations', default: true }),
    __metadata("design:type", Boolean)
], UserNotificationPreference.prototype, "reservationConfirmations", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'class_reminders', default: true }),
    __metadata("design:type", Boolean)
], UserNotificationPreference.prototype, "classReminders", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'cancellations_alerts', default: true }),
    __metadata("design:type", Boolean)
], UserNotificationPreference.prototype, "cancellationsAlerts", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'promotional_content', default: false }),
    __metadata("design:type", Boolean)
], UserNotificationPreference.prototype, "promotionalContent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'updated_at', default: () => 'now()' }),
    __metadata("design:type", Date)
], UserNotificationPreference.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], UserNotificationPreference.prototype, "user", void 0);
exports.UserNotificationPreference = UserNotificationPreference = __decorate([
    (0, typeorm_1.Entity)('user_notification_preferences')
], UserNotificationPreference);
//# sourceMappingURL=user-notification-preference.entity.js.map