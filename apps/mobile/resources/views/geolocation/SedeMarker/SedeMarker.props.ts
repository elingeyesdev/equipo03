/**
 * SedeMarker Props — Tipos de props para el marcador de sede.
 */

import { Sede } from '@gymsync/core';
import { Distancia } from '@gymsync/core';

export interface SedeMarkerProps {
  sede: Sede;
  distancia: Distancia;
  onPress: () => void;
}
