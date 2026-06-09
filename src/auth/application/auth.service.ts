import * as nodemailer from 'nodemailer';
import { Injectable, UnauthorizedException, ConflictException, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
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
    USER:        10,
    CLIENTE:     10,
    ENTRENADOR:  20,
    INSTRUCTOR:  30,
    GERENTE:     50,
    SUPER_ADMIN: 99,
  };

  private extractGymName(
    userRoles: UserRole[] | undefined | null,
    gymId: number | null,
  ): string | null {
    if (!gymId || !userRoles?.length) return null;
    const match = userRoles.find((ur) => ur.gymId === gymId && ur.gym);
    if (match) return match.gym!.name;
    const anyGym = userRoles.find((ur) => ur.gym)?.gym;
    return anyGym?.name ?? null;
  }

  private async buildJwtPayload(user: { id: number; email: string }) {
    const userRoles = await this.userRolesRepo.find({
      where: { userId: user.id },
      relations: ['role', 'gym'],
      order: { id: 'ASC' },
    });

    console.log(
      '[JWT] userId=%d email=%s roles encontrados en BD: [%s]',
      user.id,
      user.email,
      userRoles.map((r) => `${r.role?.name ?? '?'}(gymId=${r.gymId ?? 'null'})`).join(', '),
    );

    if (userRoles.length === 0) {
      console.warn('[JWT] userId=%d SIN roles en user_roles → payload role=null', user.id);
      return { sub: user.id, email: user.email, role: null, gymId: null };
    }

    const sorted = [...userRoles].sort((a, b) => {
      const pa = AuthService.ROLE_PRIORITY[a.role?.name?.toUpperCase() ?? ''] ?? 0;
      const pb = AuthService.ROLE_PRIORITY[b.role?.name?.toUpperCase() ?? ''] ?? 0;
      return pb - pa; // mayor primero
    });

    const topAssignment = sorted[0];
    const topRoleName = topAssignment.role?.name?.toUpperCase() ?? null;

    console.log('[JWT] userId=%d rol elegido (mayor prioridad): %s', user.id, topRoleName);

    // ── SUPER_ADMIN — sin sede ────────────────────────────────────────────────
    if (topRoleName === 'SUPER_ADMIN') {
      const payload = { sub: user.id, email: user.email, role: 'SUPER_ADMIN', gymId: null };
      console.log('Generando JWT para:', user.email, 'con ROL:', payload.role);
      return payload;
    }

    // ── GERENTE — resuelve a Sucursal (gymId físico) ─────────────────────────
    if (topRoleName === 'GERENTE') {
      const gerenteRoles = userRoles.filter(
        (a) => a.role?.name?.toUpperCase() === 'GERENTE',
      );
      const gerenteRole =
        gerenteRoles.find((a) => a.gymId !== null && a.gymId !== undefined)
        ?? gerenteRoles[0];

      let resolvedGymId: number | null = gerenteRole.gymId ?? null;

      if (resolvedGymId !== null) {
        const assignedGym =
          gerenteRole.gym ?? (await this.gymRepo.findOne({ where: { id: resolvedGymId } }));

        if (assignedGym && assignedGym.parentId === null) {
          // Es una Marca → resolver a su primera Sucursal activa
          const sucursal = await this.gymRepo.findOne({
            where: { parentId: resolvedGymId, isActive: true },
            order: { id: 'ASC' },
          });
          if (sucursal) {
            console.log('[JWT] GERENTE userId=%d: Marca %d → Sucursal %d', user.id, resolvedGymId, sucursal.id);
            resolvedGymId = sucursal.id;
          } else {
            console.warn('[JWT] GERENTE userId=%d: Marca %d sin sucursales activas → gymId=null', user.id, resolvedGymId);
            resolvedGymId = null;
          }
        } else {
          console.log('[JWT] GERENTE userId=%d: Sucursal directa id=%d', user.id, resolvedGymId);
        }
      }

      const payload = { sub: user.id, email: user.email, role: 'GERENTE', gymId: resolvedGymId };
      console.log('Generando JWT para:', user.email, 'con ROL:', payload.role, '| SUCURSAL ID:', payload.gymId);
      return payload;
    }

    // ── Fallback (INSTRUCTOR, ENTRENADOR, USER/CLIENTE, etc.) ─────────────────
    const payload = {
      sub:   user.id,
      email: user.email,
      role:  topRoleName,
      gymId: topAssignment.gymId ?? null,
    };
    console.log('Generando JWT para:', user.email, 'con ROL:', payload.role);
    return payload;
  }

  async register(data: { email: string; password: string; firstName: string; lastName: string }) {
    const existing = await this.usersService.findByEmail(data.email);
    if (existing) throw new ConflictException(`El usuario ${data.email} ya se encuentra registrado. Por favor inicie sesión.`);

    // Buscar ID del rol CLIENTE usando query directa
    const rolesResult = await this.userRolesRepo.manager.query("SELECT id, name FROM roles WHERE name = 'CLIENTE' OR name = 'USER' LIMIT 1");
    console.log('[AuthService] Búsqueda de rol CLIENTE:', rolesResult);
    
    const roleId = rolesResult?.length ? rolesResult[0].id : 2; // Fallback al ID 2 si por alguna razón falla la query

    console.log('[AuthService] Creando usuario con roleId:', roleId);

    // Crear el usuario incluyendo el roleId
    const user = await this.usersService.create({
      ...data,
      roleId: roleId,
    });

    console.log('[AuthService] Usuario creado con ID:', user.id, 'Verificando roles asignados:', user.userRoles);

    const payload = await this.buildJwtPayload({ id: user.id, email: user.email });
    const gymName = this.extractGymName(user.userRoles, payload.gymId);
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id:        user.id,
        email:     user.email,
        role:      payload.role,
        gymId:     payload.gymId,
        gymName,
        firstName: user.profile?.firstName ?? null,
        lastName:  user.profile?.lastName ?? null,
        profile:   user.profile,
      },
    };
  }

  async login(data: { email: string; password: string }) {
    const user = await this.usersService.findByEmail(data.email);
    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Credenciales inválidas');
    if (!user.isActive) throw new UnauthorizedException('Cuenta desactivada');

    const payload = await this.buildJwtPayload({ id: user.id, email: user.email });
    const gymName = this.extractGymName(user.userRoles, payload.gymId);
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id:        user.id,
        email:     user.email,
        role:      payload.role,
        gymId:     payload.gymId,
        gymName,
        firstName: user.profile?.firstName ?? null,
        lastName:  user.profile?.lastName ?? null,
        profile:   user.profile,
      },
    };
  }

  verifyToken(token: string): { sub: number; role: string | null; gymId: number | null } | null {
    try {
      return this.jwtService.verify<{ sub: number; role: string | null; gymId: number | null }>(token);
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
      const otpCode     = String(Math.floor(100000 + Math.random() * 900000));
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
        throw new InternalServerErrorException('Fallo interno del servidor SMTP.');
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
      throw new BadRequestException('El código OTP ha expirado. Solicita uno nuevo.');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.userRepo.update(user.id, {
      passwordHash,
      otpCode:      null,
      otpExpiresAt: null,
    });

    return { success: true, message: 'Contraseña actualizada correctamente.' };
  }
}
