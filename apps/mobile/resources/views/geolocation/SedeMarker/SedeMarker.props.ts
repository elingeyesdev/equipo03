import { Sede } from '@gymsync/core';
import { Distancia } from '@gymsync/core';

export interface SedeMarkerProps {
  sede: Sede;
  distancia: Distancia;
  onPress: () => void;
}
