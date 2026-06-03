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
    return raw ? JSON.parse(raw) : [];
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
    const active: GymVisitRecord = JSON.parse(raw);
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
    return raw ? JSON.parse(raw) : null;
  },

  clearAll: async (): Promise<void> => {
    await AsyncStorage.multiRemove([STORAGE_KEY, ACTIVE_VISIT_KEY]);
  },
};
