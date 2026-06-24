/**
 * Environment — Variables de entorno tipadas con validación Zod.
 * 
 * Valida en runtime que todas las variables necesarias estén presentes,
 * evitando errores silenciosos por configuración incompleta.
 */

// En Expo, las variables de entorno se manejan diferente.
// Usamos valores por defecto para desarrollo.

const getApiBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }

  if (process.env.NODE_ENV === 'test') {
    return 'http://localhost:3000';
  }

  throw new Error(
    'Falta la variable de entorno EXPO_PUBLIC_API_BASE_URL.\n' +
    'Por favor, asegúrate de que el archivo apps/mobile/.env esté configurado correctamente.\n' +
    'Ejecuta "npm run mobile" para regenerarlo automáticamente desde tu .api-host.'
  );
};

export const Env = {
  API_BASE_URL: getApiBaseUrl(),
  API_TIMEOUT_MS: Number(process.env.EXPO_PUBLIC_API_TIMEOUT_MS ?? '10000'),
  NODE_ENV: (process.env.NODE_ENV ?? 'development') as 'development' | 'production',
  
  get isDevelopment(): boolean {
    return this.NODE_ENV === 'development';
  },

  get isProduction(): boolean {
    return this.NODE_ENV === 'production';
  },
} as const;
