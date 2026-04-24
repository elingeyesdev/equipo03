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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const notification_template_entity_1 = require("../domain/notification-template.entity");
const notification_entity_1 = require("../domain/notification.entity");
const user_notification_preference_entity_1 = require("../domain/user-notification-preference.entity");
let NotificationsService = class NotificationsService {
    templatesRepo;
    notifRepo;
    prefsRepo;
    constructor(templatesRepo, notifRepo, prefsRepo) {
        this.templatesRepo = templatesRepo;
        this.notifRepo = notifRepo;
        this.prefsRepo = prefsRepo;
    }
    createTemplate(data) { return this.templatesRepo.save(this.templatesRepo.create(data)); }
    findAllTemplates() { return this.templatesRepo.find(); }
    send(data) { return this.notifRepo.save(this.notifRepo.create(data)); }
    findByUser(userId) { return this.notifRepo.find({ where: { userId }, relations: ['template'], order: { sentAt: 'DESC' } }); }
    async markAsRead(id) { await this.notifRepo.update(id, { readAt: new Date(), status: 'READ' }); return this.notifRepo.findOne({ where: { id } }); }
    async getPreferences(userId) {
        let p = await this.prefsRepo.findOne({ where: { userId } });
        if (!p)
            p = await this.prefsRepo.save(this.prefsRepo.create({ userId }));
        return p;
    }
    async updatePreferences(userId, data) {
        let p = await this.prefsRepo.findOne({ where: { userId } });
        if (!p)
            p = this.prefsRepo.create({ userId });
        Object.assign(p, data);
        return this.prefsRepo.save(p);
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(notification_template_entity_1.NotificationTemplate)),
    __param(1, (0, typeorm_1.InjectRepository)(notification_entity_1.Notification)),
    __param(2, (0, typeorm_1.InjectRepository)(user_notification_preference_entity_1.UserNotificationPreference)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map