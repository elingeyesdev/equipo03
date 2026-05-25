import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../infrastructure/api.config';
import { DB_ROLES, ROLE_ID_TO_NAME } from '../../config/rbac.constants';
import { ModalOverlay, ConfirmModal, panelStyle, RecordDetailModal, DetailField } from './Shared/DashboardShared';
import type { GymDto, UserDto } from './Shared/DashboardTypes';

// ─── Roles que requieren asignación de sede (por nombre, no ID hardcodeado) ───
const SEDE_ROLE_NAMES = new Set([
  'GERENTE', 'ENTRENADOR', 'NUTRICIONISTA', 'INSTRUCTOR',
  'COORDINADOR', 'PERSONAL_DE_LIMPIEZA',
]);

// ─── Interfaz para roles cargados dinámicamente ───────────────────────────────
interface RoleOption { id: number; name: string; label: string; }

// ─── Formatea el nombre DB al label legible ───────────────────────────────────
const formatRoleName = (name: string): string => {
  const map: Record<string, string> = {
    SUPER_ADMIN: 'Super Administrador',
    GERENTE: 'Gerente de Sede',
    ENTRENADOR: 'Entrenador',
    NUTRICIONISTA: 'Nutricionista',
    CLIENTE: 'Cliente Activo',
    USER: 'Usuario Estándar',
    INSTRUCTOR: 'Instructor',
    COORDINADOR: 'Coordinador',
    PERSONAL_DE_LIMPIEZA: 'Personal de Limpieza',
  };
  return map[name] ?? name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// ─── Componente Modal de creación/edición (usa Portal via ModalOverlay) ───────
const UserModal = ({ isOpen, onClose, userToEdit, onSave, roleOptions }: {
  isOpen: boolean; onClose: () => void; userToEdit: any; onSave: (d: any) => void;
  roleOptions: RoleOption[];
}) => {
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', password: '', phone: '', ci: '',
    roleId: DB_ROLES.USER as number, gymIds: [] as number[], isActive: true,
  });
  const [gyms, setGyms] = useState<GymDto[]>([]);
  const [loadingGyms, setLoadingGyms] = useState(false);
  // Para GERENTE: selección en dos pasos (sede → sucursal)
  const [selectedSede, setSelectedSede] = useState<number | ''>('');

  // ── Derivados: sedes (marcas) y sucursales (gymns físicos) ────────────────────
  const sedes      = gyms.filter(g => (g.maxCapacity ?? 0) === 0);
  const sucursales = gyms.filter(g => (g.maxCapacity ?? 0) > 0);
  // Sucursales que pertenecen a la sede seleccionada
  const sucursalesParaSede = selectedSede !== ''
    ? sucursales.filter(s => (s.parentId ?? s.parent?.id) === selectedSede)
    : [];

  // ── Cargar gyms al abrir ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    setLoadingGyms(true);
    apiClient.get('/gyms')
      .then(res => setGyms(Array.isArray(res.data) ? res.data : []))
      .catch(() => console.error('Error al cargar sedes.'))
      .finally(() => setLoadingGyms(false));
  }, [isOpen]);

  // ── Poblar formulario al abrir ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    if (userToEdit) {
      const gymsFromRoles = (userToEdit.userRoles ?? []).map((ur: any) => ur?.gym).filter(Boolean);
      setFormData({
        firstName: userToEdit.profile?.firstName ?? '',
        lastName:  userToEdit.profile?.lastName  ?? '',
        phone:     userToEdit.profile?.phone     ?? '',
        ci:        userToEdit.profile?.ci        ?? '',
        email:     userToEdit.email ?? '',
        password:  '',
        roleId:    Number(userToEdit.userRoles?.[0]?.roleId) || DB_ROLES.USER,
        gymIds:    gymsFromRoles.map((g: any) => Number(g.id)),
        isActive:  userToEdit.isActive ?? true,
      });
    } else {
      setFormData({ firstName: '', lastName: '', email: '', password: '', phone: '', ci: '', roleId: DB_ROLES.USER, gymIds: [], isActive: true });
    }
    setSelectedSede('');
  }, [userToEdit, isOpen]);

  // ── Pre-poblar selectedSede al editar un GERENTE (espera que gyms cargue) ─────
  useEffect(() => {
    if (!isOpen || !userToEdit || formData.roleId !== DB_ROLES.GERENTE || !gyms.length) return;
    const sucursalId = formData.gymIds[0];
    if (!sucursalId) return;
    const sucursal = gyms.find(g => g.id === sucursalId);
    const sedeId   = sucursal?.parentId ?? sucursal?.parent?.id;
    if (sedeId) setSelectedSede(sedeId);
  }, [gyms, formData.gymIds, formData.roleId, isOpen, userToEdit]);

  const toggleGym  = (id: number) => setFormData(p => ({
    ...p, gymIds: p.gymIds.includes(id) ? p.gymIds.filter(x => x !== id) : [...p.gymIds, id],
  }));

  // Determina el nombre del rol seleccionado (usando datos reales de la BD)
  const selectedRoleName = roleOptions.find(r => r.id === formData.roleId)?.name ?? '';
  const isGerente  = selectedRoleName === 'GERENTE';
  const needsSede  = SEDE_ROLE_NAMES.has(selectedRoleName);
  const needsMulti = needsSede && !isGerente;

  if (!isOpen) return null;

  // ── Estilos compartidos ────────────────────────────────────────────────────────
  const selectStyle = (invalid: boolean): React.CSSProperties => ({
    width: '100%', padding: '0.5rem', borderRadius: '6px',
    color: '#fff', background: '#0A0A0A',
    border: invalid ? '1px solid #ef4444' : '1px solid #3A3A3C',
  });

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
          <label>Teléfono</label>
          <input type="tel" value={formData.phone}
            onChange={e => setFormData({ ...formData, phone: e.target.value })}
            placeholder="Ej. +591 70000000" />
        </div>
        <div className="modal-form-group">
          <label>Carnet de Identidad (CI) <span style={{ color: '#8E8E93', fontWeight: 400, fontSize: '0.8rem' }}>— opcional</span></label>
          <input type="text" value={formData.ci}
            onChange={e => setFormData({ ...formData, ci: e.target.value })}
            placeholder="Ej. 12345678" maxLength={20} />
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
            onChange={e => {
              setFormData({ ...formData, roleId: Number(e.target.value), gymIds: [] });
              setSelectedSede('');
            }}>
            {roleOptions.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
        </div>

        {/* ── GERENTE: selección en dos pasos ──────────────────────────────────── */}
        {isGerente && (
          <div style={{
            background: 'rgba(255,94,0,0.05)',
            border: '1px solid rgba(255,94,0,0.2)',
            borderRadius: '10px',
            padding: '1rem',
            marginBottom: '0.75rem',
            display: 'flex', flexDirection: 'column', gap: '0.75rem',
          }}>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#FF5E00', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              📍 Asignación de Sede y Sucursal
            </p>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#8E8E93', lineHeight: 1.5 }}>
              Una <strong style={{ color: '#E5E5EA' }}>Sede</strong> es la marca/organización (ej. "Smart Fit").
              Una <strong style={{ color: '#E5E5EA' }}>Sucursal</strong> es el gimnasio físico que administrará el gerente (ej. "Smart Fit - Centro").
            </p>

            {/* Paso 1: Sede (Marca) */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 600 }}>
                1 · Sede (Marca) *
              </label>
              {loadingGyms ? <p style={{ color: '#8E8E93', fontSize: '0.85rem' }}>Cargando...</p> : (
                <select
                  value={selectedSede}
                  onChange={e => {
                    setSelectedSede(Number(e.target.value) || '');
                    setFormData(p => ({ ...p, gymIds: [] }));
                  }}
                  style={selectStyle(!selectedSede)}
                >
                  <option value="">— Seleccionar Sede (Marca) —</option>
                  {sedes.map(s => <option key={s.id} value={s.id} style={{ background: '#0A0A0A' }}>{s.name}</option>)}
                </select>
              )}
            </div>

            {/* Paso 2: Sucursal (habilitado tras elegir sede) */}
            <div style={{ opacity: selectedSede !== '' ? 1 : 0.4, transition: 'opacity 0.2s' }}>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 600 }}>
                2 · Sucursal a Administrar *
              </label>
              {selectedSede !== '' && sucursalesParaSede.length === 0 ? (
                <p style={{ margin: 0, color: '#EF4444', fontSize: '0.83rem', padding: '0.5rem', background: 'rgba(239,68,68,0.08)', borderRadius: '6px' }}>
                  ⚠️ Esta sede no tiene sucursales registradas aún.
                </p>
              ) : (
                <select
                  value={formData.gymIds[0] ?? ''}
                  onChange={e => setFormData(p => ({ ...p, gymIds: e.target.value ? [Number(e.target.value)] : [] }))}
                  disabled={selectedSede === ''}
                  style={selectStyle(selectedSede !== '' && formData.gymIds.length === 0)}
                >
                  <option value="">— Seleccionar Sucursal —</option>
                  {sucursalesParaSede.map(s => (
                    <option key={s.id} value={s.id} style={{ background: '#0A0A0A' }}>{s.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        )}

        {/* ── ENTRENADOR / NUTRICIONISTA: sucursales agrupadas por sede ────────── */}
        {needsMulti && (
          <div className="modal-form-group">
            <label>
              Sucursales Asignadas{' '}
              <span style={{ color: '#8E8E93', fontWeight: 400, fontSize: '0.78rem' }}>— puede seleccionar múltiples</span>
            </label>
            {loadingGyms ? <p style={{ color: '#8E8E93' }}>Cargando...</p> : (
              <div style={{
                display: 'flex', flexDirection: 'column', gap: '0.6rem',
                maxHeight: '220px', overflowY: 'auto', padding: '0.6rem',
                background: 'rgba(255,255,255,0.04)', borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
                {sedes.map(sede => {
                  const hijos = sucursales.filter(s => (s.parentId ?? s.parent?.id) === sede.id);
                  if (hijos.length === 0) return null;
                  return (
                    <div key={sede.id}>
                      <div style={{
                        color: '#8E8E93', fontSize: '0.7rem', fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.07em',
                        marginBottom: '0.25rem', paddingBottom: '0.25rem',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                      }}>
                        🏢 {sede.name}
                      </div>
                      {hijos.map(g => (
                        <label key={g.id} style={{
                          display: 'flex', alignItems: 'center', gap: '0.5rem',
                          padding: '0.3rem 0.4rem', cursor: 'pointer', borderRadius: '4px',
                          background: formData.gymIds.includes(Number(g.id)) ? 'rgba(0,217,255,0.08)' : 'transparent',
                        }}>
                          <input type="checkbox" checked={formData.gymIds.includes(Number(g.id))}
                            onChange={() => toggleGym(Number(g.id))}
                            style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: '#00D9FF' }} />
                          <span style={{ fontSize: '0.86rem' }}>🏪 {g.name}</span>
                        </label>
                      ))}
                    </div>
                  );
                })}
                {/* Sucursales sin sede padre registrada */}
                {sucursales.filter(s => !s.parentId && !s.parent?.id).map(g => (
                  <label key={g.id} style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.3rem 0.4rem', cursor: 'pointer', borderRadius: '4px',
                    background: formData.gymIds.includes(Number(g.id)) ? 'rgba(0,217,255,0.08)' : 'transparent',
                  }}>
                    <input type="checkbox" checked={formData.gymIds.includes(Number(g.id))}
                      onChange={() => toggleGym(Number(g.id))}
                      style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: '#00D9FF' }} />
                    <span style={{ fontSize: '0.86rem' }}>🏪 {g.name}</span>
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
          if (isGerente) {
            if (!selectedSede) {
              toast.error('Debes seleccionar la Sede (Marca) a la que pertenece el Gerente');
              return;
            }
            if (formData.gymIds.length === 0) {
              toast.error('Debes seleccionar la Sucursal que administrará el Gerente');
              return;
            }
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

  // ── Roles dinámicos desde la BD ───────────────────────────────────────────────
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);
  useEffect(() => {
    apiClient.get('/roles')
      .then((res: any) => {
        const raw: any[] = Array.isArray(res) ? res : (res?.data ?? []);
        setRoleOptions(
          raw
            .filter((r: any) => r.isActive !== false)
            .sort((a: any, b: any) => (b.hierarchyLevel ?? 0) - (a.hierarchyLevel ?? 0))
            .map((r: any) => ({ id: r.id, name: r.name, label: formatRoleName(r.name) }))
        );
      })
      .catch(() => {});
  }, []);

  // ── Catálogo de gyms para el mapa sede↔sucursal en la ficha detallada ────────
  const [gymsCatalog, setGymsCatalog] = useState<GymDto[]>([]);
  useEffect(() => {
    apiClient.get('/gyms')
      .then(res => setGymsCatalog(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});
  }, []);

  /** Mapa sucursalId → { sucursalName, sedeId, sedeName } */
  const gymInfoMap = useMemo(() => {
    const sedes      = gymsCatalog.filter(g => (g.maxCapacity ?? 0) === 0);
    const sucursales = gymsCatalog.filter(g => (g.maxCapacity ?? 0) > 0);
    const sedesById  = new Map(sedes.map(s => [s.id, s.name]));
    const map = new Map<number, { sucursalName: string; sedeId: number | null; sedeName: string }>();
    sucursales.forEach(s => {
      const sedeId = s.parentId ?? s.parent?.id ?? null;
      map.set(s.id, {
        sucursalName: s.name,
        sedeId,
        sedeName: sedeId ? (sedesById.get(sedeId) ?? `Sede #${sedeId}`) : 'Sin Sede Registrada',
      });
    });
    return map;
  }, [gymsCatalog]);

  // ── Carga inicial ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    setUsers([]);
    setError(null);

    const load = async () => {
      if (!user) { setLoading(false); return; }
      try {
        setLoading(true);
        const res = await apiClient.get('/users');
        if (!mounted) return;
        const data: UserDto[] = Array.isArray(res.data)
          ? res.data
          : (res as any)?.data ?? [];
        setUsers(data);
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

  // ── Filtros ───────────────────────────────────────────────────────────────────
  const [search,       setSearch]       = useState('');
  const [filterRole,   setFilterRole]   = useState('');
  const [filterGym,    setFilterGym]    = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortOrder,    setSortOrder]    = useState<'az' | 'za' | 'id_asc' | 'id_desc'>('az');

  // Gyms únicos que aparecen en los roles de los usuarios (para el filtro)
  const gymOptions = useMemo(() => {
    const map = new Map<number, string>();
    users.forEach(u => {
      (u?.userRoles ?? []).forEach((ur: any) => {
        if (ur?.gym?.id) map.set(Number(ur.gym.id), ur.gym.name ?? `Gym #${ur.gym.id}`);
      });
    });
    return [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [users]);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users
      .filter(u => {
        const fullName = [u?.profile?.firstName, u?.profile?.lastName].filter(Boolean).join(' ').toLowerCase();
        const email    = (u?.email ?? '').toLowerCase();
        if (term && !fullName.includes(term) && !email.includes(term)) return false;

        if (filterRole) {
          const rId = String(Number(u?.userRoles?.[0]?.roleId ?? 0));
          if (rId !== filterRole) return false;
        }

        if (filterGym) {
          const gymIds = (u?.userRoles ?? []).map((ur: any) => String(ur?.gym?.id)).filter(Boolean);
          if (!gymIds.includes(filterGym)) return false;
        }

        if (filterStatus === 'active'   && !u.isActive) return false;
        if (filterStatus === 'inactive' &&  u.isActive) return false;
        return true;
      })
      .sort((a, b) => {
        const nameA = [a?.profile?.firstName, a?.profile?.lastName].filter(Boolean).join(' ');
        const nameB = [b?.profile?.firstName, b?.profile?.lastName].filter(Boolean).join(' ');
        if (sortOrder === 'az') return nameA.localeCompare(nameB);
        if (sortOrder === 'za') return nameB.localeCompare(nameA);
        if (sortOrder === 'id_asc')  return Number(a.id) - Number(b.id);
        return Number(b.id) - Number(a.id);
      });
  }, [users, search, filterRole, filterGym, filterStatus, sortOrder]);

  const hasActiveFilters = search || filterRole || filterGym || filterStatus !== 'all' || sortOrder !== 'az';
  const resetFilters = () => { setSearch(''); setFilterRole(''); setFilterGym(''); setFilterStatus('all'); setSortOrder('az'); };

  // ── Re-fetch directo (no usa el use-case para evitar fallos silenciosos de RBAC) ──
  const recargarUsuarios = async () => {
    const res = await apiClient.get('/users');
    const fresh: UserDto[] = Array.isArray(res.data)
      ? res.data
      : (res as any)?.data ?? [];
    setUsers(fresh);
  };

  // ── Acciones CRUD ────────────────────────────────────────────────────────────
  const handleSaveUser = async (formData: any) => {
    try {
      const emailTrimmed = formData.email?.trim();
      const payload: any = {
        // Solo envía email si tiene valor (evita error 400 de @IsEmail con cadena vacía)
        ...(emailTrimmed ? { email: emailTrimmed } : {}),
        firstName: formData.firstName?.trim() || undefined,
        lastName:  formData.lastName?.trim()  || undefined,
        // Solo envía phone/ci si tienen valor (campos opcionales)
        ...(formData.phone?.trim() ? { phone: formData.phone.trim() } : {}),
        ...(formData.ci?.trim()    ? { ci:    formData.ci.trim()    } : {}),
        roleId:    Number(formData.roleId),
        gymIds: [DB_ROLES.SUPER_ADMIN, DB_ROLES.CLIENTE, DB_ROLES.USER].includes(Number(formData.roleId))
          ? []
          : (formData.gymIds || []).map(Number),
        isActive: formData.isActive,
      };

      // 🔐 RBAC GERENTE: forzar gymId propio
      if (user?.role === 'GERENTE' && user?.gymId) {
        payload.gymIds = [Number(user.gymId)];
      }

      if (formData.password?.trim()) payload.password = formData.password.trim();

      if (userToEdit) {
        await apiClient.put(`/users/${userToEdit.id}`, payload);
      } else {
        await apiClient.post('/users', payload);
      }

      // Re-fetch directo: garantiza que la lista refleja el estado real del servidor
      await recargarUsuarios();

      setIsModalOpen(false);
      setUserToEdit(null);
      toast.success(userToEdit ? 'Usuario actualizado.' : 'Usuario creado.');
    } catch (err: any) {
      console.error('[handleSaveUser]', err);
      // El interceptor de apiClient ya muestra el toast de error correspondiente
    }
  };

  const confirmDeleteUser = async () => {
    if (!deleteConfirmUser) return;
    try {
      await apiClient.delete(`/users/${deleteConfirmUser.id}`);
      toast.success('Usuario eliminado.');
      await recargarUsuarios();
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

      {/* ── Barra de filtros ── */}
      {!loading && !error && users.length > 0 && (
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '1rem', marginBottom: '0.5rem' }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍  Buscar por nombre o email..."
            style={{ flex: 1, minWidth: '200px', background: '#1C1C1E', color: '#E5E5EA', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '0.5rem 0.9rem', fontSize: '0.85rem', outline: 'none' }}
          />
          {/* Rol */}
          <div style={{ position: 'relative' }}>
            <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
              style={{ background: '#1C1C1E', color: '#E5E5EA', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '0.5rem 2rem 0.5rem 0.9rem', fontSize: '0.85rem', appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer', outline: 'none' }}>
              <option value="" style={{ background: '#1C1C1E' }}>Todos los roles</option>
              {roleOptions.map(r => <option key={r.id} value={r.id} style={{ background: '#1C1C1E' }}>{r.label}</option>)}
            </select>
            <span style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#8E8E93', fontSize: '0.7rem' }}>▼</span>
          </div>
          {/* Sede asignada */}
          {gymOptions.length > 0 && (
            <div style={{ position: 'relative' }}>
              <select value={filterGym} onChange={e => setFilterGym(e.target.value)}
                style={{ background: '#1C1C1E', color: '#E5E5EA', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '0.5rem 2rem 0.5rem 0.9rem', fontSize: '0.85rem', appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer', outline: 'none', maxWidth: '180px' }}>
                <option value="" style={{ background: '#1C1C1E' }}>Todas las sedes</option>
                {gymOptions.map(g => <option key={g.id} value={g.id} style={{ background: '#1C1C1E' }}>{g.name}</option>)}
              </select>
              <span style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#8E8E93', fontSize: '0.7rem' }}>▼</span>
            </div>
          )}
          {/* Estado */}
          <div style={{ position: 'relative' }}>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}
              style={{ background: '#1C1C1E', color: '#E5E5EA', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '0.5rem 2rem 0.5rem 0.9rem', fontSize: '0.85rem', appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer', outline: 'none' }}>
              <option value="all"      style={{ background: '#1C1C1E' }}>Todos</option>
              <option value="active"   style={{ background: '#1C1C1E' }}>Solo Activos</option>
              <option value="inactive" style={{ background: '#1C1C1E' }}>Solo Inactivos</option>
            </select>
            <span style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#8E8E93', fontSize: '0.7rem' }}>▼</span>
          </div>
          {/* Orden */}
          <div style={{ position: 'relative' }}>
            <select value={sortOrder} onChange={e => setSortOrder(e.target.value as any)}
              style={{ background: '#1C1C1E', color: '#E5E5EA', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '0.5rem 2rem 0.5rem 0.9rem', fontSize: '0.85rem', appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer', outline: 'none' }}>
              <option value="az"       style={{ background: '#1C1C1E' }}>Nombre A → Z</option>
              <option value="za"       style={{ background: '#1C1C1E' }}>Nombre Z → A</option>
              <option value="id_asc"   style={{ background: '#1C1C1E' }}>ID ↑</option>
              <option value="id_desc"  style={{ background: '#1C1C1E' }}>ID ↓</option>
            </select>
            <span style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#8E8E93', fontSize: '0.7rem' }}>▼</span>
          </div>
          {hasActiveFilters && (
            <button onClick={resetFilters}
              style={{ background: 'none', color: '#8E8E93', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.45rem 0.85rem', cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
              ✕ Limpiar
            </button>
          )}
        </div>
      )}

      {/* Contador */}
      {!loading && !error && users.length > 0 && (
        <div style={{ color: '#8E8E93', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
          {filteredUsers.length === users.length
            ? `${users.length} usuario${users.length !== 1 ? 's' : ''} · Activos: ${usuariosActivos}`
            : `${filteredUsers.length} de ${users.length} usuarios`}
        </div>
      )}

      {!loading && !error && users.length === 0 && (
        <div style={{ marginTop: '2rem', textAlign: 'center', color: '#8E8E93', padding: '2rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)' }}>
          <p style={{ fontSize: '1.5rem', margin: '0 0 0.5rem' }}>👥</p>
          <p>No hay usuarios disponibles en esta sede.</p>
        </div>
      )}

      {!loading && !error && users.length > 0 && (
        <div style={{ marginTop: '0.5rem', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '850px' }}>
            <thead>
              <tr>
                {['ID', 'Nombre', 'Email', 'Rol', 'Sucursal / Sede', 'Estado', 'Acciones'].map(h => (
                  <th key={h} style={{ textAlign: h === 'Acciones' ? 'center' : 'left', padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: '#8E8E93' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#8E8E93' }}>Sin resultados para los filtros aplicados.</td></tr>
              ) : filteredUsers.map(u => {
                const fullName  = [u?.profile?.firstName, u?.profile?.lastName].filter(Boolean).join(' ').trim() || '-';
                const roleId    = Number(u?.userRoles?.[0]?.roleId ?? 0);
                // Prioridad: joined role object del backend > roleOptions dinámico > ROLE_ID_TO_NAME hardcodeado
                const roleNameRaw = (u?.userRoles?.[0] as any)?.role?.name
                  ?? roleOptions.find(r => r.id === roleId)?.name
                  ?? ROLE_ID_TO_NAME[roleId]
                  ?? 'SIN_ROL';
                const roleDisplay = formatRoleName(roleNameRaw);
                const gymsList  = (u?.userRoles ?? []).map((ur: any) => ur?.gym).filter(Boolean);
                const gymNames  = gymsList.map((g: any) => (u as any)?.gymsMap?.get(Number(g?.id)) ?? g?.name ?? '').filter(Boolean);
                const showSedes = SEDE_ROLE_NAMES.has(roleNameRaw) && gymNames.length > 0;

                return (
                  <tr key={u.id}>
                    <td style={{ padding: '0.6rem', borderBottom: '1px solid #3A3A3C' }}>{u.id}</td>
                    <td style={{ padding: '0.6rem', borderBottom: '1px solid #3A3A3C' }}>{fullName}</td>
                    <td style={{ padding: '0.6rem', borderBottom: '1px solid #3A3A3C' }}>{u.email ?? '-'}</td>
                    <td style={{ padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: '#8E8E93', fontSize: '0.85rem' }}>{roleDisplay}</td>
                    <td style={{ padding: '0.6rem', borderBottom: '1px solid #3A3A3C' }}>
                      {showSedes ? (() => {
                        const first  = gymsList[0] as any;
                        const extras = gymsList.length - 1;
                        const gId    = Number(first?.id);
                        const info   = gymInfoMap.get(gId);
                        const sucursalName = info?.sucursalName ?? first?.name ?? `Gym #${gId}`;
                        const sedeName     = info?.sedeName;
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {/* Primera sucursal siempre visible */}
                            <span style={{
                              background: 'rgba(0,217,255,0.12)', color: '#00D9FF',
                              padding: '0.18rem 0.5rem', borderRadius: '4px',
                              fontSize: '0.75rem', border: '1px solid rgba(0,217,255,0.25)',
                              fontWeight: 600, display: 'inline-block',
                            }}>🏪 {sucursalName}</span>
                            {sedeName && (
                              <span style={{ fontSize: '0.68rem', color: '#8E8E93', paddingLeft: '0.2rem' }}>
                                🏢 {sedeName}
                              </span>
                            )}
                            {/* Badge compacto si hay más */}
                            {extras > 0 && (
                              <span
                                onClick={() => setViewingUser(u)}
                                title="Ver ficha completa"
                                style={{
                                  fontSize: '0.7rem', color: '#8E8E93',
                                  cursor: 'pointer', marginTop: '1px',
                                  textDecoration: 'underline dotted',
                                  display: 'inline-block',
                                }}
                              >
                                y {extras} {extras === 1 ? 'sucursal más' : 'sucursales más'}
                              </span>
                            )}
                          </div>
                        );
                      })() : (
                        <span style={{ color: '#8E8E93', fontSize: '0.82rem' }}>Sin asignar</span>
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

      <UserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} userToEdit={userToEdit} onSave={handleSaveUser} roleOptions={roleOptions} />

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
        <DetailField label="Correo Electrónico" value={viewingUser?.email} />
        <DetailField label="Carnet de Identidad (CI)" value={viewingUser?.profile?.ci || 'Sin registrar'} />
        <DetailField label="Teléfono" value={viewingUser?.profile?.phone || 'No registrado'} />
        <DetailField label="Estado de Cuenta"
          value={
            <span style={{ color: viewingUser?.isActive ? '#30D158' : '#FF5E00', fontWeight: 700 }}>
              {viewingUser?.isActive ? '● ACTIVO' : '● INACTIVO'}
            </span>
          } />
        <DetailField label="Rol del Sistema" isFullWidth
          value={(() => {
            const rId   = Number(viewingUser?.userRoles?.[0]?.roleId ?? 0);
            const name  = ROLE_ID_TO_NAME[rId] ?? 'Usuario';
            const label = roleOptions.find(r => r.id === rId)?.label ?? name;
            return `${name} · ${label}`;
          })()} />

        {/* ── Asignación: desglose sede + sucursal según rol ── */}
        {(() => {
          const rId        = Number(viewingUser?.userRoles?.[0]?.roleId ?? 0);
          const hasAssign  = SEDE_ROLE_NAMES.has(roleOptions.find(r => r.id === rId)?.name ?? ROLE_ID_TO_NAME[rId] ?? '');
          const gymsInRoles = (viewingUser?.userRoles ?? []).map((ur: any) => ur?.gym).filter(Boolean);

          if (!hasAssign || gymsInRoles.length === 0) {
            return (
              <DetailField
                label="Sucursal Asignada"
                isFullWidth
                value={<span style={{ color: '#636366', fontStyle: 'italic' }}>Sin asignar</span>}
              />
            );
          }

          // GERENTE: siempre 1 sucursal → mostrar dos campos lado a lado
          if (rId === DB_ROLES.GERENTE) {
            const g     = gymsInRoles[0] as any;
            const gId   = Number(g?.id);
            const info  = gymInfoMap.get(gId);
            // Fallback: si gymInfoMap aún no cargó, usar el dato que viene en el rol
            const sedeName     = info?.sedeName     ?? g?.parent?.name ?? g?.gym?.name ?? '—';
            const sucursalName = info?.sucursalName ?? g?.name ?? `Gym #${gId}`;
            return (
              <>
                <DetailField
                  label="🏢 Sede (Marca)"
                  value={<span style={{ color: '#FF5E00', fontWeight: 600 }}>{sedeName}</span>}
                />
                <DetailField
                  label="🏪 Sucursal Asignada"
                  value={<span style={{ color: '#00D9FF', fontWeight: 600 }}>{sucursalName}</span>}
                />
              </>
            );
          }

          // ENTRENADOR / NUTRICIONISTA: puede tener varias → una fila por sucursal
          return (
            <DetailField
              label={`🏪 Sucursales Asignadas (${gymsInRoles.length})`}
              isFullWidth
              value={
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
                  {gymsInRoles.map((g: any, i: number) => {
                    const gId   = Number(g?.id);
                    const info  = gymInfoMap.get(gId);
                    const sucursalName = info?.sucursalName ?? g?.name ?? `Gym #${gId}`;
                    const sedeName     = info?.sedeName     ?? g?.parent?.name ?? null;
                    return (
                      <div key={i} style={{
                        padding: '0.5rem 0.75rem',
                        background: 'rgba(0,217,255,0.06)',
                        borderRadius: '6px',
                        border: '1px solid rgba(0,217,255,0.15)',
                      }}>
                        <div style={{ color: '#00D9FF', fontWeight: 600, fontSize: '0.88rem' }}>🏪 {sucursalName}</div>
                        {sedeName && (
                          <div style={{ color: '#8E8E93', fontSize: '0.78rem', marginTop: '0.2rem' }}>
                            🏢 {sedeName}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              }
            />
          );
        })()}
      </RecordDetailModal>
    </section>
  );
};