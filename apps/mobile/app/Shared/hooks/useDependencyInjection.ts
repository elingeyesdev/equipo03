import { useMemo } from 'react';
import { GeolocationModule } from '../../Providers/GeolocationModule.container';

export const useDependencyInjection = () => {
  return useMemo(() => GeolocationModule.provideUseCases(), []);
};
