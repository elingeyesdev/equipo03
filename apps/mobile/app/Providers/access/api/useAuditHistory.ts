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
    if (!user) return;

    const level = (user as any)?.level ?? 0;
    if (level < 4) {
      setError('No tienes permisos para ver el historial.');
      return;
    }

    // Verificar token antes de llamar (evita logs "[Sedes API] undefined")
    const { AuthService } = await import('../../auth/AuthService');
    const token = await AuthService.getToken();
    if (!token) return; // sesión aún no restaurada, silencio total

    setIsLoading(true);
    setError(null);

    try {
      const client = createSedesApiClient();
      const response = await client.get('/api/checkins');
      setHistory(response.data || []);
    } catch (err: any) {
      console.warn('[useAuditHistory] Error:', err?.message);
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
