/**
 * MapaView.tsx — Vista de Mapa de Red de Sucursales.
 *
 * Exclusiva para SUPER_ADMIN. Muestra todas las sucursales geolocalizadas
 * sobre un tile layer oscuro (CartoDB Dark Matter) con popups premium.
 *
 * Arquitectura:
 *  - Consume ObtenerSedesMapaUseCase del @gymsync/core vía UseCaseFactory.
 *  - Usa react-leaflet (ya instalado en el proyecto).
 *  - El acceso está doblemente protegido: RBAC en Core + RoleGuard en AppRouter.
 */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../../contexts/AuthContext';
import { UseCaseFactory } from '../../infrastructure/UseCaseFactory';
import type { SucursalMapaDTO } from '@gymsync/core';

// ── Fix para íconos rotos de Leaflet en entornos Vite/Webpack ─────────────────
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// ── Íconos personalizados por estado ─────────────────────────────────────────
const createCustomIcon = (color: string) =>
  L.divIcon({
    className: '',
    html: `
      <div style="
        width: 28px; height: 28px;
        background: ${color};
        border: 3px solid rgba(255,255,255,0.9);
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 14px rgba(0,0,0,0.5);
      "></div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -30],
  });

const iconActiva = createCustomIcon('#00D9FF');   // Cyan — activa y abierta
const iconCerrada = createCustomIcon('#FF9F0A');   // Ámbar — activa pero cerrada
const iconInactiva = createCustomIcon('#FF5E00');  // Naranja — inactiva

// ── Colores por Sede Principal (generados de forma determinística) ────────────
const SEDE_PALETTE = [
  '#00D9FF', '#30D158', '#FF9F0A', '#BF5AF2', '#FF375F',
  '#64D2FF', '#FFD60A', '#FF6961', '#4CD964', '#5AC8FA',
];
const getSedeColor = (sedePrincipalId: number | null): string => {
  if (sedePrincipalId === null) return '#8E8E93';
  return SEDE_PALETTE[sedePrincipalId % SEDE_PALETTE.length];
};

// ── Componente auxiliar: centra el mapa en el promedio de coordenadas ─────────
const AutoFitBounds = ({ sucursales }: { sucursales: SucursalMapaDTO[] }) => {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (fitted.current || sucursales.length === 0) return;
    const bounds = L.latLngBounds(sucursales.map((s) => [s.latitude, s.longitude]));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 });
    fitted.current = true;
  }, [sucursales, map]);

  return null;
};

// ── Estilos premium inline ────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: '1.25rem',
    color: '#FFFFFF',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    minHeight: 0,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '0.75rem',
  },
  headerLeft: { display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  title: { margin: 0, fontSize: '1.8rem', fontWeight: 700 },
  subtitle: { margin: 0, color: '#8E8E93', fontSize: '0.9rem' },
  statsRow: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  statCard: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    padding: '0.6rem 1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: '110px',
  },
  statLabel: { fontSize: '0.7rem', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.06em' },
  statValue: { fontSize: '1.25rem', fontWeight: 700 },
  geoWarning: {
    background: 'rgba(255, 159, 10, 0.1)',
    border: '1px solid rgba(255, 159, 10, 0.3)',
    borderRadius: '8px',
    padding: '0.5rem 0.85rem',
    fontSize: '0.8rem',
    color: '#FF9F0A',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  controlBar: {
    display: 'flex',
    gap: '0.6rem',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  filterBtn: {
    padding: '0.35rem 0.85rem',
    borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.05)',
    color: '#E5E5EA',
    fontSize: '0.8rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontWeight: 500,
  },
  filterBtnActive: {
    border: '1px solid #00D9FF',
    background: 'rgba(0, 217, 255, 0.15)',
    color: '#00D9FF',
  },
  mapWrapper: {
    flex: 1,
    borderRadius: '16px',
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
    minHeight: '500px',
  },
  legend: {
    display: 'flex',
    gap: '1.25rem',
    flexWrap: 'wrap',
    padding: '0.75rem 1rem',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '10px',
  },
  legendItem: { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#8E8E93' },
  legendDot: (color: string): React.CSSProperties => ({
    width: '12px', height: '12px', borderRadius: '50%',
    background: color, flexShrink: 0,
    boxShadow: `0 0 6px ${color}`,
  }),
};

// ── Popup content — HTML estilizado inyectado en Leaflet ─────────────────────
const buildPopupHTML = (s: SucursalMapaDTO): string => {
  const sedeColor = getSedeColor(s.sedePrincipalId);
  const estadoColor = !s.isActive ? '#FF5E00' : s.isOpen ? '#30D158' : '#FF9F0A';
  const estadoLabel = !s.isActive ? 'INACTIVA' : s.isOpen ? 'ABIERTA' : 'CERRADA';
  const ocupacion = s.maxCapacity > 0
    ? Math.round((s.aforoActual / s.maxCapacity) * 100)
    : 0;
  const barColor = ocupacion >= 80 ? '#FF5E00' : ocupacion >= 50 ? '#FF9F0A' : '#30D158';

  return `
    <div style="
      font-family: 'Inter', system-ui, sans-serif;
      background: rgba(15,15,17,0.97);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 12px;
      padding: 14px 16px;
      min-width: 220px;
      max-width: 270px;
      color: #FFF;
      box-shadow: 0 16px 40px rgba(0,0,0,0.6);
    ">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
        <div>
          <div style="font-size:0.95rem;font-weight:700;color:#FFFFFF;line-height:1.3;">${s.nombre}</div>
          <span style="
            display:inline-block;margin-top:4px;
            background:rgba(0,0,0,0.4);
            border:1px solid ${sedeColor}50;
            color:${sedeColor};
            font-size:0.68rem;font-weight:700;
            padding:2px 8px;border-radius:12px;
            letter-spacing:0.04em;
          ">${s.sedePrincipalNombre}</span>
        </div>
        <span style="
          font-size:0.68rem;font-weight:700;
          color:${estadoColor};
          background:${estadoColor}20;
          padding:3px 7px;border-radius:8px;
          border:1px solid ${estadoColor}40;
          white-space:nowrap;margin-left:8px;
        ">● ${estadoLabel}</span>
      </div>

      <div style="font-size:0.75rem;color:#8E8E93;margin-bottom:10px;line-height:1.4;">
        📍 ${s.address}
      </div>

      <div style="margin-bottom:8px;">
        <div style="display:flex;justify-content:space-between;font-size:0.72rem;margin-bottom:4px;">
          <span style="color:#8E8E93;">Aforo</span>
          <span style="color:#E5E5EA;font-weight:600;">${s.aforoActual} / ${s.maxCapacity}</span>
        </div>
        <div style="height:5px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden;">
          <div style="height:100%;width:${ocupacion}%;background:${barColor};border-radius:3px;transition:width 0.4s;"></div>
        </div>
      </div>

      <div style="font-size:0.7rem;color:#8E8E93;text-align:right;margin-top:6px;font-family:monospace;">
        ${s.latitude.toFixed(5)}, ${s.longitude.toFixed(5)}
      </div>
    </div>
  `;
};

// ── Componente principal ──────────────────────────────────────────────────────
export const MapaView: React.FC = () => {
  const { user } = useAuth();
  const [sucursales, setSucursales] = useState<SucursalMapaDTO[]>([]);
  const [sinGeo, setSinGeo] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroSede, setFiltroSede] = useState<string | null>(null); // null = todas

  // Guardián extra — el RoleGuard en el router es la barrera principal
  if (!user || user.role !== 'SUPER_ADMIN') {
    return <Navigate to="/dashboard/resumen" replace />;
  }

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const uc = UseCaseFactory.getObtenerSedesMapaUC();
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

  // Sedes únicas para los filtros
  const sedesUnicas = useMemo(() => {
    const map = new Map<string, number | null>();
    sucursales.forEach((s) => map.set(s.sedePrincipalNombre, s.sedePrincipalId));
    return Array.from(map.entries()).map(([nombre, id]) => ({ nombre, id }));
  }, [sucursales]);

  // Sucursales filtradas según el botón activo
  const sucursalesFiltradas = useMemo(() => {
    if (filtroSede === null) return sucursales;
    return sucursales.filter((s) => s.sedePrincipalNombre === filtroSede);
  }, [sucursales, filtroSede]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <section style={styles.page} className="glass-panel">
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>🌐 Mapa de Red de Sucursales</h1>
          <p style={styles.subtitle}>
            Visualización geoespacial de toda la red de gimnasios GymSync Pro
          </p>
        </div>

        {/* Tarjetas de estadísticas */}
        <div style={styles.statsRow}>
          <div style={styles.statCard}>
            <span style={styles.statLabel}>Total Sucursales</span>
            <span style={{ ...styles.statValue, color: '#00D9FF' }}>
              {loading ? '—' : sucursales.length}
            </span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statLabel}>En Mapa</span>
            <span style={{ ...styles.statValue, color: '#30D158' }}>
              {loading ? '—' : sucursalesFiltradas.length}
            </span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statLabel}>Sedes (Marcas)</span>
            <span style={{ ...styles.statValue, color: '#BF5AF2' }}>
              {loading ? '—' : sedesUnicas.length}
            </span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statLabel}>Cap. Total</span>
            <span style={{ ...styles.statValue, color: '#FF9F0A' }}>
              {loading ? '—' : sucursalesFiltradas.reduce((acc, s) => acc + s.maxCapacity, 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Aviso de sucursales sin geolocalización */}
      {sinGeo > 0 && !loading && (
        <div style={styles.geoWarning}>
          <span>⚠️</span>
          <span>
            <strong>{sinGeo} sucursal{sinGeo > 1 ? 'es' : ''}</strong> sin coordenadas GPS — no se
            {sinGeo > 1 ? ' muestran' : ' muestra'} en el mapa. Actualiza su ubicación desde la gestión de Sucursales.
          </span>
        </div>
      )}

      {/* Estado de carga/error */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#8E8E93' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem', animation: 'pulse 1.5s infinite' }}>🗺️</div>
          Cargando datos geoespaciales...
        </div>
      )}

      {error && !loading && (
        <div style={{ background: 'rgba(255,94,0,0.1)', border: '1px solid #FF5E00', borderRadius: '8px', padding: '1rem', color: '#FF5E00' }}>
          ⚠️ {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Barra de filtros por Sede Principal */}
          {sedesUnicas.length > 0 && (
            <div style={styles.controlBar}>
              <span style={{ fontSize: '0.8rem', color: '#8E8E93', marginRight: '0.25rem' }}>Filtrar por Sede:</span>
              <button
                style={{
                  ...styles.filterBtn,
                  ...(filtroSede === null ? styles.filterBtnActive : {}),
                }}
                onClick={() => setFiltroSede(null)}
              >
                Todas ({sucursales.length})
              </button>
              {sedesUnicas.map(({ nombre, id }) => {
                const count = sucursales.filter((s) => s.sedePrincipalNombre === nombre).length;
                const color = getSedeColor(id);
                const isActive = filtroSede === nombre;
                return (
                  <button
                    key={nombre}
                    style={{
                      ...styles.filterBtn,
                      ...(isActive ? { border: `1px solid ${color}`, background: `${color}22`, color } : {}),
                    }}
                    onClick={() => setFiltroSede(isActive ? null : nombre)}
                  >
                    {nombre} ({count})
                  </button>
                );
              })}
            </div>
          )}

          {/* Mapa de Leaflet */}
          <div style={styles.mapWrapper}>
            <MapContainer
              center={[-17.7833, -63.1667]}
              zoom={12}
              style={{ height: '100%', width: '100%', minHeight: '500px', background: '#0A0A0A' }}
              zoomControl={true}
            >
              {/* Tile Layer oscuro — CartoDB Dark Matter */}
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                maxZoom={19}
              />

              {/* Auto-fit a los marcadores */}
              <AutoFitBounds sucursales={sucursalesFiltradas} />

              {/* Marcadores */}
              {sucursalesFiltradas.map((s) => {
                const icon = !s.isActive ? iconInactiva : s.isOpen ? iconActiva : iconCerrada;
                return (
                  <Marker
                    key={s.id}
                    position={[s.latitude, s.longitude]}
                    icon={icon}
                  >
                    <Popup
                      className="gymsync-popup"
                      maxWidth={280}
                      minWidth={230}
                    >
                      <div
                        dangerouslySetInnerHTML={{ __html: buildPopupHTML(s) }}
                      />
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>

          {/* Leyenda de estados */}
          <div style={styles.legend}>
            <div style={styles.legendItem}>
              <div style={styles.legendDot('#00D9FF')} />
              <span>Activa y Abierta</span>
            </div>
            <div style={styles.legendItem}>
              <div style={styles.legendDot('#FF9F0A')} />
              <span>Activa y Cerrada</span>
            </div>
            <div style={styles.legendItem}>
              <div style={styles.legendDot('#FF5E00')} />
              <span>Inactiva</span>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {sedesUnicas.slice(0, 6).map(({ nombre, id }) => (
                <div key={nombre} style={styles.legendItem}>
                  <div style={styles.legendDot(getSedeColor(id))} />
                  <span style={{ color: getSedeColor(id) }}>{nombre}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Estilos globales del popup de Leaflet */}
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
          top: 8px !important;
          right: 8px !important;
          font-size: 16px !important;
        }
        .leaflet-container {
          background: #0A0A0A !important;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </section>
  );
};
