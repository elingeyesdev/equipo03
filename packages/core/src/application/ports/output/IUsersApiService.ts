import type { UserRole } from '../input/ConsultarHistorialAccesos.use-case';

/**
 * Puerto de salida para el repositorio/API de usuarios.
 * Cada plataforma (web, mobile) provee su implementación concreta.
 */
export interface IUsersApiService {
  /**
   * Obtiene todos los usuarios desde la API.
   * El filtrado de scope es responsabilidad del caso de uso, no del adaptador.
   */
  findAll(): Promise<IUserRecord[]>;
}

export interface IUserRoleRecord {
  roleId: number;
  gymId:  number | null;
  gym?:   { id: number; name: string } | null;
}

export interface IUserRecord {
  id:        number;
  email:     string;
  isActive:  boolean;
  createdAt: string;
  profile?:  { firstName?: string; lastName?: string; phone?: string } | null;
  userRoles?: IUserRoleRecord[];
}

export const IUsersApiService = Symbol('IUsersApiService');
