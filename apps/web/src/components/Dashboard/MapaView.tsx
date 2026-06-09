/**
 * MapaView.tsx — Vista de Mapa de Red de Sucursales.
 * Exclusiva para SUPER_ADMIN. Mapa interactivo con filtros avanzados y popups JSX.
 */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { UseCaseFactory } from '../../infrastructure/UseCaseFactory';
import type { SucursalMapaDTO } from '@gymsync/core';
import { Edit } from 'lucide-react';

// ── Fix íconos Leaflet en Vite ────────────────────────────────────────────────
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// ── Tipos de filtro estado ────────────────────────────────────────────────────
type EstadoFiltro = 'abierta' | 'cerrada' | 'inactiva';

const ESTADO_CONFIG: Record<EstadoFiltro, { label: string; color: string; emoji: string }> = {
  abierta:  { label: 'Abierta',  color: '#00D9FF', emoji: '🔵' },
  cerrada:  { label: 'Cerrada',  color: '#FF9F0A', emoji: '🟠' },
  inactiva: { label: 'Inactiva', color: '#FF5E00', emoji: '🔴' },
};

// ── Motor de cálculo de estado ─────────────────────────────────────────────────
/**
 * Obtiene día y minutos actuales forzados a 'America/La_Paz'.
 * Usa Intl.DateTimeFormat para ser independiente de la TZ del navegador.
 */
const getNowLaPaz = (): { dayKey: string; minutesNow: number } => {
  const now = new Date();

  // Día de la semana en La Paz
  const weekdayFmt = new Intl.DateTimeFormat('es-BO', {
    timeZone: 'America/La_Paz',
    weekday: 'long',
  });
  const weekdayRaw = weekdayFmt.format(now).toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  // 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'

  // Hora y minuto en La Paz
  const timeFmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/La_Paz',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const timeParts = timeFmt.formatToParts(now);
  const hStr = timeParts.find(p => p.type === 'hour')?.value ?? '0';
  const mStr = timeParts.find(p => p.type === 'minute')?.value ?? '0';

  // '24' → medianoche → 0
  const h = parseInt(hStr) % 24;
  const m = parseInt(mStr);

  return { dayKey: weekdayRaw, minutesNow: h * 60 + m };
};

/**
 * calculateGymStatus — función pura.
 * Determina el estado real de la sucursal cruzando schedules vs hora actual en La Paz.
 * Fallback: si no hay schedules, usa el flag isOpen del backend.
 */
const calculateGymStatus = (s: SucursalMapaDTO): EstadoFiltro => {
  // Regla 1: Inactiva
  if (!s.isActive) return 'inactiva';

  // Regla 2: Sin horarios → confiar en flag isOpen del backend
  if (!s.schedules || s.schedules.length === 0) {
    return s.isOpen ? 'abierta' : 'cerrada';
  }

  // Regla 3: Obtener día y hora actual en La Paz
  const { dayKey, minutesNow } = getNowLaPaz();

  // Buscar horario del día actual (excluir feriados)
  const horarioHoy = s.schedules.find(
    sch => sch.dayOfWeek.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '') === dayKey
         && !sch.isHoliday
  );

  // Sin horario para hoy → CERRADA
  if (!horarioHoy) return 'cerrada';

  // Regla 4: Cruce horario
  const [hO, mO] = (horarioHoy.opensAt  ?? '00:00').slice(0, 5).split(':').map(Number);
  const [hC, mC] = (horarioHoy.closesAt ?? '00:00').slice(0, 5).split(':').map(Number);

  const minOpen  = hO * 60 + mO;
  let   minClose = hC * 60 + mC;
  if (minClose < minOpen) minClose += 24 * 60; // cruce medianoche

  return minutesNow >= minOpen && minutesNow <= minClose ? 'abierta' : 'cerrada';
};

// ── Íconos por estado ─────────────────────────────────────────────────────────
const createCustomIcon = (color: string) =>
  L.divIcon({
    className: '',
    html: `<div style="
      width:28px;height:28px;
      background:${color};
      border:3px solid rgba(255,255,255,0.9);
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      box-shadow:0 4px 14px rgba(0,0,0,0.5);
    "></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -32],
  });

const iconActiva   = createCustomIcon('#00D9FF');
const iconCerrada  = createCustomIcon('#FF9F0A');
const iconInactiva = createCustomIcon('#FF5E00');

// ── Paleta por Sede Principal ─────────────────────────────────────────────────
const SEDE_PALETTE = [
  '#00D9FF','#30D158','#FF9F0A','#BF5AF2','#FF375F',
  '#64D2FF','#FFD60A','#FF6961','#4CD964','#5AC8FA',
];
const getSedeColor = (id: number | null): string =>
  id === null ? '#8E8E93' : SEDE_PALETTE[id % SEDE_PALETTE.length];

// ── Ocupación determinista (mock) cuando aforoActual=0 ────────────────────────
const mockAforo = (id: number, max: number): number =>
  max > 0 ? Math.round(((id * 37) % 100) / 100 * max) : 0;

// ── Auto-fit bounds ───────────────────────────────────────────────────────────
const AutoFitBounds = ({ sucursales }: { sucursales: SucursalMapaDTO[] }) => {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (fitted.current || sucursales.length === 0) return;
    const bounds = L.latLngBounds(sucursales.map(s => [s.latitude, s.longitude]));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 });
    fitted.current = true;
  }, [sucursales, map]);
  return null;
};

// ── Popup JSX ─────────────────────────────────────────────────────────────────
const PopupCard = ({ s, computedStatus }: { s: SucursalMapaDTO; computedStatus: EstadoFiltro }) => {
  const sedeColor  = getSedeColor(s.sedePrincipalId);
  const cfg        = ESTADO_CONFIG[computedStatus];
  const aforo      = s.aforoActual > 0 ? s.aforoActual : mockAforo(s.id, s.maxCapacity);
  const pct        = s.maxCapacity > 0 ? Math.round((aforo / s.maxCapacity) * 100) : 0;
  const barColor   = pct >= 80 ? '#FF5E00' : pct >= 50 ? '#FF9F0A' : '#30D158';

  return (
    <div style={{
      fontFamily: "'Inter', system-ui, sans-serif",
      background: 'rgba(15,15,17,0.97)',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: '12px',
      padding: '14px 16px',
      minWidth: '220px',
      maxWidth: '270px',
      color: '#FFF',
      boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
    }}>
      {/* Nombre + estado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', gap: '8px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {s.nombre}
          </div>
          <span style={{
            display: 'inline-block', marginTop: '4px',
            background: 'rgba(0,0,0,0.4)',
            border: `1px solid ${sedeColor}50`,
            color: sedeColor,
            fontSize: '0.68rem', fontWeight: 700,
            padding: '2px 8px', borderRadius: '12px',
            letterSpacing: '0.04em',
          }}>
            {s.sedePrincipalNombre}
          </span>
        </div>
        <span style={{
          fontSize: '0.68rem', fontWeight: 700,
          color: cfg.color,
          background: `${cfg.color}20`,
          padding: '3px 7px', borderRadius: '8px',
          border: `1px solid ${cfg.color}40`,
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          {cfg.emoji} {cfg.label.toUpperCase()}
        </span>
      </div>

      {/* Dirección */}
      <div style={{ fontSize: '0.75rem', color: '#8E8E93', marginBottom: '10px', lineHeight: 1.4 }}>
        {s.address}
      </div>

      {/* Aforo */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '4px' }}>
          <span style={{ color: '#8E8E93' }}>Ocupación</span>
          <span style={{ color: '#E5E5EA', fontWeight: 600 }}>{aforo} / {s.maxCapacity} ({pct}%)</span>
        </div>
        <div style={{ height: '5px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: '3px', transition: 'width 0.4s' }} />
        </div>
      </div>

      {/* Coords + botón */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
        <span style={{ fontSize: '0.68rem', color: '#555', fontFamily: 'monospace' }}>
          {s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}
        </span>
        <button
          onClick={e => e.stopPropagation()}
          style={{
            fontSize: '0.72rem', fontWeight: 700,
            color: '#00D9FF',
            background: 'rgba(0,217,255,0.1)',
            border: '1px solid rgba(0,217,255,0.3)',
            borderRadius: '6px',
            padding: '3px 10px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
          }}
        >
          <Edit size={11} />
          Editar Sucursal
        </button>
      </div>
    </div>
  );
};

// ── Estilos Dinámicos ──────────────────────────────────────────────────────────
const getStyles = (isDark: boolean) => ({
  page: {
    padding: '1.25rem',
    color: isDark ? '#FFFFFF' : '#0F172A',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    minHeight: 0,
  } as React.CSSProperties,

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '1rem',
  } as React.CSSProperties,

  title: {
    margin: 0,
    fontSize: 'clamp(1.2rem, 3vw, 1.75rem)',
    fontWeight: 700,
    lineHeight: 1.2,
    color: isDark ? '#FFFFFF' : '#0F172A',
  } as React.CSSProperties,

  subtitle: {
    margin: '0.25rem 0 0',
    color: isDark ? '#94a3b8' : '#475569',
    fontSize: 'clamp(0.75rem, 1.5vw, 0.9rem)',
  } as React.CSSProperties,

  statsRow: {
    display: 'flex',
    gap: '0.6rem',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  } as React.CSSProperties,

  statCard: {
    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.05)',
    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(15,23,42,0.08)',
    borderRadius: '10px',
    padding: '0.55rem 0.9rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: '90px',
  } as React.CSSProperties,

  statLabel: {
    fontSize: 'clamp(0.6rem, 1vw, 0.7rem)',
    color: isDark ? '#94a3b8' : '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  } as React.CSSProperties,

  statValue: {
    fontSize: 'clamp(1.2rem, 3vw, 1.5rem)',
    fontWeight: 700,
  } as React.CSSProperties,

  toolbar: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap',
    alignItems: 'center',
    background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(15,23,42,0.03)',
    border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(15,23,42,0.08)',
    borderRadius: '12px',
    padding: '0.75rem 1rem',
  } as React.CSSProperties,

  searchInput: {
    flex: '1 1 160px',
    minWidth: '140px',
    maxWidth: '240px',
    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.05)',
    border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(15,23,42,0.1)',
    borderRadius: '8px',
    padding: '0.45rem 0.75rem 0.45rem 2rem',
    color: isDark ? '#FFFFFF' : '#0F172A',
    fontSize: '0.85rem',
    outline: 'none',
  } as React.CSSProperties,

  pillActive: (color: string): React.CSSProperties => ({
    padding: '0.3rem 0.75rem',
    borderRadius: '20px',
    border: `1px solid ${color}`,
    background: `${color}22`,
    color,
    fontSize: '0.78rem',
    cursor: 'pointer',
    fontWeight: 600,
    transition: 'all 0.2s',
  }),

  pillInactive: {
    padding: '0.3rem 0.75rem',
    borderRadius: '20px',
    border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(15,23,42,0.12)',
    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.04)',
    color: isDark ? '#8E8E93' : '#64748b',
    fontSize: '0.78rem',
    cursor: 'pointer',
    fontWeight: 500,
    transition: 'all 0.2s',
  } as React.CSSProperties,

  sectionLabel: {
    fontSize: '0.75rem',
    color: isDark ? '#94a3b8' : '#475569',
    fontWeight: 600,
    flexShrink: 0,
    alignSelf: 'center',
  } as React.CSSProperties,

  divider: {
    width: '1px',
    height: '24px',
    background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)',
    flexShrink: 0,
  } as React.CSSProperties,

  filterBtn: {
    padding: '0.3rem 0.8rem',
    borderRadius: '20px',
    border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(15,23,42,0.15)',
    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.05)',
    color: isDark ? '#E5E5EA' : '#475569',
    fontSize: '0.78rem',
    cursor: 'pointer',
    fontWeight: 500,
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
  } as React.CSSProperties,

  filterBtnActive: {
    border: '1px solid #00D9FF',
    background: 'rgba(0,217,255,0.15)',
    color: '#00D9FF',
    fontWeight: 700,
  } as React.CSSProperties,

  mapWrapper: {
    flex: 1,
    borderRadius: '16px',
    overflow: 'hidden',
    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(15,23,42,0.1)',
    boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(15,23,42,0.15)',
    minHeight: '560px',
  } as React.CSSProperties,

  legend: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
    padding: '0.65rem 1rem',
    background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(15,23,42,0.03)',
    border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(15,23,42,0.08)',
    borderRadius: '10px',
    alignItems: 'center',
  } as React.CSSProperties,

  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.78rem',
    color: isDark ? '#8e8e93' : '#475569',
  } as React.CSSProperties,

  legendDot: (color: string): React.CSSProperties => ({
    width: '10px', height: '10px', borderRadius: '50%',
    background: color, flexShrink: 0,
    boxShadow: `0 0 5px ${color}`,
  }),
});


// ── Componente principal ──────────────────────────────────────────────────────
export const MapaView: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const s = getStyles(theme === 'dark');

  const [sucursales, setSucursales] = useState<SucursalMapaDTO[]>([]);
  const [sinGeo, setSinGeo]         = useState(0);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  // Filtros
  const [filtroSede,    setFiltroSede]    = useState<string | null>(null);
  const [searchQuery,   setSearchQuery]   = useState('');
  const [filtroEstados, setFiltroEstados] = useState<Set<EstadoFiltro>>(new Set());

  if (!user || user.role !== 'SUPER_ADMIN') {
    return <Navigate to="/dashboard/resumen" replace />;
  }

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const uc     = UseCaseFactory.getObtenerSedesMapaUC();
        const result = await uc.execute({ role: user.role as 'SUPER_ADMIN' });
        if (!mounted) return;
        if (result.isLeft()) {
          setError(result.value.message);
        } else {
          setSucursales(result.value.sucursales);
          setSinGeo(result.value.sinGeolocalizacion);
        }
      } catch (err: any) {
        if (mounted) setError(err?.message || 'Error al cargar el mapa.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchData();
    return () => { mounted = false; };
  }, [user.role]);

  // Sucursales enriquecidas con estado calculado (La Paz TZ + schedules)
  const processedGyms = useMemo(() =>
    sucursales.map(sc => ({ ...sc, computedStatus: calculateGymStatus(sc) })),
    [sucursales]
  );

  // Sedes únicas
  const sedesUnicas = useMemo(() => {
    const map = new Map<string, number | null>();
    sucursales.forEach(sc => map.set(sc.sedePrincipalNombre, sc.sedePrincipalId));
    return Array.from(map.entries()).map(([nombre, id]) => ({ nombre, id }));
  }, [sucursales]);

  // Sucursales sin sede asignada
  const sinSedeCnt = useMemo(
    () => sucursales.filter(sc => sc.sedePrincipalId === null).length,
    [sucursales]
  );

  // Conteos por estado — calculados, no desde backend flags
  const estadoCounts = useMemo(() => ({
    abierta:  processedGyms.filter(sc => sc.computedStatus === 'abierta').length,
    cerrada:  processedGyms.filter(sc => sc.computedStatus === 'cerrada').length,
    inactiva: processedGyms.filter(sc => sc.computedStatus === 'inactiva').length,
  }), [processedGyms]);

  const toggleEstado = (e: EstadoFiltro) => {
    setFiltroEstados(prev => {
      const next = new Set(prev);
      next.has(e) ? next.delete(e) : next.add(e);
      return next;
    });
  };

  // Filtrado compuesto — usa processedGyms para estado calculado
  const sucursalesFiltradas = useMemo(() => {
    let list = processedGyms;
    if (filtroSede === '__sinSede__') {
      list = list.filter(sc => sc.sedePrincipalId === null);
    } else if (filtroSede !== null) {
      list = list.filter(sc => sc.sedePrincipalNombre === filtroSede);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(sc => sc.nombre.toLowerCase().includes(q));
    }
    if (filtroEstados.size > 0) {
      list = list.filter(sc => filtroEstados.has(sc.computedStatus));
    }
    return list;
  }, [processedGyms, filtroSede, searchQuery, filtroEstados]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <section style={s.page} className="glass-panel">

      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Mapa de Red de Sucursales</h1>
          <p style={s.subtitle}>Visualización geoespacial de toda la red de gimnasios GymSync Pro</p>
        </div>

        {/* Stats cards */}
        <div style={s.statsRow}>
          <div style={s.statCard}>
            <span style={s.statLabel}>Total</span>
            <span style={{ ...s.statValue, color: '#00D9FF' }}>{loading ? '—' : sucursales.length}</span>
          </div>
          <div style={s.statCard}>
            <span style={s.statLabel}>En mapa</span>
            <span style={{ ...s.statValue, color: '#30D158' }}>{loading ? '—' : sucursalesFiltradas.length}</span>
          </div>
          <div style={s.statCard}>
            <span style={s.statLabel}>Marcas</span>
            <span style={{ ...s.statValue, color: '#BF5AF2' }}>{loading ? '—' : sedesUnicas.length}</span>
          </div>
          <div style={s.statCard}>
            <span style={s.statLabel}>Sin marca</span>
            <span style={{ ...s.statValue, color: '#8E8E93' }}>{loading ? '—' : sinSedeCnt}</span>
          </div>
          <div style={s.statCard}>
            <span style={s.statLabel}>Cap. total</span>
            <span style={{ ...s.statValue, color: '#FF9F0A' }}>
              {loading ? '—' : sucursalesFiltradas.reduce((a, sc) => a + sc.maxCapacity, 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Aviso sin geo */}
      {sinGeo > 0 && !loading && (
        <div style={{ background: '#fb6340', border: 'none', borderRadius: '8px', padding: '0.5rem 0.85rem', fontSize: '0.8rem', color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span><strong>{sinGeo} sucursal{sinGeo > 1 ? 'es' : ''}</strong> sin coordenadas GPS — no se {sinGeo > 1 ? 'muestran' : 'muestra'} en el mapa.</span>
        </div>
      )}

      {/* Carga / error */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Cargando datos geoespaciales...</div>
        </div>
      )}
      {error && !loading && (
        <div style={{ background: '#f5365c', border: 'none', borderRadius: '8px', padding: '1rem', color: '#fff', fontWeight: 600 }}>
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* ── Toolbar ─────────────────────────────────────────────────────── */}
          <div style={s.toolbar}>

            {/* Buscar por nombre */}
            <div style={{ position: 'relative', flex: '1 1 160px', maxWidth: '240px' }}>
              <span style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem', pointerEvents: 'none', color: '#8E8E93' }}>🔍</span>
              <input
                type="text"
                placeholder="Buscar sucursal…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={s.searchInput}
              />
            </div>

            <div style={s.divider} />

            {/* Filtro estado */}
            <span style={s.sectionLabel}>Estado:</span>
            {(Object.keys(ESTADO_CONFIG) as EstadoFiltro[]).map(key => {
              const cfg  = ESTADO_CONFIG[key];
              const on   = filtroEstados.has(key);
              return (
                <button
                  key={key}
                  onClick={() => toggleEstado(key)}
                  style={on ? s.pillActive(cfg.color) : s.pillInactive}
                >
                  {cfg.emoji} {cfg.label} ({estadoCounts[key]})
                </button>
              );
            })}

            <div style={s.divider} />

            {/* Filtro marca */}
            <span style={s.sectionLabel}>Marca:</span>
            <button
              style={{ ...s.filterBtn, ...(filtroSede === null ? s.filterBtnActive : {}) }}
              onClick={() => setFiltroSede(null)}
            >
              Todas ({sucursales.length})
            </button>
            {sinSedeCnt > 0 && (
              <button
                style={{
                  ...s.filterBtn,
                  ...(filtroSede === '__sinSede__'
                    ? { border: '1px solid #8E8E93', background: 'rgba(142,142,147,0.15)', color: '#8E8E93', fontWeight: 700 }
                    : {}),
                }}
                onClick={() => setFiltroSede(filtroSede === '__sinSede__' ? null : '__sinSede__')}
              >
                Sin Marca ({sinSedeCnt})
              </button>
            )}
            {sedesUnicas.map(({ nombre, id }) => {
              const cnt   = sucursales.filter(sc => sc.sedePrincipalNombre === nombre).length;
              const color = getSedeColor(id);
              const on    = filtroSede === nombre;
              return (
                <button
                  key={nombre}
                  style={{ ...s.filterBtn, ...(on ? { border: `1px solid ${color}`, background: `${color}22`, color, fontWeight: 700 } : {}) }}
                  onClick={() => setFiltroSede(on ? null : nombre)}
                >
                  {nombre} ({cnt})
                </button>
              );
            })}
          </div>

          {/* ── Mapa ────────────────────────────────────────────────────────── */}
          <div style={s.mapWrapper}>
            <MapContainer
              center={[-17.7833, -63.1667]}
              zoom={12}
              style={{ height: '100%', width: '100%', minHeight: '560px', background: theme === 'dark' ? '#0A0A0A' : '#E5E5EA' }}
              zoomControl
            >
              <TileLayer
                url={theme === 'dark' ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"}
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                maxZoom={19}
              />
              <AutoFitBounds sucursales={sucursalesFiltradas} />

              {sucursalesFiltradas.map(sc => {
                // Icono depende del estado CALCULADO, no del flag del backend
                const icon = sc.computedStatus === 'inactiva'
                  ? iconInactiva
                  : sc.computedStatus === 'abierta'
                    ? iconActiva
                    : iconCerrada;
                return (
                  <Marker key={sc.id} position={[sc.latitude, sc.longitude]} icon={icon}>
                    <Popup className="gymsync-popup" maxWidth={280} minWidth={230}>
                      <PopupCard s={sc} computedStatus={sc.computedStatus} />
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>

          {/* ── Leyenda ─────────────────────────────────────────────────────── */}
          <div style={s.legend}>
            <div style={s.legendItem}><div style={s.legendDot('#00D9FF')} /><span>Activa y Abierta</span></div>
            <div style={s.legendItem}><div style={s.legendDot('#FF9F0A')} /><span>Activa y Cerrada</span></div>
            <div style={s.legendItem}><div style={s.legendDot('#FF5E00')} /><span>Inactiva</span></div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {sedesUnicas.slice(0, 6).map(({ nombre, id }) => (
                <div key={nombre} style={s.legendItem}>
                  <div style={s.legendDot(getSedeColor(id))} />
                  <span style={{ color: getSedeColor(id) }}>{nombre}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Estilos globales Leaflet */}
      <style>{`
        .leaflet-popup-content-wrapper,
        .leaflet-popup-tip {
          background: transparent !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .leaflet-popup-content {
          margin: 0 !important;
          width: auto !important;
        }
        .gymsync-popup .leaflet-popup-close-button {
          color: #8E8E93 !important;
          top: 6px !important;
          right: 6px !important;
          font-size: 15px !important;
        }
        .leaflet-container { background: ${theme === 'dark' ? '#0A0A0A' : '#E5E5EA'} !important; }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </section>
  );
};
