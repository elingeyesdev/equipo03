/**
 * SUPER_ADMIN : ve todas las sucursales de toda la red.
 * Nivel 5 (Gerente): ve todas las sucursales de su Marca.
 *   - gymId apunta a Sucursal (dato antiguo) → se sube al parentId para obtener la Marca.
 *   - gymId apunta a la Marca directamente (dato nuevo) → se usa directamente.
 *   El backend ya filtra /gyms por marca para el Gerente, así que `all`
 *   contiene solo las sucursales de su marca; el frontend filtra adicionalmente
 *   por sedePrincipalId para ser explícito.
 * Otros roles (RECEPCIONISTA, etc.): ve solo su sucursal asignada.
 */
import { useQuery } from '@tanstack/react-query';
import type { WebUser } from '../contexts/AuthContext';
import { gymsApiAdapter } from '../infrastructure/AxiosGymsApi.adapter';
import type { SucursalMapaDTO, IGymRaw } from '@gymsync/core';

export interface MapaSucursalesState {
  sucursales: SucursalMapaDTO[];
  sinGeo: number;
  loading: boolean;
  error: string | null;
  /** Nombre de la marca del gerente; null = SUPER_ADMIN (ve todas). */
  marcaNombre: string | null;
}

function buildSucursalDTO(gym: IGymRaw, sedesMap: Map<number, string>): SucursalMapaDTO | null {
  const lat = gym.location?.latitude;
  const lng = gym.location?.longitude;
  const hasCoords =
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) && !isNaN(lng) &&
    !(lat === 0 && lng === 0);

  if (!hasCoords) return null;

  const sedePrincipalId = gym.parentId ?? gym.parent?.id ?? null;
  const sedePrincipalNombre =
    (sedePrincipalId !== null ? sedesMap.get(sedePrincipalId) : undefined) ??
    gym.parent?.name ??
    'Sin Sede';

  return {
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
    currentOccupancy: gym.currentOccupancy ?? gym.aforoActual ?? 0,
    machineCapacity: gym.infrastructure?.machineCapacity || 0,
    machineStats: gym.machineStats ?? undefined,
    isActive: gym.isActive ?? true,
    isOpen: gym.isOpen ?? true,
    schedules: gym.schedules ?? [],
  };
}

interface MapaQueryResult {
  sucursales: SucursalMapaDTO[];
  sinGeo: number;
  marcaNombre: string | null;
}

async function fetchMapaData(user: WebUser): Promise<MapaQueryResult> {
  const allGyms = await gymsApiAdapter.findAll();

  // Mapa id → nombre de las Marcas (gyms sin parentId)
  const sedesMap = new Map<number, string>();
  allGyms
    .filter(g => !g.parentId)
    .forEach(g => sedesMap.set(g.id, g.name));

  // Construir DTOs solo de las Sucursales (gyms con parentId)
  let sinGeoCount = 0;
  const all: SucursalMapaDTO[] = [];

  for (const gym of allGyms.filter(g => !!g.parentId)) {
    const dto = buildSucursalDTO(gym, sedesMap);
    if (!dto) { sinGeoCount++; continue; }
    all.push(dto);
  }

  // ── SUPER_ADMIN: red completa ──────────────────────────────────────────────
  if (user.role === 'SUPER_ADMIN') {
    return { sucursales: all, sinGeo: sinGeoCount, marcaNombre: null };
  }

  // ── Nivel 5 = Gerente: todas las sucursales de su Marca ───────────────────
  // Detectamos por nivel (no por nombre de rol) para mayor robustez.
  if ((user.level ?? 0) === 5) {
    // 1. Intentar resolver brandId desde user.brandId (JWT lo trae si el backend lo firma)
    let brandId: number | null = user.brandId ?? null;

    // 2. Si no hay brandId, derivarlo desde gymId
    if (brandId === null && user.gymId) {
      const gymId = Number(user.gymId);
      const gym   = allGyms.find(g => g.id === gymId);
      if (gym) {
        const parentId = gym.parentId ?? gym.parent?.id ?? null;
        // parentId !== null → gymId es una sucursal (dato antiguo) → la Marca es el padre
        // parentId === null → gymId ya ES la Marca (dato nuevo, tras el fix del formulario)
        brandId = parentId ?? gym.id;
      }
    }

    const brandName =
      (brandId !== null ? sedesMap.get(brandId) : undefined)
      ?? user.brandName
      ?? null;

    // El backend ya devuelve solo las sucursales de la marca del Gerente;
    // filtramos adicionalmente por sedePrincipalId para ser explícitos.
    const filtered = brandId !== null
      ? all.filter(s => s.sedePrincipalId === brandId)
      : all; // si no se pudo resolver, mostrar todo lo que devolvió el backend

    return { sucursales: filtered, sinGeo: sinGeoCount, marcaNombre: brandName };
  }

  // ── Otros roles (RECEPCIONISTA, etc.): solo su sucursal asignada ──────────
  if (user.gymId) {
    const myGymId = Number(user.gymId);
    const sola = all.filter(s => s.id === myGymId);
    return {
      sucursales: sola,
      sinGeo: sinGeoCount,
      marcaNombre: sola[0]?.sedePrincipalNombre ?? null,
    };
  }

  return { sucursales: all, sinGeo: sinGeoCount, marcaNombre: null };
}

export function useMapaSucursales(user: WebUser | null): MapaSucursalesState {
  const { data, isLoading, error } = useQuery({
    queryKey: ['mapa-sucursales', user?.id, user?.role, user?.level, user?.gymId, user?.brandId],
    queryFn: () => fetchMapaData(user!),
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });

  return {
    sucursales:  data?.sucursales  ?? [],
    sinGeo:      data?.sinGeo      ?? 0,
    marcaNombre: data?.marcaNombre ?? null,
    loading:     isLoading,
    error:       error instanceof Error ? error.message : (error ? 'Error al cargar el mapa.' : null),
  };
}
