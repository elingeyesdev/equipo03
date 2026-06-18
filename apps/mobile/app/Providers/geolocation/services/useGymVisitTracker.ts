import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { getDistance } from 'geolib';
import axios from 'axios';
import { Env } from '../config/environment';
import { VisitStorageService, GymVisitRecord } from './VisitStorageService';
import { visitsApi } from './visits.api';
import { AuthService } from '../../auth/AuthService';

const ENTER_RADIUS_M  = 100;
const EXIT_RADIUS_M   = 200;
const POLL_INTERVAL_S = 30;

interface NearbyGym {
  id: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

const fetchNearbyGyms = async (lat: number, lng: number): Promise<NearbyGym[]> => {
  try {
    const token = await AuthService.getToken();
    const res = await axios.get(`${Env.API_BASE_URL}/api/gyms`, {
      params: { lat, lng, radius: 5 },
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      timeout: 8000,
    });
    const raw: any[] = Array.isArray(res.data?.data) ? res.data.data
      : Array.isArray(res.data) ? res.data : [];
    return raw.map((g: any) => ({
      id: g.id,
      name: g.name ?? `Gimnasio #${g.id}`,
      address: g.location?.address ?? g.address ?? g.direccion ?? '',
      lat: g.location?.latitude  ?? g.latitude  ?? g.lat ?? 0,
      lng: g.location?.longitude ?? g.longitude ?? g.lng ?? 0,
    })).filter((g) => g.lat !== 0 && g.lng !== 0);
  } catch {
    return [];
  }
};

export const useGymVisitTracker = () => {
  const insideGymRef  = useRef<NearbyGym | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    let stopped = false;

    const init = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || stopped) return;

      const check = async () => {
        if (stopped) return;
        try {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          const { latitude, longitude } = pos.coords;
          const gyms = await fetchNearbyGyms(latitude, longitude);

          let closestGym: NearbyGym | null = null;
          let closestDist = Infinity;
          for (const gym of gyms) {
            const dist = getDistance({ latitude, longitude }, { latitude: gym.lat, longitude: gym.lng });
            if (dist < closestDist) { closestDist = dist; closestGym = gym; }
          }

          const currentInside = insideGymRef.current;

          if (closestDist <= ENTER_RADIUS_M && !currentInside) {
            insideGymRef.current = closestGym;
            await VisitStorageService.startVisit({
              gymId:      closestGym!.id,
              gymName:    closestGym!.name,
              gymAddress: closestGym!.address,
            });
            // entered gym

          } else if (currentInside && closestDist > EXIT_RADIUS_M) {
            const completed = await VisitStorageService.endVisit();
            insideGymRef.current = null;
            // exited gym

            if (completed) {
              try {
                await visitsApi.postVisit({
                  gymId:       completed.gymId,
                  enteredAt:   completed.enteredAt,
                  exitedAt:    completed.exitedAt,
                  durationMin: completed.durationMin,
                });
                // synced
              } catch (e) {
                console.warn('[VisitTracker] No se pudo sincronizar visita al backend:', e);
              }
            }
          }
        } catch (e) {
          console.warn('[VisitTracker] Error al obtener posición GPS:', e);
        }
      };

      await check();
      timer = setInterval(check, POLL_INTERVAL_S * 1000);
    };

    init();
    return () => { stopped = true; clearInterval(timer); };
  }, []);
};
