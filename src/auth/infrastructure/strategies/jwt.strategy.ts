import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { UserRole } from '../../../roles/domain/user-role.entity';
import { User } from '../../../users/domain/user.entity';

export interface JwtPayload {
  sub: number;
  email: string;
  role?: string | null;
  gymId?: number | null;
  brandId?: number | null;
  level?: number;
}

const cookieExtractor = (req: Request): string | null => {
  try {
    return req?.cookies?.access_token ?? null;
  } catch {
    return null;
  }
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectRepository(UserRole)
    private readonly userRolesRepo: Repository<UserRole>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: JwtPayload) {
    // Verificar que el usuario aún existe y está activo en la BD.
    // Esto invalida JWTs de cuentas eliminadas o desactivadas antes de que expiren.
    const user = await this.userRepo.findOne({
      where: { id: payload.sub },
      select: ['id', 'isActive'],
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Esta cuenta ya no está disponible.');
    }

    let level = payload.level ?? 0;

    if (level === 0) {
      const topRole = await this.userRolesRepo.findOne({
        where: { userId: payload.sub },
        relations: ['role'],
        order: { role: { hierarchyLevel: 'DESC' } },
      });
      level = topRole?.role?.hierarchyLevel ?? 0;
    }

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role ?? null,
      gymId: payload.gymId ?? null,
      brandId: payload.brandId ?? null,
      level,
    };
  }
}
