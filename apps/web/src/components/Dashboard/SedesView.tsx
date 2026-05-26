import React, { useState, useEffect, useCallback, useRef, useLayoutEffect, useMemo } from 'react';
import type { CSSProperties } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../infrastructure/api.config';
import { ModalOverlay, ConfirmModal, panelStyle } from './Shared/DashboardShared';
import type { GymDto, GymScheduleDto, UserDto, CheckinDto, ScheduleEntry } from './Shared/DashboardTypes';

const MarcaModal = ({ isOpen, onClose, marcaToEdit, onSave, existingGyms = [] }: any) => {
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (marcaToEdit) {
      setFormData({ name: marcaToEdit.name || '', description: marcaToEdit.description || '' });
    } else {
      setFormData({ name: '', description: '' });
    }
    setErrors({});
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

  return (
    <ModalOverlay onClose={onClose}>
      <div className="modal-content glass-panel">
        <div className="modal-header">
          <h2>{marcaToEdit ? 'Editar Marca' : 'Nueva Marca'}</h2>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="modal-form-group">
            <label>Nombre de la Marca</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => { setFormData({ ...formData, name: e.target.value }); setErrors(p => ({ ...p, name: '' })); }}
              placeholder="Ej. Metro Flex"
              style={errors.name ? { borderColor: '#ef4444' } : undefined}
            />
            {errors.name && <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.name}</span>}
          </div>

          <div className="modal-form-group">
            <label>Descripción</label>
            <input
              type="text"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ej. Cadena de gimnasios premium"
            />
          </div>

          <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">
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
                {user.role === 'SUPER_ADMIN' && (
                  <th style={{ textAlign: 'center', padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: '#8E8E93' }}>Acciones</th>
                )}
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
                  {user.role === 'SUPER_ADMIN' && (
                    <td style={{ padding: '0.6rem', borderBottom: '1px solid #3A3A3C', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}>
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
                      </div>
                    </td>
                  )}
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
    </section>
  );
};

// --- MODAL DE MARCA (SEDE) ---
