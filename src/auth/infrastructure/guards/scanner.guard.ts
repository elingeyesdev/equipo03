import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class ScannerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();
    const level = user?.level ?? 0;

    if (level >= 10) {
      throw new ForbiddenException(
        'El escaneo QR es una operación física de sucursal, no de auditoría global.',
      );
    }

    if (level >= 4) return true;

    throw new ForbiddenException('Nivel jerárquico insuficiente para escanear.');
  }
}
