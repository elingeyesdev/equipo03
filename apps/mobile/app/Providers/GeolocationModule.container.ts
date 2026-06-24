/**
 * GeolocationModule Container — Composition Root.
 * 
 * ÚNICO lugar donde se instancian las dependencias concretas.
 * Todo el resto del código depende solo de interfaces (puertos).
 * 
 * Para cambiar de mock a real, solo se cambia aquí.
 */

import { 
  ObtenerSedesCercanasUseCase, 
  CalcularRutaUseCase, 
  SuscribirseUbicacionUseCase, 
  FiltrarSedesUseCase 
} from '@gymsync/core';
import { ReactNativeGeolocationAdapter } from './geolocation/adapters/geolocation/ReactNativeGeolocation.adapter';
import { ReactNativeNavigationAdapter } from '../../routes/ReactNativeNavigation.adapter';
// import { MockSedesApiAdapter } from './geolocation/adapters/api/MockSedesApi.adapter';
import { AxiosSedesApiAdapter } from './geolocation/adapters/api/AxiosSedesApi.adapter';
import { AsyncStorageAdapter } from './geolocation/adapters/storage/AsyncStorage.adapter';

/**
 * Para cambiar al backend real, descomenta AxiosSedesApiAdapter
 * y comenta MockSedesApiAdapter.
 */
export const GeolocationModule = {
  provideUseCases: () => {
    // === Adaptadores de Infraestructura ===
    const geolocationAdapter = new ReactNativeGeolocationAdapter();
    
    // MOCK: Usar datos locales de Santa Cruz
    // const sedesApiAdapter = new MockSedesApiAdapter();
    // REAL: Descomentar cuando el backend esté listo
    const sedesApiAdapter = new AxiosSedesApiAdapter();
    
    const storageAdapter = new AsyncStorageAdapter();

    const navigationAdapter = new ReactNativeNavigationAdapter();

    // === Casos de Uso ===
    const obtenerSedesCercanasUseCase = new ObtenerSedesCercanasUseCase(
      geolocationAdapter,
      sedesApiAdapter
    );

    const calcularRutaUseCase = new CalcularRutaUseCase(navigationAdapter);

    const suscribirseUbicacionUseCase = new SuscribirseUbicacionUseCase(
      geolocationAdapter
    );

    const filtrarSedesUseCase = new FiltrarSedesUseCase();

    return {
      obtenerSedesCercanasUseCase,
      calcularRutaUseCase,
      suscribirseUbicacionUseCase,
      filtrarSedesUseCase,
      storageAdapter,
      sedesApiAdapter,
    };
  },
};
