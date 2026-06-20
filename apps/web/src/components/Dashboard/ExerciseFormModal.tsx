import React, { useState } from 'react';
import { X, Upload, Loader2, Trash2, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../infrastructure/api.config';

type Exercise = {
  id: number;
  name: string;
  description?: string;
  muscleGroup?: string;
  category?: string;
  exerciseType?: string;
  difficultyLevel?: string;
  equipmentRequired?: string;
  youtubeVideoId?: string;
  imageUrl?: string;
};

type Props = {
  exercise: Exercise | null;
  onClose: () => void;
  onSuccess: () => void;
};

const MUSCLE_GROUPS = ['Pectorales', 'Dorsales', 'Hombros', 'Bíceps', 'Tríceps', 'Cuádriceps', 'Isquiotibiales', 'Gemelos', 'Core', 'Cardio', 'Funcional', 'HIIT', 'Movilidad'];
const CATEGORIES = ['FUERZA', 'CARDIO', 'FUNCIONAL'];
const DIFFICULTIES = ['BASICO', 'INTERMEDIO', 'AVANZADO'];
const EXERCISE_TYPES = ['STRENGTH', 'CARDIO', 'HIIT', 'FUNCTIONAL', 'MOBILITY'];

export const ExerciseFormModal: React.FC<Props> = ({ exercise, onClose, onSuccess }) => {
  const { user } = useAuth();
  const isNew = !exercise;
  const canEdit = (user?.level ?? 0) >= 10;

  const [form, setForm] = useState({
    name: exercise?.name ?? '',
    description: exercise?.description ?? '',
    muscleGroup: exercise?.muscleGroup ?? 'Pectorales',
    category: exercise?.category ?? 'FUERZA',
    exerciseType: exercise?.exerciseType ?? 'STRENGTH',
    difficultyLevel: exercise?.difficultyLevel ?? 'BASICO',
    equipmentRequired: exercise?.equipmentRequired ?? '',
    youtubeVideoId: exercise?.youtubeVideoId ?? '',
  });
  const [currentImageUrl, setCurrentImageUrl] = useState(exercise?.imageUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const updateField = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!form.name.trim() || !form.muscleGroup || !form.difficultyLevel) {
      toast.error('Nombre, grupo muscular y dificultad son obligatorios.');
      return;
    }
    setIsSaving(true);
    try {
      if (isNew) {
        await apiClient.post('/exercises', form);
        toast.success('Ejercicio creado');
      } else {
        await apiClient.put(`/exercises/${exercise.id}`, form);
        toast.success('Ejercicio actualizado');
      }
      onSuccess();
    } catch {
      toast.error('Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!exercise || !canEdit) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const { data } = await apiClient.patch(`/exercises/${exercise.id}/image`, formData);
      setCurrentImageUrl(data.imageUrl);
      toast.success('Imagen subida');
    } catch {
      toast.error('Error al subir imagen');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!exercise || !canEdit) return;
    try {
      await apiClient.delete(`/exercises/${exercise.id}/image`);
      setCurrentImageUrl(undefined);
      toast.success('Imagen eliminada de Cloudinary');
    } catch {
      toast.error('Error al eliminar imagen');
    }
  };

  const handleDeleteExercise = async () => {
    if (!exercise || !canEdit) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/exercises/${exercise.id}`);
      toast.success('Ejercicio eliminado');
      onSuccess();
    } catch {
      toast.error('Error al eliminar');
    } finally {
      setIsDeleting(false);
    }
  };

  const inputClass = 'w-full bg-[#0d0d0d] text-white border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors';
  const labelClass = 'text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#1a1a1a] border border-gray-700 w-full max-w-2xl rounded-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex justify-between items-center shrink-0">
          <h2 className="text-white font-bold">{isNew ? 'Crear Ejercicio' : `Editar: ${exercise.name}`}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X /></button>
        </div>

        <div className="overflow-y-auto p-6 space-y-5">
          {/* Imagen (solo en edición) */}
          {!isNew && (
            <div>
              <p className={labelClass}>Imagen del equipo</p>
              <div className="h-40 w-full bg-[#0d0d0d] rounded-lg mb-3 flex items-center justify-center overflow-hidden border border-gray-800">
                {currentImageUrl ? (
                  <img src={currentImageUrl} alt={exercise.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-600 italic text-sm">Sin imagen</span>
                )}
              </div>
              {canEdit && (
                <div className="flex gap-2">
                  <label className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#2a2a2a] hover:bg-blue-600 text-gray-300 hover:text-white border border-gray-700 hover:border-blue-500 rounded-lg cursor-pointer transition-all text-sm font-medium">
                    {isUploading ? (
                      <><Loader2 size={14} className="animate-spin" /> Subiendo...</>
                    ) : (
                      <><Upload size={14} /> {currentImageUrl ? 'Reemplazar' : 'Subir imagen'}</>
                    )}
                    <input type="file" accept="image/*" className="hidden" disabled={isUploading} onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
                  </label>
                  {currentImageUrl && (
                    <button onClick={handleDeleteImage} className="px-4 py-2.5 bg-[#2a2a2a] hover:bg-red-600 text-gray-400 hover:text-white border border-gray-700 hover:border-red-500 rounded-lg transition-all text-sm font-medium flex items-center gap-2">
                      <Trash2 size={14} /> Eliminar
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Campos del formulario */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <p className={labelClass}>Nombre *</p>
              <input className={inputClass} value={form.name} onChange={(e) => updateField('name', e.target.value)} placeholder="Ej: Press de Banca Plano" />
            </div>

            <div>
              <p className={labelClass}>Grupo muscular *</p>
              <select className={inputClass} value={form.muscleGroup} onChange={(e) => updateField('muscleGroup', e.target.value)}>
                {MUSCLE_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            <div>
              <p className={labelClass}>Categoría</p>
              <select className={inputClass} value={form.category} onChange={(e) => updateField('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <p className={labelClass}>Tipo de ejercicio</p>
              <select className={inputClass} value={form.exerciseType} onChange={(e) => updateField('exerciseType', e.target.value)}>
                {EXERCISE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <p className={labelClass}>Dificultad *</p>
              <select className={inputClass} value={form.difficultyLevel} onChange={(e) => updateField('difficultyLevel', e.target.value)}>
                {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="md:col-span-2">
              <p className={labelClass}>Equipamiento</p>
              <input className={inputClass} value={form.equipmentRequired} onChange={(e) => updateField('equipmentRequired', e.target.value)} placeholder="Ej: Barra olímpica, banco plano" />
            </div>

            <div className="md:col-span-2">
              <p className={labelClass}>YouTube Video ID</p>
              <input className={inputClass} value={form.youtubeVideoId} onChange={(e) => updateField('youtubeVideoId', e.target.value)} placeholder="Ej: dQw4w9WgXcQ" />
            </div>

            <div className="md:col-span-2">
              <p className={labelClass}>Descripción</p>
              <textarea className={`${inputClass} resize-none h-20`} value={form.description} onChange={(e) => updateField('description', e.target.value)} placeholder="Descripción del ejercicio..." />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 flex items-center gap-3 shrink-0">
          {!isNew && canEdit && (
            <>
              {showDeleteConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-red-400 text-xs">¿Eliminar ejercicio?</span>
                  <button onClick={handleDeleteExercise} disabled={isDeleting} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-colors">
                    {isDeleting ? 'Eliminando...' : 'Confirmar'}
                  </button>
                  <button onClick={() => setShowDeleteConfirm(false)} className="px-3 py-1.5 bg-[#2a2a2a] text-gray-400 rounded-lg text-xs font-medium transition-colors">
                    Cancelar
                  </button>
                </div>
              ) : (
                <button onClick={() => setShowDeleteConfirm(true)} className="px-4 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg text-sm font-medium transition-all flex items-center gap-2">
                  <Trash2 size={14} /> Eliminar ejercicio
                </button>
              )}
            </>
          )}
          <div className="flex-1" />
          <button onClick={onClose} className="px-4 py-2.5 text-gray-400 hover:text-white transition-colors text-sm">
            Cancelar
          </button>
          {canEdit && (
            <button onClick={handleSave} disabled={isSaving} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50">
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {isNew ? 'Crear' : 'Guardar'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
