import { useState, useEffect, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import type { ActivityDayOfWeek, CreateActivitySchedulePayload } from '../../../infrastructure/activities.types';
import { useCreateSchedule } from '../../../hooks/useCreateSchedule';
import type { InstructorOption } from './activities.types';
import { WEEKDAY_OPTIONS } from './activities.types';
import './ActivitiesForms.css';

export type CreateScheduleModalProps = {
  isOpen: boolean;
  activityId: number;
  activityName: string;
  instructors: InstructorOption[];
  onClose: () => void;
  onSuccess?: () => void;
};

function normalizeTime(value: string): string {
  const v = value.trim();
  if (/^\d{1,2}:\d{2}$/.test(v)) {
    const [h, m] = v.split(':');
    const hh = h!.padStart(2, '0');
    const mm = m!.padStart(2, '0');
    return `${hh}:${mm}`;
  }
  return v;
}

export function CreateScheduleModal({
  isOpen,
  activityId,
  activityName,
  instructors,
  onClose,
  onSuccess,
}: CreateScheduleModalProps) {
  const { createSchedule, submitting } = useCreateSchedule();
  const [instructorId, setInstructorId] = useState<string>('');
  const [dayOfWeek, setDayOfWeek] = useState<ActivityDayOfWeek>('LUNES');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [maxAttendees, setMaxAttendees] = useState<string>('20');

  useEffect(() => {
    if (!isOpen) return;
    setInstructorId(instructors[0]?.id != null ? String(instructors[0].id) : '');
    setDayOfWeek('LUNES');
    setStartTime('');
    setEndTime('');
    setMaxAttendees('20');
  }, [isOpen, instructors]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const start = normalizeTime(startTime);
    const end = normalizeTime(endTime);

    if (!start || !end) {
      toast.error('Indica hora de inicio y fin.');
      return;
    }
    if (start >= end) {
      toast.error('La hora de inicio debe ser menor que la hora de fin.');
      return;
    }

    const mid = Number(instructorId);
    if (!instructorId || Number.isNaN(mid) || mid < 1) {
      toast.error('Selecciona un instructor válido.');
      return;
    }

    const cap = Number(maxAttendees);
    if (!Number.isFinite(cap) || cap < 1) {
      toast.error('El aforo debe ser al menos 1.');
      return;
    }

    const payload: CreateActivitySchedulePayload = {
      instructorId: mid,
      dayOfWeek,
      startTime: start,
      endTime: end,
      maxAttendees: cap,
    };

    try {
      await createSchedule(activityId, payload, () => {
        onSuccess?.();
        onClose();
      });
    } catch {
      /* toast ya mostrado en el hook */
    }
  };

  return (
    <div className="modal-overlay activities-modal-overlay" onClick={(ev) => ev.target === ev.currentTarget && !submitting && onClose()}>
      <div className="modal-content glass-panel activities-schedule-modal" role="dialog" aria-labelledby="activities-schedule-title">
        <div className="activities-modal-header">
          <h2 id="activities-schedule-title">Añadir horario</h2>
          <button type="button" className="activities-modal-close" onClick={() => !submitting && onClose()} aria-label="Cerrar">
            ✕
          </button>
        </div>
        <p className="activities-modal-subtitle">{activityName}</p>

        <form onSubmit={handleSubmit} className="activities-schedule-form">
          <label className="activities-field">
            <span>Instructor</span>
            <select
              value={instructorId}
              onChange={(e) => setInstructorId(e.target.value)}
              required
              disabled={submitting || instructors.length === 0}
            >
              {instructors.length === 0 ? (
                <option value="">No hay instructores en esta sede</option>
              ) : (
                instructors.map((i) => (
                  <option key={i.id} value={String(i.id)}>
                    {i.label}
                  </option>
                ))
              )}
            </select>
          </label>

          <label className="activities-field">
            <span>Día</span>
            <select value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value as ActivityDayOfWeek)} disabled={submitting}>
              {WEEKDAY_OPTIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>

          <div className="activities-field-row">
            <label className="activities-field">
              <span>Inicio</span>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required disabled={submitting} />
            </label>
            <label className="activities-field">
              <span>Fin</span>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required disabled={submitting} />
            </label>
          </div>

          <label className="activities-field">
            <span>Aforo máximo</span>
            <input
              type="number"
              min={1}
              step={1}
              value={maxAttendees}
              onChange={(e) => setMaxAttendees(e.target.value)}
              required
              disabled={submitting}
            />
          </label>

          <div className="activities-modal-actions">
            <button type="button" className="btn-cancel" onClick={() => !submitting && onClose()} disabled={submitting}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary activities-submit" disabled={submitting || instructors.length === 0}>
              {submitting ? 'Guardando…' : 'Guardar horario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
