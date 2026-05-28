import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../infrastructure/api.config';
import type { GymDto, UserDto, CheckinDto } from './Shared/DashboardTypes';

// ── Tarjeta stat reutilizable ─────────────────────────────────────────────────
const StatCard = ({
  label, value, accent = false, icon,
}: {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
  icon?: string;
}) => (
  <div className={[
    'bg-white dark:bg-[#1e1e2d]',
    'border rounded-xl p-5 shadow-sm',
    'flex flex-col justify-between transition-colors',
    accent
      ? 'border-red-300 dark:border-red-700/60'
      : 'border-slate-200 dark:border-gray-800',
  ].join(' ')}>
    <div className="flex items-center justify-between mb-3">
      <span className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">
        {label}
      </span>
      {icon && <span className="text-lg opacity-60">{icon}</span>}
    </div>
    <div className={[
      'text-3xl font-bold',
      accent ? 'text-red-500 dark:text-red-400' : 'text-slate-900 dark:text-white',
    ].join(' ')}>
      {value}
    </div>
  </div>
);

// ── Vista cliente ─────────────────────────────────────────────────────────────
const ClienteResumen = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mi Progreso Personal</h1>
      <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
        Aquí podrás ver tu suscripción, check-ins y nivel de asistencia.
      </p>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
      <div className="bg-white dark:bg-[#1e1e2d] border border-emerald-300 dark:border-emerald-700/60 rounded-xl p-5 shadow-sm transition-colors">
        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">Suscripción</p>
        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">ACTIVA</p>
      </div>
      <div className="bg-white dark:bg-[#1e1e2d] border border-cyan-300 dark:border-cyan-700/60 rounded-xl p-5 shadow-sm transition-colors">
        <p className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider mb-2">Último Check-in</p>
        <p className="text-2xl font-bold text-slate-900 dark:text-white">Hoy, 08:30</p>
      </div>
    </div>
  </div>
);

// ── Componente principal ──────────────────────────────────────────────────────
export const ResumenView = () => {
  const { user } = useAuth();
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [gyms,     setGyms]     = useState<GymDto[]>([]);
  const [users,    setUsers]    = useState<UserDto[]>([]);
  const [checkins, setCheckins] = useState<CheckinDto[]>([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!user) { setLoading(false); return; }
      try {
        setLoading(true);
        setError(null);
        const [gymsR, usersR, checkinsR] = await Promise.all([
          apiClient.get('/gyms'),
          apiClient.get('/users'),
          apiClient.get('/checkins', { params: { page: 1, limit: 500 } }),
        ]);
        if (!mounted) return;
        setGyms(    Array.isArray(gymsR.data)     ? gymsR.data     : []);
        setUsers(   Array.isArray(usersR.data)    ? usersR.data    : []);
        setCheckins(Array.isArray(checkinsR.data) ? checkinsR.data : []);
      } catch (err: any) {
        if (mounted) setError(err?.response?.data?.message || err?.message || 'No se pudo cargar el resumen.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [user]);

  if (user?.role === 'CLIENTE') return <ClienteResumen />;

  const totalGyms     = gyms.length;
  const activeGyms    = gyms.filter(g => !!g.isActive).length;
  const openGyms      = gyms.filter(g => !!g.isOpen).length;
  const totalUsers    = users.length;
  const activeUsers   = users.filter(u => !!u.isActive).length;
  const totalCheckins = checkins.length;
  const denied        = checkins.filter(c => c.status === 'DENIED').length;

  const roleText = user?.role === 'SUPER_ADMIN'
    ? 'Vista global de toda la cadena de gimnasios.'
    : user?.role === 'GERENTE'
      ? `Métricas de tu sucursal (gym_id: ${user?.gymId ?? 'N/A'}).`
      : 'Vista de clientes y rutinas activas.';

  return (
    <div className="space-y-6">

      {/* Header de sección */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Resumen</h1>
        <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">{roleText}</p>
      </div>

      {/* Estado de carga */}
      {loading && (
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-gray-400">
          <span className="inline-block w-4 h-4 border-2 border-slate-300 border-t-cyan-500 rounded-full animate-spin" />
          Cargando métricas…
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 rounded-xl px-4 py-3 text-sm">
          ⚠ {error}
        </div>
      )}

      {/* Grid de tarjetas */}
      {!loading && !error && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          <StatCard label="Sedes Totales"   value={totalGyms}     icon="🏢" />
          <StatCard label="Sedes Activas"   value={activeGyms}    icon="✅" />
          <StatCard label="Sedes Abiertas"  value={openGyms}      icon="🔓" />
          <StatCard label="Usuarios"        value={totalUsers}    icon="👥" />
          <StatCard label="Usuarios Activos" value={activeUsers}  icon="🟢" />
          <StatCard label="Check-ins"       value={totalCheckins} icon="📋" />
          <StatCard label="Denegados"       value={denied}        icon="🚫" accent />
        </div>
      )}
    </div>
  );
};
