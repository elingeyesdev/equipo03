/**
 * useDependencyInjection — Hook para resolver el Composition Root.
 * 
 * Centraliza la resolución de dependencias para que los componentes
 * de presentación no conozcan las implementaciones concretas.
 */

import { useMemo } from 'react';
import { GeolocationModule } from '../../Providers/GeolocationModule.container';

export const useDependencyInjection = () => {
  return useMemo(() => GeolocationModule.provideUseCases(), []);
};
