/**
 * useAsyncOperation — Hook genérico para operaciones asíncronas.
 * 
 * Encapsula el patrón loading/data/error para cualquier operación
 * asíncrona, evitando duplicación en ViewModels.
 */

import { useState, useCallback } from 'react';

type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

export function useAsyncOperation<T>() {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (operation: () => Promise<T>) => {
    setState({ data: null, loading: true, error: null });
    try {
      const result = await operation();
      setState({ data: result, loading: false, error: null });
      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setState({ data: null, loading: false, error: message });
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}
