import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Loader2, Trash2, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../infrastructure/api.config';

type Machine = {
  id: string;
  name: string;
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE';
  category?: string;
  imageUrl?: string | null;
  gymId: number;
  gym?: { id: number; name: string };
};

type GymOption = { id: number; name: string };

type Props = {
  machine: Machine | null;
  onClose: () => void;
  onSuccess: () => void;
};

const STATUSES: { value: string; label: string }[] = [
  { value: 'AVAILABLE', label: 'Disponible' },
  { value: 'IN_USE', label: 'En Uso' },
  { value: 'MAINTENANCE', label: 'Mantenimiento' },
];

const CATEGORIES: { value: string; label: string }[] = [
  { value: 'CARDIO', label: 'Cardio' },
  { value: 'TREN_SUPERIOR', label: 'Tren Superior' },
  { value: 'TREN_INFERIOR', label: 'Tren Inferior' },
  { value: 'ESPALDA', label: 'Espalda' },
  { value: 'MULTIESTACION', label: 'Multiestación' },
];

export const MachineFormModal: React.FC<Props> = ({ machine, onClose, onSuccess }) => {
  const { user } = useAuth();
  const isNew = !machine;
  const canEdit = (user?.level ?? 0) >= 4;

  const [form, setForm] = useState({
    name: machine?.name ?? '',
    status: machine?.status ?? 'AVAILABLE',
    category: machine?.category ?? 'MULTIESTACION',
    gymId: machine?.gymId ? String(machine.gymId) : '',
  });
  const [gyms, setGyms] = useState<GymOption[]>([]);
  const [currentImageUrl, setCurrentImageUrl] = useState(machine?.imageUrl ?? undefined);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [imageChanged, setImageChanged] = useState(false);

  const initialFormRef = useRef({
    name: machine?.name ?? '',
    status: machine?.status ?? 'AVAILABLE',
    category: machine?.category ?? 'MULTIESTACION',
    gymId: machine?.gymId ? String(machine.gymId) : '',
  });

  const isDirty = imageChanged || Object.keys(initialFormRef.current).some(
    k => form[k as keyof typeof form] !== initialFormRef.current[k as keyof typeof form]
  );

  useEffect(() => {
    apiClient.get('/gyms').then((res: any) => {
      const raw: any[] = Array.isArray(res.data) ? res.data : [];
      const branches = raw.filter((g: any) => g.parentId || g.parent_id).map((g: any) => ({ id: g.id, name: g.name }));
      setGyms(branches);
      if (isNew && branches.length === 1 && !form.gymId) {
        setForm(prev => ({ ...prev, gymId: String(branches[0].id) }));
      }
    }).catch(() => {});
  }, []);

  const handleClose = () => {
    if (isDirty) {
      if (!window.confirm('Tienes cambios sin guardar. ¿Deseas salir?')) return;
    }
    onClose();
  };

  const updateField = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('El nombre de la máquina es obligatorio.');
      return;
    }
    if (!form.gymId) {
      toast.error('Selecciona una sucursal.');
      return;
    }
    setIsSaving(true);
    try {
      const payload = { name: form.name, status: form.status, category: form.category, gymId: Number(form.gymId) };
      if (isNew) {
        await apiClient.post('/machines', payload);
        toast.success('Máquina registrada');
      } else {
        await apiClient.put(`/machines/${machine.id}`, payload);
        toast.success('Máquina actualizada');
      }
      onSuccess();
    } catch {
      toast.error('Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!machine || !canEdit) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const { data } = await apiClient.patch(`/machines/${machine.id}/image`, formData);
      setCurrentImageUrl(data.imageUrl);
      setImageChanged(true);
      toast.success('Imagen subida');
    } catch {
      toast.error('Error al subir imagen');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!machine || !canEdit) return;
    try {
      await apiClient.delete(`/machines/${machine.id}/image`);
      setCurrentImageUrl(undefined);
      setImageChanged(true);
      toast.success('Imagen eliminada');
    } catch {
      toast.error('Error al eliminar imagen');
    }
  };

  const handleDeleteMachine = async () => {
    if (!machine || !canEdit) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/machines/${machine.id}`);
      toast.success('Máquina eliminada');
      onSuccess();
    } catch {
      toast.error('Error al eliminar');
    } finally {
      setIsDeleting(false);
    }
  };

  const inputClass = 'w-full bg-slate-50 dark:bg-[#0d0d0d] text-slate-900 dark:text-white border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-orange transition-colors';
  const labelClass = 'text-slate-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/80 backdrop-blur-sm p-4" onClick={handleClose}>
      <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-gray-700 w-full max-w-lg rounded-xl overflow-hidden max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-gray-700 flex justify-between items-center shrink-0">
          <h2 className="text-slate-900 dark:text-white font-bold">{isNew ? 'Registrar Máquina' : `Editar: ${machine.name}`}</h2>
          <button onClick={handleClose} className="text-slate-400 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors"><X /></button>
        </div>

        <div className="overflow-y-auto p-6 space-y-5">
          {/* Imagen (solo en edición) */}
          {!isNew && (
            <div>
              <p className={labelClass}>Imagen del equipo</p>
              <div className="h-40 w-full bg-slate-100 dark:bg-[#0d0d0d] rounded-lg mb-3 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-gray-800">
                {currentImageUrl ? (
                  <img src={currentImageUrl} alt={machine.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-slate-400 dark:text-gray-600 italic text-sm">Sin imagen</span>
                )}
              </div>
              {canEdit && (
                <div className="flex gap-2">
                  <label className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-100 dark:bg-[#2a2a2a] hover:bg-brand-orange text-slate-600 dark:text-gray-300 hover:text-white border border-slate-200 dark:border-gray-700 hover:border-brand-orange rounded-lg cursor-pointer transition-all text-sm font-medium">
                    {isUploading ? (
                      <><Loader2 size={14} className="animate-spin" /> Subiendo...</>
                    ) : (
                      <><Upload size={14} /> {currentImageUrl ? 'Reemplazar' : 'Subir imagen'}</>
                    )}
                    <input type="file" accept="image/*" className="hidden" disabled={isUploading} onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
                  </label>
                  {currentImageUrl && (
                    <button onClick={handleDeleteImage} className="px-4 py-2.5 bg-slate-100 dark:bg-[#2a2a2a] hover:bg-red-600 text-slate-500 dark:text-gray-400 hover:text-white border border-slate-200 dark:border-gray-700 hover:border-red-500 rounded-lg transition-all text-sm font-medium flex items-center gap-2">
                      <Trash2 size={14} /> Eliminar
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Campos */}
          <div className="space-y-4">
            <div>
              <p className={labelClass}>Nombre de la máquina *</p>
              <input className={inputClass} value={form.name} onChange={(e) => updateField('name', e.target.value)} placeholder="Ej: Cinta de Correr Precor A" />
            </div>

            <div>
              <p className={labelClass}>Estado *</p>
              <select className={inputClass} value={form.status} onChange={(e) => updateField('status', e.target.value)}>
                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            <div>
              <p className={labelClass}>Zona muscular *</p>
              <select className={inputClass} value={form.category} onChange={(e) => updateField('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            <div>
              <p className={labelClass}>Sucursal *</p>
              <select className={inputClass} value={form.gymId} onChange={(e) => updateField('gymId', e.target.value)}>
                <option value="">Seleccionar sucursal...</option>
                {gyms.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-gray-700 flex items-center gap-3 shrink-0">
          {!isNew && canEdit && (
            <>
              {showDeleteConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-red-400 text-xs">¿Eliminar máquina?</span>
                  <button onClick={handleDeleteMachine} disabled={isDeleting} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-colors">
                    {isDeleting ? 'Eliminando...' : 'Confirmar'}
                  </button>
                  <button onClick={() => setShowDeleteConfirm(false)} className="px-3 py-1.5 bg-slate-100 dark:bg-[#2a2a2a] text-slate-500 dark:text-gray-400 rounded-lg text-xs font-medium transition-colors">
                    Cancelar
                  </button>
                </div>
              ) : (
                <button onClick={() => setShowDeleteConfirm(true)} className="px-4 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg text-sm font-medium transition-all flex items-center gap-2">
                  <Trash2 size={14} /> Eliminar máquina
                </button>
              )}
            </>
          )}
          <div className="flex-1" />
          <button onClick={handleClose} className="px-4 py-2.5 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm">
            Cancelar
          </button>
          {canEdit && (
            <button onClick={handleSave} disabled={isSaving} className="px-6 py-2.5 bg-brand-orange hover:brightness-110 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-50">
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {isNew ? 'Registrar' : 'Guardar'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
