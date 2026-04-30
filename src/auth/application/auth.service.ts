import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../../users/application/users.service';
import { UserRole } from '../../roles/domain/user-role.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectRepository(UserRole)
    private readonly userRolesRepo: Repository<UserRole>,
  ) {}

  private async buildJwtPayload(user: { id: number; email: string }) {
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

  async register(data: { email: string; password: string; firstName: string; lastName: string }) {
    const existing = await this.usersService.findByEmail(data.email);
    if (existing) throw new ConflictException(`El usuario ${data.email} ya se encuentra registrado. Por favor inicie sesión.`);

    const user = await this.usersService.create(data);
    const payload = await this.buildJwtPayload({ id: user.id, email: user.email });
    return {
      user: { id: user.id, email: user.email, profile: user.profile },
      accessToken: this.jwtService.sign(payload),
    };
  }

  async login(data: { email: string; password: string }) {
    const user = await this.usersService.findByEmail(data.email);
    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Credenciales inválidas');
    if (!user.isActive) throw new UnauthorizedException('Cuenta desactivada');

    const payload = await this.buildJwtPayload({ id: user.id, email: user.email });
    return {
      user: { id: user.id, email: user.email, profile: user.profile },
      accessToken: this.jwtService.sign(payload),
    };
  }

  async validateUser(userId: number) {
    return this.usersService.findOne(userId);
  }
}
