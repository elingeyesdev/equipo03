import { useCallback, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { activitiesApi } from '../infrastructure/AxiosActivitiesApi.adapter';
import type { CreateActivitySchedulePayload } from '../infrastructure/activities.types';

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const raw = error.response?.data as { message?: string | string[] } | undefined;
    const m = raw?.message;
    if (Array.isArray(m)) {
      return m.map(String).join('\n• ');
    }
    if (typeof m === 'string' && m.trim()) {
      return m;
    }
    if (error.response?.status === 409) {
      return 'Conflicto al guardar el horario (revisa solape del instructor o horario de la sede).';
    }
    return error.message || 'Error de red o del servidor';
  }
  if (error instanceof Error) return error.message;
  return 'Error desconocido';
}

export function useCreateSchedule() {
  const [submitting, setSubmitting] = useState(false);

  const createSchedule = useCallback(
    async (activityId: number, payload: CreateActivitySchedulePayload, onSuccess?: () => void) => {
      setSubmitting(true);
      try {
        await activitiesApi.createActivitySchedule(activityId, payload);
        toast.success('Horario creado correctamente.');
        onSuccess?.();
      } catch (error: unknown) {
        const msg = getApiErrorMessage(error);
        toast.error(msg);
        throw error;
      } finally {
        setSubmitting(false);
      }
    },
    [],
  );

  return { createSchedule, submitting };
}
