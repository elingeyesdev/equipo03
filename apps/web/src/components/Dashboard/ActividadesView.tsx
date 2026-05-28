import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { CSSProperties } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../infrastructure/api.config';
import { ModalOverlay, ConfirmModal } from './Shared/DashboardShared';
import { Eye, Edit, Trash2, Plus, X } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Activity {
  id: number;
  gymId: number;
  name: string;
  description: string;
  defaultDurationMin: number;
  isActive: boolean;
  isFreeAccess: boolean;
  gym?: { id: number; name: string };
}

interface GymOption { id: number; name: string; parentId?: number | null }

interface ActivitySchedule {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

const DAY_LABELS: Record<string, string> = {
  LUN: 'Lunes', MAR: 'Martes', MIE: 'Miércoles',
  JUE: 'Jueves', VIE: 'Viernes', SAB: 'Sábado', DOM: 'Domingo',
};

const HOURS_24   = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES_15 = ['00', '15', '30', '45'];

// Selector de hora en formato 24 h — inmune al locale del navegador
const TimeSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
  const parts = value.split(':');
  const h = parts[0]?.padStart(2, '0') ?? '08';
  const m = parts[1]?.substring(0, 2) ?? '00';

  const selCls = "bg-slate-50 dark:bg-[#1C1C1E] text-slate-900 dark:text-[#E5E5EA] border-0 px-[0.4rem] py-[0.45rem] text-[0.88rem] font-mono font-semibold cursor-pointer outline-none appearance-none text-center";

  return (
    <div className="inline-flex items-center gap-px bg-slate-100 dark:bg-[rgba(255,255,255,0.06)] border border-slate-200 dark:border-[rgba(255,255,255,0.12)] rounded-lg overflow-hidden">
      <select value={h} onChange={e => onChange(`${e.target.value}:${m}`)} className={selCls}>
        {HOURS_24.map(hh => <option key={hh} value={hh}>{hh}</option>)}
      </select>
      <span className="text-slate-400 dark:text-[#8E8E93] font-bold text-[0.9rem] select-none">:</span>
      <select value={m} onChange={e => onChange(`${h}:${e.target.value}`)} className={selCls}>
        {MINUTES_15.map(mm => <option key={mm} value={mm}>{mm}</option>)}
      </select>
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const panelStyle: CSSProperties = { padding: '2rem', color: '#E5E5EA', minHeight: '100vh' };

const tableStyle: CSSProperties = {
  width: '100%', borderCollapse: 'collapse',
};

const thStyle: CSSProperties = {
  padding: '0.85rem 1rem', textAlign: 'left',
};

const tdStyle: CSSProperties = {
  padding: '0.85rem 1rem',
  fontSize: '0.9rem', verticalAlign: 'middle',
};

const badgeActive: CSSProperties = {
  display: 'inline-block', padding: '2px 10px', borderRadius: '99px',
  fontSize: '0.75rem', fontWeight: 600,
  background: 'rgba(52,199,89,0.15)', color: '#34C759',
  border: '1px solid rgba(52,199,89,0.3)',
};

const badgeInactive: CSSProperties = {
  ...badgeActive,
  background: 'rgba(255,59,48,0.15)', color: '#FF3B30',
  border: '1px solid rgba(255,59,48,0.3)',
};

const btnPrimary: CSSProperties = {
  background: '#FF5E00', color: '#fff', border: 'none',
  borderRadius: '8px', padding: '0.5rem 1.2rem',
  cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
};

const btnSecondaryCls = "px-4 py-2 text-slate-600 dark:text-gray-300 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-gray-700 rounded-lg cursor-pointer text-[0.85rem] transition-colors";

const btnDanger: CSSProperties = {
  background: 'rgba(255,59,48,0.15)', color: '#FF3B30',
  border: '1px solid rgba(255,59,48,0.3)', borderRadius: '8px',
  padding: '0.4rem 0.8rem', cursor: 'pointer', fontSize: '0.82rem',
};

const inputCls = "w-full bg-slate-50 dark:bg-[#151521] border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white rounded-lg px-[0.9rem] py-[0.6rem] text-[0.9rem] focus:outline-none focus:ring-2 focus:ring-[#2ecc71] transition-colors box-border";
const labelCls = "block mb-[0.35rem] text-[0.8rem] font-medium text-slate-500 dark:text-gray-500 uppercase tracking-[0.04em]";
const fieldGap: CSSProperties = { marginBottom: '1rem' };

// ─── Activity Detail Modal ────────────────────────────────────────────────────
const ActivityDetailModal = ({
  activity, onClose, onEdit,
}: {
  activity: Activity;
  onClose: () => void;
  onEdit: () => void;
}) => {
  const [schedules,    setSchedules]    = useState<ActivitySchedule[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [instructorMap, setInstructorMap] = useState<Map<number, string>>(new Map());

  useEffect(() => {
    setLoading(true);

    // Carga paralela: horarios + usuarios para mapear nombre del instructor
    Promise.all([
      apiClient.get(`/activities/${activity.id}/schedules`).catch(() => []),
      apiClient.get('/users').catch(() => []),
    ]).then(([schedRes, usersRes]: any[]) => {
      const rawSched: any[] = Array.isArray(schedRes) ? schedRes : (schedRes?.data ?? []);
      setSchedules(rawSched.filter(Boolean));

      const rawUsers: any[] = Array.isArray(usersRes) ? usersRes : (usersRes?.data ?? []);
      const map = new Map<number, string>();
      rawUsers.forEach((u: any) => {
        const first = u?.profile?.firstName ?? u?.userProfiles?.[0]?.firstName ?? '';
        const last  = u?.profile?.lastName  ?? u?.userProfiles?.[0]?.lastName  ?? '';
        const name  = `${first} ${last}`.trim() || u?.email || `#${u?.id}`;
        map.set(Number(u.id), name);
      });
      setInstructorMap(map);
    }).finally(() => setLoading(false));
  }, [activity.id]);

  const field = (label: string, value: React.ReactNode, full = false): React.ReactNode => (
    <div className={`bg-slate-50 dark:bg-black/10 border border-slate-200 dark:border-white/5 rounded-xl p-3 ${full ? 'col-span-2' : 'col-span-1'}`}>
      <div className="text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wide mb-1">{label}</div>
      <div className="text-[0.92rem] font-medium text-slate-900 dark:text-white">{value || <span className="text-slate-400 dark:text-gray-600">—</span>}</div>
    </div>
  );

  return (
    <ModalOverlay onClose={onClose}>
      {/* Wrapper flex-column ocupa todo el modal */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>

        {/* Header fijo */}
        <div className="flex justify-between items-start flex-shrink-0 mb-4">
          <div>
            <div className="text-[0.7rem] font-bold uppercase tracking-[0.08em] mb-[0.2rem]" style={{ color: '#FF5E00' }}>
              🏃 Ficha del Servicio · #{activity.id}
            </div>
            <h2 className="m-0 text-[1.35rem] font-bold text-slate-900 dark:text-white">{activity.name}</h2>
          </div>
          <button onClick={onClose} className="bg-transparent border-0 text-slate-400 dark:text-gray-500 text-[1.3rem] cursor-pointer p-[0.2rem] flex-shrink-0 hover:text-slate-600 dark:hover:text-gray-300 transition-colors">✕</button>
        </div>

        {/* Contenido scrollable */}
        <div style={{ overflowY: 'auto', flex: 1, minHeight: 0, paddingRight: '0.2rem' }}>
          <div className="grid grid-cols-2 gap-[0.6rem] mb-4">
            {field('Gimnasio / Sucursal', activity.gym?.name ?? `Gym #${activity.gymId}`)}
            {field('Duración', activity.defaultDurationMin ? `${activity.defaultDurationMin} min` : 'No definida')}
            {field('Tipo', activity.isFreeAccess
              ? <span style={{ color: '#FF5E00', fontWeight: 700 }}>🔓 Acceso Libre</span>
              : <span style={{ color: '#0A84FF', fontWeight: 700 }}>📅 Con Horarios</span>
            )}
            {field('Estado', activity.isActive
              ? <span style={{ color: '#34C759', fontWeight: 700 }}>● Activa</span>
              : <span style={{ color: '#FF3B30', fontWeight: 700 }}>● Inactiva</span>
            )}
            {field('Descripción', activity.description, true)}
          </div>

          {/* Horarios */}
          {!activity.isFreeAccess && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '1rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#FF5E00', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.6rem' }}>
                📅 Horarios de Clase
              </div>
              {loading ? (
                <p style={{ color: '#8E8E93', fontSize: '0.85rem', textAlign: 'center', padding: '1rem 0' }}>Cargando horarios...</p>
              ) : schedules.length === 0 ? (
                <p style={{ color: '#636366', fontSize: '0.85rem', fontStyle: 'italic', textAlign: 'center', padding: '0.5rem 0' }}>Sin horarios configurados</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {schedules.map(s => (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,94,0,0.06)', border: '1px solid rgba(255,94,0,0.18)', borderRadius: '8px', padding: '0.55rem 0.85rem' }}>
                      <span style={{ color: '#FF5E00', fontWeight: 700, fontSize: '0.78rem', minWidth: '42px' }}>{DAY_LABELS[s.dayOfWeek] ?? s.dayOfWeek}</span>
                      <span style={{ color: '#E5E5EA', fontSize: '0.87rem', flex: 1 }}>
                        {s.startTime.substring(0, 5)} – {s.endTime.substring(0, 5)}
                      </span>
                      {(s as any).maxAttendees && (
                        <span style={{ color: '#8E8E93', fontSize: '0.75rem' }}>👥 {(s as any).maxAttendees}</span>
                      )}
                      {(s as any).instructorId && (
                        <span style={{ color: '#8E8E93', fontSize: '0.75rem', maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          🎓 {instructorMap.get(Number((s as any).instructorId)) ?? (s as any).instructor?.email ?? `#${(s as any).instructorId}`}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer fijo */}
        <div className="flex gap-[0.6rem] mt-4 pt-3 border-t border-slate-200 dark:border-white/5 flex-shrink-0">
          <button onClick={onClose} className={`${btnSecondaryCls} flex-1`}>Cerrar</button>
          <button onClick={onEdit} style={{ ...btnPrimary, flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}><Edit size={14} />Editar Servicio</button>
        </div>
      </div>
    </ModalOverlay>
  );
};

// ─── Form Modal ───────────────────────────────────────────────────────────────
const ActivityFormModal = ({
  initial, gyms, userGymId, onClose, onSaved,
}: {
  initial: Activity | null;
  gyms: GymOption[];
  userGymId: number | null;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const isEdit = !!initial;

  const resolveInitialGymId = () => {
    if (isEdit) return String(initial!.gymId);
    if (userGymId) return String(userGymId);
    if (gyms.length === 1) return String(gyms[0].id);
    return '';
  };

  // ── Campos básicos ──
  const [gymId,       setGymId]       = useState<string>(resolveInitialGymId);
  const [name,        setName]        = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [duration,    setDuration]    = useState(
    initial?.defaultDurationMin ? String(initial.defaultDurationMin) : ''
  );
  const [isFreeAccess, setIsFreeAccess] = useState(initial?.isFreeAccess ?? false);
  const [saving, setSaving] = useState(false);

  // ── Horarios de clase (solo en edición) ──
  const [schedules,        setSchedules]        = useState<ActivitySchedule[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [newDay,           setNewDay]           = useState('LUN');
  const [newStart,         setNewStart]         = useState('08:00');
  const [newEnd,           setNewEnd]           = useState('09:00');
  const [newMaxAttendees,  setNewMaxAttendees]  = useState('20');
  const [newInstructorId,  setNewInstructorId]  = useState('');
  const [instructors,      setInstructors]      = useState<{ id: number; label: string }[]>([]);
  const [addingSchedule,   setAddingSchedule]   = useState(false);

  const needsGymPicker = !userGymId;

  // Cargar horarios del servidor (solo en edición)
  useEffect(() => {
    if (!isEdit || !initial?.id) return;
    setSchedulesLoading(true);
    apiClient.get(`/activities/${initial.id}/schedules`)
      .then((data: any) => {
        const raw = Array.isArray(data) ? data : (data as any)?.data ?? [];
        setSchedules(raw.filter(Boolean));
      })
      .catch(() => {})
      .finally(() => setSchedulesLoading(false));
  }, [isEdit, initial?.id]);

  // Cargar instructores usando los query params del backend (?role=ENTRENADOR / ?role=INSTRUCTOR)
  // Se ejecuta una sola vez al montar el modal (los roles no cambian según el gym seleccionado).
  useEffect(() => {
    const parse = (res: any): any[] => {
      const raw = Array.isArray(res) ? res : (res as any)?.data ?? [];
      return Array.isArray(raw) ? raw : [];
    };

    Promise.all([
      apiClient.get('/users', { params: { role: 'ENTRENADOR' } }).catch(() => []),
      apiClient.get('/users', { params: { role: 'INSTRUCTOR' } }).catch(() => []),
    ]).then(([tRes, iRes]: any[]) => {
      const seen = new Set<number>();
      const list = [...parse(tRes), ...parse(iRes)]
        .filter((u: any) => {
          const uid = Number(u?.id);
          if (!uid || seen.has(uid)) return false;
          seen.add(uid);
          return true; // isActive ya filtrado por el backend
        })
        .map((u: any) => ({
          id: u.id,
          label: u.profile
            ? `${u.profile.firstName ?? ''} ${u.profile.lastName ?? ''}`.trim() || u.email
            : u.email,
        }));
      setInstructors(list);
      if (list.length === 1) setNewInstructorId(String(list[0].id));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Se ejecuta una sola vez al abrir el modal

  const handleAddSchedule = async () => {
    if (!newStart || !newEnd)        { toast.error('Completa los horarios'); return; }
    if (newStart >= newEnd)          { toast.error('El inicio debe ser antes del fin'); return; }
    if (!newInstructorId)            { toast.error('Selecciona un instructor'); return; }
    const maxAtt = parseInt(newMaxAttendees, 10);
    if (!maxAtt || maxAtt < 1)       { toast.error('El aforo mínimo es 1'); return; }

    if (isEdit) {
      // Modo edición: POST inmediato al servidor
      setAddingSchedule(true);
      try {
        const res = await apiClient.post(`/activities/${initial!.id}/schedules`, {
          dayOfWeek:    newDay,
          startTime:    newStart,
          endTime:      newEnd,
          instructorId: Number(newInstructorId),
          maxAttendees: maxAtt,
          isRecurring:  true,
        }) as any;
        const created: ActivitySchedule = res?.data ?? res;
        setSchedules(prev => [...prev, created]);
        toast.success('Horario agregado');
      } catch {
        // interceptor toasts
      } finally {
        setAddingSchedule(false);
      }
    } else {
      // Modo creación: guardar en estado local; se enviarán al crear el servicio
      setSchedules(prev => [...prev, {
        id:           -(Date.now()),   // ID temporal negativo
        dayOfWeek:    newDay,
        startTime:    newStart,
        endTime:      newEnd,
        instructorId: Number(newInstructorId),
        maxAttendees: maxAtt,
      } as any]);
    }
  };

  const handleDeleteSchedule = async (scheduleId: number) => {
    if (isEdit && scheduleId > 0) {
      // Modo edición: DELETE en el servidor
      try {
        await apiClient.delete(`/activities/${initial!.id}/schedules/${scheduleId}`);
        setSchedules(prev => prev.filter(s => s.id !== scheduleId));
        toast.success('Horario eliminado');
      } catch {
        // interceptor toasts
      }
    } else {
      // Modo creación o ID temporal: solo quitar del estado local
      setSchedules(prev => prev.filter(s => s.id !== scheduleId));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) {
      toast.error('Nombre y descripción son obligatorios');
      return;
    }
    const parsedGymId = parseInt(gymId, 10);
    if (!parsedGymId || isNaN(parsedGymId)) {
      toast.error('Selecciona un gimnasio');
      return;
    }
    const parsedDuration = duration.trim() ? parseInt(duration, 10) : 0;

    setSaving(true);
    try {
      if (isEdit) {
        await apiClient.patch(`/activities/${initial!.id}`, {
          gymId: parsedGymId,
          name: name.trim(),
          description: description.trim(),
          defaultDurationMin: parsedDuration,
          isFreeAccess,
        });
        toast.success('Servicio actualizado');
      } else {
        const res = await apiClient.post('/activities', {
          gymId: parsedGymId,
          name: name.trim(),
          description: description.trim(),
          defaultDurationMin: parsedDuration,
          isFreeAccess,
        }) as any;
        // POST de horarios al nuevo servicio (si los hay y no es acceso libre)
        const newActivityId: number | undefined = res?.data?.id ?? res?.id;
        if (newActivityId && schedules.length > 0 && !isFreeAccess) {
          await Promise.allSettled(
            schedules.map(s =>
              apiClient.post(`/activities/${newActivityId}/schedules`, {
                dayOfWeek:    s.dayOfWeek,
                startTime:    s.startTime.substring(0, 5),
                endTime:      s.endTime.substring(0, 5),
                instructorId: Number((s as any).instructorId),
                maxAttendees: Number((s as any).maxAttendees) || 20,
                isRecurring:  true,
              })
            )
          );
        }
        toast.success('Servicio creado');
      }
      onSaved();
      onClose();
    } catch {
      // interceptor toasts
    } finally {
      setSaving(false);
    }
  };

  const selectCls = `${inputCls} appearance-none cursor-pointer pr-10`;

  return (
    <ModalOverlay onClose={onClose}>
      {/* Header fijo */}
      <div className="flex justify-between items-center mb-5 flex-shrink-0">
        <h2 className="m-0 text-[1.2rem] font-bold" style={{ color: '#FF5E00' }}>
          {isEdit ? '✏️ Editar Servicio' : '➕ Nuevo Servicio'}
        </h2>
        <button onClick={onClose} className="bg-transparent border-0 text-slate-400 dark:text-gray-500 cursor-pointer text-[1.3rem] hover:text-slate-600 dark:hover:text-gray-300 transition-colors">✕</button>
      </div>

      {/* Contenido scrollable */}
      <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.2rem' }}>
        <form onSubmit={handleSubmit} id="activity-form" style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {/* Selector de sucursal — SUPER_ADMIN */}
          {needsGymPicker && (
            <div style={fieldGap}>
              <label className={labelCls}>Gimnasio / Sucursal *</label>
              <div className="relative">
                <select className={selectCls} value={gymId} onChange={e => setGymId(e.target.value)}>
                  <option value="">— Selecciona una sucursal —</option>
                  {(() => {
                    const brands = gyms.filter(g => g.parentId == null);
                    const branches = gyms.filter(g => g.parentId != null);
                    if (brands.length === 0 || branches.length === 0) {
                      return gyms.map(g => <option key={g.id} value={g.id}>{g.name}</option>);
                    }
                    return brands.map(brand => {
                      const children = branches.filter(b => b.parentId === brand.id);
                      if (children.length === 0) return null;
                      return (
                        <optgroup key={brand.id} label={brand.name}>
                          {children.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </optgroup>
                      );
                    });
                  })()}
                </select>
                <span className="absolute right-[0.85rem] top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-gray-500 text-[0.75rem]">▼</span>
              </div>
            </div>
          )}

          <div style={fieldGap}>
            <label className={labelCls}>Nombre *</label>
            <input className={inputCls} value={name} onChange={e => setName(e.target.value)}
              placeholder="Ej: Yoga, Spinning, Sauna..." maxLength={100} />
          </div>

          <div style={fieldGap}>
            <label className={labelCls}>Descripción *</label>
            <textarea
              className={inputCls}
              style={{ minHeight: '100px', resize: 'none', lineHeight: '1.55' }}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Breve descripción del servicio..."
              maxLength={500}
            />
          </div>

          {/* ── Toggle Acceso Libre ── */}
          <div
            className={`flex items-center gap-3 rounded-xl px-4 py-3 cursor-pointer select-none transition-all mb-4 border ${isFreeAccess ? 'bg-orange-50 dark:bg-[rgba(255,94,0,0.08)] border-orange-300 dark:border-[rgba(255,94,0,0.35)]' : 'bg-slate-50 dark:bg-black/5 border-slate-200 dark:border-white/5'}`}
            onClick={() => setIsFreeAccess(v => !v)}
          >
            <div style={{ width: '40px', height: '22px', borderRadius: '11px', background: isFreeAccess ? '#FF5E00' : undefined, position: 'relative', flexShrink: 0, transition: 'background 0.2s ease' }}
              className={!isFreeAccess ? 'bg-slate-300 dark:bg-white/15' : ''}>
              <div style={{ position: 'absolute', top: '3px', left: isFreeAccess ? '21px' : '3px', width: '16px', height: '16px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }} />
            </div>
            <div>
              <span className={`font-semibold text-[0.88rem] ${isFreeAccess ? 'text-orange-500' : 'text-slate-700 dark:text-gray-200'}`}>
                Acceso Libre / Open Gym
              </span>
              <span className="block text-slate-400 dark:text-gray-500 text-[0.75rem] mt-[1px]">
                No requiere horarios de clase — los usuarios entran sin reservar bloque específico
              </span>
            </div>
          </div>

          <div style={fieldGap}>
            <label className={labelCls}>
              Duración por defecto (minutos)
              <span className="text-slate-400 dark:text-gray-500 font-normal ml-[0.4rem] text-[0.75rem]">— opcional</span>
            </label>
            <input className={inputCls} type="number" min={0} max={480}
              value={duration} onChange={e => setDuration(e.target.value)}
              placeholder="Ej: 60 · Dejar vacío si no aplica" />
          </div>

          {/* ── Horarios de clase — disponible en creación y edición, solo si NO es acceso libre ── */}
          {!isFreeAccess && (
            <div className="mt-5 pt-5 border-t border-slate-200 dark:border-white/5">
              <div className="flex justify-between items-center mb-[0.4rem]">
                <label className={`${labelCls} !mb-0`}>Horarios de Clase</label>
                <span className="text-slate-400 dark:text-gray-500 text-[0.75rem]">opcional</span>
              </div>
              <p className="text-slate-400 dark:text-gray-500 text-[0.76rem] m-0 mb-[0.85rem] leading-relaxed">
                Define bloques horarios específicos (Zumba, Natación, Sauna…). Los usuarios podrán reservar en estos bloques desde la app.
              </p>

              {/* Lista de horarios existentes */}
              {schedulesLoading ? (
                <p className="text-slate-400 dark:text-gray-500 text-[0.82rem] mb-3">Cargando horarios...</p>
              ) : schedules.length === 0 ? (
                <p className="text-slate-400 dark:text-gray-500 text-[0.82rem] italic mb-3">Sin horarios configurados</p>
              ) : (
                <div className="flex flex-col gap-[0.35rem] mb-[0.85rem]">
                  {schedules.map(s => {
                    const instrLabel = instructors.find(i => i.id === Number((s as any).instructorId))?.label
                      ?? (s as any).instructor?.email;
                    return (
                      <div key={s.id} className="flex items-center gap-[0.6rem] bg-orange-50 dark:bg-[rgba(255,94,0,0.07)] border border-orange-200 dark:border-[rgba(255,94,0,0.2)] rounded-lg px-[0.75rem] py-[0.45rem]">
                        <span className="font-bold text-[0.78rem] min-w-[36px]" style={{ color: '#FF5E00' }}>
                          {DAY_LABELS[s.dayOfWeek] ?? s.dayOfWeek}
                        </span>
                        <span className="text-slate-700 dark:text-gray-200 text-[0.85rem] flex-1">
                          {s.startTime.substring(0, 5)} – {s.endTime.substring(0, 5)}
                          {instrLabel && (
                            <span className="text-slate-400 dark:text-gray-500 ml-2 text-[0.76rem]">
                              · 🎓 {instrLabel}
                            </span>
                          )}
                        </span>
                        <button type="button" onClick={() => handleDeleteSchedule(s.id)}
                          className="bg-red-50 dark:bg-[rgba(255,59,48,0.15)] text-red-500 dark:text-[#FF3B30] border border-red-200 dark:border-[rgba(255,59,48,0.3)] rounded-md px-2 py-[0.15rem] cursor-pointer text-[0.75rem]">
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Fila para agregar nuevo horario */}
              <div className="flex flex-col gap-[0.6rem] bg-slate-50 dark:bg-black/5 border border-dashed border-slate-300 dark:border-white/10 rounded-lg p-3">
                {/* Chips de días */}
                <div>
                  <span className="text-[0.72rem] text-slate-500 dark:text-gray-500 block mb-[0.4rem] uppercase tracking-[0.04em]">Día</span>
                  <div className="flex gap-[0.3rem] flex-wrap">
                    {Object.entries(DAY_LABELS).map(([key]) => (
                      <button key={key} type="button" onClick={() => setNewDay(key)}
                        className={`px-[0.6rem] py-[0.35rem] rounded-full text-[0.72rem] cursor-pointer transition-all ${newDay === key ? 'font-bold border border-orange-400 bg-orange-50 dark:bg-[rgba(255,94,0,0.18)] text-orange-500' : 'font-normal border border-slate-300 dark:border-white/10 bg-white dark:bg-black/30 text-slate-500 dark:text-gray-400'}`}>
                        {key}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Horario */}
                <div className="flex gap-2 items-center flex-wrap">
                  <TimeSelect value={newStart} onChange={setNewStart} />
                  <span className="text-slate-400 dark:text-gray-500 font-semibold">–</span>
                  <TimeSelect value={newEnd} onChange={setNewEnd} />
                </div>

                {/* Instructor + Aforo */}
                <div className="flex gap-2 flex-wrap">
                  {/* Selector instructor */}
                  <div style={{ flex: 2, minWidth: '140px' }}>
                    <span className="text-[0.72rem] text-slate-500 dark:text-gray-500 block mb-[0.3rem] uppercase tracking-[0.04em]">Instructor *</span>
                    <div className="relative">
                      <select
                        value={newInstructorId}
                        onChange={e => setNewInstructorId(e.target.value)}
                        className={`${selectCls} text-[0.83rem]`}
                      >
                        <option value="">— Seleccionar —</option>
                        {instructors.map(i => (
                          <option key={i.id} value={i.id}>{i.label}</option>
                        ))}
                      </select>
                      <span className="absolute right-[0.6rem] top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-gray-500 text-[0.65rem]">▼</span>
                    </div>
                    {instructors.length === 0 && (
                      <span className="text-[0.7rem] text-slate-400 dark:text-gray-600 mt-[0.2rem] block">
                        Sin instructores asignados a esta sede
                      </span>
                    )}
                  </div>

                  {/* Aforo */}
                  <div style={{ flex: 1, minWidth: '80px' }}>
                    <span className="text-[0.72rem] text-slate-500 dark:text-gray-500 block mb-[0.3rem] uppercase tracking-[0.04em]">Aforo *</span>
                    <input
                      type="number" min={1} max={500}
                      value={newMaxAttendees}
                      onChange={e => setNewMaxAttendees(e.target.value)}
                      className={`${inputCls} text-[0.83rem]`}
                      placeholder="20"
                    />
                  </div>
                </div>

                {/* Botón agregar */}
                <div className="flex justify-end">
                  <button type="button" onClick={handleAddSchedule} disabled={addingSchedule}
                    style={{ ...btnPrimary, padding: '0.45rem 0.9rem', fontSize: '0.82rem', opacity: addingSchedule ? 0.6 : 1 }}>
                    {addingSchedule ? '...' : '+ Agregar'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Botones fijos al fondo */}
      <div className="flex gap-3 justify-end mt-5 pt-4 pb-1 border-t border-slate-200 dark:border-white/5 flex-shrink-0">
        <button type="button" className={btnSecondaryCls} onClick={onClose}>Cancelar</button>
        <button type="submit" form="activity-form" style={btnPrimary} disabled={saving}>
          {saving ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Crear Servicio'}
        </button>
      </div>
    </ModalOverlay>
  );
};

// ─── Estilos filtros ──────────────────────────────────────────────────────────
// ── estilos de filtros reemplazados por Tailwind ──────────────────────────────
const filterBarStyle: CSSProperties = {};
const filterSelectStyle: CSSProperties = {};
const filterWrapStyle: CSSProperties = {};
const filterChevron: CSSProperties = {};
const searchInputStyle: CSSProperties = {};

const resetBtnStyle: CSSProperties = {
  background: 'none', color: '#8E8E93',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
  padding: '0.5rem 0.9rem', cursor: 'pointer', fontSize: '0.8rem',
  whiteSpace: 'nowrap',
};

// ─── Select Stellar ───────────────────────────────────────────────────────────
const DarkSelect = ({ value, onChange, children, style }: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  style?: CSSProperties;
}) => (
  <div className="relative inline-flex items-center">
    <select
      className="bg-white dark:bg-[#151521] border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-gray-100 rounded-md py-2 pl-3 pr-8 text-sm cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-[#2ecc71] transition-all"
      style={style}
      value={value}
      onChange={e => onChange(e.target.value)}
    >
      {children}
    </select>
    <span className="absolute right-2.5 pointer-events-none text-slate-400 dark:text-gray-500 text-xs">▼</span>
  </div>
);

// ─── Main View ────────────────────────────────────────────────────────────────
export const ActividadesView = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [gyms, setGyms] = useState<GymOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [formTarget,   setFormTarget]   = useState<Activity | null | 'new'>(null);
  const [deleteTarget, setDeleteTarget] = useState<Activity | null>(null);
  const [detailTarget, setDetailTarget] = useState<Activity | null>(null);

  // ── Filtros ──
  const [search, setSearch] = useState('');
  const [filterGymId, setFilterGymId] = useState('');
  const [sortOrder, setSortOrder] = useState<'az' | 'za' | 'dur_asc' | 'dur_desc'>('az');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  const userGymId = user?.gymId ? Number(user.gymId) : null;
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      // GERENTE: filtra por su gymId en el servidor; SUPER_ADMIN: trae todo
      const params = userGymId ? { gymId: userGymId } : {};
      const data = await apiClient.get<Activity[]>('/activities', { params });
      let raw: Activity[] = Array.isArray(data) ? data : (data as any)?.data ?? [];

      // Segunda capa de seguridad: filtro client-side para GERENTE
      if (userGymId) raw = raw.filter(a => a.gymId === userGymId);

      setActivities(raw);
    } catch {
      // interceptor toasts
    } finally {
      setLoading(false);
    }
  }, [userGymId]);

  const fetchGyms = useCallback(async () => {
    if (!isSuperAdmin) return;
    try {
      const data = await apiClient.get<GymOption[]>('/gyms');
      const raw: any[] = Array.isArray(data) ? data : (data as any)?.data ?? [];
      // Dedup por nombre: si hay 2 gyms con igual nombre (IDs distintos), mostrar solo uno
      const seenNames = new Set<string>();
      const unique = raw
        .map(g => ({ id: g.id, name: g.name, parentId: g.parentId ?? g.parent_id ?? null }))
        .filter(g => { if (seenNames.has(g.name)) return false; seenNames.add(g.name); return true; })
        .sort((a, b) => a.name.localeCompare(b.name));
      setGyms(unique);
    } catch {
      // ignore
    }
  }, [isSuperAdmin]);

  useEffect(() => { fetchActivities(); fetchGyms(); }, [fetchActivities, fetchGyms]);

  // ── Gymns únicos en la lista actual (para GERENTE que no carga /gyms) ──
  const gymOptions = useMemo((): GymOption[] => {
    if (gyms.length) return gyms;
    const seen = new Map<number, string>();
    activities.forEach(a => {
      if (!seen.has(a.gymId)) seen.set(a.gymId, a.gym?.name ?? `Gym #${a.gymId}`);
    });
    return [...seen.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [gyms, activities]);

  // ── Pipeline de filtros ──
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return activities
      .filter(a => {
        if (term && !a.name.toLowerCase().includes(term) && !a.description.toLowerCase().includes(term)) return false;
        if (filterGymId && a.gymId !== Number(filterGymId)) return false;
        if (filterStatus === 'active' && !a.isActive) return false;
        if (filterStatus === 'inactive' && a.isActive) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'az') return a.name.localeCompare(b.name);
        if (sortOrder === 'za') return b.name.localeCompare(a.name);
        if (sortOrder === 'dur_asc') return a.defaultDurationMin - b.defaultDurationMin;
        return b.defaultDurationMin - a.defaultDurationMin;
      });
  }, [activities, search, filterGymId, sortOrder, filterStatus]);

  const hasActiveFilters = search || filterGymId || filterStatus !== 'all' || sortOrder !== 'az';

  const resetFilters = () => {
    setSearch('');
    setFilterGymId('');
    setSortOrder('az');
    setFilterStatus('all');
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiClient.delete(`/activities/${deleteTarget.id}`);
      toast.success('Servicio eliminado');
      setDeleteTarget(null);
      fetchActivities();
    } catch {
      // interceptor toasts
    }
  };

  return (
    <section style={panelStyle}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Catálogo de Servicios</h1>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Gestión de actividades disponibles en el gimnasio</p>
        </div>
        <button style={{ ...btnPrimary, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }} onClick={() => setFormTarget('new')}>
          <Plus size={15} />
          Nuevo Servicio
        </button>
      </div>

      {/* ── Barra de filtros ── */}
      <div className="flex flex-col md:flex-row flex-wrap gap-3 items-center mb-6">
        {/* Búsqueda libre */}
        <input
          className="flex-1 bg-white dark:bg-[#151521] border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-gray-100 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2ecc71] transition-all placeholder:text-slate-400 dark:placeholder:text-gray-500"
          style={{ minWidth: '220px' }}
          placeholder="🔍  Buscar por nombre o descripción..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {/* Sucursal — solo SUPER_ADMIN ve múltiples gyms */}
        {isSuperAdmin && gymOptions.length > 1 && (
          <DarkSelect value={filterGymId} onChange={setFilterGymId}>
            <option value="">Todas las sucursales</option>
            {gymOptions
              .filter((g, i, a) => a.findIndex(t => t.name === g.name) === i)
              .map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
          </DarkSelect>
        )}

        {/* Orden */}
        <DarkSelect value={sortOrder} onChange={v => setSortOrder(v as typeof sortOrder)}>
          <option value="az" >Nombre A → Z</option>
          <option value="za" >Nombre Z → A</option>
          <option value="dur_asc" >Duración ↑</option>
          <option value="dur_desc">Duración ↓</option>
        </DarkSelect>

        {/* Estado */}
        <DarkSelect value={filterStatus} onChange={v => setFilterStatus(v as typeof filterStatus)}>
          <option value="all"     >Todos los estados</option>
          <option value="active"  >Solo Activas</option>
          <option value="inactive">Solo Inactivas</option>
        </DarkSelect>

        {hasActiveFilters && (
          <button style={{ ...resetBtnStyle, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }} onClick={resetFilters}><X size={12} />Limpiar filtros</button>
        )}
      </div>

      {/* Contador */}
      {!loading && (
        <p style={{ color: '#8E8E93', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
          {filtered.length === activities.length
            ? `${activities.length} servicio${activities.length !== 1 ? 's' : ''}`
            : `${filtered.length} de ${activities.length} servicios`}
        </p>
      )}

      {/* Table */}
      {loading ? (
        <p style={{ color: '#8E8E93', textAlign: 'center', padding: '3rem 0' }}>Cargando servicios...</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: '#8E8E93', textAlign: 'center', padding: '3rem 0' }}>
          {activities.length === 0 ? 'No hay servicios registrados aún.' : 'Sin resultados para los filtros aplicados.'}
        </p>
      ) : (
        <div className="bg-white dark:bg-[#1e1e2d] border border-slate-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden mt-4">
        <div className="overflow-x-auto">
          <table style={tableStyle}>
            <thead className="bg-slate-50 dark:bg-[#151521] border-b border-slate-200 dark:border-gray-800 text-slate-500 dark:text-gray-400 text-xs uppercase tracking-wider">
              <tr>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Nombre</th>
                <th style={thStyle}>Descripción</th>
                {isSuperAdmin && <th style={thStyle}>Gimnasio</th>}
                <th style={thStyle}>Tipo</th>
                <th style={thStyle}>Duración</th>
                <th style={thStyle}>Estado</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(act => (
                <tr key={act.id}
                  className="border-b border-slate-100 dark:border-gray-800 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-slate-700 dark:text-gray-300 text-sm"
                >
                  <td style={{ ...tdStyle, color: '#8E8E93', fontFamily: 'monospace' }}>#{act.id}</td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{act.name}</td>
                  <td style={{ ...tdStyle, color: '#AEAEB2', maxWidth: '280px' }}>
                    <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {act.description}
                    </span>
                  </td>
                  {isSuperAdmin && (
                    <td style={{ ...tdStyle, color: '#AEAEB2' }}>
                      {act.gym?.name ?? `Gym #${act.gymId}`}
                    </td>
                  )}
                  <td style={tdStyle}>
                    {act.isFreeAccess
                      ? <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(255,94,0,0.15)', color: '#FF5E00', border: '1px solid rgba(255,94,0,0.3)' }}>🔓 Libre</span>
                      : <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(10,132,255,0.12)', color: '#0A84FF', border: '1px solid rgba(10,132,255,0.25)' }}>📅 Horarios</span>
                    }
                  </td>
                  <td style={{ ...tdStyle, color: '#AEAEB2' }}>
                    {act.defaultDurationMin ? `${act.defaultDurationMin} min` : <span style={{ color: '#636366' }}>—</span>}
                  </td>
                  <td style={tdStyle}>
                    <span style={act.isActive ? badgeActive : badgeInactive}>
                      {act.isActive ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button
                        title="Ver detalle"
                        onClick={() => setDetailTarget(act)}
                        style={{ background: 'rgba(0,217,255,0.1)', color: '#00D9FF', border: '1px solid rgba(0,217,255,0.25)', borderRadius: '8px', padding: '0.4rem 0.65rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                      ><Eye size={15} /></button>
                      <button className={`${btnSecondaryCls} inline-flex items-center gap-1`} onClick={() => setFormTarget(act)}><Edit size={13} />Editar</button>
                      <button style={{ ...btnDanger, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }} onClick={() => setDeleteTarget(act)}><Trash2 size={13} />Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailTarget && (
        <ActivityDetailModal
          activity={detailTarget}
          onClose={() => setDetailTarget(null)}
          onEdit={() => { setFormTarget(detailTarget); setDetailTarget(null); }}
        />
      )}

      {/* Form Modal */}
      {formTarget !== null && (
        <ActivityFormModal
          initial={formTarget === 'new' ? null : formTarget}
          gyms={gyms}
          userGymId={userGymId}
          onClose={() => setFormTarget(null)}
          onSaved={fetchActivities}
        />
      )}

      {/* Confirm Delete */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Eliminar Servicio"
        message={`¿Confirmas eliminar "${deleteTarget?.name}"? Esta acción aplica soft-delete en el servidor.`}
      />
    </section>
  );
};
