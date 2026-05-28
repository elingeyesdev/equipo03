import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../infrastructure/api.config';
import { DB_ROLES, ROLE_ID_TO_NAME } from '../../config/rbac.constants';
import { ModalOverlay, ConfirmModal, panelStyle, RecordDetailModal, DetailField } from './Shared/DashboardShared';
import type { GymDto, UserDto } from './Shared/DashboardTypes';
import { Eye, Edit, Trash2, Plus } from 'lucide-react';

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
  const PHONE_PREFIXES = [
    { code: '+591', flag: '🇧🇴', label: '+591' },
    { code: '+54',  flag: '🇦🇷', label: '+54'  },
    { code: '+56',  flag: '🇨🇱', label: '+56'  },
    { code: '+55',  flag: '🇧🇷', label: '+55'  },
    { code: '+51',  flag: '🇵🇪', label: '+51'  },
    { code: '+57',  flag: '🇨🇴', label: '+57'  },
    { code: '+52',  flag: '🇲🇽', label: '+52'  },
    { code: '+1',   flag: '🇺🇸', label: '+1'   },
  ];

  const splitPhone = (raw: string): { prefix: string; number: string } => {
    for (const p of PHONE_PREFIXES) {
      if (raw.startsWith(p.code)) {
        return { prefix: p.code, number: raw.slice(p.code.length).trim() };
      }
    }
    return { prefix: '+591', number: raw.replace(/^\+\d{1,3}\s?/, '') };
  };

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', password: '', phone: '',
    phonePrefix: '+591', phoneNumber: '', ci: '',
    roleId: DB_ROLES.USER as number, gymIds: [] as number[], isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [gyms, setGyms] = useState<GymDto[]>([]);
  const [loadingGyms, setLoadingGyms] = useState(false);
  // Para GERENTE: selección en dos pasos (sede → sucursal)
  const [selectedSede, setSelectedSede] = useState<number | ''>('');

  // ── Derivados: marcas (sin padre) y sucursales físicas (con padre) ────────────
  const sedes      = gyms.filter(g => !g.parentId && !g.parent?.id);
  const sucursales = gyms.filter(g => !!(g.parentId ?? g.parent?.id));
  // Sucursales que pertenecen a la sede seleccionada
  const sucursalesParaSede = selectedSede !== ''
    ? sucursales.filter(s => (s.parentId ?? s.parent?.id) === selectedSede)
    : [];

  // ── Cargar gyms al abrir: marcas (/gyms/brands) + sucursales (/gyms) ─────────
  useEffect(() => {
    if (!isOpen) return;
    setLoadingGyms(true);
    Promise.all([
      apiClient.get('/gyms/brands').catch(() => ({ data: [] })),
      apiClient.get('/gyms').catch(() => ({ data: [] })),
    ]).then(([brandsRes, sucursalesRes]) => {
      const brands: GymDto[]     = Array.isArray(brandsRes.data)     ? brandsRes.data     : [];
      const sucursales: GymDto[] = Array.isArray(sucursalesRes.data) ? sucursalesRes.data : [];
      // Marcas: parentId null; Sucursales: parentId != null (ya viene del backend)
      setGyms([...brands, ...sucursales]);
    }).finally(() => setLoadingGyms(false));
  }, [isOpen]);

  // ── Poblar formulario al abrir ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    if (userToEdit) {
      const gymsFromRoles = (userToEdit.userRoles ?? []).map((ur: any) => ur?.gym).filter(Boolean);
      const rawPhone = userToEdit.profile?.phone ?? '';
      const { prefix, number } = splitPhone(rawPhone);
      setFormData({
        firstName:   userToEdit.profile?.firstName ?? '',
        lastName:    userToEdit.profile?.lastName  ?? '',
        phone:       rawPhone,
        phonePrefix: prefix,
        phoneNumber: number,
        ci:          userToEdit.profile?.ci ?? '',
        email:       userToEdit.email ?? '',
        password:    '',
        roleId:      Number(userToEdit.userRoles?.[0]?.roleId) || DB_ROLES.USER,
        gymIds:      gymsFromRoles.map((g: any) => Number(g.id)),
        isActive:    userToEdit.isActive ?? true,
      });
    } else {
      setFormData({ firstName: '', lastName: '', email: '', password: '', phone: '', phonePrefix: '+591', phoneNumber: '', ci: '', roleId: DB_ROLES.USER, gymIds: [], isActive: true });
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Correo inválido';
    }

    const isCreation = !userToEdit;
    if (isCreation || formData.password.trim()) {
      if (!/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(formData.password)) {
        newErrors.password = 'Mínimo 8 caracteres, 1 número y 1 especial';
      }
    }

    if (formData.phoneNumber.trim()) {
      const digits = formData.phoneNumber.replace(/\s/g, '');
      if (!/^\d{6,14}$/.test(digits)) {
        newErrors.phone = 'Solo dígitos, entre 6 y 14 números';
      }
    }

    if (formData.ci.trim()) {
      if (!/^\d{6,9}(-[a-zA-Z0-9]{1,2})?$/.test(formData.ci.trim())) {
        newErrors.ci = 'CI inválido (ej: 12345678 o 1234567-1A)';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const toggleGym  = (id: number) => setFormData(p => ({
    ...p, gymIds: p.gymIds.includes(id) ? p.gymIds.filter(x => x !== id) : [...p.gymIds, id],
  }));

  // Determina el nombre del rol seleccionado (usando datos reales de la BD)
  const selectedRoleName = roleOptions.find(r => r.id === formData.roleId)?.name ?? '';
  const isGerente  = selectedRoleName === 'GERENTE';
  const needsSede  = SEDE_ROLE_NAMES.has(selectedRoleName);
  const needsMulti = needsSede && !isGerente;

  if (!isOpen) return null;

  const inputCls = (err?: string) =>
    `w-full bg-slate-50 dark:bg-[#151521] border ${err ? 'border-red-500' : 'border-slate-200 dark:border-gray-700'} text-slate-900 dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2ecc71] transition-colors`;
  const labelCls = "block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1 mt-3";

  return (
    <ModalOverlay onClose={onClose}>
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
        {userToEdit ? 'Editar Usuario' : 'Nuevo Usuario'}
      </h2>

      <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.25rem' }}>
        <label className={labelCls}>Nombre</label>
        <input type="text" className={inputCls()} value={formData.firstName}
          onChange={e => setFormData({ ...formData, firstName: e.target.value })}
          placeholder="Ej. Juan" />

        <label className={labelCls}>Apellido</label>
        <input type="text" className={inputCls()} value={formData.lastName}
          onChange={e => setFormData({ ...formData, lastName: e.target.value })}
          placeholder="Ej. Pérez" />

        <label className={labelCls}>
          Teléfono <span className="text-slate-400 dark:text-gray-500 font-normal text-xs">— opcional</span>
        </label>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select
            value={formData.phonePrefix}
            onChange={e => setFormData({ ...formData, phonePrefix: e.target.value })}
            className={`bg-slate-50 dark:bg-[#151521] border ${errors.phone ? 'border-red-500' : 'border-slate-200 dark:border-gray-700'} text-slate-900 dark:text-white rounded-lg px-2 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2ecc71] transition-colors text-sm cursor-pointer`}
            style={{ width: '95px', flexShrink: 0 }}
          >
            {PHONE_PREFIXES.map(p => (
              <option key={p.code} value={p.code}>{p.flag} {p.label}</option>
            ))}
          </select>
          <input
            type="tel"
            value={formData.phoneNumber}
            onChange={e => { setFormData({ ...formData, phoneNumber: e.target.value }); setErrors(p => ({ ...p, phone: '' })); }}
            placeholder="71234567"
            maxLength={14}
            className={inputCls(errors.phone)}
            style={{ flex: 1 }}
          />
        </div>
        {errors.phone && <span className="text-red-500 text-xs mt-1 block">{errors.phone}</span>}

        <label className={labelCls}>
          Carnet de Identidad (CI) <span className="text-slate-400 dark:text-gray-500 font-normal text-xs">— opcional</span>
        </label>
        <input
          type="text"
          className={inputCls(errors.ci)}
          value={formData.ci}
          onChange={e => { setFormData({ ...formData, ci: e.target.value }); setErrors(p => ({ ...p, ci: '' })); }}
          placeholder="Ej. 12345678 o 1234567-1A"
          maxLength={20}
        />
        {errors.ci && <span className="text-red-500 text-xs mt-1 block">{errors.ci}</span>}

        <label className={labelCls}>Correo Electrónico</label>
        <input
          type="email"
          className={inputCls(errors.email)}
          value={formData.email}
          onChange={e => { setFormData({ ...formData, email: e.target.value }); setErrors(p => ({ ...p, email: '' })); }}
          placeholder="correo@ejemplo.com"
        />
        {errors.email && <span className="text-red-500 text-xs mt-1 block">{errors.email}</span>}

        <label className={labelCls}>
          Contraseña{' '}
          {userToEdit && <span className="text-slate-400 dark:text-gray-500 font-normal text-xs">(vacío = sin cambios)</span>}
        </label>
        <div style={{ position: 'relative' }}>
          <input
            type={showPassword ? 'text' : 'password'}
            className={inputCls(errors.password)}
            value={formData.password}
            onChange={e => { setFormData({ ...formData, password: e.target.value }); setErrors(p => ({ ...p, password: '' })); }}
            placeholder="••••••••"
            style={{ paddingRight: '42px' }}
          />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              style={{
                position: 'absolute', right: '10px', top: '50%',
                transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '4px', display: 'flex', alignItems: 'center',
                color: '#8E8E93',
              }}
              title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? (
                /* Eye-off SVG */
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                /* Eye SVG */
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
          {errors.password && <span className="text-red-500 text-xs mt-1 block">{errors.password}</span>}

        <label className={labelCls}>Rol del Sistema</label>
        <select
          className={inputCls()}
          value={formData.roleId}
          onChange={e => {
            setFormData({ ...formData, roleId: Number(e.target.value), gymIds: [] });
            setSelectedSede('');
          }}
        >
          {roleOptions.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
        </select>

        {/* ── GERENTE: selección en dos pasos ──────────────────────────────────── */}
        {isGerente && (
          <div className="bg-orange-50 dark:bg-orange-900/5 border border-orange-200 dark:border-orange-500/20 rounded-xl p-4 mt-3 mb-1 flex flex-col gap-3">
            <p className="m-0 text-xs font-semibold tracking-widest uppercase text-orange-600 dark:text-orange-400">
              📍 Asignación de Sede y Sucursal
            </p>
            <p className="m-0 text-sm text-slate-600 dark:text-gray-400 leading-relaxed">
              Una <strong className="text-slate-900 dark:text-gray-200">Sede</strong> es la marca/organización (ej. "Smart Fit").
              Una <strong className="text-slate-900 dark:text-gray-200">Sucursal</strong> es el gimnasio físico que administrará el gerente (ej. "Smart Fit - Centro").
            </p>

            {/* Paso 1: Sede (Marca) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">1 · Sede (Marca) *</label>
              {loadingGyms ? <p className="text-sm text-slate-400 dark:text-gray-500">Cargando...</p> : (
                <select
                  value={selectedSede}
                  onChange={e => {
                    setSelectedSede(Number(e.target.value) || '');
                    setFormData(p => ({ ...p, gymIds: [] }));
                  }}
                  className={`w-full bg-slate-50 dark:bg-[#151521] border ${!selectedSede ? 'border-red-500' : 'border-slate-200 dark:border-gray-700'} text-slate-900 dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2ecc71] transition-colors`}
                >
                  <option value="">— Seleccionar Sede (Marca) —</option>
                  {sedes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              )}
            </div>

            {/* Paso 2: Sucursal (habilitado tras elegir sede) */}
            <div style={{ opacity: selectedSede !== '' ? 1 : 0.4, transition: 'opacity 0.2s' }}>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">2 · Sucursal a Administrar *</label>
              {selectedSede !== '' && sucursalesParaSede.length === 0 ? (
                <p className="m-0 text-sm text-red-500 p-2 bg-red-50 dark:bg-red-900/10 rounded-lg">
                  ⚠️ Esta sede no tiene sucursales registradas aún.
                </p>
              ) : (
                <select
                  value={formData.gymIds[0] ?? ''}
                  onChange={e => setFormData(p => ({ ...p, gymIds: e.target.value ? [Number(e.target.value)] : [] }))}
                  disabled={selectedSede === ''}
                  className={`w-full bg-slate-50 dark:bg-[#151521] border ${selectedSede !== '' && formData.gymIds.length === 0 ? 'border-red-500' : 'border-slate-200 dark:border-gray-700'} text-slate-900 dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2ecc71] transition-colors disabled:opacity-40`}
                >
                  <option value="">— Seleccionar Sucursal —</option>
                  {sucursalesParaSede.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        )}

        {/* ── ENTRENADOR / NUTRICIONISTA: sucursales agrupadas por sede ────────── */}
        {needsMulti && (
          <>
            <label className={labelCls}>
              Sucursales Asignadas{' '}
              <span className="text-slate-400 dark:text-gray-500 font-normal text-xs">— puede seleccionar múltiples</span>
            </label>
            {loadingGyms ? <p className="text-sm text-slate-400 dark:text-gray-500">Cargando...</p> : (
              <div className="flex flex-col gap-2 max-h-56 overflow-y-auto p-3 bg-slate-50 dark:bg-black/10 rounded-lg border border-slate-200 dark:border-white/10">
                {sedes.map(sede => {
                  const hijos = sucursales.filter(s => (s.parentId ?? s.parent?.id) === sede.id);
                  if (hijos.length === 0) return null;
                  return (
                    <div key={sede.id}>
                      <div className="text-xs font-bold text-slate-500 dark:text-gray-500 uppercase tracking-wider mb-1 pb-1 border-b border-slate-200 dark:border-white/10">
                        🏢 {sede.name}
                      </div>
                      {hijos.map(g => (
                        <label key={g.id} className="flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded-md"
                          style={{ background: formData.gymIds.includes(Number(g.id)) ? 'rgba(0,217,255,0.08)' : 'transparent' }}>
                          <input type="checkbox" checked={formData.gymIds.includes(Number(g.id))}
                            onChange={() => toggleGym(Number(g.id))}
                            style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: '#00D9FF' }} />
                          <span className="text-sm text-slate-700 dark:text-gray-300">🏪 {g.name}</span>
                        </label>
                      ))}
                    </div>
                  );
                })}
                {sucursales.filter(s => !s.parentId && !s.parent?.id).map(g => (
                  <label key={g.id} className="flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded-md"
                    style={{ background: formData.gymIds.includes(Number(g.id)) ? 'rgba(0,217,255,0.08)' : 'transparent' }}>
                    <input type="checkbox" checked={formData.gymIds.includes(Number(g.id))}
                      onChange={() => toggleGym(Number(g.id))}
                      style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: '#00D9FF' }} />
                    <span className="text-sm text-slate-700 dark:text-gray-300">🏪 {g.name}</span>
                  </label>
                ))}
              </div>
            )}
          </>
        )}

        <div className="flex items-center gap-2 mt-3">
          <input type="checkbox" style={{ width: 'auto' }} checked={formData.isActive}
            onChange={e => setFormData({ ...formData, isActive: e.target.checked })} />
          <label className="text-sm font-medium text-slate-700 dark:text-gray-300">Usuario Activo</label>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-gray-800 flex-shrink-0">
        <button className="px-4 py-2 text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors font-medium border-0 cursor-pointer bg-transparent" onClick={onClose}>Cancelar</button>
        <button className="px-4 py-2 bg-[#009ef7] hover:bg-[#0086d1] text-white font-medium rounded-lg shadow-sm transition-colors border-0 cursor-pointer" onClick={() => {
          if (!validateForm()) return;
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
          const phoneVal = formData.phoneNumber.trim()
            ? `${formData.phonePrefix}${formData.phoneNumber.replace(/\s/g, '')}`
            : '';
          onSave({ ...formData, phone: phoneVal });
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
    Promise.all([
      apiClient.get('/gyms/brands').catch(() => ({ data: [] })),
      apiClient.get('/gyms').catch(() => ({ data: [] })),
    ]).then(([brandsRes, sucursalesRes]) => {
      const brands: GymDto[]     = Array.isArray(brandsRes.data)     ? brandsRes.data     : [];
      const sucursales: GymDto[] = Array.isArray(sucursalesRes.data) ? sucursalesRes.data : [];
      setGymsCatalog([...brands, ...sucursales]);
    }).catch(() => {});
  }, []);

  /** Mapa sucursalId → { sucursalName, sedeId, sedeName } */
  const gymInfoMap = useMemo(() => {
    const sedes      = gymsCatalog.filter(g => !g.parentId && !g.parent?.id);
    const sucursales = gymsCatalog.filter(g => !!(g.parentId ?? g.parent?.id));
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
        gymIds: (([DB_ROLES.SUPER_ADMIN, DB_ROLES.CLIENTE, DB_ROLES.USER] as number[]).includes(Number(formData.roleId)))
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
      toast.error(err?.response?.data?.message || err?.message || 'Error al guardar usuario');
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
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Usuarios</h1>
      <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
        {user?.role === 'SUPER_ADMIN'
          ? 'Gestión de usuarios de toda la red.'
          : 'Gestión de usuarios de tus sucursales asignadas.'}
      </p>

      <div className="flex flex-wrap justify-between items-center gap-3 mt-4 mb-4">
        <div style={{ color: '#8E8E93', fontSize: '0.9rem' }}>
          {loading ? 'Cargando usuarios...' : `Total: ${users.length} | Activos: ${usuariosActivos}`}
        </div>
        {(user?.role === 'SUPER_ADMIN' || user?.role === 'GERENTE') && (
          <button onClick={() => { setUserToEdit(null); setIsModalOpen(true); }}
            className="bg-[#00D9FF] text-[#0A0A0A] font-semibold px-4 py-2 rounded-lg border-0 cursor-pointer hover:bg-[#00c0e0] transition-colors whitespace-nowrap inline-flex items-center gap-1.5">
            <Plus size={15} />
            + Nuevo Usuario
          </button>
        )}
      </div>

      {error && <div style={{ marginTop: '0.75rem', color: '#FF5E00', fontSize: '0.9rem' }}>{error}</div>}
      {loading && <div style={{ marginTop: '2rem', textAlign: 'center', color: '#8E8E93' }}>Cargando...</div>}

      {/* ── Barra de filtros ── */}
      {!loading && !error && users.length > 0 && (
        <div className="flex flex-col md:flex-row flex-wrap gap-3 items-center mb-6">
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍  Buscar por nombre o email..."
            className="flex-1 bg-white dark:bg-[#151521] border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-gray-100 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2ecc71] transition-all placeholder:text-slate-400 dark:placeholder:text-gray-500"
            style={{ minWidth: '200px' }}
          />
          {/* Rol */}
          <div style={{ position: 'relative' }}>
            <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
              className="bg-white dark:bg-[#151521] border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-gray-100 rounded-md py-2 pl-3 pr-8 text-sm cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-[#2ecc71] transition-all">
              <option value="">Todos los roles</option>
              {roleOptions.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
            <span style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#8E8E93', fontSize: '0.7rem' }}>▼</span>
          </div>
          {/* Sede asignada */}
          {gymOptions.length > 0 && (
            <div style={{ position: 'relative' }}>
              <select value={filterGym} onChange={e => setFilterGym(e.target.value)}
                className="bg-white dark:bg-[#151521] border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-gray-100 rounded-md py-2 pl-3 pr-8 text-sm cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-[#2ecc71] transition-all" style={{ maxWidth: '180px' }}>
                <option value="">Todas las sedes</option>
                {gymOptions.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
              <span style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#8E8E93', fontSize: '0.7rem' }}>▼</span>
            </div>
          )}
          {/* Estado */}
          <div style={{ position: 'relative' }}>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}
              className="bg-white dark:bg-[#151521] border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-gray-100 rounded-md py-2 pl-3 pr-8 text-sm cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-[#2ecc71] transition-all">
              <option value="all"     >Todos</option>
              <option value="active"  >Solo Activos</option>
              <option value="inactive">Solo Inactivos</option>
            </select>
            <span style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#8E8E93', fontSize: '0.7rem' }}>▼</span>
          </div>
          {/* Orden */}
          <div style={{ position: 'relative' }}>
            <select value={sortOrder} onChange={e => setSortOrder(e.target.value as any)}
              className="bg-white dark:bg-[#151521] border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-gray-100 rounded-md py-2 pl-3 pr-8 text-sm cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-[#2ecc71] transition-all">
              <option value="az"      >Nombre A → Z</option>
              <option value="za"      >Nombre Z → A</option>
              <option value="id_asc"  >ID ↑</option>
              <option value="id_desc" >ID ↓</option>
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
        <div className="bg-white dark:bg-[#1e1e2d] border border-slate-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden mt-4">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: '850px' }}>
            <thead className="bg-slate-50 dark:bg-[#151521] border-b border-slate-200 dark:border-gray-800 text-slate-500 dark:text-gray-400 text-xs uppercase tracking-wider">
              <tr>
                {['ID', 'Nombre', 'Email', 'Rol', 'Sucursal / Sede', 'Estado', 'Acciones'].map(h => (
                  <th key={h} style={{ textAlign: h === 'Acciones' ? 'center' : 'left', padding: '0.6rem' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400 dark:text-gray-500">Sin resultados para los filtros aplicados.</td></tr>
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
                  <tr key={u.id} className="border-b border-slate-100 dark:border-gray-800 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-slate-700 dark:text-gray-300 text-sm">
                    <td style={{ padding: '0.6rem' }}>{u.id}</td>
                    <td style={{ padding: '0.6rem' }}>{fullName}</td>
                    <td style={{ padding: '0.6rem' }}>{u.email ?? '-'}</td>
                    <td style={{ padding: '0.6rem', color: '#8E8E93', fontSize: '0.85rem' }}>{roleDisplay}</td>
                    <td style={{ padding: '0.6rem' }}>
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
                    <td style={{ padding: '0.6rem', color: u.isActive ? '#30D158' : '#FF5E00' }}>
                      {u.isActive ? 'ACTIVO' : 'INACTIVO'}
                    </td>
                    <td style={{ padding: '0.6rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                        <button onClick={() => setViewingUser(u)}
                          style={{ background: 'rgba(0,217,255,0.1)', color: '#00D9FF', border: '1px solid rgba(0,217,255,0.3)', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Eye size={13} />
                          Detalle
                        </button>
                        {(user?.role === 'SUPER_ADMIN' || user?.role === 'GERENTE') && (<>
                          <button onClick={() => { setUserToEdit(u); setIsModalOpen(true); }}
                            style={{ background: '#00D9FF', color: '#0A0A0A', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Edit size={13} />
                            Editar
                          </button>
                          <button onClick={() => setDeleteConfirmUser(u)}
                            style={{ background: 'rgba(255,94,0,0.1)', color: '#FF5E00', border: '1px solid #FF5E00', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Trash2 size={13} />
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