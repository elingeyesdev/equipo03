import axios from 'axios';
import type { AxiosInstance } from 'axios';
import toast from 'react-hot-toast';

// Limpia el estado local y redirige al login.
// El token ya NO está en localStorage — la cookie HttpOnly la borra el backend.
const forceLogout = async () => {
  try {
    // Pedirle al backend que limpie la cookie HttpOnly
    await axios.post('/api/auth/logout', {}, { withCredentials: true });
  } catch {
    // Si falla (ya expiró, red caída) igual se redirige
  } finally {
    localStorage.removeItem('gymsync_user');
    sessionStorage.clear();
    if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
      window.location.href = '/login';
    }
  }
};

const handleAccessDenied = (message?: string) => {
  toast.error(message || 'Acceso Denegado: No tienes permisos para esta acción.');
};

export const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: '/api',
    timeout: 10000,
    withCredentials: true, // envía la cookie HttpOnly en cada petición automáticamente
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  // ── Request interceptor ──────────────────────────────────────────────────────
  client.interceptors.request.use(
    (config) => {
      if (config.data instanceof FormData) {
        config.headers.set('Content-Type', undefined as any);
      }
      return config;
    },
    (error) => Promise.reject(error),
  );

  // ── Response interceptor ─────────────────────────────────────────────────────
  client.interceptors.response.use(
    (response) => {
      const body = response.data;
      if (body && typeof body === 'object' && 'success' in body) {
        if (body.success === false) {
          const reqUrl = response.config?.url ?? '';
          if (body.statusCode === 403 || body.message?.includes('denegado')) {
            handleAccessDenied(body.message);
          } else if (body.statusCode === 401 && !reqUrl.includes('/auth/login') && !reqUrl.includes('/auth/me')) {
            forceLogout();
          } else {
            toast.error(body.message || 'Error en la operación');
          }
          return Promise.reject(new Error(body.message || 'La API retornó success=false.'));
        }
        if ('data' in body) {
          response.data = body.data;
        }
      }
      return response;
    },
    (error) => {
      const SILENT_ON_ERROR = ['/gyms/brands', '/roles', '/auth/login', '/auth/me'];
      const url = error.config?.url ?? '';
      if (
        error.config?._skipErrorToast ||
        SILENT_ON_ERROR.some((p) => url.includes(p))
      ) {
        return Promise.reject(error);
      }

      console.error('[Web API Error]', error.message);

      if (error.response) {
        const status = error.response.status;
        const body = error.response.data;
        const rawMessage = body?.message || body?.error || error.message;

        let errorMessage =
          typeof rawMessage === 'string' ? rawMessage : 'Error desconocido';
        if (Array.isArray(rawMessage)) {
          errorMessage = '• ' + rawMessage.join('\n• ');
        }

        if (status === 400) {
          console.warn(`[API Error 400]:`, errorMessage);
          toast.error(`Error de validación:\n${errorMessage}`, {
            duration: 6000,
            style: { whiteSpace: 'pre-wrap', textAlign: 'left' },
          });
        } else if (
          status === 500 &&
          typeof rawMessage === 'string' &&
          (rawMessage.toLowerCase().includes('duplicate key') ||
            rawMessage.toLowerCase().includes('unique constraint'))
        ) {
          console.error(`[API Error 500]: Duplicidad en DB ->`, rawMessage);
          toast.error(
            'Error de secuencia en DB. Intente de nuevo o ejecute el script de reseteo.',
            { duration: 8000 },
          );
        } else if (status === 401) {
          forceLogout();
        } else if (status === 403) {
          handleAccessDenied(errorMessage);
        } else if (body?.success === false) {
          toast.error(errorMessage);
        } else {
          toast.error(errorMessage || `Error del servidor (${status})`);
        }
      } else {
        toast.error('Error de red o conexión perdida.');
      }

      return Promise.reject(error);
    },
  );

  return client;
};

export const apiClient = createApiClient();
