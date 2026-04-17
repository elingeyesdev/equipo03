/**
 * ReactNativeGeolocationAdapter — Adaptador de geolocalización usando expo-location.
 * 
 * Implementa el puerto IGeolocationService utilizando la API de Expo Location,
 * que es compatible con Expo EAS Build y no requiere linking nativo manual.
 */

import * as Location from 'expo-location';
import { IGeolocationService, GeolocationOptions } from '@gymsync/core';
import { Either, left, right } from '@gymsync/core';
import { UbicacionNoDisponibleError } from '@gymsync/core';
import { Coordenadas } from '@gymsync/core';

export class ReactNativeGeolocationAdapter implements IGeolocationService {
  
  async solicitarPermiso(): Promise<Either<UbicacionNoDisponibleError, boolean>> {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        return left(new UbicacionNoDisponibleError(
          'Permiso de ubicación denegado por el usuario',
          undefined,
          'PERMISO_DENEGADO'
        ));
      }

      return right(true);
    } catch (error) {
      return left(new UbicacionNoDisponibleError(
        'Error al solicitar permiso de ubicación',
        error
      ));
    }
  }

  async obtenerUbicacionActual(
    options: GeolocationOptions = {}
  ): Promise<Either<UbicacionNoDisponibleError, Coordenadas>> {
    try {
      // Verificar si el servicio de ubicación está habilitado
      const isEnabled = await Location.hasServicesEnabledAsync();
      if (!isEnabled) {
        return left(new UbicacionNoDisponibleError(
          'Los servicios de ubicación están desactivados',
          undefined,
          'GPS_DESACTIVADO'
        ));
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: options.enableHighAccuracy 
          ? Location.Accuracy.High 
          : Location.Accuracy.Balanced,
      });

      const coordenadas = Coordenadas.create({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy ?? undefined,
        timestamp: new Date(location.timestamp),
      });

      return right(coordenadas);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido de ubicación';
      return left(new UbicacionNoDisponibleError(message, error, 'TIMEOUT'));
    }
  }

  suscribirseAUbicacion(
    onSuccess: (coordenadas: Coordenadas) => void,
    onError: (error: UbicacionNoDisponibleError) => void,
    options?: { distanceFilter?: number; interval?: number }
  ): () => void {
    let subscription: Location.LocationSubscription | null = null;

    // Iniciar suscripción asíncrona
    Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: options?.distanceFilter ?? 10,
        timeInterval: options?.interval ?? 5000,
      },
      (location) => {
        try {
          const coordenadas = Coordenadas.create({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy ?? undefined,
            timestamp: new Date(location.timestamp),
          });
          onSuccess(coordenadas);
        } catch (err) {
          onError(new UbicacionNoDisponibleError(
            'Error al procesar ubicación',
            err
          ));
        }
      }
    ).then((sub) => {
      subscription = sub;
    }).catch((err) => {
      onError(new UbicacionNoDisponibleError(
        'Error al iniciar seguimiento de ubicación',
        err
      ));
    });

    // Retorna función de limpieza
    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }
}
