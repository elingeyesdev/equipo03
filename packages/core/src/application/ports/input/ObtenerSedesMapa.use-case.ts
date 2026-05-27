import type { AutenticacionContext } from './ConsultarHistorialAccesos.use-case';
import { Either, right, left } from '../../../shared/kernel/Either';

// ─── DTOs propios de este caso de uso ────────────────────────────────────────

/** Representa la ubicación geográfica de un gym tal como llega del API. */
export interface IGymLocationRaw {
  address?: string;
  city?: string;
  latitude?: number | null;
  longitude?: number | null;
}

/** Horario de un día tal como llega del endpoint GET /gyms. */
export interface IScheduleRaw {
  id?: number;
  gymId?: number;
  dayOfWeek: string;   // Ej: 'LUNES', 'MARTES' ...
  opensAt: string;     // Ej: '06:00' o '06:00:00'
  closesAt: string;    // Ej: '22:00' o '22:00:00'
  isHoliday: boolean;
}

/** Gym crudo tal como llega del endpoint GET /gyms. */
export interface IGymRaw {
  id: number;
  name: string;
  description?: string;
  maxCapacity?: number;
  isActive?: boolean;
  isOpen?: boolean;
  aforoActual?: number;
  parentId?: number | null;
  parent?: { id: number; name: string } | null;
  location?: IGymLocationRaw | null;
  schedules?: IScheduleRaw[];
}

/**
 * DTO de salida enriquecido para el mapa.
 * Cada sucursal incluye el nombre de su Sede Principal (Marca) ya resuelto.
 */
export interface SucursalMapaDTO {
  id: number;
  nombre: string;
  sedePrincipalNombre: string;
  sedePrincipalId: number | null;
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  maxCapacity: number;
  aforoActual: number;
  isActive: boolean;
  isOpen: boolean;
  schedules: IScheduleRaw[];
}

/** Puerto de salida: contrato que deben implementar los adaptadores de infraestructura. */
export interface IGymsApiService {
  findAll(): Promise<IGymRaw[]>;
}

// ─── Caso de Uso ──────────────────────────────────────────────────────────────

/**
 * ObtenerSedesMapaUseCase — Caso de uso exclusivo para SUPER_ADMIN.
 *
 * Responsabilidades:
 *  1. Verificar que el usuario sea SUPER_ADMIN (acceso total).
 *  2. Obtener todos los registros de la API /gyms.
 *  3. Separar sedes principales (maxCapacity === 0) de sucursales (maxCapacity > 0).
 *  4. Construir el mapa de sedes { id → nombre } para enriquecer cada sucursal.
 *  5. Retornar solo las sucursales con coordenadas válidas más el recuento de las sin geo.
 */
export class ObtenerSedesMapaUseCase {
  constructor(private readonly gymsApiService: IGymsApiService) {}

  async execute(authContext: Pick<AutenticacionContext, 'role'>): Promise<
    Either<Error, { sucursales: SucursalMapaDTO[]; sinGeolocalizacion: number }>
  > {
    // ── Verificación de permisos ──────────────────────────────────────────────
    if (authContext.role !== 'SUPER_ADMIN') {
      return left(
        new Error('ACCESO_DENEGADO: Esta vista es exclusiva para SUPER_ADMIN.')
      );
    }

    // ── Obtención de todos los gyms ───────────────────────────────────────────
    const allGyms = await this.gymsApiService.findAll();

    // ── Separación: sedes principales vs. sucursales ──────────────────────────
    // Convención del proyecto: maxCapacity === 0 → Sede Principal (Marca).
    const sedesPrincipalesMap = new Map<number, string>();
    allGyms
      .filter((g) => (g.maxCapacity ?? 0) === 0)
      .forEach((g) => sedesPrincipalesMap.set(g.id, g.name));

    const sucursales = allGyms.filter((g) => (g.maxCapacity ?? 0) > 0);

    // ── Enriquecimiento y validación de coordenadas ───────────────────────────
    let sinGeolocalizacion = 0;
    const sucursalesMapa: SucursalMapaDTO[] = [];

    for (const gym of sucursales) {
      const lat = gym.location?.latitude;
      const lng = gym.location?.longitude;

      // Coordenada válida: número distinto de 0 y que no sea el valor por defecto del form
      const hasValidCoords =
        typeof lat === 'number' &&
        typeof lng === 'number' &&
        !isNaN(lat) &&
        !isNaN(lng) &&
        !(lat === 0 && lng === 0);

      if (!hasValidCoords) {
        sinGeolocalizacion++;
        continue;
      }

      // Resolución del nombre de la Sede Principal
      const sedePrincipalId = gym.parentId ?? gym.parent?.id ?? null;
      const sedePrincipalNombre =
        (sedePrincipalId !== null ? sedesPrincipalesMap.get(sedePrincipalId) : undefined) ??
        gym.parent?.name ??
        'Sin Sede';

      sucursalesMapa.push({
        id: gym.id,
        nombre: gym.name,
        sedePrincipalNombre,
        sedePrincipalId,
        latitude: lat!,
        longitude: lng!,
        address: gym.location?.address ?? gym.description ?? 'Sin dirección',
        city: gym.location?.city ?? 'Sin ciudad',
        maxCapacity: gym.maxCapacity ?? 0,
        aforoActual: gym.aforoActual ?? 0,
        isActive: gym.isActive ?? true,
        isOpen: gym.isOpen ?? true,
        schedules: gym.schedules ?? [],
      });
    }

    return right({ sucursales: sucursalesMapa, sinGeolocalizacion });
  }
}
