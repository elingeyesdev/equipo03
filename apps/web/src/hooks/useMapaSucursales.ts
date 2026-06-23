/**
 *
 * SUPER_ADMIN : ve todas las sucursales de toda la red.
 * GERENTE     : ve solo las sucursales de la marca a la que pertenece su sucursal asignada.
 *               Resolución: user.gymId → parentId del gym → filtra por ese brand.
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

  const sedesMap = new Map<number, string>();
  allGyms
    .filter(g => !g.parentId)
    .forEach(g => sedesMap.set(g.id, g.name));

  let sinGeoCount = 0;
  const all: SucursalMapaDTO[] = [];

  for (const gym of allGyms.filter(g => !!g.parentId)) {
    const dto = buildSucursalDTO(gym, sedesMap);
    if (!dto) { sinGeoCount++; continue; }
    all.push(dto);
  }

  if (user.role === 'SUPER_ADMIN') {
    return { sucursales: all, sinGeo: sinGeoCount, marcaNombre: null };
  }

  if (user.role === 'RECEPCIONISTA' && user.gymId) {
    const receptGymId = Number(user.gymId);
    const sola = all.filter(s => s.id === receptGymId);
    return { sucursales: sola, sinGeo: sinGeoCount, marcaNombre: sola[0]?.sedePrincipalNombre ?? null };
  }

  // GERENTE
  let brandId: number | null = null;
  let brandName: string | null = null;

  if (user.brandId) {
    brandId = user.brandId;
    brandName = sedesMap.get(brandId) ?? null;
  } else if (user.gymId) {
    const managerGymId = Number(user.gymId);
    const managerGym   = allGyms.find(g => g.id === managerGymId);
    brandId  = managerGym?.parentId ?? managerGym?.parent?.id ?? null;
    brandName = brandId !== null ? (sedesMap.get(brandId) ?? null) : null;
  }

  const filtered = brandId !== null
    ? all.filter(s => s.sedePrincipalId === brandId)
    : all;

  return { sucursales: filtered, sinGeo: sinGeoCount, marcaNombre: brandName };
}

export function useMapaSucursales(user: WebUser | null): MapaSucursalesState {
  const { data, isLoading, error } = useQuery({
    queryKey: ['mapa-sucursales', user?.id, user?.role, user?.gymId, user?.brandId],
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
