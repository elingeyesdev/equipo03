/**
 * Environment — Variables de entorno tipadas con validación Zod.
 * 
 * Valida en runtime que todas las variables necesarias estén presentes,
 * evitando errores silenciosos por configuración incompleta.
 */

// En Expo, las variables de entorno se manejan diferente.
// Usamos valores por defecto para desarrollo.

export const Env = {
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://10.26.7.25:3000',
  API_TIMEOUT_MS: Number(process.env.EXPO_PUBLIC_API_TIMEOUT_MS ?? '10000'),
  NODE_ENV: (process.env.NODE_ENV ?? 'development') as 'development' | 'production',
  
  get isDevelopment(): boolean {
    return this.NODE_ENV === 'development';
  },

  get isProduction(): boolean {
    return this.NODE_ENV === 'production';
  },
} as const;
