/// <reference types="vite/client" />

declare module 'axios' {
  interface AxiosRequestConfig {
    _skipErrorToast?: boolean;
  }
  interface InternalAxiosRequestConfig {
    _skipErrorToast?: boolean;
  }
}

// Declaraciones para importar archivos de imagen estáticos como módulos
declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  const src: string;
  export default src;
}
