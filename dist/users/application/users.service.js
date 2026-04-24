"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcrypt"));
const user_entity_1 = require("../domain/user.entity");
const user_profile_entity_1 = require("../domain/user-profile.entity");
let UsersService = class UsersService {
    usersRepo;
    profilesRepo;
    constructor(usersRepo, profilesRepo) {
        this.usersRepo = usersRepo;
        this.profilesRepo = profilesRepo;
    }
    async create(data) {
        const existing = await this.usersRepo.findOne({ where: { email: data.email } });
        if (existing)
            throw new common_1.ConflictException('Ya existe un usuario con este email');
        const user = this.usersRepo.create({
            email: data.email,
            passwordHash: await bcrypt.hash(data.password, 10),
        });
        const saved = await this.usersRepo.save(user);
        const profile = this.profilesRepo.create({
            userId: saved.id,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
            gender: data.gender,
        });
        await this.profilesRepo.save(profile);
        return this.findOne(saved.id);
    }
    async findAll() {
        return this.usersRepo.find({ relations: ['profile'], select: ['id', 'email', 'isActive', 'createdAt'] });
    }
    async findOne(id) {
        const user = await this.usersRepo.findOne({ where: { id }, relations: ['profile', 'userRoles', 'userRoles.role'] });
        if (!user)
            throw new common_1.NotFoundException(`Usuario con ID ${id} no encontrado`);
        return user;
    }
    async findByEmail(email) {
        return this.usersRepo.findOne({ where: { email }, relations: ['profile'] });
    }
    async update(id, data) {
        const user = await this.findOne(id);
        if (data.password) {
            user.passwordHash = await bcrypt.hash(data.password, 10);
        }
        if (data.email)
            user.email = data.email;
        if (data.isActive !== undefined)
            user.isActive = data.isActive;
        await this.usersRepo.save(user);
        if (user.profile && (data.firstName || data.lastName || data.phone)) {
            if (data.firstName)
                user.profile.firstName = data.firstName;
            if (data.lastName)
                user.profile.lastName = data.lastName;
            if (data.phone)
                user.profile.phone = data.phone;
            await this.profilesRepo.save(user.profile);
        }
        return this.findOne(id);
    }
    async remove(id) {
        const result = await this.usersRepo.delete(id);
        if (result.affected === 0)
            throw new common_1.NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(user_profile_entity_1.UserProfile)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map