import { ForbiddenException } from '@nestjs/common';
import { Request } from 'express';

export type RequestUser = {
  userId: string | number;
  email: string;
  role?: string | null;
  gymId?: number | null;
  brandId?: number | null;
};

export type RequestWithUser = Request & { user?: RequestUser };

/** Cuando el rol es GERENTE o RECEPCIONISTA devuelve su gymId (o brandId para gerente); otros → null (sin filtro). */
export function getManagerGymId(req: RequestWithUser): number | null {
  const user = req.user;
  if (!user) return null;
  if (user.role !== 'GERENTE' && user.role !== 'RECEPCIONISTA') return null;
  if (user.gymId !== null && user.gymId !== undefined)
    return Number(user.gymId);
  if (user.brandId !== null && user.brandId !== undefined)
    return Number(user.brandId);
  throw new ForbiddenException('El usuario no tiene un gimnasio asignado');
}

/**
 * Para cualquier rol de staff con sede asignada (GERENTE, INSTRUCTOR, ENTRENADOR,
 * NUTRICIONISTA, PERSONAL_DE_LIMPIEZA) devuelve su gymId.
 * CLIENTE y SUPER_ADMIN → null (sin filtro por marca).
 */
const BRAND_SCOPED_ROLES = new Set([
  'GERENTE',
  'RECEPCIONISTA',
  'INSTRUCTOR',
  'ENTRENADOR',
  'NUTRICIONISTA',
  'PERSONAL_DE_LIMPIEZA',
]);

export function getStaffGymId(req: RequestWithUser): number | null {
  const user = req.user;
  if (!user || !user.role) return null;
  if (!BRAND_SCOPED_ROLES.has(user.role)) return null;
  if (user.gymId !== null && user.gymId !== undefined)
    return Number(user.gymId);
  if (user.brandId !== null && user.brandId !== undefined)
    return Number(user.brandId);
  return null;
}

export function ensureManagerMatchesResourceGym(
  managerGymId: number | null,
  resourceGymId: number | null | undefined,
): void {
  if (managerGymId === null) return;
  if (resourceGymId === null || resourceGymId === undefined) {
    throw new ForbiddenException(
      'No tiene permisos para acceder a este recurso',
    );
  }
  if (Number(resourceGymId) !== managerGymId) {
    throw new ForbiddenException(
      'No tiene permisos para acceder a otra sucursal',
    );
  }
}
