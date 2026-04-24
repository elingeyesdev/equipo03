import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../../users/application/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(data: { email: string; password: string; firstName: string; lastName: string }) {
    const existing = await this.usersService.findByEmail(data.email);
    if (existing) throw new ConflictException(`El usuario ${data.email} ya se encuentra registrado. Por favor inicie sesión.`);

    const user = await this.usersService.create(data);
    const payload = { sub: user.id, email: user.email };
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

    const payload = { sub: user.id, email: user.email };
    return {
      user: { id: user.id, email: user.email, profile: user.profile },
      accessToken: this.jwtService.sign(payload),
    };
  }

  async validateUser(userId: number) {
    return this.usersService.findOne(userId);
  }
}
