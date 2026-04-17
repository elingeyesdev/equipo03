/**
 * SedeInfoController — Estado para el modal de información de sede.
 */

import { create } from 'zustand';
import { Sede } from '@gymsync/core';
import { Distancia } from '@gymsync/core';

interface SedeInfoState {
  sede: Sede | null;
  distancia: Distancia | null;
  visible: boolean;

  mostrar: (sede: Sede, distancia: Distancia) => void;
  ocultar: () => void;
}

export const useSedeInfoStore = create<SedeInfoState>((set) => ({
  sede: null,
  distancia: null,
  visible: false,

  mostrar: (sede, distancia) => set({ sede, distancia, visible: true }),
  ocultar: () => set({ sede: null, distancia: null, visible: false }),
}));
