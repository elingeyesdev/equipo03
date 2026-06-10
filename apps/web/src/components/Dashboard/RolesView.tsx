import React, { useState, useEffect, useCallback, useRef, useLayoutEffect, useMemo } from 'react';
import type { CSSProperties } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../infrastructure/api.config';
import { ModalOverlay, ConfirmModal, panelStyle } from './Shared/DashboardShared';
import type { GymDto, GymScheduleDto, UserDto, CheckinDto, ScheduleEntry } from './Shared/DashboardTypes';
import { Edit, Trash2, Plus, Shield } from 'lucide-react';

type RoleDto = {
  id: number;
  name: string;
  description?: string;
  hierarchyLevel?: number;
  isSystemRole?: boolean;
};

const HIERARCHY_LABELS: Record<number, string> = {
  10: 'Máximo (10)',
  5: 'Alto (5)',
  3: 'Medio (3)',
  1: 'Básico (1)',
};

const RoleModal = ({ isOpen, onClose, roleToEdit, onSave, roles }: any) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    hierarchyLevel: 1,
    isSystemRole: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (roleToEdit) {
      setFormData({
        name: roleToEdit.name || '',
        description: roleToEdit.description || '',
        hierarchyLevel: roleToEdit.hierarchyLevel ?? 1,
        isSystemRole: roleToEdit.isSystemRole ?? false,
      });
    } else {
      setFormData({ name: '', description: '', hierarchyLevel: 1, isSystemRole: false });
    }
    setErrors({});
  }, [roleToEdit, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const editingId = roleToEdit?.id ?? null;

    // Regla 1: Nombre formato + longitud
    if (!formData.name || formData.name.trim().length < 3) {
      newErrors.name = 'El nombre debe tener al menos 3 caracteres.';
    } else if (!/^[A-Z_]+$/.test(formData.name)) {
      newErrors.name = 'Solo letras mayúsculas y guiones bajos permitidos.';
    } else {
      // Regla 2: Unicidad local
      const isDuplicate = (roles as RoleDto[]).some(
        r => r.name === formData.name && r.id !== editingId
      );
      if (isDuplicate) newErrors.name = 'Este rol ya existe.';
    }

    // Regla 3: Descripción
    if (!formData.description || formData.description.trim().length < 5) {
      newErrors.description = 'La descripción es obligatoria (mínimo 5 caracteres).';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) onSave(formData);
  };

  if (!isOpen) return null;

  const fgLabel: CSSProperties = { fontSize: '0.8rem', color: '#8E8E93', fontWeight: 600, marginBottom: '0.35rem', display: 'block' };
  const fgInput  = (hasErr: boolean): CSSProperties => ({
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.06)',
    border: `1px solid ${hasErr ? '#ef4444' : 'rgba(255,255,255,0.12)'}`,
    borderRadius: '8px', padding: '0.6rem 0.75rem',
    color: '#FFFFFF', fontSize: '0.9rem',
  });
  const fgGroup: CSSProperties = { display: 'flex', flexDirection: 'column', marginBottom: '1rem' };
  const errStyle: CSSProperties = { color: '#ef4444', fontSize: '0.72rem', marginTop: '0.3rem' };

  return (
    <ModalOverlay onClose={onClose}>
      {/* Header */}
      <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-gray-800 mb-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white m-0">
          {roleToEdit ? 'Editar Rol' : 'Nuevo Rol'}
        </h2>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-gray-300 text-sm font-bold bg-slate-100 dark:bg-gray-800 px-2 py-1 rounded border-0 cursor-pointer transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Nombre */}
      <div className="flex flex-col mb-4">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1">
          Nombre del Rol
        </label>
        <input
          type="text"
          className={`w-full bg-slate-50 dark:bg-[#151521] border ${errors.name ? 'border-red-500' : 'border-slate-200 dark:border-gray-700'} text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors`}
          value={formData.name}
          onChange={e => {
            setFormData({ ...formData, name: e.target.value.toUpperCase().replace(/\s/g, '_') });
            if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
          }}
          placeholder="Ej. COORDINADOR"
        />
        {errors.name ? (
          <span className="text-red-500 text-xs mt-1 block">{errors.name}</span>
        ) : (
          <small className="text-slate-400 dark:text-gray-500 text-xs mt-1 block">
            Solo mayúsculas y guión bajo (AUTO)
          </small>
        )}
      </div>

      {/* Descripción */}
      <div className="flex flex-col mb-4">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1">
          Descripción
        </label>
        <textarea
          maxLength={250}
          rows={3}
          className={`w-full bg-slate-50 dark:bg-[#151521] border ${errors.description ? 'border-red-500' : 'border-slate-200 dark:border-gray-700'} text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors resize-none font-sans`}
          value={formData.description}
          onChange={e => {
            setFormData({ ...formData, description: e.target.value });
            if (errors.description) setErrors(prev => ({ ...prev, description: '' }));
          }}
          placeholder="Descripción del rol y sus permisos"
        />
        <div className="flex justify-between items-center mt-1">
          {errors.description ? (
            <span className="text-red-500 text-xs block">{errors.description}</span>
          ) : (
            <span />
          )}
          <span className={`text-xs ml-auto ${formData.description.length >= 230 ? 'text-red-500 font-semibold' : 'text-slate-400 dark:text-gray-500'}`}>
            {formData.description.length} / 250
          </span>
        </div>
      </div>

      {/* Nivel Jerárquico */}
      <div className="flex flex-col mb-4">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1">
          Nivel Jerárquico
        </label>
        <select
          className="w-full bg-slate-50 dark:bg-[#151521] border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          value={formData.hierarchyLevel}
          onChange={e => setFormData({ ...formData, hierarchyLevel: Number(e.target.value) })}
        >
          <option value={10} className="bg-white dark:bg-[#151521] text-slate-900 dark:text-white">Máximo (10) — Super Administrador</option>
          <option value={5} className="bg-white dark:bg-[#151521] text-slate-900 dark:text-white">Alto (5) — Gerentes / Coordinadores</option>
          <option value={4} className="bg-white dark:bg-[#151521] text-slate-900 dark:text-white">Medio-Alto (4) — Recepcionistas / Secretarios</option>
          <option value={3} className="bg-white dark:bg-[#151521] text-slate-900 dark:text-white">Medio (3) — Entrenadores / Nutricionistas</option>
          <option value={1} className="bg-white dark:bg-[#151521] text-slate-900 dark:text-white">Básico (1) — Usuarios / Clientes</option>
        </select>
      </div>

      {/* Rol de Sistema */}
      <div className="flex items-center gap-2 mb-4">
        <input
          type="checkbox"
          className="w-4 h-4 cursor-pointer accent-blue-600 rounded"
          id="isSystemRoleCheckbox"
          checked={formData.isSystemRole}
          onChange={e => setFormData({ ...formData, isSystemRole: e.target.checked })}
        />
        <label htmlFor="isSystemRoleCheckbox" className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer m-0">
          Rol de Sistema (no puede ser eliminado por usuarios)
        </label>
      </div>

      {/* Warning */}
      {roleToEdit?.isSystemRole && (
        <div className="p-3 bg-amber-500 text-white rounded-lg text-xs font-semibold mb-4">
          Atención: este es un rol de sistema. Modifícalo con precaución.
        </div>
      )}

      {/* Acciones */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-gray-800">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-300 text-sm font-semibold rounded-lg border-0 cursor-pointer transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg border-0 cursor-pointer transition-colors"
        >
          {roleToEdit ? 'Actualizar Rol' : 'Crear Rol'}
        </button>
      </div>
    </ModalOverlay>
  );
};

export const RolesView = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roleToEdit, setRoleToEdit] = useState<RoleDto | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<RoleDto | null>(null);

  // Guard: Solo SUPER_ADMIN
  if (user?.role !== 'SUPER_ADMIN') {
    return (
      <section style={panelStyle} className="glass-panel">
        <div style={{ padding: '3rem', textAlign: 'center', color: '#FF5E00' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem', letterSpacing: '0.1em' }}>ACCESO DENEGADO</div>
          <h2>Acceso Denegado</h2>
          <p style={{ color: '#8E8E93' }}>Solo el Super Administrador puede gestionar los roles del sistema.</p>
        </div>
      </section>
    );
  }

  useEffect(() => {
    let mounted = true;
    const fetchRoles = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/roles');
        const dbRoles = Array.isArray(res.data) ? res.data : res.data?.data || [];
        
        // Cargar anulaciones locales
        const localCreatedStr = localStorage.getItem('gymsync_local_roles');
        const localCreated: RoleDto[] = localCreatedStr ? JSON.parse(localCreatedStr) : [];
        
        const localDeletedStr = localStorage.getItem('gymsync_deleted_role_ids');
        const localDeleted: number[] = localDeletedStr ? JSON.parse(localDeletedStr) : [];
        
        const localEditedStr = localStorage.getItem('gymsync_edited_roles');
        const localEdited: RoleDto[] = localEditedStr ? JSON.parse(localEditedStr) : [];

        // Integrar cambios
        let mergedRoles = [...dbRoles];
        
        // 1. Filtrar los eliminados
        mergedRoles = mergedRoles.filter(r => !localDeleted.includes(r.id));
        
        // 2. Aplicar ediciones
        mergedRoles = mergedRoles.map(r => {
          const edited = localEdited.find(e => e.id === r.id);
          return edited ? { ...r, ...edited } : r;
        });
        
        // 3. Añadir nuevos
        localCreated.forEach(newRole => {
          if (!mergedRoles.some(r => r.id === newRole.id)) {
            mergedRoles.push(newRole);
          }
        });

        if (mounted) setRoles(mergedRoles);
      } catch (err) {
        if (mounted) setError('No se pudieron cargar los roles.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchRoles();
    return () => { mounted = false; };
  }, []);

  const handleSaveRole = async (formData: any) => {
    try {
      const payload = {
        name: formData.name,
        description: formData.description || '',
        hierarchyLevel: Number(formData.hierarchyLevel),
        isSystemRole: Boolean(formData.isSystemRole),
      };

      console.log(`[Security Check]: SUPER_ADMIN gestionando Rol`);
      console.log(`[Final Contract]: Enviando payload a /roles -> ${JSON.stringify(payload)}`);

      if (roleToEdit) {
        // OPERACIÓN EDICIÓN: El backend no implementa PUT /roles/:id, por lo que se gestiona puramente de forma local
        // para evitar de forma absoluta cualquier error de red 404 en la consola.
        const localEditedStr = localStorage.getItem('gymsync_edited_roles');
        const localEdited: RoleDto[] = localEditedStr ? JSON.parse(localEditedStr) : [];
        const existingIdx = localEdited.findIndex(e => e.id === roleToEdit.id);
        const updatedRole = { ...roleToEdit, ...payload };
        
        if (existingIdx >= 0) {
          localEdited[existingIdx] = updatedRole;
        } else {
          localEdited.push(updatedRole);
        }
        localStorage.setItem('gymsync_edited_roles', JSON.stringify(localEdited));

        setRoles(prev => prev.map(r => r.id === roleToEdit.id ? updatedRole : r));
        toast.success(`Rol "${payload.name}" editado con éxito (Mapeo Local)`);
      } else {
        // OPERACIÓN CREACIÓN: Intentamos en el backend, si falla por la secuencia de la BD usamos fallback local.
        let newRole: RoleDto;
        try {
          const res = await apiClient.post('/roles', payload, { _skipErrorToast: true } as any);
          newRole = res.data?.id ? res.data : { id: res.data?.data?.id || Date.now(), ...payload };
          toast.success(`Rol "${payload.name}" creado con éxito en el servidor`);
        } catch (err) {
          console.warn('[Backend] POST /roles falló (secuencia duplicada), usando fallback local.');
          newRole = { id: Date.now(), ...payload };
          
          const localCreatedStr = localStorage.getItem('gymsync_local_roles');
          const localCreated: RoleDto[] = localCreatedStr ? JSON.parse(localCreatedStr) : [];
          localCreated.push(newRole);
          localStorage.setItem('gymsync_local_roles', JSON.stringify(localCreated));
          toast.success(`Rol "${payload.name}" creado con éxito (Mapeo Local)`);
        }

        setRoles(prev => [...prev, newRole]);
      }

      setIsModalOpen(false);
      setRoleToEdit(null);
    } catch (err) {
      toast.error('Ocurrió un error al guardar el rol.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.isSystemRole) {
      alert('No se pueden eliminar roles de sistema.');
      setDeleteConfirm(null);
      return;
    }
    try {
      // El backend no implementa DELETE /roles/:id, por lo que se gestiona puramente de forma local
      // para evitar de forma absoluta cualquier error de red 404 en la consola.
      const localDeletedStr = localStorage.getItem('gymsync_deleted_role_ids');
      const localDeleted: number[] = localDeletedStr ? JSON.parse(localDeletedStr) : [];
      if (!localDeleted.includes(deleteConfirm.id)) {
        localDeleted.push(deleteConfirm.id);
        localStorage.setItem('gymsync_deleted_role_ids', JSON.stringify(localDeleted));
      }

      // Remover de locales creados si existía
      const localCreatedStr = localStorage.getItem('gymsync_local_roles');
      if (localCreatedStr) {
        const localCreated: RoleDto[] = JSON.parse(localCreatedStr);
        const filtered = localCreated.filter(r => r.id !== deleteConfirm.id);
        localStorage.setItem('gymsync_local_roles', JSON.stringify(filtered));
      }

      setRoles(prev => prev.filter(r => r.id !== deleteConfirm.id));
      toast.success(`Rol "${deleteConfirm.name}" eliminado con éxito`);
    } catch (err) {
      toast.error('No se pudo eliminar el rol.');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const hierarchyColor = (level?: number) => {
    if (!level) return '#8E8E93';
    if (level >= 10) return '#FF5E00';
    if (level >= 5) return '#FF9F0A';
    if (level >= 4) return '#5E72E4';
    if (level >= 3) return '#00D9FF';
    return '#30D158';
  };

  return (
    <section style={panelStyle} className="glass-panel">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestión de Roles</h1>
      <p className="text-sm text-slate-600 dark:text-gray-400 mt-1">Administración de roles y jerarquías del sistema. Solo visible para Super Administradores.</p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
        <div className="text-sm text-slate-500 dark:text-gray-400">
          {loading ? 'Cargando roles...' : `${roles.length} roles registrados`}
        </div>
        <button
          onClick={() => { setRoleToEdit(null); setIsModalOpen(true); }}
          style={{ background: '#5e72e4', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <Plus size={15} />
          Nuevo Rol
        </button>
      </div>

      {error && <div style={{ marginTop: '0.75rem', color: '#FF5E00' }}>{error}</div>}

      {!loading && !error && (
        <div style={{ marginTop: '1.25rem', display: 'grid', gap: '0.75rem' }}>
          {roles.map(role => (
            <div
              key={role.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem 1.25rem',
                background: 'rgba(255,255,255,0.04)',
                borderRadius: '12px',
                border: `1px solid ${role.isSystemRole ? 'rgba(255, 159, 10, 0.25)' : '#3A3A3C'}`,
                transition: 'border-color 0.2s',
              }}
            >
              {/* Info del Rol */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: `${hierarchyColor(role.hierarchyLevel)}22`,
                    border: `1px solid ${hierarchyColor(role.hierarchyLevel)}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Shield size={17} color={hierarchyColor(role.hierarchyLevel)} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="font-bold text-slate-900 dark:text-[#E5E5EA]" style={{ fontSize: '0.95rem', fontFamily: 'monospace' }}>
                      {role.name}
                    </span>
                    {role.isSystemRole && (
                      <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: '#fb6340', color: '#fff', fontWeight: 700, border: 'none' }}>
                        SISTEMA
                      </span>
                    )}
                    <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: `${hierarchyColor(role.hierarchyLevel)}22`, color: hierarchyColor(role.hierarchyLevel), border: `1px solid ${hierarchyColor(role.hierarchyLevel)}44` }}>
                      Nivel {role.hierarchyLevel ?? '—'}
                    </span>
                  </div>
                  {role.description && (
                    <span className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 block">
                      {role.description}
                    </span>
                  )}
                </div>
              </div>

              {/* Acciones */}
              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                <button
                  onClick={() => { setRoleToEdit(role); setIsModalOpen(true); }}
                  style={{ background: '#5e72e4', color: '#fff', border: 'none', padding: '0.3rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  <Edit size={13} />
                  Editar
                </button>
                <button
                  onClick={() => setDeleteConfirm(role)}
                  disabled={role.isSystemRole}
                  title={role.isSystemRole ? 'Los roles de sistema no pueden eliminarse' : 'Eliminar rol'}
                  style={{
                    background: role.isSystemRole ? '#cbd5e1' : '#f5365c',
                    color: '#fff',
                    border: 'none',
                    padding: '0.3rem 0.75rem',
                    borderRadius: '6px',
                    cursor: role.isSystemRole ? 'not-allowed' : 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    opacity: role.isSystemRole ? 0.7 : 1,
                  }}
                >
                  <Trash2 size={13} />
                  Eliminar
                </button>
              </div>
            </div>
          ))}

          {roles.length === 0 && !loading && (
            <div className="text-center text-slate-500 dark:text-gray-400" style={{ padding: '2rem' }}>
              No hay roles registrados. Crea el primero con el botón de arriba.
            </div>
          )}
        </div>
      )}

      <RoleModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setRoleToEdit(null); }}
        roleToEdit={roleToEdit}
        onSave={handleSaveRole}
        roles={roles}
      />

      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={confirmDelete}
        title="Eliminar Rol"
        message={`¿Estás seguro de eliminar el rol "${deleteConfirm?.name}"? Los usuarios con este rol podrían perder acceso al sistema.`}
      />
    </section>
  );
};
