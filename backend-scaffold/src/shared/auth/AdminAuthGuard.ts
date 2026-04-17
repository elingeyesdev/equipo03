import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminRole } from './AdminRole.enum';

/**
 * AdminAuthGuard (Ejemplo Teórico para Módulo 4)
 * 
 * Verifica que el JWT contenga el claim de que el solicitante es un Admin,
 * independiente y separado del MobileClientGuard de GymSync App.
 */
@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rolesRequeridos = this.reflector.get<AdminRole[]>('roles', context.getHandler());
    
    // Aquí iría la lógica de NestJS para parsear Request y el JWT token
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Token no provisto o inválido');
    }

    if (!user.isAdmin) {
      throw new UnauthorizedException('Acceso denegado: Se requiere perfil administrativo');
    }

    if (!rolesRequeridos) {
      return true; // Solo requiere ser admin, sin rol específico
    }

    const tienePermiso = rolesRequeridos.some((role) => user.role === role);
    if (!tienePermiso) {
      throw new UnauthorizedException('No tienes el nivel jerárquico para esta operación');
    }

    return true;
  }
}
