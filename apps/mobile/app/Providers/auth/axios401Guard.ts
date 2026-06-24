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

let handling401 = false;

function isSessionError(error: any): boolean {
  const status = error?.response?.status;
  if (status === 401) return true;
  const msg = String(error?.response?.data?.message ?? '').toLowerCase();
  return msg.includes('sesión') && (msg.includes('inválida') || msg.includes('expiró'));
}

export function attach401Guard(client: AxiosInstance): void {
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (isSessionError(error) && !handling401) {
        handling401 = true;
        try {
          await AuthService.logout();
          const { queryClient } = await import('../../../App');
          queryClient.clear();
        } catch {}
        Alert.alert(
          'Sesión expirada',
          'Tu sesión ha expirado. Inicia sesión nuevamente.',
          [{
            text: 'Aceptar',
            onPress: () => {
              handling401 = false;
              authEvents.emitForceLogout();
            },
          }],
          { cancelable: false },
        );
      }
      return Promise.reject(error);
    },
  );
}
