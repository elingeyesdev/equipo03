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

function resolveSessionMessage(error: any): { title: string; body: string } {
  const serverMsg = error?.response?.data?.message;
  if (typeof serverMsg === 'string' && serverMsg.trim()) {
    // El backend envió un mensaje específico (ej. "Esta cuenta ya no está disponible.")
    return { title: 'Acceso denegado', body: serverMsg };
  }
  return { title: 'Sesión expirada', body: 'Tu sesión ha expirado. Inicia sesión nuevamente.' };
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
        const { title, body } = resolveSessionMessage(error);
        Alert.alert(
          title,
          body,
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
