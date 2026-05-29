import React, { useState, useEffect } from 'react';
import { Building, CheckCircle, Unlock, Ban, RefreshCw, Clock, Users, Dumbbell, CalendarCheck, UserCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../infrastructure/api.config';
import { DB_ROLES } from '../../config/rbac.constants';
import type { GymDto, UserDto } from './Shared/DashboardTypes';

// ── Tipos ─────────────────────────────────────────────────────────────────────
type HistPoint = { v: number };
type SummaryData = {
  users?:        { total?: number; history?: HistPoint[] };
  checkins?:     { total?: number; history?: HistPoint[] };
  reservations?: { total?: number; history?: HistPoint[] };
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const safeData = (h?: HistPoint[]): HistPoint[] => {
  if (h && h.length >= 2) return h;
  return [];
};

const lastDays = (n: number): string[] => {
  const labels: string[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    labels.push(d.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase().slice(0, 3));
  }
  return labels;
};

const fmtTimeAgo = (date: Date): string => {
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return 'hace un momento';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return `hace ${Math.floor(diff / 86400)} d`;
};

// ── Mini KPI card ─────────────────────────────────────────────────────────────
const KpiCard = ({
  label, value, icon, color, accent = false,
}: {
  label:  string;
  value:  React.ReactNode;
  icon:   React.ReactNode;
  color:  string;
  accent?: boolean;
}) => (
  <div className="bg-white dark:bg-[#1e1e2d] border border-slate-200 dark:border-gray-800 rounded-xl shadow-sm flex items-center gap-4 p-5">
    <div
      className="w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0"
      style={{ background: color }}
    >
      {icon}
    </div>
    <div className="flex flex-col">
      <span className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">
        {label}
      </span>
      <span className={[
        'text-2xl font-bold leading-tight',
        accent ? 'text-red-500 dark:text-red-400' : 'text-slate-900 dark:text-white',
      ].join(' ')}>
        {value}
      </span>
    </div>
  </div>
);

// ── LineChart SVG sobre fondo de color ───────────────────────────────────────
const LineChartCard = ({ data, labels }: { data: HistPoint[]; labels: string[] }) => {
  const W = 600;
  const H = 220;
  const PAD_X = 24;
  const PAD_Y = 30;

  if (!data.length) return <EmptyChart />;

  const values = data.map(d => d.v);
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) { min -= 1; max += 1; }
  const span = max - min;

  const stepX = (W - PAD_X * 2) / Math.max(1, data.length - 1);
  const points = values.map((v, i) => ({
    x: PAD_X + i * stepX,
    y: PAD_Y + (H - PAD_Y * 2) * (1 - (v - min) / span),
  }));

  // Catmull-Rom suave
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }

  // Grid horizontal: 4 líneas
  const gridLines = [0.25, 0.5, 0.75].map(p => PAD_Y + (H - PAD_Y * 2) * p);

  // Labels eje X (máximo 7 visibles)
  const tickStep = Math.max(1, Math.floor(labels.length / 7));

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ display: 'block' }}
    >
      {/* Grid */}
      {gridLines.map((y, i) => (
        <line key={i} x1={PAD_X} x2={W - PAD_X} y1={y} y2={y} stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="3 4" />
      ))}

      {/* Línea principal */}
      <path d={d} fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

      {/* Puntos */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#ffffff" />
      ))}

      {/* Labels eje X */}
      {labels.map((lbl, i) => (
        i % tickStep === 0 && points[i] ? (
          <text
            key={i}
            x={points[i].x}
            y={H - 8}
            fill="rgba(255,255,255,0.7)"
            fontSize="11"
            textAnchor="middle"
            fontFamily="system-ui"
          >
            {lbl}
          </text>
        ) : null
      ))}
    </svg>
  );
};

// ── BarChart SVG sobre fondo de color ────────────────────────────────────────
const BarChartCard = ({ data, labels }: { data: HistPoint[]; labels: string[] }) => {
  const W = 600;
  const H = 220;
  const PAD_X = 24;
  const PAD_Y = 30;

  if (!data.length) return <EmptyChart />;

  const values = data.map(d => d.v);
  const max = Math.max(...values, 1);

  const barAreaW = W - PAD_X * 2;
  const barW = (barAreaW / data.length) * 0.55;
  const gap = (barAreaW / data.length) * 0.45;
  const slot = barW + gap;

  const gridLines = [0.25, 0.5, 0.75].map(p => PAD_Y + (H - PAD_Y * 2) * p);
  const tickStep = Math.max(1, Math.floor(labels.length / 7));

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ display: 'block' }}
    >
      {gridLines.map((y, i) => (
        <line key={i} x1={PAD_X} x2={W - PAD_X} y1={y} y2={y} stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="3 4" />
      ))}

      {values.map((v, i) => {
        const barH = (H - PAD_Y * 2) * (v / max);
        const x = PAD_X + i * slot + gap / 2;
        const y = H - PAD_Y - barH;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barW}
            height={Math.max(barH, 2)}
            fill="#ffffff"
            rx="2"
          />
        );
      })}

      {labels.map((lbl, i) => (
        i % tickStep === 0 ? (
          <text
            key={i}
            x={PAD_X + i * slot + slot / 2}
            y={H - 8}
            fill="rgba(255,255,255,0.7)"
            fontSize="11"
            textAnchor="middle"
            fontFamily="system-ui"
          >
            {lbl}
          </text>
        ) : null
      ))}
    </svg>
  );
};

const EmptyChart = () => (
  <div className="w-full h-full flex items-center justify-center text-white/50 text-sm">
    Sin datos suficientes
  </div>
);

// ── Tarjeta grande con gráfico ───────────────────────────────────────────────
const ChartCard = ({
  bg, title, subtitle, total, totalLabel, updatedAt, children,
}: {
  bg:         string;
  title:      string;
  subtitle:   string;
  total:      number;
  totalLabel: string;
  updatedAt:  Date;
  children:   React.ReactNode;
}) => (
  <div className="bg-white dark:bg-[#1e1e2d] border border-slate-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
    {/* Chart area con fondo de color */}
    <div style={{ background: bg, padding: '20px 20px 0 20px' }}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-white/80 text-xs font-semibold uppercase tracking-wider">{totalLabel}</div>
          <div className="text-white text-2xl font-bold leading-tight">{total.toLocaleString('es-ES')}</div>
        </div>
      </div>
      <div style={{ width: '100%', height: '180px' }}>
        {children}
      </div>
    </div>

    {/* Info bajo el gráfico */}
    <div className="px-5 py-4">
      <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
      <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-gray-500 mt-3 pt-3 border-t border-slate-100 dark:border-gray-800">
        <Clock size={12} />
        <span>actualizado {fmtTimeAgo(updatedAt)}</span>
      </div>
    </div>
  </div>
);

// ── Vista cliente ────────────────────────────────────────────────────────────
const ClienteResumen = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mi Progreso Personal</h1>
      <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
        Aquí podrás ver tu suscripción, check-ins y nivel de asistencia.
      </p>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
      <div className="bg-white dark:bg-[#1e1e2d] border border-emerald-300 dark:border-emerald-700/60 rounded-xl p-5 shadow-sm">
        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">Suscripción</p>
        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">ACTIVA</p>
      </div>
      <div className="bg-white dark:bg-[#1e1e2d] border border-cyan-300 dark:border-cyan-700/60 rounded-xl p-5 shadow-sm">
        <p className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider mb-2">Último Check-in</p>
        <p className="text-2xl font-bold text-slate-900 dark:text-white">Hoy, 08:30</p>
      </div>
    </div>
  </div>
);

// ── Componente principal ─────────────────────────────────────────────────────
export const ResumenView = () => {
  const { user } = useAuth();
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [summary,   setSummary]   = useState<SummaryData>({});
  const [gyms,      setGyms]      = useState<GymDto[]>([]);
  const [allUsers,  setAllUsers]  = useState<UserDto[]>([]);
  const [updatedAt, setUpdatedAt] = useState<Date>(new Date());

  const fetchAll = async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, gymsRes, usersRes] = await Promise.allSettled([
        apiClient.get<SummaryData>('/dashboard/summary'),
        apiClient.get('/gyms'),
        apiClient.get('/users'),
      ]);
      if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value.data ?? {});
      if (gymsRes.status === 'fulfilled') {
        const raw = gymsRes.value.data;
        setGyms(Array.isArray(raw) ? raw : []);
      }
      if (usersRes.status === 'fulfilled') {
        const raw = usersRes.value.data;
        setAllUsers(Array.isArray(raw) ? raw : []);
      }
      setUpdatedAt(new Date());
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo cargar el resumen.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    if (mounted) fetchAll();
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (user?.role === 'CLIENTE') return <ClienteResumen />;

  const totalGyms  = gyms.length;
  const activeGyms = gyms.filter(g => !!g.isActive).length;
  const openGyms   = gyms.filter(g => !!g.isOpen).length;
  const totalUsers = summary.users?.total        ?? 0;
  const totalCk    = summary.checkins?.total     ?? 0;
  const totalRes   = summary.reservations?.total ?? 0;

  const usersHist    = safeData(summary.users?.history);
  const checkinsHist = safeData(summary.checkins?.history);
  const resHist      = safeData(summary.reservations?.history);

  const labels7 = lastDays(7);

  const userGymId = user?.gymId ? Number(user.gymId) : null;
  const userGym   = gyms.find(g => g.id === userGymId);
  const gymName   = userGym?.name ?? 'N/A';

  const roleText = user?.role === 'SUPER_ADMIN'
    ? 'Vista global de toda la cadena de gimnasios.'
    : `Métricas de tu sucursal ${gymName}.`;

  // Valores exclusivos para GERENTE (calculados desde /users)
  const clientCount        = allUsers.filter(u => u.userRoles?.some(ur => ur.roleId === DB_ROLES.CLIENTE)).length;
  const entrenadorCount    = allUsers.filter(u => u.userRoles?.some(ur => ur.roleId === DB_ROLES.ENTRENADOR)).length;
  const nutricionistaCount = allUsers.filter(u => u.userRoles?.some(ur => ur.roleId === DB_ROLES.NUTRICIONISTA)).length;
  const totalStaff       = entrenadorCount + nutricionistaCount;

  const staffChartData: HistPoint[] = [
    { v: entrenadorCount },
    { v: nutricionistaCount },
  ];
  const staffChartLabels = ['Entrenadores', 'Nutricionistas'];

  const isGerente = user?.role !== 'SUPER_ADMIN';

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Resumen</h1>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">{roleText}</p>
        </div>
        <button
          onClick={fetchAll}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-gray-300 bg-white dark:bg-[#1e1e2d] border border-slate-200 dark:border-gray-800 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* KPIs pequeños — condicional por rol */}
      {isGerente ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Clientes"        value={clientCount}  icon={<Users size={24} color="#fff" />}        color="#11cdef" />
          <KpiCard label="Entrenadores"    value={entrenadorCount} icon={<Dumbbell size={24} color="#fff" />}  color="#5e72e4" />
          <KpiCard label="Nutricionistas"  value={nutricionistaCount} icon={<UserCheck size={24} color="#fff" />} color="#2dce89" />
          <KpiCard label="Personal Total"  value={totalStaff}   icon={<CalendarCheck size={24} color="#fff" />} color="#fb6340" />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Sedes Totales"  value={totalGyms}  icon={<Building size={24} color="#fff" />}    color="#11cdef" />
          <KpiCard label="Sedes Activas"  value={activeGyms} icon={<CheckCircle size={24} color="#fff" />} color="#2dce89" />
          <KpiCard label="Sedes Abiertas" value={openGyms}   icon={<Unlock size={24} color="#fff" />}      color="#fb6340" />
          <KpiCard label="Denegados"      value={0}          icon={<Ban size={24} color="#fff" />}         color="#f5365c" accent />
        </div>
      )}

      {/* Gráficos grandes — condicional por rol */}
      {isGerente ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ChartCard
            bg="#2dce89"
            title="Clientes registrados"
            subtitle="Crecimiento de clientes en tu sucursal"
            total={totalUsers}
            totalLabel="Total"
            updatedAt={updatedAt}
          >
            <LineChartCard data={usersHist} labels={labels7} />
          </ChartCard>

          <ChartCard
            bg="#fb6340"
            title="Reservas activas"
            subtitle="Reservas registradas por día"
            total={totalRes}
            totalLabel="Total"
            updatedAt={updatedAt}
          >
            <BarChartCard data={resHist} labels={labels7} />
          </ChartCard>

          <ChartCard
            bg="#172b4d"
            title="Check-ins"
            subtitle="Accesos físicos confirmados en tu sucursal"
            total={totalCk}
            totalLabel="Total"
            updatedAt={updatedAt}
          >
            <LineChartCard data={checkinsHist} labels={labels7} />
          </ChartCard>

          <ChartCard
            bg="#5e72e4"
            title="Personal por Rol"
            subtitle="Distribución del equipo de tu sucursal"
            total={totalStaff}
            totalLabel="Total"
            updatedAt={updatedAt}
          >
            <BarChartCard data={staffChartData} labels={staffChartLabels} />
          </ChartCard>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <ChartCard
            bg="#2dce89"
            title="Usuarios registrados"
            subtitle="Crecimiento de usuarios en la cadena"
            total={totalUsers}
            totalLabel="Total"
            updatedAt={updatedAt}
          >
            <LineChartCard data={usersHist} labels={labels7} />
          </ChartCard>

          <ChartCard
            bg="#fb6340"
            title="Reservas activas"
            subtitle="Reservas registradas por día"
            total={totalRes}
            totalLabel="Total"
            updatedAt={updatedAt}
          >
            <BarChartCard data={resHist} labels={labels7} />
          </ChartCard>

          <ChartCard
            bg="#172b4d"
            title="Check-ins"
            subtitle="Accesos físicos confirmados"
            total={totalCk}
            totalLabel="Total"
            updatedAt={updatedAt}
          >
            <LineChartCard data={checkinsHist} labels={labels7} />
          </ChartCard>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-gray-400">
          <span className="inline-block w-4 h-4 border-2 border-slate-300 border-t-cyan-500 rounded-full animate-spin" />
          Cargando métricas…
        </div>
      )}
    </div>
  );
};
