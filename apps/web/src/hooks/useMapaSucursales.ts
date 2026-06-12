/**
 *
 * SUPER_ADMIN : ve todas las sucursales de toda la red.
 * GERENTE     : ve solo las sucursales de la marca a la que pertenece su sucursal asignada.
 *               Resolución: user.gymId → parentId del gym → filtra por ese brand.
 */
import { useState, useEffect } from 'react';
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
    isActive: gym.isActive ?? true,
    isOpen: gym.isOpen ?? true,
    schedules: gym.schedules ?? [],
  };
}

export function useMapaSucursales(user: WebUser | null): MapaSucursalesState {
  const [sucursales, setSucursales] = useState<SucursalMapaDTO[]>([]);
  const [sinGeo, setSinGeo]         = useState(0);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [marcaNombre, setMarcaNombre] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const allGyms = await gymsApiAdapter.findAll();
        if (!mounted) return;

        // Sedes principales (maxCapacity === 0) → mapa id → nombre
        const sedesMap = new Map<number, string>();
        allGyms
          .filter(g => (g.maxCapacity ?? 0) === 0)
          .forEach(g => sedesMap.set(g.id, g.name));

        // Construir todas las sucursales con coordenadas válidas
        let sinGeoCount = 0;
        const all: SucursalMapaDTO[] = [];

        for (const gym of allGyms.filter(g => (g.maxCapacity ?? 0) > 0)) {
          const dto = buildSucursalDTO(gym, sedesMap);
          if (!dto) { sinGeoCount++; continue; }
          all.push(dto);
        }

        if (user.role === 'SUPER_ADMIN') {
          setSucursales(all);
          setSinGeo(sinGeoCount);
          setMarcaNombre(null);
          return;
        }

        // RECEPCIONISTA: ve únicamente su sucursal asignada
        if (user.role === 'RECEPCIONISTA' && user.gymId) {
          const receptGymId = Number(user.gymId);
          const sola = all.filter(s => s.id === receptGymId);
          setSucursales(sola);
          setSinGeo(sinGeoCount);
          setMarcaNombre(sola[0]?.sedePrincipalNombre ?? null);
          return;
        }

        // GERENTE: filtrar por su marca
        let brandId: number | null = null;
        let brandName: string | null = null;

        if (user.brandId) {
          // JWT nuevo: brandId viene directamente (GERENTE asignado a Marca)
          brandId = user.brandId;
          brandName = sedesMap.get(brandId) ?? null;
        } else if (user.gymId) {
          // JWT legado: GERENTE asignado a sucursal → resolver brand via parentId
          const managerGymId = Number(user.gymId);
          const managerGym   = allGyms.find(g => g.id === managerGymId);
          brandId  = managerGym?.parentId ?? managerGym?.parent?.id ?? null;
          brandName = brandId !== null ? (sedesMap.get(brandId) ?? null) : null;
        }

        const filtered = brandId !== null
          ? all.filter(s => s.sedePrincipalId === brandId)
          : all;

        setSucursales(filtered);
        setSinGeo(sinGeoCount);
        setMarcaNombre(brandName);
      } catch (err: unknown) {
        if (mounted) setError((err instanceof Error ? err.message : null) || 'Error al cargar el mapa.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => { mounted = false; };
    // Dependencias granulares intencionales — evita refetch por rerenders del objeto user
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.role, user?.gymId, user?.brandId]);

  return { sucursales, sinGeo, loading, error, marcaNombre };
}
