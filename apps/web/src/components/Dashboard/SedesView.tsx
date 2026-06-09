import React, { useState, useEffect, useCallback, useRef, useLayoutEffect, useMemo } from 'react';
import type { CSSProperties } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../infrastructure/api.config';
import { ModalOverlay, ConfirmModal, panelStyle } from './Shared/DashboardShared';
import type { GymDto, GymScheduleDto, UserDto, CheckinDto, ScheduleEntry } from './Shared/DashboardTypes';
import { Edit, Trash2 } from 'lucide-react';

const DESC_MAX = 180;

const MarcaModal = ({ isOpen, onClose, marcaToEdit, onSave, existingGyms = [] }: any) => {
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [errors, setErrors]     = useState<Record<string, string>>({});
  const textareaRef             = React.useRef<HTMLTextAreaElement>(null);

  /* Auto-resize textarea */
  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    if (marcaToEdit) {
      setFormData({ name: marcaToEdit.name || '', description: marcaToEdit.description || '' });
    } else {
      setFormData({ name: '', description: '' });
    }
    setErrors({});
    /* reset altura al abrir */
    requestAnimationFrame(() => autoResize());
  }, [marcaToEdit, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const nameTrimmed = formData.name.trim();

    if (!nameTrimmed) {
      newErrors.name = 'El nombre es obligatorio';
    } else {
      const isDuplicate = (existingGyms as any[]).some(
        s => s.name.trim().toLowerCase() === nameTrimmed.toLowerCase() &&
             s.id !== marcaToEdit?.id
      );
      if (isDuplicate) newErrors.name = 'Esta marca ya existe en tu lista';
    }

    if (formData.description.length > DESC_MAX) {
      newErrors.description = `Máximo ${DESC_MAX} caracteres`;
    }

    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return false; }
    setErrors({});
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    onSave(formData);
  };

  if (!isOpen) return null;

  const descLen     = formData.description.length;
  const descOver    = descLen > DESC_MAX;
  const descNear    = descLen >= DESC_MAX * 0.85;

  const inputCls = (err?: string) =>
    `w-full bg-slate-50 dark:bg-[#151521] border ${err ? 'border-red-500' : 'border-slate-200 dark:border-gray-700'} text-slate-900 dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2ecc71] transition-colors`;
  const labelCls = "text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wide";

  return (
    <ModalOverlay onClose={onClose}>
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
        {marcaToEdit ? 'Editar Marca' : 'Nueva Marca'}
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        {/* Nombre */}
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Nombre de la Marca *</label>
          <input
            type="text"
            className={inputCls(errors.name)}
            value={formData.name}
            onChange={e => { setFormData({ ...formData, name: e.target.value }); setErrors(p => ({ ...p, name: '' })); }}
            placeholder="Ej. Metro Flex"
          />
          {errors.name && <span className="text-red-500 text-xs">{errors.name}</span>}
        </div>

        {/* Descripción con auto-resize */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-baseline">
            <label className={labelCls}>Descripción</label>
            <span className={`text-xs ${descOver ? 'text-red-500' : descNear ? 'text-orange-400' : 'text-slate-400 dark:text-gray-500'}`}>
              {descLen}/{DESC_MAX}
            </span>
          </div>
          <textarea
            ref={textareaRef}
            className={`${inputCls(errors.description || descOver ? 'err' : undefined)} resize-none overflow-hidden`}
            value={formData.description}
            onChange={e => {
              setFormData({ ...formData, description: e.target.value });
              setErrors(p => ({ ...p, description: '' }));
              autoResize();
            }}
            placeholder="Ej. Cadena de gimnasios premium"
            rows={3}
            style={{ minHeight: '80px', lineHeight: '1.55' }}
          />
          {(errors.description || descOver) && (
            <span className="text-red-500 text-xs">
              {errors.description || `Máximo ${DESC_MAX} caracteres`}
            </span>
          )}
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-gray-800">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors font-medium border-0 cursor-pointer bg-transparent">
            Cancelar
          </button>
          <button type="submit"
            className="px-4 py-2 bg-[#00D9FF] hover:bg-[#00c0e0] text-[#0A0A0A] font-bold rounded-lg border-0 cursor-pointer transition-colors">
            {marcaToEdit ? 'Actualizar' : 'Crear'} Marca
          </button>
        </div>
      </form>
    </ModalOverlay>
  );
};

// --- MODAL DE SUCURSAL ---

export const SedesView = () => {
  const { user } = useAuth();
  const [gyms, setGyms] = useState<GymDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sedeToEdit, setSedeToEdit] = useState<GymDto | null>(null);
  const [deleteConfirmSede, setDeleteConfirmSede] = useState<GymDto | null>(null);
  const [infoSede, setInfoSede] = useState<GymDto | null>(null);

  // ── Filtros ──
  const [search,    setSearch]    = useState('');
  const [sortOrder, setSortOrder] = useState<'az' | 'za' | 'id_asc' | 'id_desc'>('az');

  const filteredGyms = useMemo(() => {
    const term = search.trim().toLowerCase();
    return gyms
      .filter(g => !term || g.name.toLowerCase().includes(term))
      .sort((a, b) => {
        if (sortOrder === 'az') return a.name.localeCompare(b.name);
        if (sortOrder === 'za') return b.name.localeCompare(a.name);
        if (sortOrder === 'id_asc')  return a.id - b.id;
        return b.id - a.id;
      });
  }, [gyms, search, sortOrder]);

  useEffect(() => {
    let mounted = true;

    const cargarSedes = async () => {
      try {
        setLoading(true);
        setError(null);
        const gymsResp = await apiClient.get('/gyms/brands');
        let gymsData: GymDto[] = Array.isArray(gymsResp.data) ? gymsResp.data : [];

        // Las marcas no tienen scoping de gerente, solo SUPER_ADMIN las gestiona

        if (mounted) setGyms(gymsData);
      } catch (err: any) {
        if (mounted) setError(err?.response?.data?.message || err?.message || 'No se pudo cargar sedes.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    cargarSedes();
    return () => {
      mounted = false;
    };
  }, []);

  const handleDeleteSede = (sede: GymDto) => {
    setDeleteConfirmSede(sede);
  };

  const confirmDeleteSede = async () => {
    if (!deleteConfirmSede) return;
    try {
      await apiClient.delete(`/gyms/${deleteConfirmSede.id}`);
      setGyms(prev => prev.filter(g => g.id !== deleteConfirmSede.id));
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Error al eliminar marca.');
    } finally {
      setDeleteConfirmSede(null);
    }
  };

  const handleCreateSede = () => {
    setSedeToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditSede = (sede: GymDto) => {
    if (user?.role === 'GERENTE' && user?.gymId && sede.id !== parseInt(user.gymId as string)) {
      console.warn(`[Security Guard]: Bloqueo de acceso a Sede ajena para Gerente ID ${user.id}`);
      alert("Acceso denegado: No tienes permisos para editar una marca que no te pertenece.");
      return;
    }
    setSedeToEdit(sede);
    setIsModalOpen(true);
  };

  const handleSaveSede = async (formData: any) => {
    try {
      let payload: any = {};

      if (sedeToEdit) {
        // PUT: UpdateGymDto — Solo propiedades de identidad mutables, sin location
        payload = {
          name: formData.name,
          description: formData.description || '',
          maxCapacity: 0
        };
      } else {
        // POST: Crear Marca (entidad abstracta) - solo nombre y capacidad 0
        payload = {
          name: formData.name,
          description: formData.description || '',
          maxCapacity: 0
        };
      }

      console.log(`[Security Check]: Ejecutando acción para Rol ${user?.role} con Scope Gym ${user?.gymId || 'Global'}`);
      console.log(`[Final Contract]: Enviando payload a /gyms -> ${JSON.stringify(payload)}`);

      if (sedeToEdit) {
        // 1ª Petición: Actualizar identidad del gym
        await apiClient.put(`/gyms/${sedeToEdit.id}`, payload);

        setGyms(prev => prev.map(g => g.id === sedeToEdit.id
          ? { ...g, name: formData.name, description: formData.description || '' }
          : g
        ));
      } else {
        const res = await apiClient.post('/gyms', payload);
        const newSede = res.data?.id ? res.data : { id: res.data?.data?.id || Date.now(), ...payload };
        setGyms(prev => [...prev, newSede]);
      }

      setIsModalOpen(false);
    } catch (err: any) {
      console.error('[Debug] Error completo del servidor en handleSaveSede:', JSON.stringify(err?.response?.data, null, 2));
      if (err?.response?.status === 400) {
        console.error('[API Error 400] Arreglo de validaciones:', err?.response?.data?.message || err?.response?.data);
      }
      // api.config.ts maneja el toast
    }
  };


  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <section style={panelStyle} className="glass-panel">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestión de Marcas</h1>
      <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
        {user.role === 'SUPER_ADMIN'
          ? 'Administra las marcas o franquicias del grupo. Cada marca puede tener múltiples sucursales (locales físicos).'
          : 'Solo los administradores pueden gestionar las marcas del sistema.'}
      </p>

      <div className="flex flex-wrap justify-between items-center gap-3 mt-4 mb-4">
        <div style={{ color: '#8E8E93', fontSize: '0.9rem' }}>
          {loading ? 'Cargando marcas...' : `Total de marcas: ${gyms.length}`}
        </div>
        {user.role === 'SUPER_ADMIN' && (
          <button
            onClick={handleCreateSede}
            className="bg-[#5e72e4] text-white font-semibold px-4 py-2 rounded-lg border-0 cursor-pointer hover:bg-[#4f63d2] whitespace-nowrap"
          >
            Nueva Marca
          </button>
        )}
      </div>
      {error && <div style={{ marginTop: '0.75rem', color: '#FF5E00' }}>{error}</div>}

      {/* ── Barra de filtros ── */}
      {!loading && !error && gyms.length > 0 && (
        <div className="flex flex-col md:flex-row flex-wrap gap-3 items-center mb-6">
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍  Buscar marca por nombre..."
            className="flex-1 bg-white dark:bg-[#151521] border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-gray-100 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2ecc71] transition-all placeholder:text-slate-400 dark:placeholder:text-gray-500"
            style={{ minWidth: '180px' }}
          />
          <div style={{ position: 'relative' }}>
            <select value={sortOrder} onChange={e => setSortOrder(e.target.value as any)}
              className="bg-white dark:bg-[#151521] border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-gray-100 rounded-md py-2 pl-3 pr-8 text-sm cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-[#2ecc71] transition-all">
              <option value="az"     >Nombre A → Z</option>
              <option value="za"     >Nombre Z → A</option>
              <option value="id_asc" >ID ↑</option>
              <option value="id_desc">ID ↓</option>
            </select>
            <span style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#8E8E93', fontSize: '0.7rem' }}>▼</span>
          </div>
          {(search || sortOrder !== 'az') && (
            <button onClick={() => { setSearch(''); setSortOrder('az'); }}
              style={{ background: '#8e8e93', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.45rem 0.85rem', cursor: 'pointer', fontSize: '0.8rem' }}>
              Limpiar
            </button>
          )}
        </div>
      )}
      {!loading && !error && gyms.length > 0 && (
        <div style={{ color: '#8E8E93', fontSize: '0.8rem', margin: '0.5rem 0' }}>
          {filteredGyms.length === gyms.length ? `${gyms.length} marcas` : `${filteredGyms.length} de ${gyms.length} marcas`}
        </div>
      )}

      {!loading && !error && (
        <div className="bg-white dark:bg-[#1e1e2d] border border-slate-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden mt-4">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: '400px' }}>
            <thead className="bg-slate-50 dark:bg-[#151521] border-b border-slate-200 dark:border-gray-800 text-slate-500 dark:text-gray-400 text-xs uppercase tracking-wider">
              <tr>
                <th style={{ textAlign: 'left', padding: '0.6rem' }}>ID</th>
                <th style={{ textAlign: 'left', padding: '0.6rem' }}>Nombre de la Marca</th>
                <th style={{ textAlign: 'center', padding: '0.6rem' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredGyms.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400 dark:text-gray-500">Sin resultados para los filtros aplicados.</td></tr>
              ) : filteredGyms.map((g) => (
                <tr key={g.id} className="border-b border-slate-100 dark:border-gray-800 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-slate-700 dark:text-gray-300 text-sm">
                  <td style={{ padding: '0.6rem' }}>{g.id}</td>
                  <td style={{ padding: '0.6rem' }}>
                    <span style={{
                      background: '#11cdef',
                      color: '#fff',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                    }}>
                      {g.name}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', alignItems: 'center' }}>
                      {/* ── Botón info (siempre visible) ── */}
                      <button
                        title="Ver información"
                        onClick={() => setInfoSede(g)}
                        style={{ background: '#8e8e93', border: 'none', color: '#fff', padding: '0.25rem 0.45rem', borderRadius: '4px', cursor: 'pointer', lineHeight: 1, display: 'flex', alignItems: 'center' }}
                      >
                        {/* SVG info circle */}
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="12" y1="16" x2="12" y2="12"/>
                          <line x1="12" y1="8" x2="12.01" y2="8"/>
                        </svg>
                      </button>

                      {user.role === 'SUPER_ADMIN' && (<>
                        <button
                          onClick={() => handleEditSede(g)}
                          style={{ background: '#5e72e4', border: 'none', color: '#fff', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          <Edit size={12} />
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteSede(g)}
                          style={{ background: '#f5365c', border: 'none', color: '#fff', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          <Trash2 size={12} />
                          Eliminar
                        </button>
                      </>)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      )}

      <MarcaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        marcaToEdit={sedeToEdit}
        onSave={handleSaveSede}
        existingGyms={gyms}
      />

      <ConfirmModal
        isOpen={!!deleteConfirmSede}
        onClose={() => setDeleteConfirmSede(null)}
        onConfirm={confirmDeleteSede}
        title="Confirmar Eliminación"
        message={`¿Estás seguro de querer eliminar la marca "${deleteConfirmSede?.name}"? Esta acción no se puede deshacer y borrará los registros asociados permanentemente.`}
      />

      {/* ── Info card de marca ── */}
      {infoSede && (
        <ModalOverlay onClose={() => setInfoSede(null)}>
          <div style={{ width: '100%' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🏷️</span>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#00D9FF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>
                    Marca · #{infoSede.id}
                  </div>
                  <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>{infoSede.name}</h2>
                </div>
              </div>
              <button
                onClick={() => setInfoSede(null)}
                style={{ background: '#8e8e93', border: 'none', color: '#fff', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', padding: '0.25rem 0.55rem', borderRadius: '6px', flexShrink: 0 }}
              >X</button>
            </div>

            {/* Descripción */}
            <div style={{ background: '#f6f6f8', border: '1px solid #e2e2e8', borderRadius: '10px', padding: '1rem' }}>
              <div style={{ fontSize: '0.68rem', color: '#8E8E93', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
                Descripción
              </div>
              {infoSede.description ? (
                <p style={{ margin: 0, color: '#E5E5EA', fontSize: '0.92rem', lineHeight: '1.6' }}>{infoSede.description}</p>
              ) : (
                <p style={{ margin: 0, color: '#555', fontSize: '0.88rem', fontStyle: 'italic' }}>Sin descripción registrada.</p>
              )}
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              {user.role === 'SUPER_ADMIN' && (
                <button
                  onClick={() => { handleEditSede(infoSede); setInfoSede(null); }}
                  style={{ background: '#5e72e4', border: 'none', color: '#fff', borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Edit size={14} />
                  Editar
                </button>
              )}
              <button
                onClick={() => setInfoSede(null)}
                style={{ background: '#8e8e93', border: 'none', color: '#fff', borderRadius: '8px', padding: '0.5rem 1.1rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </section>
  );
};

// --- MODAL DE MARCA (SEDE) ---
