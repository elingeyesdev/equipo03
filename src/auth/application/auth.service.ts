import * as nodemailer from 'nodemailer';
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../../users/application/users.service';
import { User } from '../../users/domain/user.entity';
import { UserRole } from '../../roles/domain/user-role.entity';
import { Gym } from '../../gyms/domain/gym.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly mailer: nodemailer.Transporter;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(UserRole)
    private readonly userRolesRepo: Repository<UserRole>,
    @InjectRepository(Gym)
    private readonly gymRepo: Repository<Gym>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {
    this.mailer = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST') ?? 'smtp.gmail.com',
      port: this.configService.get<number>('SMTP_PORT') ?? 587,
      secure: false, // STARTTLS en puerto 587 (no SSL)
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  // Jerarquía de roles: mayor índice = mayor prioridad
  private static readonly ROLE_PRIORITY: Record<string, number> = {
    USER: 10,
    CLIENTE: 10,
    ENTRENADOR: 20,
    INSTRUCTOR: 30,
    RECEPCIONISTA: 40,
    GERENTE: 50,
    SUPER_ADMIN: 99,
  };

  private extractGymName(
    userRoles: UserRole[] | undefined | null,
    gymId: number | null,
  ): string | null {
    if (!gymId || !userRoles?.length) return null;
    const match = userRoles.find((ur) => ur.gymId === gymId && ur.gym);
    if (match) return match.gym.name;
    const anyGym = userRoles.find((ur) => ur.gym)?.gym;
    return anyGym?.name ?? null;
  }

  private async buildJwtPayload(user: { id: number; email: string }) {
    const userRoles = await this.userRolesRepo.find({
      where: { userId: user.id },
      relations: ['role', 'gym'],
      order: { id: 'ASC' },
    });

    if (userRoles.length === 0) {
      this.logger.warn('JWT generado sin roles asignados');
      return { sub: user.id, email: user.email, role: null, gymId: null, level: 0 };
    }

    const sorted = [...userRoles].sort((a, b) => {
      const pa =
        AuthService.ROLE_PRIORITY[a.role?.name?.toUpperCase() ?? ''] ?? 0;
      const pb =
        AuthService.ROLE_PRIORITY[b.role?.name?.toUpperCase() ?? ''] ?? 0;
      return pb - pa; // mayor primero
    });

    const topAssignment = sorted[0];
    const topRoleName = topAssignment.role?.name?.toUpperCase() ?? null;

    // ── SUPER_ADMIN — sin sede ────────────────────────────────────────────────
    if (topRoleName === 'SUPER_ADMIN') {
      return {
        sub: user.id,
        email: user.email,
        role: 'SUPER_ADMIN',
        gymId: null,
        level: topAssignment.role?.hierarchyLevel ?? 10,
      };
    }

    // ── GERENTE — emite brandId si se asignó a una Marca, gymId si es Sucursal ──
    if (topRoleName === 'GERENTE') {
      const gerenteRoles = userRoles.filter(
        (a) => a.role?.name?.toUpperCase() === 'GERENTE',
      );
      const gerenteRole =
        gerenteRoles.find((a) => a.gymId !== null && a.gymId !== undefined) ??
        gerenteRoles[0];

      const resolvedGymId: number | null = gerenteRole.gymId ?? null;

      if (resolvedGymId !== null) {
        const assignedGym =
          gerenteRole.gym ??
          (await this.gymRepo.findOne({ where: { id: resolvedGymId } }));

        if (assignedGym && assignedGym.parentId === null) {
          // Es una Marca → emitir brandId directamente (no buscar sucursal hija)
          return {
            sub: user.id,
            email: user.email,
            role: 'GERENTE',
            gymId: null,
            brandId: resolvedGymId,
            level: topAssignment.role?.hierarchyLevel ?? 5,
          };
        }

      }

      return {
        sub: user.id,
        email: user.email,
        role: 'GERENTE',
        gymId: resolvedGymId,
        brandId: null,
        level: topAssignment.role?.hierarchyLevel ?? 5,
      };
    }

    // ── Fallback (INSTRUCTOR, ENTRENADOR, USER/CLIENTE, etc.) ─────────────────
    return {
      sub: user.id,
      email: user.email,
      role: topRoleName,
      gymId: topAssignment.gymId ?? null,
      level: topAssignment.role?.hierarchyLevel ?? 1,
    };
  }

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    const existing = await this.usersService.findByEmail(data.email);
    if (existing)
      throw new ConflictException(
        `El usuario ${data.email} ya se encuentra registrado. Por favor inicie sesión.`,
      );

    // Buscar ID del rol CLIENTE usando query directa
    const rolesResult = await this.userRolesRepo.manager.query(
      "SELECT id, name FROM roles WHERE name = 'CLIENTE' OR name = 'USER' LIMIT 1",
    );
    const roleId = rolesResult?.length ? rolesResult[0].id : 2;

    const user = await this.usersService.create({
      ...data,
      roleId: roleId,
    });

    const payload = await this.buildJwtPayload({
      id: user.id,
      email: user.email,
    });
    const gymName = this.extractGymName(user.userRoles, payload.gymId);
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: payload.role,
        gymId: payload.gymId,
        gymName,
        firstName: user.profile?.firstName ?? null,
        lastName: user.profile?.lastName ?? null,
        profile: user.profile,
      },
    };
  }

  async login(data: { email: string; password: string }) {
    const user = await this.usersService.findByEmail(data.email);
    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Credenciales inválidas');
    if (!user.isActive) throw new UnauthorizedException('Cuenta desactivada');

    const payload = await this.buildJwtPayload({
      id: user.id,
      email: user.email,
    });
    const gymName = this.extractGymName(user.userRoles, payload.gymId);
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: payload.role,
        gymId: payload.gymId,
        gymName,
        firstName: user.profile?.firstName ?? null,
        lastName: user.profile?.lastName ?? null,
        profile: user.profile,
      },
    };
  }

  verifyToken(
    token: string,
  ): { sub: number; role: string | null; gymId: number | null } | null {
    try {
      return this.jwtService.verify<{
        sub: number;
        role: string | null;
        gymId: number | null;
      }>(token);
    } catch {
      return null;
    }
  }

  async validateUser(userId: number) {
    return this.usersService.findOne(userId);
  }

  /**
   * Genera un OTP de 6 dígitos, lo guarda en la BD con expiración de 15 min
   * y lo imprime en consola (mock de correo).
   * Siempre devuelve 200 para evitar enumeración de usuarios.
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);

    if (user) {
      const otpCode = String(Math.floor(100000 + Math.random() * 900000));
      const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // +15 min

      await this.userRepo.update(user.id, { otpCode, otpExpiresAt });

      try {
        await this.mailer.verify();
        await this.mailer.sendMail({
          from: this.configService.get<string>('SMTP_USER'),
          to: email,
          subject: 'Código de Verificación - Corpus Gym',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 24px; border: 1px solid #eaeaea; border-radius: 12px;">
              <h2 style="color: #ff5500; text-align: center; margin-bottom: 20px;">Corpus Gym</h2>
              <p style="color: #333; font-size: 16px;">Has solicitado restablecer tu contraseña.</p>
              <p style="color: #333; font-size: 16px;">Usa el siguiente código de verificación de 6 dígitos:</p>
              <div style="background-color: #f4f4f5; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #111;">${otpCode}</span>
              </div>
              <p style="font-size: 12px; color: #666; text-align: center;">Este código expira en 15 minutos. No lo compartas con nadie.</p>
            </div>
          `,
        });
        this.logger.log(`[OTP] Correo enviado a ${email} vía Nodemailer`);
      } catch (error: any) {
        this.logger.error(
          `[SMTP] Error al enviar OTP a ${email}: ${error?.message ?? error} | code=${error?.code ?? 'n/a'} | responseCode=${error?.responseCode ?? 'n/a'}`,
          error?.stack,
        );
        throw new InternalServerErrorException(
          'Fallo interno del servidor SMTP.',
        );
      }
    }

    // Respuesta idéntica exista o no el usuario (anti-enumeración)
    return { message: 'Si el correo existe recibirás un código OTP.' };
  }

  /**
   * Verifica el OTP, valida expiración y actualiza la contraseña.
   * Limpia otpCode y otpExpiresAt tras el reset exitoso.
   */
  async resetPassword(
    email: string,
    otpCode: string,
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.userRepo.findOne({ where: { email } });

    if (!user || user.otpCode !== otpCode) {
      throw new BadRequestException('Código OTP inválido.');
    }

    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      throw new BadRequestException(
        'El código OTP ha expirado. Solicita uno nuevo.',
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.userRepo.update(user.id, {
      passwordHash,
      otpCode: null,
      otpExpiresAt: null,
    });

    return { success: true, message: 'Contraseña actualizada correctamente.' };
  }
}
