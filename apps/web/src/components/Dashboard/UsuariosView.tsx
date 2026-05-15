import React, { useState, useEffect, useCallback, useRef, useLayoutEffect, useMemo } from 'react';
import type { CSSProperties } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../infrastructure/api.config';
import { ModalOverlay, ConfirmModal, panelStyle, RecordDetailModal, DetailField } from './Shared/DashboardShared';
import type { GymDto, GymScheduleDto, UserDto, CheckinDto, ScheduleEntry } from './Shared/DashboardTypes';

const UserModal = ({ isOpen, onClose, userToEdit, onSave }: any) => {
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', password: '', roleId: 3, gymIds: [] as number[], isActive: true
  });
  const [gyms, setGyms] = useState<any[]>([]);
  const [loadingGyms, setLoadingGyms] = useState(false);
  const modalScrollContainerRef = useRef<HTMLDivElement>(null);
  const topAnchorRef = useRef<HTMLDivElement>(null);

  const roles = [
    { id: 1, name: 'SUPER_ADMIN', label: 'Super Administrador' },
    { id: 2, name: 'GERENTE', label: 'Gerente de Sede' },
    { id: 3, name: 'USER', label: 'Usuario Estándar' },
    { id: 4, name: 'CLIENTE', label: 'Cliente Activo' },
    { id: 5, name: 'ENTRENADOR', label: 'Entrenador' },
    { id: 6, name: 'NUTRICIONISTA', label: 'Nutricionista' },
  ];

  useEffect(() => {
    if (isOpen) {
      const originalStyle = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  useLayoutEffect(() => {
    if (isOpen) {
      fetchGyms();
      // 1. Forzar el foco al contenedor superior o un elemento invisible al inicio
      topAnchorRef.current?.focus();

      // 2. Doble reset de scroll para vencer al Reflow de React
      const reset = () => {
        if (modalScrollContainerRef.current) {
          modalScrollContainerRef.current.scrollTop = 0;
        }
      };

      reset(); // Intento 1: Inmediato
      const timeoutId = setTimeout(reset, 100); // Intento 2: Tras el renderizado del Rol

      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, formData.roleId]);

  const fetchGyms = async () => {
    setLoadingGyms(true);
    try {
      const response = await apiClient.get('/gyms');
      if (response.data) {
        setGyms(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Error al cargar sedes:', error);
    } finally {
      setLoadingGyms(false);
    }
  };

  useEffect(() => {
    if (userToEdit) {
      // Adaptado a nueva estructura: userRoles.gym en lugar de gyms directo
      const gymsFromRoles = userToEdit.userRoles?.map((ur: any) => ur.gym).filter(Boolean) || [];
      setFormData({
        firstName: userToEdit.profile?.firstName || '',
        lastName: userToEdit.profile?.lastName || '',
        email: userToEdit.email || '',
        password: '',
        roleId: Number(userToEdit.userRoles?.[0]?.roleId) || 3,
        gymIds: gymsFromRoles.map((g: any) => g.id),
        isActive: userToEdit.isActive ?? true
      });
    } else {
      setFormData({ firstName: '', lastName: '', email: '', password: '', roleId: 3, gymIds: [], isActive: true });
    }
  }, [userToEdit, isOpen]);

  const handleGymToggle = (gymId: number) => {
    setFormData(prev => ({
      ...prev,
      gymIds: prev.gymIds.includes(gymId)
        ? prev.gymIds.filter(id => id !== gymId)
        : [...prev.gymIds, gymId]
    }));
  };

  const handleGymSelect = (gymId: number) => {
    setFormData(prev => ({
      ...prev,
      gymIds: [gymId]
    }));
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClose={onClose}>
      <div className="modal-content glass-panel" style={{ maxHeight: '75vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header">
          <h2>{userToEdit ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
        </div>
        <div ref={modalScrollContainerRef} className="border-2 border-red-500" style={{ overflowY: 'auto', paddingRight: '0.5rem', flex: 1, maxHeight: '75vh', display: 'flex', flexDirection: 'column' }}>
          <div ref={topAnchorRef} tabIndex={-1} style={{ width: '100%', height: '1px', opacity: 0, display: 'block' }} />
          <div className="modal-form-group">
            <label>Nombre</label>
            <input type="text" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} placeholder="Ej. Juan" />
          </div>
          <div className="modal-form-group">
            <label>Apellido</label>
            <input type="text" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} placeholder="Ej. Pérez" />
          </div>
          <div className="modal-form-group">
            <label>Correo Electrónico</label>
            <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="correo@ejemplo.com" />
          </div>
          <div className="modal-form-group">
            <label>Contraseña {userToEdit && '(Déjalo en blanco para no cambiar)'}</label>
            <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="••••••••" />
          </div>
        <div className="modal-form-group">
          <label>Rol del Sistema</label>
          <select 
            value={formData.roleId} 
            onChange={e => setFormData({...formData, roleId: Number(e.target.value), gymIds: []})}
          >
            {roles.map(role => (
              <option key={role.id} value={role.id}>
                {role.label}
              </option>
            ))}
          </select>
        </div>

        {formData.roleId === 2 && (
          <div className="modal-form-group">
            <label>Sede (Única) *</label>
            {loadingGyms ? (
              <p style={{ color: '#8E8E93', fontSize: '0.875rem' }}>Cargando sedes...</p>
            ) : (
              <select
                value={formData.gymIds[0] || ''}
                onChange={e => handleGymSelect(Number(e.target.value))}
                style={{ width: '100%', padding: '0.5rem', background: '#0A0A0A', border: formData.gymIds.length === 0 ? '1px solid #ef4444' : '1px solid #3A3A3C', color: '#FFFFFF', borderRadius: '6px' }}
              >
                <option value="">Seleccionar sede</option>
                {gyms.map(gym => (
                  <option key={gym.id} value={gym.id} style={{ background: '#0A0A0A', color: '#FFFFFF' }}>
                    {gym.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {(formData.roleId === 5 || formData.roleId === 6) && (
          <div className="modal-form-group">
            <label>Sedes (Múltiples)</label>
            {loadingGyms ? (
              <p style={{ color: '#8E8E93', fontSize: '0.875rem' }}>Cargando sedes...</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', padding: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
                {gyms.map(gym => (
                  <label key={gym.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', borderRadius: '4px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.gymIds.includes(gym.id)}
                      onChange={() => handleGymToggle(gym.id)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span>{gym.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="modal-form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input type="checkbox" style={{ width: 'auto' }} checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} />
          <label style={{ margin: 0 }}>Usuario Activo</label>
        </div>
        </div>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancelar</button>
          <button 
            className="btn-primary" 
            onClick={() => {
              if (formData.roleId === 2 && formData.gymIds.length === 0) {
                alert('El Gerente de Sede debe tener asignada al menos una sede');
                return;
              }
              onSave(formData);
            }}
          >
            Guardar Usuario
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
};


// ============================================================
// LOCATION PICKER — Mapa interactivo con Leaflet + OpenStreetMap
// ============================================================
export const UsuariosView = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserDto | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<UserDto | null>(null);
  const [viewingUser, setViewingUser] = useState<UserDto | null>(null);

  useEffect(() => {
    let mounted = true;

    const cargarUsuarios = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const usersResponse = await apiClient.get('/users');
        const usersData: UserDto[] = Array.isArray(usersResponse.data) ? usersResponse.data : [];

        // Fetch gyms para mostrar nombres en la tabla
        const gymsResponse = await apiClient.get('/gyms');
        const gymsMap = new Map(Array.isArray(gymsResponse.data) ? gymsResponse.data.map((g: any) => [g.id, g.name]) : []);

        if (user.role === 'GERENTE' && user.gymId) {
          const checkinsResponse = await apiClient.get('/checkins', {
            params: { gym_id: user.gymId, page: 1, limit: 500 },
          });
          const checkinsData: CheckinDto[] = Array.isArray(checkinsResponse.data) ? checkinsResponse.data : [];
          const allowedUserIds = new Set(checkinsData.map(item => String(item.userId)));
          const scopedUsers = usersData.filter(u => allowedUserIds.has(String(u.id)));
          if (mounted) setUsers(scopedUsers.map((u: any) => ({ ...u, gymsMap })));
        } else if (mounted) {
          setUsers(usersData.map((u: any) => ({ ...u, gymsMap })));
        }
      } catch (err: any) {
        if (mounted) setError(err?.response?.data?.message || err?.message || 'No se pudo cargar usuarios.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    cargarUsuarios();
    return () => {
      mounted = false;
    };
  }, [user]);

  const usuariosActivos = useMemo(() => users.filter(u => !!u.isActive).length, [users]);

  const handleDeleteUser = (u: UserDto) => {
    setDeleteConfirmUser(u);
  };

  const confirmDeleteUser = async () => {
    if (!deleteConfirmUser) return;
    try {
      await apiClient.delete(`/users/${deleteConfirmUser.id}`);
      setUsers(prev => prev.filter(item => item.id !== deleteConfirmUser.id));
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Error al eliminar usuario.');
    } finally {
      setDeleteConfirmUser(null);
    }
  };

  const handleCreateUser = () => {
    setUserToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditUser = (u: UserDto) => {
    setUserToEdit(u);
    setIsModalOpen(true);
  };

  const handleSaveUser = async (formData: any) => {
    try {
      const payload: any = {
        email: formData.email?.trim(),
        firstName: formData.firstName?.trim(),
        lastName: formData.lastName?.trim(),
        roleId: formData.roleId,
        gymIds: (formData.roleId === 3 || formData.roleId === 4) ? [] : (formData.gymIds || []),
        isActive: formData.isActive,
      };

      if (formData.password && formData.password.trim()) {
        payload.password = formData.password.trim();
      }

      console.log(`[Security Check]: Ejecutando acción para Rol ${user?.role} con Scope Gym ${user?.gymId || 'Global'}`);
      console.log("[Debug] Payload de Usuario a enviar (/users):", JSON.stringify(payload, null, 2));

      let newUserId = userToEdit?.id;

      if (userToEdit) {
        await apiClient.put(`/users/${userToEdit.id}`, payload);
        // Recargar usuarios para obtener la estructura actualizada del backend
        const usersResponse = await apiClient.get('/users');
        const gymsResponse = await apiClient.get('/gyms');
        const gymsMap = new Map(Array.isArray(gymsResponse.data) ? gymsResponse.data.map((g: any) => [g.id, g.name]) : []);
        const usersData: UserDto[] = Array.isArray(usersResponse.data) ? usersResponse.data : [];
        
        if (user.role === 'GERENTE' && user.gymId) {
          const checkinsResponse = await apiClient.get('/checkins', {
            params: { gym_id: user.gymId, page: 1, limit: 500 },
          });
          const checkinsData: CheckinDto[] = Array.isArray(checkinsResponse.data) ? checkinsResponse.data : [];
          const allowedUserIds = new Set(checkinsData.map(item => String(item.userId)));
          const scopedUsers = usersData.filter(u => allowedUserIds.has(String(u.id)));
          setUsers(scopedUsers.map((u: any) => ({ ...u, gymsMap })));
        } else {
          setUsers(usersData.map((u: any) => ({ ...u, gymsMap })));
        }
      } else {
        const res = await apiClient.post('/users', payload);
        newUserId = res.data?.id || res.data?.data?.id || res.data?.userId;
        // Recargar usuarios para obtener la estructura actualizada del backend
        const usersResponse = await apiClient.get('/users');
        const gymsResponse = await apiClient.get('/gyms');
        const gymsMap = new Map(Array.isArray(gymsResponse.data) ? gymsResponse.data.map((g: any) => [g.id, g.name]) : []);
        const usersData: UserDto[] = Array.isArray(usersResponse.data) ? usersResponse.data : [];
        
        if (user.role === 'GERENTE' && user.gymId) {
          const checkinsResponse = await apiClient.get('/checkins', {
            params: { gym_id: user.gymId, page: 1, limit: 500 },
          });
          const checkinsData: CheckinDto[] = Array.isArray(checkinsResponse.data) ? checkinsResponse.data : [];
          const allowedUserIds = new Set(checkinsData.map(item => String(item.userId)));
          const scopedUsers = usersData.filter(u => allowedUserIds.has(String(u.id)));
          setUsers(scopedUsers.map((u: any) => ({ ...u, gymsMap })));
        } else {
          setUsers(usersData.map((u: any) => ({ ...u, gymsMap })));
        }
      }

      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || err?.message || 'Error al guardar usuario.');
    }
  };

  return (
    <section style={panelStyle} className="glass-panel">
      <h1 style={{ marginTop: 0 }}>Usuarios</h1>
      <p>
        {user?.role === 'SUPER_ADMIN'
          ? 'Gestion de usuarios de toda la red.'
          : 'Gestion de usuarios restringida a tus sucursales de la cadena.'}
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
        <div style={{ color: '#8E8E93', fontSize: '0.9rem' }}>
          {loading ? 'Cargando usuarios...' : `Total: ${users.length} | Activos: ${usuariosActivos}`}
        </div>
        {(user?.role === 'SUPER_ADMIN' || user?.role === 'GERENTE') && (
          <button 
            onClick={handleCreateUser}
            style={{ background: '#00D9FF', color: '#0A0A0A', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
          >
            + Nuevo Usuario
          </button>
        )}
      </div>

      {error && <div style={{ marginTop: '0.75rem', color: '#FF5E00', fontSize: '0.9rem' }}>{error}</div>}

      {!loading && !error && (
        <div style={{ marginTop: '1rem', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '850px' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: '#8E8E93' }}>ID</th>
                <th style={{ textAlign: 'left', padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: '#8E8E93' }}>Nombre</th>
                <th style={{ textAlign: 'left', padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: '#8E8E93' }}>Email</th>
                <th style={{ textAlign: 'left', padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: '#8E8E93' }}>Sedes Asignadas</th>
                <th style={{ textAlign: 'left', padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: '#8E8E93' }}>Estado</th>
                <th style={{ textAlign: 'center', padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: '#8E8E93' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const fullName = [u?.profile?.firstName, u?.profile?.lastName].filter(Boolean).join(' ').trim();
                const roleId = Number(u?.userRoles?.[0]?.roleId);
                // Adaptado a nueva estructura: userRoles.gym en lugar de gyms directo
                const gymsList = u?.userRoles?.map((ur: any) => ur.gym).filter(Boolean) || [];
                const gymNames = gymsList.map((g: any) => u?.gymsMap?.get(g.id) || g.name || g.nombre).filter(Boolean);
                
                console.log("Datos del usuario en tabla:", { id: u.id, roleId, userRoles: u?.userRoles, gymsList, gymNames });
                
                return (
                  <tr key={u.id}>
                    <td style={{ padding: '0.6rem', borderBottom: '1px solid #3A3A3C' }}>{u.id}</td>
                    <td style={{ padding: '0.6rem', borderBottom: '1px solid #3A3A3C' }}>{fullName || '-'}</td>
                    <td style={{ padding: '0.6rem', borderBottom: '1px solid #3A3A3C' }}>{u.email}</td>
                    <td style={{ padding: '0.6rem', borderBottom: '1px solid #3A3A3C' }}>
                      {(roleId === 2 || roleId === 5 || roleId === 6) && gymNames.length > 0 ? (
                        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                          {gymNames.map((name: string, idx: number) => (
                            <span key={idx} style={{ 
                              background: 'rgba(0, 217, 255, 0.15)', 
                              backdropFilter: 'blur(10px)',
                              color: '#00D9FF', 
                              padding: '0.2rem 0.5rem', 
                              borderRadius: '4px', 
                              fontSize: '0.75rem',
                              border: '1px solid rgba(0, 217, 255, 0.3)'
                            }}>
                              {name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: '#8E8E93' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: u.isActive ? '#30D158' : '#FF5E00' }}>
                      {u.isActive ? 'ACTIVO' : 'INACTIVO'}
                    </td>
                    <td style={{ padding: '0.6rem', borderBottom: '1px solid #3A3A3C', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button onClick={() => setViewingUser(u)} style={{ background: 'rgba(0, 217, 255, 0.1)', color: '#00D9FF', border: '1px solid rgba(0, 217, 255, 0.3)', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }} title="Ver ficha completa">👁️ Detalle</button>
                        {(user?.role === 'SUPER_ADMIN' || user?.role === 'GERENTE') && (
                          <button onClick={() => handleEditUser(u)} style={{ background: '#00D9FF', color: '#0A0A0A', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Editar</button>
                        )}
                        {(user?.role === 'SUPER_ADMIN' || user?.role === 'GERENTE') && (
                          <button onClick={() => handleDeleteUser(u)} style={{ background: 'rgba(255, 94, 0, 0.1)', color: '#FF5E00', border: '1px solid #FF5E00', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Eliminar</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <UserModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        userToEdit={userToEdit} 
        onSave={handleSaveUser} 
      />

      <ConfirmModal
        isOpen={!!deleteConfirmUser}
        onClose={() => setDeleteConfirmUser(null)}
        onConfirm={confirmDeleteUser}
        title="Confirmar Eliminación"
        message={`¿Estás seguro de querer eliminar al usuario "${deleteConfirmUser?.email}"? Esta acción no se puede deshacer y borrará permanentemente sus datos de acceso y perfil.`}
      />

      <RecordDetailModal
        isOpen={!!viewingUser}
        onClose={() => setViewingUser(null)}
        title="Ficha Detallada de Usuario"
      >
        <DetailField label="ID de Usuario" value={viewingUser?.id} />
        <DetailField 
          label="Nombre Completo" 
          value={[viewingUser?.profile?.firstName, viewingUser?.profile?.lastName].filter(Boolean).join(' ') || '-'} 
        />
        <DetailField label="Correo Electrónico" value={viewingUser?.email} isFullWidth />
        <DetailField 
          label="Estado de Cuenta" 
          value={
            <span style={{ color: viewingUser?.isActive ? '#30D158' : '#FF5E00', fontWeight: 700 }}>
              {viewingUser?.isActive ? '● ACTIVO' : '● INACTIVO'}
            </span>
          } 
        />
        <DetailField 
          label="Rol del Sistema" 
          value={
            (() => {
              const roleId = Number(viewingUser?.userRoles?.[0]?.roleId);
              switch(roleId) {
                case 1: return 'SUPER_ADMIN (Administrador Global)';
                case 2: return 'GERENTE (Gerente de Sede)';
                case 3: return 'USER (Usuario Estándar)';
                case 4: return 'CLIENTE (Cliente Activo)';
                case 5: return 'ENTRENADOR';
                case 6: return 'NUTRICIONISTA';
                default: return 'Usuario';
              }
            })()
          } 
        />
        <DetailField 
          label="Sedes Asignadas" 
          isFullWidth 
          value={
            (() => {
              const gymsList = viewingUser?.userRoles?.map((ur: any) => ur.gym).filter(Boolean) || [];
              const gymNames = gymsList.map((g: any) => viewingUser?.gymsMap?.get(g.id) || g.name || g.nombre).filter(Boolean);
              return gymNames.length > 0 ? gymNames.join(', ') : 'Sin Sedes Asignadas (Acceso Global / Ninguna)';
            })()
          } 
        />
      </RecordDetailModal>
    </section>
  );
};