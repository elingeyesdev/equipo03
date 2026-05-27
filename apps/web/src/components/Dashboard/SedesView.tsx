import React, { useState, useEffect, useCallback, useRef, useLayoutEffect, useMemo } from 'react';
import type { CSSProperties } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../infrastructure/api.config';
import { ModalOverlay, ConfirmModal, panelStyle } from './Shared/DashboardShared';
import type { GymDto, GymScheduleDto, UserDto, CheckinDto, ScheduleEntry } from './Shared/DashboardTypes';

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

  return (
    <ModalOverlay onClose={onClose}>
      {/* Elimina el wrapper doble — ModalOverlay ya provee el contenedor */}
      <div style={{ width: '100%' }}>
        {/* Header */}
        <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
          {marcaToEdit ? '✏️ Editar Marca' : '🏷️ Nueva Marca'}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Nombre */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Nombre de la Marca *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => { setFormData({ ...formData, name: e.target.value }); setErrors(p => ({ ...p, name: '' })); }}
              placeholder="Ej. Metro Flex"
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.06)', border: `1px solid ${errors.name ? '#ef4444' : 'rgba(255,255,255,0.12)'}`,
                borderRadius: '8px', color: '#E5E5EA', padding: '0.65rem 0.9rem',
                fontSize: '0.9rem', outline: 'none',
              }}
            />
            {errors.name && (
              <span style={{ color: '#ef4444', fontSize: '12px' }}>{errors.name}</span>
            )}
          </div>

          {/* Descripción con auto-resize */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Descripción
              </label>
              <span style={{ fontSize: '11px', color: descOver ? '#ef4444' : descNear ? '#f97316' : '#555' }}>
                {descLen}/{DESC_MAX}
              </span>
            </div>
            <textarea
              ref={textareaRef}
              value={formData.description}
              onChange={e => {
                setFormData({ ...formData, description: e.target.value });
                setErrors(p => ({ ...p, description: '' }));
                autoResize();
              }}
              placeholder="Ej. Cadena de gimnasios premium"
              rows={3}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.06)',
                border: `1px solid ${errors.description || descOver ? '#ef4444' : 'rgba(255,255,255,0.12)'}`,
                borderRadius: '8px', color: '#E5E5EA',
                padding: '0.65rem 0.9rem', fontSize: '0.9rem',
                outline: 'none', resize: 'none', overflow: 'hidden',
                lineHeight: '1.55', minHeight: '80px',
                transition: 'border-color 0.2s',
              }}
            />
            {(errors.description || descOver) && (
              <span style={{ color: '#ef4444', fontSize: '12px' }}>
                {errors.description || `Máximo ${DESC_MAX} caracteres`}
              </span>
            )}
          </div>

          {/* Botones */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <button type="button" onClick={onClose}
              style={{ background: 'rgba(255,255,255,0.07)', color: '#E5E5EA', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '0.55rem 1.1rem', cursor: 'pointer', fontSize: '0.875rem' }}>
              Cancelar
            </button>
            <button type="submit"
              style={{ background: '#00D9FF', color: '#0A0A0A', border: 'none', borderRadius: '8px', padding: '0.55rem 1.25rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem' }}>
              {marcaToEdit ? 'Actualizar' : 'Crear'} Marca
            </button>
          </div>
        </form>
      </div>
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
      alert(err?.response?.data?.message || err?.message || 'Error al eliminar sede.');
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
      alert("Acceso denegado: No tienes permisos para editar una sede que no te pertenece.");
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
      <h1 style={{ marginTop: 0 }}>Gestión de Marcas (Sedes)</h1>
      <p>
        {user.role === 'SUPER_ADMIN'
          ? 'Administra las marcas o franquicias del grupo. Cada marca puede tener múltiples sucursales (locales físicos).'
          : 'Solo los administradores pueden gestionar las marcas del sistema.'}
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ color: '#8E8E93', fontSize: '0.9rem' }}>
          {loading ? 'Cargando marcas...' : `Total de marcas: ${gyms.length}`}
        </div>
        {user.role === 'SUPER_ADMIN' && (
          <button
            onClick={handleCreateSede}
            style={{ background: '#00D9FF', color: '#0A0A0A', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
          >
            + Nueva Marca
          </button>
        )}
      </div>
      {error && <div style={{ marginTop: '0.75rem', color: '#FF5E00' }}>{error}</div>}

      {/* ── Barra de filtros ── */}
      {!loading && !error && gyms.length > 0 && (
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '0.85rem' }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍  Buscar marca por nombre..."
            style={{ flex: 1, minWidth: '180px', background: '#1C1C1E', color: '#E5E5EA', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '0.5rem 0.9rem', fontSize: '0.85rem', outline: 'none' }}
          />
          <div style={{ position: 'relative' }}>
            <select value={sortOrder} onChange={e => setSortOrder(e.target.value as any)}
              style={{ background: '#1C1C1E', color: '#E5E5EA', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '0.5rem 2rem 0.5rem 0.9rem', fontSize: '0.85rem', appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer', outline: 'none' }}>
              <option value="az"      style={{ background: '#1C1C1E' }}>Nombre A → Z</option>
              <option value="za"      style={{ background: '#1C1C1E' }}>Nombre Z → A</option>
              <option value="id_asc"  style={{ background: '#1C1C1E' }}>ID ↑</option>
              <option value="id_desc" style={{ background: '#1C1C1E' }}>ID ↓</option>
            </select>
            <span style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#8E8E93', fontSize: '0.7rem' }}>▼</span>
          </div>
          {(search || sortOrder !== 'az') && (
            <button onClick={() => { setSearch(''); setSortOrder('az'); }}
              style={{ background: 'none', color: '#8E8E93', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.45rem 0.85rem', cursor: 'pointer', fontSize: '0.8rem' }}>
              ✕ Limpiar
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
        <div style={{ marginTop: '0.25rem', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '400px' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: '#8E8E93' }}>ID</th>
                <th style={{ textAlign: 'left', padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: '#8E8E93' }}>Nombre de la Marca</th>
                <th style={{ textAlign: 'center', padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: '#8E8E93' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredGyms.length === 0 ? (
                <tr><td colSpan={3} style={{ padding: '2rem', textAlign: 'center', color: '#8E8E93' }}>Sin resultados para los filtros aplicados.</td></tr>
              ) : filteredGyms.map((g) => (
                <tr key={g.id}>
                  <td style={{ padding: '0.6rem', borderBottom: '1px solid #3A3A3C' }}>{g.id}</td>
                  <td style={{ padding: '0.6rem', borderBottom: '1px solid #3A3A3C' }}>
                    <span style={{
                      background: 'rgba(0, 217, 255, 0.15)',
                      backdropFilter: 'blur(10px)',
                      color: '#00D9FF',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.9rem',
                      border: '1px solid rgba(0, 217, 255, 0.3)'
                    }}>
                      {g.name}
                    </span>
                  </td>
                  <td style={{ padding: '0.6rem', borderBottom: '1px solid #3A3A3C', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}>
                      {/* ── Botón info (siempre visible) ── */}
                      <button
                        title="Ver información"
                        onClick={() => setInfoSede(g)}
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#AEAEB2', padding: '0.25rem 0.45rem', borderRadius: '4px', cursor: 'pointer', lineHeight: 1, display: 'flex', alignItems: 'center' }}
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
                          style={{ background: 'transparent', border: '1px solid #00D9FF', color: '#00D9FF', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteSede(g)}
                          style={{ background: 'transparent', border: '1px solid #FF5E00', color: '#FF5E00', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                        >
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
        message={`¿Estás seguro de querer eliminar la sede "${deleteConfirmSede?.name}"? Esta acción no se puede deshacer y borrará los registros asociados permanentemente.`}
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
                style={{ background: 'none', border: 'none', color: '#8E8E93', fontSize: '1.2rem', cursor: 'pointer', padding: '0.2rem', flexShrink: 0 }}
              >✕</button>
            </div>

            {/* Descripción */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '1rem' }}>
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
                  style={{ background: 'transparent', border: '1px solid #00D9FF', color: '#00D9FF', borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                >
                  ✏️ Editar
                </button>
              )}
              <button
                onClick={() => setInfoSede(null)}
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#E5E5EA', borderRadius: '8px', padding: '0.5rem 1.1rem', cursor: 'pointer', fontSize: '0.85rem' }}
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
