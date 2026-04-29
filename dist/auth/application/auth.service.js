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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const users_service_1 = require("../../users/application/users.service");
const user_role_entity_1 = require("../../roles/domain/user-role.entity");
let AuthService = class AuthService {
    usersService;
    jwtService;
    userRolesRepo;
    constructor(usersService, jwtService, userRolesRepo) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.userRolesRepo = userRolesRepo;
    }
    async buildJwtPayload(user) {
        const userRoles = await this.userRolesRepo.find({
            where: { userId: user.id },
            relations: ['role'],
            order: { id: 'ASC' },
        });
        const superAdminRole = userRoles.find((assignment) => assignment.role?.name === 'SUPER_ADMIN');
        if (superAdminRole) {
            return {
                sub: user.id,
                email: user.email,
                role: 'SUPER_ADMIN',
            };
        }
        const gerenteRole = userRoles.find((assignment) => assignment.role?.name === 'GERENTE');
        if (gerenteRole) {
            return {
                sub: user.id,
                email: user.email,
                role: 'GERENTE',
                gymId: gerenteRole.gymId ?? null,
            };
        }
        const fallbackRole = userRoles[0];
        return {
            sub: user.id,
            email: user.email,
            role: fallbackRole?.role?.name ?? null,
            gymId: fallbackRole?.gymId ?? null,
        };
    }
    async register(data) {
        const existing = await this.usersService.findByEmail(data.email);
        if (existing)
            throw new common_1.ConflictException(`El usuario ${data.email} ya se encuentra registrado. Por favor inicie sesión.`);
        const user = await this.usersService.create(data);
        const payload = await this.buildJwtPayload({ id: user.id, email: user.email });
        return {
            user: { id: user.id, email: user.email, profile: user.profile },
            accessToken: this.jwtService.sign(payload),
        };
    }
    async login(data) {
        const user = await this.usersService.findByEmail(data.email);
        if (!user)
            throw new common_1.UnauthorizedException('Credenciales inválidas');
        const valid = await bcrypt.compare(data.password, user.passwordHash);
        if (!valid)
            throw new common_1.UnauthorizedException('Credenciales inválidas');
        if (!user.isActive)
            throw new common_1.UnauthorizedException('Cuenta desactivada');
        const payload = await this.buildJwtPayload({ id: user.id, email: user.email });
        return {
            user: { id: user.id, email: user.email, profile: user.profile },
            accessToken: this.jwtService.sign(payload),
        };
    }
    async validateUser(userId) {
        return this.usersService.findOne(userId);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, typeorm_1.InjectRepository)(user_role_entity_1.UserRole)),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        typeorm_2.Repository])
], AuthService);
//# sourceMappingURL=auth.service.js.map