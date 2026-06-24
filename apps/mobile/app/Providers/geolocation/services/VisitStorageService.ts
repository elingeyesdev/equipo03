import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'gymsync.gym_visits';
const ACTIVE_VISIT_KEY = 'gymsync.active_visit';

export interface GymVisitRecord {
  id: string;
  gymId: number;
  gymName: string;
  gymAddress: string;
  enteredAt: string;
  exitedAt?: string;
  durationMin?: number;
}

const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const VisitStorageService = {
  getAll: async (): Promise<GymVisitRecord[]> => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      console.warn('[VisitStorage] Datos de visitas corruptos en AsyncStorage — se reinicia el registro.');
      await AsyncStorage.removeItem(STORAGE_KEY);
      return [];
    }
  },

  saveVisit: async (visit: GymVisitRecord): Promise<void> => {
    const all = await VisitStorageService.getAll();
    const idx = all.findIndex((v) => v.id === visit.id);
    if (idx >= 0) {
      all[idx] = visit;
    } else {
      all.unshift(visit);
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  },

  startVisit: async (gym: { gymId: number; gymName: string; gymAddress: string }): Promise<GymVisitRecord> => {
    const visit: GymVisitRecord = {
      id: genId(),
      gymId: gym.gymId,
      gymName: gym.gymName,
      gymAddress: gym.gymAddress,
      enteredAt: new Date().toISOString(),
    };
    await VisitStorageService.saveVisit(visit);
    await AsyncStorage.setItem(ACTIVE_VISIT_KEY, JSON.stringify(visit));
    return visit;
  },

  endVisit: async (): Promise<GymVisitRecord | null> => {
    const raw = await AsyncStorage.getItem(ACTIVE_VISIT_KEY);
    if (!raw) return null;
    let active: GymVisitRecord;
    try {
      active = JSON.parse(raw);
    } catch {
      console.warn('[VisitStorage] Visita activa corrupta en AsyncStorage — se descarta.');
      await AsyncStorage.removeItem(ACTIVE_VISIT_KEY);
      return null;
    }
    const exitedAt = new Date().toISOString();
    const durationMin = Math.round(
      (new Date(exitedAt).getTime() - new Date(active.enteredAt).getTime()) / 60000
    );
    const completed: GymVisitRecord = { ...active, exitedAt, durationMin };
    await VisitStorageService.saveVisit(completed);
    await AsyncStorage.removeItem(ACTIVE_VISIT_KEY);
    return completed;
  },

  getActiveVisit: async (): Promise<GymVisitRecord | null> => {
    const raw = await AsyncStorage.getItem(ACTIVE_VISIT_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      console.warn('[VisitStorage] Visita activa corrupta en AsyncStorage — se descarta.');
      await AsyncStorage.removeItem(ACTIVE_VISIT_KEY);
      return null;
    }
  },

  clearAll: async (): Promise<void> => {
    await AsyncStorage.multiRemove([STORAGE_KEY, ACTIVE_VISIT_KEY]);
  },

  discardActiveVisit: async (): Promise<void> => {
    const raw = await AsyncStorage.getItem(ACTIVE_VISIT_KEY);
    if (!raw) return;
    await AsyncStorage.removeItem(ACTIVE_VISIT_KEY);
    try {
      const active: GymVisitRecord = JSON.parse(raw);
      const all = await VisitStorageService.getAll();
      const cleaned = all.filter(v => v.id !== active.id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    } catch {}
  },

  purgeByGymIds: async (validGymIds: Set<number>): Promise<void> => {
    const all = await VisitStorageService.getAll();
    const cleaned = all.filter(v => validGymIds.has(v.gymId));
    if (cleaned.length < all.length) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    }
    const active = await VisitStorageService.getActiveVisit();
    if (active && !validGymIds.has(active.gymId)) {
      await AsyncStorage.removeItem(ACTIVE_VISIT_KEY);
    }
  },
};
