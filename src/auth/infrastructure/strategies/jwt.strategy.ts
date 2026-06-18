import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

export interface JwtPayload {
  sub: string;
  email: string;
  role?: string | null;
  gymId?: number | null;
  brandId?: number | null;
}

// Extrae el JWT desde la cookie HttpOnly 'access_token'
const cookieExtractor = (req: Request): string | null => {
  try {
    return req?.cookies?.access_token ?? null;
  } catch {
    return null;
  }
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      // 1º cookie HttpOnly (producción segura)
      // 2º Authorization: Bearer ... (fallback para Swagger/Postman/mobile)
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: JwtPayload) {
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      gymId: payload.gymId ?? null,
      brandId: payload.brandId ?? null,
      level: (payload as any).level ?? 0,
    };
  }
}
