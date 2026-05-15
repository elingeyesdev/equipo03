import { useState, useEffect, useCallback } from 'react';
import { createSedesApiClient } from '../../geolocation/adapters/api/sedes.api.config';
import { useAuth } from '../../../Shared/hooks/useAuth';

export interface AuditRecord {
  id: number;
  userId: number;
  userName?: string;
  gymId: number;
  status: 'AUTORIZADO' | 'DENEGADO';
  method: string;
  checkInTime: string;
}

export const useAuditHistory = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<AuditRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    // Solo permitimos buscar si es gerente
    if (user?.role !== 'GERENTE') {
      setError('No tienes permisos para ver el historial.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const client = createSedesApiClient();
      // El backend manejará el scoping por el token JWT
      // Según la auditoría, el endpoint para listar es /api/checkins
      const response = await client.get('/api/checkins');
      
      // La data ya está desempaquetada gracias al interceptor
      setHistory(response.data || []);
    } catch (err: any) {
      console.error('[useAuditHistory] Error:', err);
      setError(err.message || 'Error al obtener el historial de auditoría');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    history,
    isLoading,
    error,
    refetch: fetchHistory,
  };
};
