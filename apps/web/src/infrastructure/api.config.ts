import axios from 'axios';
import type { AxiosInstance } from 'axios';
import toast from 'react-hot-toast';

const forceLogout = () => {
  localStorage.removeItem('gymsync_user');
  localStorage.removeItem('gymsync_token');
  sessionStorage.clear();
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

const handleAccessDenied = (message?: string) => {
  toast.error(message || 'Acceso Denegado: No tienes permisos.');
  if (window.location.pathname !== '/dashboard/resumen' && window.location.pathname.startsWith('/dashboard')) {
    // Redirección elegante al resumen del dashboard en caso de intento de salto de URL
    window.location.href = '/dashboard/resumen?error=access_denied';
  }
};

export const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: '/api', // Redirigido internamente por Vite al puerto 3000
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  // Request interceptor: Inyectar JWT y Scoping
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('gymsync_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // RBAC Scoping Injection invisible
      if (config.method?.toUpperCase() === 'GET') {
        const userStr = localStorage.getItem('gymsync_user');
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            if (user.role === 'GERENTE' && user.gymId) {
              config.params = config.params || {};
              config.params.gym_id = user.gymId;
            }
          } catch (e) {
            console.error('Error al inyectar scope de GERENTE', e);
          }
        }
      }

      console.log(`[Web API] ${config.method?.toUpperCase()} ${config.url}`, config.params || config.data);
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor: Manejo de errores de validación y autenticación
  client.interceptors.response.use(
    (response) => {
      const body = response.data;
      if (body && typeof body === 'object' && 'success' in body) {
        if (body.success === false) {
          if (body.statusCode === 403 || body.message?.includes('denegado')) {
            handleAccessDenied(body.message);
          } else if (body.statusCode === 401) {
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
      console.error('[Web API Error]', error.message);
      
      if (error.response) {
        const status = error.response.status;
        const body = error.response.data;
        const rawMessage = body?.message || body?.error || error.message;
        
        let errorMessage = typeof rawMessage === 'string' ? rawMessage : 'Error desconocido';
        if (Array.isArray(rawMessage)) {
          errorMessage = rawMessage.join('\n• ');
          errorMessage = '• ' + errorMessage;
        }

        if (status === 400) {
          console.warn(`[API Error 400]: Detalle de validación ->\n`, errorMessage);
          toast.error(`Error de validación:\n${errorMessage}`, { duration: 6000, style: { whiteSpace: 'pre-wrap', textAlign: 'left' } });
        } else if (status === 500 && typeof rawMessage === 'string' && (rawMessage.toLowerCase().includes('duplicate key') || rawMessage.toLowerCase().includes('unique constraint'))) {
          console.error(`[API Error 500]: Duplicidad en la Base de Datos ->`, rawMessage);
          toast.error("Error de secuencia en DB. Intente de nuevo o ejecute el script de reseteo.", { duration: 8000 });
        } else if (status === 401) {
          forceLogout();
        } else if (status === 403) {
          handleAccessDenied(errorMessage);
        } else if (body?.success === false) {
          toast.error(errorMessage);
        } else {
          toast.error(`Error del servidor (${status})`);
        }
      } else {
        toast.error('Error de red o conexión perdida.');
      }
      
      return Promise.reject(error);
    }
  );

  return client;
};

export const apiClient = createApiClient();
