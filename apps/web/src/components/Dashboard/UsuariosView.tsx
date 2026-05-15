import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../infrastructure/api.config';
import { UseCaseFactory } from '../../infrastructure/UseCaseFactory';
import { DB_ROLES, ROLE_ID_TO_NAME } from '../../config/rbac.constants';
import { ModalOverlay, ConfirmModal, panelStyle, RecordDetailModal, DetailField } from './Shared/DashboardShared';
import type { GymDto, UserDto } from './Shared/DashboardTypes';

// ─── Constante: roles que requieren asignación de sede ───────────────────────
const ROLES_WITH_SEDE = [DB_ROLES.GERENTE, DB_ROLES.ENTRENADOR, DB_ROLES.NUTRICIONISTA];

// ─── Lista de roles sincronizada con DB_ROLES ─────────────────────────────────
const ROLE_OPTIONS = [
  { id: DB_ROLES.SUPER_ADMIN,   label: 'Super Administrador' },
  { id: DB_ROLES.GERENTE,       label: 'Gerente de Sede' },
  { id: DB_ROLES.ENTRENADOR,    label: 'Entrenador' },
  { id: DB_ROLES.NUTRICIONISTA, label: 'Nutricionista' },
  { id: DB_ROLES.CLIENTE,       label: 'Cliente Activo' },
  { id: DB_ROLES.USER,          label: 'Usuario Estándar' },
] as const;

// ─── Caso de uso obtenido via Factory (no usamos 'new' en la vista) ──────────
const obtenerUsuariosUseCase = UseCaseFactory.getObtenerUsuariosUC();

// ─── Componente Modal de creación/edición (usa Portal via ModalOverlay) ───────
const UserModal = ({ isOpen, onClose, userToEdit, onSave }: any) => {
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', password: '',
    roleId: DB_ROLES.USER as number, gymIds: [] as number[], isActive: true,
  });
  const [gyms, setGyms] = useState<GymDto[]>([]);
  const [loadingGyms, setLoadingGyms] = useState(false);

  // Cargar sedes al abrir
  useEffect(() => {
    if (!isOpen) return;
    setLoadingGyms(true);
    apiClient.get('/gyms')
      .then(res => setGyms(Array.isArray(res.data) ? res.data : []))
      .catch(() => console.error('Error al cargar sedes.'))
      .finally(() => setLoadingGyms(false));
  }, [isOpen]);

  // Poblar formulario
  useEffect(() => {
    if (!isOpen) return;
    if (userToEdit) {
      const gymsFromRoles = (userToEdit.userRoles ?? []).map((ur: any) => ur?.gym).filter(Boolean);
      setFormData({
        firstName: userToEdit.profile?.firstName ?? '',
        lastName:  userToEdit.profile?.lastName  ?? '',
        email:     userToEdit.email ?? '',
        password:  '',
        roleId:    Number(userToEdit.userRoles?.[0]?.roleId) || DB_ROLES.USER,
        gymIds:    gymsFromRoles.map((g: any) => Number(g.id)),
        isActive:  userToEdit.isActive ?? true,
      });
    } else {
      setFormData({ firstName: '', lastName: '', email: '', password: '', roleId: DB_ROLES.USER, gymIds: [], isActive: true });
    }
  }, [userToEdit, isOpen]);

  const toggleGym  = (id: number) => setFormData(p => ({
    ...p, gymIds: p.gymIds.includes(id) ? p.gymIds.filter(x => x !== id) : [...p.gymIds, id],
  }));
  const selectGym  = (id: number) => setFormData(p => ({ ...p, gymIds: [id] }));
  const needsMulti = formData.roleId === DB_ROLES.ENTRENADOR || formData.roleId === DB_ROLES.NUTRICIONISTA;

  if (!isOpen) return null;

  return (
    <ModalOverlay onClose={onClose}>
      <div className="modal-header">
        <h2 style={{ margin: 0 }}>{userToEdit ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
      </div>

      <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.25rem', marginTop: '1rem' }}>
        <div className="modal-form-group">
          <label>Nombre</label>
          <input type="text" value={formData.firstName}
            onChange={e => setFormData({ ...formData, firstName: e.target.value })}
            placeholder="Ej. Juan" />
        </div>
        <div className="modal-form-group">
          <label>Apellido</label>
          <input type="text" value={formData.lastName}
            onChange={e => setFormData({ ...formData, lastName: e.target.value })}
            placeholder="Ej. Pérez" />
        </div>
        <div className="modal-form-group">
          <label>Correo Electrónico</label>
          <input type="email" value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
            placeholder="correo@ejemplo.com" />
        </div>
        <div className="modal-form-group">
          <label>Contraseña{' '}
            {userToEdit && <span style={{ color: '#8E8E93', fontSize: '0.8rem' }}>(vacío = sin cambios)</span>}
          </label>
          <input type="password" value={formData.password}
            onChange={e => setFormData({ ...formData, password: e.target.value })}
            placeholder="••••••••" />
        </div>

        <div className="modal-form-group">
          <label>Rol del Sistema</label>
          <select value={formData.roleId}
            onChange={e => setFormData({ ...formData, roleId: Number(e.target.value), gymIds: [] })}>
            {ROLE_OPTIONS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
        </div>

        {formData.roleId === DB_ROLES.GERENTE && (
          <div className="modal-form-group">
            <label>Sede Asignada (Única) *</label>
            {loadingGyms ? <p style={{ color: '#8E8E93' }}>Cargando sedes...</p> : (
              <select value={formData.gymIds[0] ?? ''} onChange={e => selectGym(Number(e.target.value))}
                style={{
                  width: '100%', padding: '0.5rem', borderRadius: '6px', color: '#fff', background: '#0A0A0A',
                  border: formData.gymIds.length === 0 ? '1px solid #ef4444' : '1px solid #3A3A3C',
                }}>
                <option value="">Seleccionar sede</option>
                {gyms.map(g => <option key={g.id} value={g.id} style={{ background: '#0A0A0A' }}>{g.name}</option>)}
              </select>
            )}
          </div>
        )}

        {needsMulti && (
          <div className="modal-form-group">
            <label>Sedes Asignadas (Múltiples)</label>
            {loadingGyms ? <p style={{ color: '#8E8E93' }}>Cargando sedes...</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                {gyms.map(g => (
                  <label key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={formData.gymIds.includes(Number(g.id))}
                      onChange={() => toggleGym(Number(g.id))} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                    <span>{g.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="modal-form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input type="checkbox" style={{ width: 'auto' }} checked={formData.isActive}
            onChange={e => setFormData({ ...formData, isActive: e.target.checked })} />
          <label style={{ margin: 0 }}>Usuario Activo</label>
        </div>
      </div>

      <div className="modal-actions" style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
        <button className="btn-cancel" onClick={onClose}>Cancelar</button>
        <button className="btn-primary" onClick={() => {
          if (formData.roleId === DB_ROLES.GERENTE && formData.gymIds.length === 0) {
            toast.error('El Gerente de Sede debe tener asignada al menos una sede');
            return;
          }
          onSave(formData);
        }}>
          Guardar Usuario
        </button>
      </div>
    </ModalOverlay>
  );
};

// ─── Vista Principal de Usuarios ──────────────────────────────────────────────
export const UsuariosView = () => {
  const { user } = useAuth();
  const [users, setUsers]   = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  const [isModalOpen,       setIsModalOpen]       = useState(false);
  const [userToEdit,        setUserToEdit]        = useState<UserDto | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<UserDto | null>(null);
  const [viewingUser,       setViewingUser]       = useState<UserDto | null>(null);

  // ── Carga inicial ─────────────────────────────────────────────────────────────
  // El Core (ObtenerUsuariosUseCase) aplica el scope RBAC internamente.
  // La Vista solo renderiza lo que el caso de uso autoriza.
  useEffect(() => {
    let mounted = true;
    setUsers([]);
    setError(null);

    const load = async () => {
      if (!user) { setLoading(false); return; }
      try {
        setLoading(true);
        const authCtx = { userId: String(user.id), role: user.role, gymId: user.gymId };
        const result = await obtenerUsuariosUseCase.execute(authCtx);
        if (!mounted) return;
        if (result.isLeft()) {
          setError(result.value.message);
        } else {
          setUsers(result.value as UserDto[]);
        }
      } catch (err: any) {
        if (mounted) setError(err?.response?.data?.message || err?.message || 'No se pudo cargar usuarios.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.roleId, user?.gymId]);

  const usuariosActivos = useMemo(() => users.filter(u => !!u.isActive).length, [users]);

  // ── Acciones CRUD ────────────────────────────────────────────────────────────
  const handleSaveUser = async (formData: any) => {
    try {
      const payload: any = {
        email:     formData.email?.trim(),
        firstName: formData.firstName?.trim(),
        lastName:  formData.lastName?.trim(),
        roleId:    Number(formData.roleId),
        gymIds: [DB_ROLES.SUPER_ADMIN, DB_ROLES.CLIENTE, DB_ROLES.USER].includes(Number(formData.roleId))
          ? []
          : (formData.gymIds || []).map(Number),
        isActive: formData.isActive,
      };
      if (formData.password?.trim()) payload.password = formData.password.trim();

      if (userToEdit) {
        await apiClient.put(`/users/${userToEdit.id}`, payload);
      } else {
        await apiClient.post('/users', payload);
      }

      const authCtx = { userId: String(user!.id), role: user!.role, gymId: user!.gymId };
      const result = await obtenerUsuariosUseCase.execute(authCtx);
      if (result.isRight()) setUsers(result.value as UserDto[]);
      setIsModalOpen(false);
      toast.success(userToEdit ? 'Usuario actualizado.' : 'Usuario creado.');
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || err?.message || 'Error al guardar usuario.');
    }
  };

  const confirmDeleteUser = async () => {
    if (!deleteConfirmUser) return;
    try {
      await apiClient.delete(`/users/${deleteConfirmUser.id}`);
      setUsers(prev => prev.filter(u => u.id !== deleteConfirmUser.id));
      toast.success('Usuario eliminado.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Error al eliminar usuario.');
    } finally {
      setDeleteConfirmUser(null);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <section style={panelStyle} className="glass-panel">
      <h1 style={{ marginTop: 0 }}>Usuarios</h1>
      <p>
        {user?.role === 'SUPER_ADMIN'
          ? 'Gestión de usuarios de toda la red.'
          : 'Gestión de usuarios de tus sucursales asignadas.'}
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
        <div style={{ color: '#8E8E93', fontSize: '0.9rem' }}>
          {loading ? 'Cargando usuarios...' : `Total: ${users.length} | Activos: ${usuariosActivos}`}
        </div>
        {(user?.role === 'SUPER_ADMIN' || user?.role === 'GERENTE') && (
          <button onClick={() => { setUserToEdit(null); setIsModalOpen(true); }}
            style={{ background: '#00D9FF', color: '#0A0A0A', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
            + Nuevo Usuario
          </button>
        )}
      </div>

      {error && <div style={{ marginTop: '0.75rem', color: '#FF5E00', fontSize: '0.9rem' }}>{error}</div>}
      {loading && <div style={{ marginTop: '2rem', textAlign: 'center', color: '#8E8E93' }}>Cargando...</div>}

      {!loading && !error && users.length === 0 && (
        <div style={{ marginTop: '2rem', textAlign: 'center', color: '#8E8E93', padding: '2rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)' }}>
          <p style={{ fontSize: '1.5rem', margin: '0 0 0.5rem' }}>👥</p>
          <p>No hay usuarios disponibles en esta sede.</p>
        </div>
      )}

      {!loading && !error && users.length > 0 && (
        <div style={{ marginTop: '1rem', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '850px' }}>
            <thead>
              <tr>
                {['ID', 'Nombre', 'Email', 'Rol', 'Sedes Asignadas', 'Estado', 'Acciones'].map(h => (
                  <th key={h} style={{ textAlign: h === 'Acciones' ? 'center' : 'left', padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: '#8E8E93' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const fullName  = [u?.profile?.firstName, u?.profile?.lastName].filter(Boolean).join(' ').trim() || '-';
                const roleId    = Number(u?.userRoles?.[0]?.roleId ?? 0);
                const roleName  = ROLE_ID_TO_NAME[roleId] ?? 'Usuario';
                const gymsList  = (u?.userRoles ?? []).map((ur: any) => ur?.gym).filter(Boolean);
                const gymNames  = gymsList.map((g: any) => (u as any)?.gymsMap?.get(Number(g?.id)) ?? g?.name ?? '').filter(Boolean);
                const showSedes = ROLES_WITH_SEDE.includes(roleId as any) && gymNames.length > 0;

                return (
                  <tr key={u.id}>
                    <td style={{ padding: '0.6rem', borderBottom: '1px solid #3A3A3C' }}>{u.id}</td>
                    <td style={{ padding: '0.6rem', borderBottom: '1px solid #3A3A3C' }}>{fullName}</td>
                    <td style={{ padding: '0.6rem', borderBottom: '1px solid #3A3A3C' }}>{u.email ?? '-'}</td>
                    <td style={{ padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: '#8E8E93', fontSize: '0.85rem' }}>{roleName}</td>
                    <td style={{ padding: '0.6rem', borderBottom: '1px solid #3A3A3C' }}>
                      {showSedes ? (
                        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                          {gymNames.map((name: string, i: number) => (
                            <span key={i} style={{
                              background: 'rgba(0,217,255,0.15)', backdropFilter: 'blur(10px)',
                              color: '#00D9FF', padding: '0.2rem 0.5rem', borderRadius: '4px',
                              fontSize: '0.75rem', border: '1px solid rgba(0,217,255,0.3)',
                            }}>{name}</span>
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
                        <button onClick={() => setViewingUser(u)}
                          style={{ background: 'rgba(0,217,255,0.1)', color: '#00D9FF', border: '1px solid rgba(0,217,255,0.3)', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                          👁️ Detalle
                        </button>
                        {(user?.role === 'SUPER_ADMIN' || user?.role === 'GERENTE') && (<>
                          <button onClick={() => { setUserToEdit(u); setIsModalOpen(true); }}
                            style={{ background: '#00D9FF', color: '#0A0A0A', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                            Editar
                          </button>
                          <button onClick={() => setDeleteConfirmUser(u)}
                            style={{ background: 'rgba(255,94,0,0.1)', color: '#FF5E00', border: '1px solid #FF5E00', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                            Eliminar
                          </button>
                        </>)}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <UserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} userToEdit={userToEdit} onSave={handleSaveUser} />

      <ConfirmModal
        isOpen={!!deleteConfirmUser}
        onClose={() => setDeleteConfirmUser(null)}
        onConfirm={confirmDeleteUser}
        title="Confirmar Eliminación"
        message={`¿Estás seguro de querer eliminar al usuario "${deleteConfirmUser?.email}"? Esta acción no se puede deshacer.`}
      />

      <RecordDetailModal isOpen={!!viewingUser} onClose={() => setViewingUser(null)} title="Ficha Detallada de Usuario">
        <DetailField label="ID de Usuario" value={viewingUser?.id} />
        <DetailField label="Nombre Completo"
          value={[viewingUser?.profile?.firstName, viewingUser?.profile?.lastName].filter(Boolean).join(' ') || '-'} />
        <DetailField label="Correo Electrónico" value={viewingUser?.email} isFullWidth />
        <DetailField label="Estado de Cuenta"
          value={
            <span style={{ color: viewingUser?.isActive ? '#30D158' : '#FF5E00', fontWeight: 700 }}>
              {viewingUser?.isActive ? '● ACTIVO' : '● INACTIVO'}
            </span>
          } />
        <DetailField label="Rol del Sistema"
          value={(() => {
            const rId = Number(viewingUser?.userRoles?.[0]?.roleId ?? 0);
            const name = ROLE_ID_TO_NAME[rId] ?? 'Usuario';
            const label = ROLE_OPTIONS.find(r => r.id === rId)?.label ?? name;
            return `${name} (${label})`;
          })()} />
        <DetailField label="Sedes Asignadas" isFullWidth
          value={(() => {
            const gyms = (viewingUser?.userRoles ?? []).map((ur: any) => ur?.gym).filter(Boolean);
            const names = gyms.map((g: any) => (viewingUser as any)?.gymsMap?.get(Number(g?.id)) ?? g?.name ?? '').filter(Boolean);
            return names.length > 0 ? names.join(', ') : 'Sin Sedes Asignadas (Acceso Global / Ninguna)';
          })()} />
      </RecordDetailModal>
    </section>
  );
};