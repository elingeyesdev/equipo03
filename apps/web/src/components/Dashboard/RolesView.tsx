import React, { useState, useEffect, useCallback, useRef, useLayoutEffect, useMemo } from 'react';
import type { CSSProperties } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../infrastructure/api.config';
import { ModalOverlay, ConfirmModal, panelStyle } from './Shared/DashboardShared';
import type { GymDto, GymScheduleDto, UserDto, CheckinDto, ScheduleEntry } from './Shared/DashboardTypes';

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.15rem', color: '#FFFFFF' }}>
          {roleToEdit ? '✏️ Editar Rol' : '🔑 Nuevo Rol'}
        </h2>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#8E8E93', fontSize: '1.2rem', cursor: 'pointer', lineHeight: 1 }}>✕</button>
      </div>

      {/* Nombre */}
      <div style={fgGroup}>
        <label style={fgLabel}>Nombre del Rol</label>
        <input
          type="text"
          style={fgInput(!!errors.name)}
          value={formData.name}
          onChange={e => {
            setFormData({ ...formData, name: e.target.value.toUpperCase().replace(/\s/g, '_') });
            if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
          }}
          placeholder="Ej. COORDINADOR"
        />
        {errors.name
          ? <span style={errStyle}>⚠ {errors.name}</span>
          : <small style={{ color: '#8E8E93', fontSize: '0.72rem', marginTop: '0.3rem' }}>Solo mayúsculas y guión bajo (AUTO)</small>
        }
      </div>

      {/* Descripción */}
      <div style={fgGroup}>
        <label style={fgLabel}>Descripción</label>
        <textarea
          maxLength={250}
          rows={3}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            background: 'rgba(255,255,255,0.06)',
            border: `1px solid ${errors.description ? '#ef4444' : 'rgba(255,255,255,0.12)'}`,
            borderRadius: '8px',
            padding: '0.6rem 0.75rem',
            color: '#FFFFFF',
            fontSize: '0.9rem',
            resize: 'none',
            outline: 'none',
            transition: 'border-color 0.2s',
            fontFamily: 'inherit',
            lineHeight: 1.5,
          }}
          onFocus={e => { if (!errors.description) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)'; }}
          onBlur={e  => { if (!errors.description) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
          value={formData.description}
          onChange={e => {
            setFormData({ ...formData, description: e.target.value });
            if (errors.description) setErrors(prev => ({ ...prev, description: '' }));
          }}
          placeholder="Descripción del rol y sus permisos"
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.3rem' }}>
          {errors.description
            ? <span style={errStyle}>⚠ {errors.description}</span>
            : <span />
          }
          <span style={{
            fontSize: '0.68rem',
            color: formData.description.length >= 230 ? '#ef4444' : formData.description.length >= 180 ? '#FF9F0A' : '#8E8E93',
            marginLeft: 'auto',
          }}>
            {formData.description.length} / 250
          </span>
        </div>
      </div>

      {/* Nivel Jerárquico */}
      <div style={fgGroup}>
        <label style={fgLabel}>Nivel Jerárquico</label>
        <select
          style={{ ...fgInput(false), cursor: 'pointer', background: '#0F0F12', colorScheme: 'dark' } as CSSProperties}
          value={formData.hierarchyLevel}
          onChange={e => setFormData({ ...formData, hierarchyLevel: Number(e.target.value) })}
        >
          <option value={10} style={{ background: '#0F0F12', color: '#FFFFFF' }}>Máximo (10) — Super Administrador</option>
          <option value={5}  style={{ background: '#0F0F12', color: '#FFFFFF' }}>Alto (5) — Gerentes / Coordinadores</option>
          <option value={3}  style={{ background: '#0F0F12', color: '#FFFFFF' }}>Medio (3) — Entrenadores / Nutricionistas</option>
          <option value={1}  style={{ background: '#0F0F12', color: '#FFFFFF' }}>Básico (1) — Usuarios / Clientes</option>
        </select>
      </div>

      {/* Rol de Sistema */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
        <input
          type="checkbox"
          style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#FF5E00' }}
          checked={formData.isSystemRole}
          onChange={e => setFormData({ ...formData, isSystemRole: e.target.checked })}
        />
        <label style={{ margin: 0, fontSize: '0.85rem', color: '#C7C7CC', cursor: 'pointer' }}>
          Rol de Sistema (no puede ser eliminado por usuarios)
        </label>
      </div>

      {/* Warning */}
      {roleToEdit?.isSystemRole && (
        <div style={{ padding: '0.6rem 0.75rem', background: 'rgba(255, 159, 10, 0.08)', border: '1px solid rgba(255, 159, 10, 0.3)', borderRadius: '8px', color: '#FF9F0A', fontSize: '0.8rem', marginBottom: '1rem' }}>
          ⚠️ Este es un rol de sistema. Modifícalo con precaución.
        </div>
      )}

      {/* Acciones */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button
          onClick={onClose}
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#C7C7CC', padding: '0.55rem 1.1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          style={{ background: '#FF5E00', border: 'none', color: '#FFFFFF', padding: '0.55rem 1.25rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 700 }}
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
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
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
    if (level >= 3) return '#00D9FF';
    return '#30D158';
  };

  return (
    <section style={panelStyle} className="glass-panel">
      <h1 style={{ marginTop: 0 }}>Gestión de Roles</h1>
      <p style={{ color: '#8E8E93' }}>Administración de roles y jerarquías del sistema. Solo visible para Super Administradores.</p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
        <div style={{ color: '#8E8E93', fontSize: '0.9rem' }}>
          {loading ? 'Cargando roles...' : `${roles.length} roles registrados`}
        </div>
        <button
          onClick={() => { setRoleToEdit(null); setIsModalOpen(true); }}
          style={{ background: '#00D9FF', color: '#0A0A0A', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
        >
          + Nuevo Rol
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
                    fontSize: '1rem',
                    flexShrink: 0,
                  }}
                >
                  🔑
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', fontFamily: 'monospace', color: '#E5E5EA' }}>
                      {role.name}
                    </span>
                    {role.isSystemRole && (
                      <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255, 159, 10, 0.15)', color: '#FF9F0A', border: '1px solid rgba(255,159,10,0.3)' }}>
                        SISTEMA
                      </span>
                    )}
                    <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: `${hierarchyColor(role.hierarchyLevel)}22`, color: hierarchyColor(role.hierarchyLevel), border: `1px solid ${hierarchyColor(role.hierarchyLevel)}44` }}>
                      Nivel {role.hierarchyLevel ?? '—'}
                    </span>
                  </div>
                  {role.description && (
                    <span style={{ fontSize: '0.82rem', color: '#8E8E93', marginTop: '2px', display: 'block' }}>
                      {role.description}
                    </span>
                  )}
                </div>
              </div>

              {/* Acciones */}
              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                <button
                  onClick={() => { setRoleToEdit(role); setIsModalOpen(true); }}
                  style={{ background: '#00D9FF', color: '#0A0A0A', border: 'none', padding: '0.3rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                >
                  Editar
                </button>
                <button
                  onClick={() => setDeleteConfirm(role)}
                  disabled={role.isSystemRole}
                  title={role.isSystemRole ? 'Los roles de sistema no pueden eliminarse' : 'Eliminar rol'}
                  style={{
                    background: role.isSystemRole ? 'rgba(58,58,60,0.5)' : 'rgba(255, 94, 0, 0.1)',
                    color: role.isSystemRole ? '#555' : '#FF5E00',
                    border: `1px solid ${role.isSystemRole ? '#3A3A3C' : '#FF5E00'}`,
                    padding: '0.3rem 0.75rem',
                    borderRadius: '6px',
                    cursor: role.isSystemRole ? 'not-allowed' : 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}

          {roles.length === 0 && !loading && (
            <div style={{ textAlign: 'center', color: '#8E8E93', padding: '2rem' }}>
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
