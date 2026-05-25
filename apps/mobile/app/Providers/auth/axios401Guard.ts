/**
 * axios401Guard — Interceptor global de 401 para cualquier cliente Axios.
 *
 * Uso:
 *   import { attach401Guard } from '../auth/axios401Guard';
 *   attach401Guard(miClienteAxios);
 */
import { Alert } from 'react-native';
import type { AxiosInstance } from 'axios';
import { AuthService } from './AuthService';
import { authEvents } from './authEvents';

let alertShown = false; // evita mostrar la alerta dos veces si hay requests en paralelo

export function attach401Guard(client: AxiosInstance): void {
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error?.response?.status === 401) {
        if (!alertShown) {
          alertShown = true;
          // 1. Limpiar sesión
          await AuthService.logout();
          // 2. Avisar al usuario
          Alert.alert(
            'Sesión expirada',
            'Por favor, inicia sesión nuevamente para continuar.',
            [
              {
                text: 'Aceptar',
                onPress: () => {
                  alertShown = false;
                  // 3. Redirigir al login vía evento global
                  authEvents.emitForceLogout();
                },
              },
            ],
            { cancelable: false },
          );
        }
      }
      return Promise.reject(error);
    },
  );
}
