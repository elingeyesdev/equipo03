import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../infrastructure/api.config';
import { ModalOverlay, ConfirmModal, panelStyle } from './Shared/DashboardShared';
import { Eye, Edit, Trash2, Plus, X, Search, Dumbbell } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type ExerciseCatalog = {
  id:              number;
  name:            string;
  muscleGroup?:    string;
  difficultyLevel?: string;
  equipmentRequired?: string;
};

type RoutineExerciseItem = {
  exerciseId:             number;
  orderPosition:          number;
  setsRecommended:        number;
  repsRecommended:        number;
  weightRecommendedKg:    number;
  restSecondsBetweenSets: number;
  notes?:                 string;
  exercise?:              ExerciseCatalog;
};

type TemplateDto = {
  id:              number;
  name:            string;
  difficultyLevel?: string;
  description?:    string;
  isTemplate:      boolean;
  durationWeeks?:  number;
  exercises:       RoutineExerciseItem[];
};

type FormExercise = {
  exerciseId:             number;
  exerciseName:           string;
  setsRecommended:        string;
  repsRecommended:        string;
  weightRecommendedKg:    string;
  restSecondsBetweenSets: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DIFF_META: Record<string, { label: string; color: string; bg: string }> = {
  FACIL:      { label: 'Fácil',      color: '#000', bg: '#00E5A3' },
  INTERMEDIO: { label: 'Intermedio', color: '#000', bg: '#38BDF8' },
  AVANZADO:   { label: 'Avanzado',   color: '#fff', bg: '#FF5E00' },
};

const normDiff = (d?: string) => (d ?? '').toUpperCase().replace(/[^A-Z]/g, '');
const diffMeta = (d?: string) =>
  DIFF_META[normDiff(d)] ?? { label: normDiff(d) || '—', color: '#fff', bg: '#555' };

// ─── Template Form Modal ──────────────────────────────────────────────────────

const TemplateModal = ({
  isOpen, onClose, template, allExercises, onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  template: TemplateDto | null;
  allExercises: ExerciseCatalog[];
  onSave: (data: any) => Promise<void>;
}) => {
  const [name, setName]             = useState('');
  const [difficulty, setDifficulty] = useState('FACIL');
  const [description, setDesc]      = useState('');
  const [durationWeeks, setWeeks]   = useState('');
  const [exercises, setExercises]   = useState<FormExercise[]>([]);
  const [search, setSearch]         = useState('');
  const [showDrop, setShowDrop]     = useState(false);
  const [saving, setSaving]         = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (template) {
      setName(template.name);
      setDifficulty(template.difficultyLevel ?? 'FACIL');
      setDesc(template.description ?? '');
      setWeeks(template.durationWeeks ? String(template.durationWeeks) : '');
      setExercises(
        (template.exercises ?? []).map(e => ({
          exerciseId:             e.exerciseId,
          exerciseName:           e.exercise?.name ?? `Ejercicio #${e.exerciseId}`,
          setsRecommended:        String(e.setsRecommended),
          repsRecommended:        String(e.repsRecommended),
          weightRecommendedKg:    String(e.weightRecommendedKg),
          restSecondsBetweenSets: String(e.restSecondsBetweenSets),
        })),
      );
    } else {
      setName(''); setDifficulty('FACIL'); setDesc(''); setWeeks(''); setExercises([]);
    }
    setSearch(''); setShowDrop(false);
  }, [isOpen, template]);

  const filteredEx = useMemo(() =>
    search.trim().length < 2
      ? []
      : allExercises
          .filter(e =>
            e.name.toLowerCase().includes(search.toLowerCase()) &&
            !exercises.find(ex => ex.exerciseId === e.id),
          )
          .slice(0, 8),
    [search, allExercises, exercises],
  );

  const addExercise = (ex: ExerciseCatalog) => {
    setExercises(prev => [...prev, {
      exerciseId:             ex.id,
      exerciseName:           ex.name,
      setsRecommended:        '3',
      repsRecommended:        '12',
      weightRecommendedKg:    '0',
      restSecondsBetweenSets: '60',
    }]);
    setSearch(''); setShowDrop(false);
  };

  const removeExercise = (i: number) =>
    setExercises(prev => prev.filter((_, idx) => idx !== i));

  const updateEx = (i: number, field: keyof FormExercise, v: string) =>
    setExercises(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: v } : e));

  const handleSave = async () => {
    if (!name.trim()) { toast.error('El nombre es obligatorio.'); return; }
    setSaving(true);
    try {
      await onSave({
        name:            name.trim(),
        difficultyLevel: difficulty,
        description:     description.trim(),
        durationWeeks:   durationWeeks ? parseInt(durationWeeks) : undefined,
        exercises:       exercises.map((e, i) => ({
          exerciseId:             e.exerciseId,
          orderPosition:          i + 1,
          setsRecommended:        parseInt(e.setsRecommended)       || 3,
          repsRecommended:        parseInt(e.repsRecommended)       || 12,
          weightRecommendedKg:    parseFloat(e.weightRecommendedKg) || 0,
          restSecondsBetweenSets: parseInt(e.restSecondsBetweenSets) || 60,
        })),
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const inp = 'w-full bg-slate-100 dark:bg-[#0d0d1a] border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#FF5E00] transition-colors text-sm placeholder:text-slate-400 dark:placeholder:text-gray-600';
  const lbl = 'block text-[10px] font-bold text-slate-400 dark:text-gray-500 mb-1.5 uppercase tracking-widest';

  return (
    <ModalOverlay onClose={onClose} maxWidth="620px">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100 dark:border-gray-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {template ? 'Editar Plantilla' : 'Nueva Plantilla de Rutina'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Visible para todos los entrenadores de la plataforma
          </p>
        </div>
      </div>

      {/* Basic info */}
      <div className="space-y-3">
        <div>
          <label className={lbl}>Nombre</label>
          <input type="text" className={inp} value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ej. Cardio HIIT, Fuerza Básica, Hipertrofia Full Body..." />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Dificultad</label>
            <select className={inp} value={difficulty} onChange={e => setDifficulty(e.target.value)}>
              <option value="FACIL">Fácil</option>
              <option value="INTERMEDIO">Intermedio</option>
              <option value="AVANZADO">Avanzado</option>
            </select>
          </div>
          <div>
            <label className={lbl}>Duración (semanas)</label>
            <input type="number" className={inp} value={durationWeeks}
              onChange={e => setWeeks(e.target.value)} placeholder="Ej. 4" min="1" />
          </div>
        </div>

        <div>
          <label className={lbl}>Descripción</label>
          <textarea className={inp} value={description}
            onChange={e => setDesc(e.target.value)}
            placeholder="Objetivos, indicaciones generales..."
            rows={2}
            style={{ resize: 'none' }} />
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-slate-100 dark:bg-gray-800" />
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest">
          <Dumbbell size={11} className="text-[#FF5E00]" />
          Ejercicios ({exercises.length})
        </div>
        <div className="flex-1 h-px bg-slate-100 dark:bg-gray-800" />
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          className={inp + ' pl-9'}
          value={search}
          onChange={e => { setSearch(e.target.value); setShowDrop(true); }}
          onFocus={() => setShowDrop(true)}
          onBlur={() => setTimeout(() => setShowDrop(false), 150)}
          placeholder="Buscar ejercicio para agregar..."
        />
        {showDrop && search.trim().length >= 2 && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-[#0d0d1a] border border-slate-200 dark:border-gray-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
            {filteredEx.length === 0 ? (
              <div className="px-4 py-3 text-sm text-slate-400 text-center">Sin resultados para "{search}"</div>
            ) : filteredEx.map(ex => (
              <button key={ex.id}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-[#151528] text-slate-800 dark:text-gray-200 flex items-center justify-between gap-3 border-0 bg-transparent cursor-pointer border-b border-slate-50 dark:border-gray-800 last:border-0"
                onMouseDown={() => addExercise(ex)}
              >
                <span className="font-medium">{ex.name}</span>
                {ex.muscleGroup && (
                  <span className="text-xs text-slate-400 bg-slate-100 dark:bg-gray-800 px-2 py-0.5 rounded-full shrink-0">
                    {ex.muscleGroup}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Exercise list */}
      {exercises.length === 0 ? (
        <div className="text-center py-6 text-sm text-slate-400 bg-slate-50 dark:bg-[#0d0d1a] rounded-xl border border-dashed border-slate-200 dark:border-gray-800">
          Escribe al menos 2 caracteres para buscar ejercicios
        </div>
      ) : (
        <div className="space-y-2 max-h-52 overflow-y-auto">
          {exercises.map((ex, i) => (
            <div key={i} className="bg-slate-50 dark:bg-[#0d0d1a] border border-slate-200 dark:border-gray-800 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#FF5E00] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  {ex.exerciseName}
                </span>
                <button
                  className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/30 transition-colors border-0 bg-transparent cursor-pointer"
                  onClick={() => removeExercise(i)}
                >
                  <X size={13} />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {(
                  [
                    { label: 'Series',    field: 'setsRecommended'        },
                    { label: 'Reps',      field: 'repsRecommended'        },
                    { label: 'Peso (kg)', field: 'weightRecommendedKg'    },
                    { label: 'Desc. (s)', field: 'restSecondsBetweenSets' },
                  ] as { label: string; field: keyof FormExercise }[]
                ).map(({ label, field }) => (
                  <div key={field} className="text-center">
                    <label className="text-[10px] text-slate-400 dark:text-gray-600 block mb-1">{label}</label>
                    <input
                      type="number"
                      className="w-full bg-white dark:bg-[#151528] border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-[#FF5E00] font-semibold"
                      value={ex[field] as string}
                      onChange={e => updateEx(i, field, e.target.value)}
                      min="0"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-slate-100 dark:border-gray-800">
        <button
          className="px-5 py-2.5 text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-[#151528] rounded-xl font-medium border border-slate-200 dark:border-gray-700 cursor-pointer bg-transparent transition-colors text-sm"
          onClick={onClose}
        >
          Cancelar
        </button>
        <button
          className="px-6 py-2.5 bg-[#FF5E00] hover:bg-[#e05200] text-white font-semibold rounded-xl border-0 cursor-pointer text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Guardando...' : (template ? 'Actualizar' : 'Crear Plantilla')}
        </button>
      </div>
    </ModalOverlay>
  );
};

// ─── Detail Modal ─────────────────────────────────────────────────────────────

const TemplateDetailModal = ({ template, onClose }: {
  template: TemplateDto | null;
  onClose: () => void;
}) => {
  if (!template) return null;
  const meta = diffMeta(template.difficultyLevel);
  const exCount = template.exercises?.length ?? 0;
  return (
    <ModalOverlay onClose={onClose} maxWidth="560px">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 pb-4 border-b border-slate-100 dark:border-gray-800">
        <div className="flex-1 min-w-0 pr-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate">{template.name}</h2>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: meta.bg, color: meta.color }}>
              {meta.label}
            </span>
            {template.durationWeeks && (
              <span className="text-xs text-slate-500 dark:text-gray-400 bg-slate-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                {template.durationWeeks} semanas
              </span>
            )}
            <span className="text-xs font-semibold text-[#00E5A3] bg-[#00E5A3]/10 px-2 py-0.5 rounded-full">
              Plantilla Global
            </span>
          </div>
        </div>
        <button
          className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-800 hover:text-slate-600 dark:hover:text-white transition-colors border-0 bg-transparent cursor-pointer shrink-0"
          onClick={onClose}
        >
          <X size={15} />
        </button>
      </div>

      {template.description && (
        <p className="text-sm text-slate-500 dark:text-gray-400 mb-4 leading-relaxed">{template.description}</p>
      )}

      {/* Exercise count header */}
      <div className="flex items-center gap-2 mb-3">
        <Dumbbell size={13} className="text-[#FF5E00]" />
        <span className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest">
          {exCount} Ejercicio{exCount !== 1 ? 's' : ''}
        </span>
      </div>

      {exCount === 0 ? (
        <div className="text-center py-8 text-sm text-slate-400 bg-slate-50 dark:bg-[#0d0d1a] rounded-xl border border-dashed border-slate-200 dark:border-gray-800">
          Sin ejercicios registrados en esta plantilla.
        </div>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {template.exercises.map((ex, i) => (
            <div key={i} className="bg-slate-50 dark:bg-[#0d0d1a] border border-slate-100 dark:border-gray-800 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-5 h-5 rounded-full bg-[#FF5E00] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <span className="font-semibold text-sm text-slate-900 dark:text-white">
                  {ex.exercise?.name ?? `Ejercicio #${ex.exerciseId}`}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 mt-1">
                {[
                  { label: 'Series',    value: ex.setsRecommended },
                  { label: 'Reps',      value: ex.repsRecommended },
                  { label: 'Peso',      value: `${ex.weightRecommendedKg} kg` },
                  { label: 'Descanso',  value: `${ex.restSecondsBetweenSets}s` },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center bg-white dark:bg-[#151528] rounded-lg py-1.5 px-1 border border-slate-100 dark:border-gray-700">
                    <div className="text-[10px] text-slate-400 dark:text-gray-500">{label}</div>
                    <div className="text-sm font-bold text-slate-800 dark:text-white mt-0.5">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end mt-5 pt-4 border-t border-slate-100 dark:border-gray-800">
        <button
          className="px-5 py-2 text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-[#151528] rounded-xl text-sm font-medium border border-slate-200 dark:border-gray-700 bg-transparent cursor-pointer transition-colors"
          onClick={onClose}
        >
          Cerrar
        </button>
      </div>
    </ModalOverlay>
  );
};

// ─── Main View ────────────────────────────────────────────────────────────────

export const RutinasView = () => {
  const { user } = useAuth();
  const [templates, setTemplates]       = useState<TemplateDto[]>([]);
  const [allExercises, setAllExercises] = useState<ExerciseCatalog[]>([]);
  const [loading, setLoading]           = useState(true);

  const [isModalOpen, setIsModalOpen]       = useState(false);
  const [templateToEdit, setTemplateToEdit] = useState<TemplateDto | null>(null);
  const [viewingTemplate, setViewingTemplate] = useState<TemplateDto | null>(null);
  const [deleteTarget, setDeleteTarget]     = useState<TemplateDto | null>(null);

  const canWrite = user?.role === 'SUPER_ADMIN' || user?.role === 'GERENTE';

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const [routinesRes, exercisesRes] = await Promise.all([
          apiClient.get('/routines', { params: { isTemplate: 'true' } }),
          apiClient.get('/exercises'),
        ]);
        if (mounted) {
          setTemplates(Array.isArray(routinesRes.data) ? routinesRes.data : []);
          setAllExercises(Array.isArray(exercisesRes.data) ? exercisesRes.data : []);
        }
      } catch {
        // Handled by api.config.ts
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleSave = async (formData: any) => {
    if (templateToEdit) {
      await apiClient.put(`/routines/${templateToEdit.id}`, {
        name:            formData.name,
        description:     formData.description,
        difficultyLevel: formData.difficultyLevel,
        durationWeeks:   formData.durationWeeks,
        exercises:       formData.exercises,
      });
      const refreshRes = await apiClient.get('/routines', { params: { isTemplate: 'true' } });
      setTemplates(Array.isArray(refreshRes.data) ? refreshRes.data : []);
      toast.success('Plantilla actualizada.');
    } else {
      const res = await apiClient.post('/routines', {
        ...formData,
        isTemplate: true,
        trainerId:  Number(user?.id),
      });
      const created: TemplateDto = res.data?.data ?? res.data;
      const withExercises: TemplateDto = {
        ...created,
        isTemplate: true,
        exercises: formData.exercises.map((e: any) => ({
          ...e,
          exercise: allExercises.find(ex => ex.id === e.exerciseId),
        })),
      };
      setTemplates(prev => [...prev, withExercises]);
      toast.success('Plantilla creada.');
    }
    setIsModalOpen(false);
    setTemplateToEdit(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiClient.delete(`/routines/${deleteTarget.id}`);
      setTemplates(prev => prev.filter(r => r.id !== deleteTarget.id));
      toast.success('Plantilla eliminada.');
    } catch {
      // Handled by api.config.ts
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <section style={panelStyle} className="glass-panel">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Plantillas de Rutinas</h1>
      <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
        Catálogo global de rutinas predefinidas disponibles para los entrenadores.
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
        <span style={{ color: '#8E8E93', fontSize: '0.875rem' }}>
          {loading
            ? 'Cargando plantillas...'
            : `${templates.length} plantilla${templates.length !== 1 ? 's' : ''} disponible${templates.length !== 1 ? 's' : ''}`}
        </span>
        {canWrite && (
          <button
            onClick={() => { setTemplateToEdit(null); setIsModalOpen(true); }}
            className="bg-brand-orange text-white font-semibold px-4 py-2 rounded-lg border-0 cursor-pointer inline-flex items-center gap-1.5 text-sm"
          >
            <Plus size={16} /> Nueva Plantilla
          </button>
        )}
      </div>

      {!loading && (
        <div className="bg-white dark:bg-bg-surface border border-gray-200 dark:border-bg-deep rounded-xl overflow-x-auto mt-4">
          {templates.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-[#151528] flex items-center justify-center mx-auto mb-4">
                <Dumbbell size={28} className="text-slate-300 dark:text-gray-600" />
              </div>
              <p className="text-sm font-semibold text-slate-500 dark:text-gray-400">No hay plantillas creadas aún.</p>
              {canWrite && (
                <p className="text-xs mt-1 text-slate-400 dark:text-gray-600">
                  Usa "+ Nueva Plantilla" para crear la primera.
                </p>
              )}
            </div>
          ) : (
            <table className="w-full text-left border-collapse" style={{ minWidth: '680px' }}>
              <thead className="bg-gray-50 dark:bg-bg-deep border-b border-gray-200 dark:border-bg-deep text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                <tr>
                  <th style={{ padding: '0.85rem 1rem' }}>Nombre</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Dificultad</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Ejercicios</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Duración</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Descripción</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {templates.map(t => {
                  const meta = diffMeta(t.difficultyLevel);
                  return (
                    <tr
                      key={t.id}
                      className="border-b border-slate-100 dark:border-gray-800 hover:bg-slate-50 dark:hover:bg-bg-deep transition-colors text-slate-700 dark:text-gray-300 text-sm"
                    >
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>{t.name}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: 4,
                          fontSize: 11, fontWeight: 700,
                          background: meta.bg, color: meta.color,
                        }}>
                          {meta.label}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span className="inline-flex items-center gap-1 text-xs">
                          <Dumbbell size={11} className="text-[#FF5E00]" />
                          {t.exercises?.length ?? 0}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {t.durationWeeks ? `${t.durationWeeks} sem.` : '—'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', maxWidth: 220 }}>
                        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.description || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button
                            onClick={() => setViewingTemplate(t)}
                            className="bg-brand-celeste text-black px-3 py-1 rounded cursor-pointer text-xs font-semibold inline-flex items-center gap-1"
                          >
                            <Eye size={12} /> Ver
                          </button>
                          {canWrite && (
                            <>
                              <button
                                onClick={() => { setTemplateToEdit(t); setIsModalOpen(true); }}
                                className="bg-brand-celeste text-black px-3 py-1 rounded cursor-pointer text-xs font-semibold inline-flex items-center gap-1"
                              >
                                <Edit size={12} /> Editar
                              </button>
                              <button
                                onClick={() => setDeleteTarget(t)}
                                className="bg-transparent text-gray-500 dark:text-text-muted px-3 py-1 rounded cursor-pointer text-xs font-semibold inline-flex items-center gap-1"
                              >
                                <Trash2 size={12} /> Eliminar
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      <TemplateModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setTemplateToEdit(null); }}
        template={templateToEdit}
        allExercises={allExercises}
        onSave={handleSave}
      />

      <TemplateDetailModal
        template={viewingTemplate}
        onClose={() => setViewingTemplate(null)}
      />

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Eliminar Plantilla"
        message={`¿Eliminar la plantilla "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
      />
    </section>
  );
};
