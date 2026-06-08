import React, { useState, useEffect, useCallback, useRef, useId } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import toast from 'react-hot-toast';
import { ConsultarHistorialAccesosUseCase } from '@gymsync/core';
import type { Acceso } from '@gymsync/core';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../infrastructure/api.config';
import { AxiosAccessApiAdapter } from '../../infrastructure/AxiosAccessApi.adapter';
import './AuditoriaView.css';
import '../Reservas/QrScannerModal.css';

const apiAdapter = new AxiosAccessApiAdapter();
const consultarAccesosUseCase = new ConsultarHistorialAccesosUseCase(apiAdapter);

// ── Modal escáner QR de Check-In ─────────────────────────────────────────────
const CheckInScannerModal = ({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) => {
  const uid       = useId().replace(/:/g, '_');
  const SCANNER_ID = `checkin_scanner_${uid}`;
  const scannerRef    = useRef<Html5Qrcode | null>(null);
  const processingRef = useRef(false);
  const [status,    setStatus]   = useState<'idle' | 'scanning' | 'validating' | 'error'>('idle');
  const [errorMsg,  setErrorMsg] = useState('');

  const playBeep = () => {
    try {
      const ctx  = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine'; osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.01);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
      osc.start(); osc.stop(ctx.currentTime + 0.2);
    } catch {}
  };

  useEffect(() => {
    let isMounted = true;
    const start = async () => {
      await new Promise(r => setTimeout(r, 300));
      if (!isMounted) return;
      const scanner = new Html5Qrcode(SCANNER_ID);
      scannerRef.current = scanner;
      try {
        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 15,
            qrbox: (w, h) => {
              const size = Math.floor(Math.min(w, h) * 0.6);
              return { width: size, height: size };
            },
          },
          async (decodedText) => {
            if (processingRef.current || !isMounted) return;
            processingRef.current = true;
            setStatus('validating');
            playBeep();
            try {
              await apiClient.post('/checkins', { userId: decodedText, method: 'QR' });
              toast.success('Acceso registrado correctamente');
              await scanner.stop();
              onSuccess();
              onClose();
            } catch (e: any) {
              const msg = e?.response?.data?.message ?? e.message ?? 'Error al registrar acceso';
              setErrorMsg(msg);
              setStatus('error');
              setTimeout(() => {
                if (isMounted) { setStatus('scanning'); processingRef.current = false; }
              }, 3000);
            }
          },
          (errMsg: string) => {
            // Html5Qrcode llama este callback en cada frame sin QR (NotFoundException es ruido normal)
            if (errMsg && !errMsg.includes('NotFoundException') && !errMsg.toLowerCase().includes('no qr code')) {
              console.warn('[QRScanner] Error de escaneo:', errMsg);
            }
          },
        );
        if (isMounted) setStatus('scanning');
      } catch (e) {
        if (!isMounted) return;
        setErrorMsg(`Cámara no disponible: ${e instanceof Error ? e.message : String(e)}`);
        setStatus('error');
      }
    };
    start();
    return () => {
      isMounted = false;
      if (scannerRef.current?.isScanning) scannerRef.current.stop().catch(() => {});
    };
  }, [SCANNER_ID]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="qr-modal-overlay" onClick={onClose}>
      <div className="qr-modal-card" onClick={e => e.stopPropagation()}>
        <div className="qr-modal-header">
          <div className="qr-title-group">
            <h2 className="qr-modal-title">Registrar Acceso</h2>
            <div className={`qr-badge-live ${status === 'scanning' ? 'active' : ''}`}>
              <span className="dot" /> EN VIVO
            </div>
          </div>
          <button className="qr-modal-close" onClick={onClose}>✕</button>
        </div>
        <p className="qr-modal-subtitle">Ubica el código QR del miembro dentro del recuadro</p>
        <div className="qr-scanner-wrapper">
          <div id={SCANNER_ID} className="qr-scanner-video-container" />
          {status === 'idle' && (
            <div className="qr-overlay-state">
              <div className="qr-loader-spinner" /><span>Iniciando cámara...</span>
            </div>
          )}
          {status === 'validating' && (
            <div className="qr-overlay-state success">
              <div className="qr-loader-spinner white" /><span>Registrando...</span>
            </div>
          )}
          {status === 'scanning' && (
            <div className="qr-scan-guide">
              <div className="guide-corners" />
              <div className="guide-line" />
            </div>
          )}
        </div>
        <div className="qr-footer-info">
          {status === 'error' ? (
            <div className="qr-msg-box error">
              <span className="icon">⚠️</span>
              <div className="content">
                <p>{errorMsg}</p>
                <button className="btn-inline-retry" onClick={() => { setStatus('scanning'); processingRef.current = false; }}>
                  Reintentar
                </button>
              </div>
            </div>
          ) : (
            <div className="qr-hint">
              <p>Asegúrate de que haya buena iluminación sobre el teléfono del miembro.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Avatar de letra por rol ───────────────────────────────────────────────────
const ROLE_AVATAR: Record<string, { letter: string; bg: string }> = {
  ENTRENADOR:           { letter: 'E', bg: '#5e72e4' },
  INSTRUCTOR:           { letter: 'I', bg: '#11cdef' },
  NUTRICIONISTA:        { letter: 'N', bg: '#fb6340' },
  PERSONAL_DE_LIMPIEZA: { letter: 'L', bg: '#6c757d' },
  COORDINADOR:          { letter: 'C', bg: '#f5365c' },
  GERENTE:              { letter: 'G', bg: '#8965e0' },
  CLIENTE:              { letter: 'U', bg: '#2dce89' },
  SUPER_ADMIN:          { letter: 'S', bg: '#172b4d' },
};

const RoleAvatar = ({ rol, nombre }: { rol?: string; nombre: string }) => {
  const mapped = rol ? ROLE_AVATAR[rol.toUpperCase()] : undefined;
  const letter = mapped?.letter ?? (nombre?.[0]?.toUpperCase() || 'U');
  const bg     = mapped?.bg ?? '#adb5bd';
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white select-none"
      style={{ background: bg }}
    >
      {letter}
    </div>
  );
};

// ── Panel de Accesos ─────────────────────────────────────────────────────────
const AccesosPanel = () => {
  const { user } = useAuth();
  const [accesos,      setAccesos]      = useState<Acceso[]>([]);
  const [filtroSede,   setFiltroSede]   = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroTiempo, setFiltroTiempo] = useState('');
  const [page,         setPage]         = useState(1);
  const [hasMore,      setHasMore]      = useState(true);
  const [loading,      setLoading]      = useState(false);
  const [errorAcceso,  setErrorAcceso]  = useState<string | null>(null);
  const [refreshKey,   setRefreshKey]   = useState(0);
  const [showScanner,  setShowScanner]  = useState(false);
  const [gyms,         setGyms]         = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    if (user?.role !== 'SUPER_ADMIN') return;
    apiClient.get<Array<{ id: unknown; name: unknown }>>('/gyms')
      .then(res => {
        const raw = Array.isArray(res.data) ? res.data : [];
        setGyms(raw.map(g => ({ id: Number(g.id), name: String(g.name) })));
      })
      .catch(() => {});
  }, [user?.role]);

  const cargarAccesos = useCallback(async (resetPage = false) => {
    if (!user) return;
    setLoading(true);
    setErrorAcceso(null);

    // Cuando hay filtro de tiempo activo, cargar todos los registros de una vez
    // para que el filtro cliente-side tenga el universo completo y no solo la página actual
    const timeFilterActive = Boolean(filtroTiempo);
    const currentPage = (resetPage || timeFilterActive) ? 1 : page;
    const limit = timeFilterActive ? 1000 : 20;

    // Gerente: Restringir a sucursal asociada a la cuenta del gerente
    const selectedGymId = user.role === 'GERENTE' ? (user.gymId || undefined) : (filtroSede || undefined);

    const result = await consultarAccesosUseCase.execute(user, {
      gymId:  selectedGymId,
      estado: filtroEstado || undefined,
      page:   currentPage,
      limit,
    });

    if (result.isRight()) {
      const { data, total } = result.value;
      setAccesos(prev => (resetPage || timeFilterActive) ? data : [...prev, ...data]);
      setHasMore(!timeFilterActive && data.length > 0 && (currentPage * 20) < total);
    } else {
      setErrorAcceso(result.value.message);
      setAccesos([]);
      setHasMore(false);
    }
    setLoading(false);
  }, [filtroSede, filtroEstado, filtroTiempo, page, user]);

  useEffect(() => {
    cargarAccesos(true);
    setPage(1);
  }, [filtroSede, filtroEstado, filtroTiempo, user, refreshKey]);

  useEffect(() => {
    if (page > 1) cargarAccesos(false);
  }, [page, cargarAccesos]);

  const filteredAccesos = React.useMemo(() => {
    let list = accesos;

    if (filtroTiempo === 'hoy') {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      list = list.filter(a => new Date(a.checkInTime).getTime() >= startOfToday);
    } else if (filtroTiempo === 'semana') {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).getTime();
      list = list.filter(a => new Date(a.checkInTime).getTime() >= sevenDaysAgo);
    } else if (filtroTiempo === 'mes') {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30).getTime();
      list = list.filter(a => new Date(a.checkInTime).getTime() >= thirtyDaysAgo);
    }

    return list;
  }, [accesos, filtroTiempo]);

  return (
    <div className="auditoria-view">

      {showScanner && (
        <CheckInScannerModal
          onClose={() => setShowScanner(false)}
          onSuccess={() => { setRefreshKey(k => k + 1); setShowScanner(false); }}
        />
      )}

      {/* Cabecera + filtros */}
      <div className="view-header">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Control de Asistencia</h1>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
            Historial diario de ingresos y cumplimiento de horarios del personal en todas las sedes.  
          </p>
        </div>
        <div className="view-filters">
          {user?.role !== 'SUPER_ADMIN' && (
            <button
              onClick={() => setShowScanner(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                background: '#fb6340', color: '#fff', border: 'none',
                padding: '0.5rem 1rem', borderRadius: '8px',
                fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="3" height="3"/>
                <rect x="19" y="14" width="2" height="2"/><rect x="14" y="19" width="2" height="2"/>
                <rect x="19" y="19" width="2" height="2"/>
              </svg>
              Escanear QR
            </button>
          )}
          {user?.role === 'SUPER_ADMIN' && (
            <select
              value={filtroSede}
              onChange={e => setFiltroSede(e.target.value)}
              className="bg-white dark:bg-[#151521] border border-slate-200 dark:border-gray-800 text-slate-900 dark:text-white rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#2ecc71] transition-colors"
            >
              <option value="">Todas las Sedes</option>
              {gyms.map(g => (
                <option key={g.id} value={String(g.id)}>{g.name}</option>
              ))}
            </select>
          )}
          <select
            value={filtroEstado}
            onChange={e => setFiltroEstado(e.target.value)}
            className="bg-white dark:bg-[#151521] border border-slate-200 dark:border-gray-800 text-slate-900 dark:text-white rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#2ecc71] transition-colors font-semibold cursor-pointer text-sm"
          >
            <option value="">Todos los Estados</option>
            <option value="AUTORIZADO">Autorizados</option>
            <option value="DENEGADO">Denegados</option>
          </select>
          <select
            value={filtroTiempo}
            onChange={e => setFiltroTiempo(e.target.value)}
            className="bg-white dark:bg-[#151521] border border-slate-200 dark:border-gray-800 text-slate-900 dark:text-white rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#2ecc71] transition-colors font-semibold cursor-pointer text-sm"
          >
            <option value="">Todos los Registros</option>
            <option value="hoy">Hoy</option>
            <option value="semana">Esta Semana</option>
            <option value="mes">Este Mes</option>
          </select>
        </div>
      </div>

      {errorAcceso ? (
        <div className="error-panel">
          <h3>Error de Seguridad (RBAC)</h3>
          <p>{errorAcceso}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1e1e2d] border border-slate-200 dark:border-gray-800 rounded-xl shadow-sm overflow-x-auto mt-4 transition-colors">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-[#151521] border-b border-slate-200 dark:border-gray-800 text-slate-500 dark:text-gray-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Usuario</th>
                <th className="px-6 py-4">Sede</th>
                <th className="px-6 py-4">Fecha/Hora</th>
                <th className="px-6 py-4">Método</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccesos.map(acceso => {
                const isDenied = acceso.status.estado === 'DENEGADO';
                return (
                  <tr
                    key={acceso.id.value}
                    className={`border-b border-slate-100 dark:border-gray-800 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-slate-700 dark:text-gray-300 text-sm${isDenied ? ' row-denied' : ''}`}
                  >
                    <td data-label="ID" className="px-6 py-4 cell-id">...{acceso.id.value.slice(-6)}</td>
                    <td data-label="Usuario" className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <RoleAvatar rol={acceso.userInfo.rol} nombre={acceso.userInfo.nombre} />
                        <div className="flex-1 flex flex-col gap-0.5">
                          <span className="font-semibold text-slate-900 dark:text-white">{acceso.userInfo.nombre}</span>
                          <span className="text-xs text-slate-500 dark:text-gray-400">{acceso.userInfo.email}</span>
                        </div>
                      </div>
                    </td>
                    <td data-label="Sede" className="px-6 py-4">
                      <div className="cell-gym">
                        <span className="name">{acceso.gymInfo.nombre}</span>
                        <a
                          href={`https://maps.google.com/?q=${acceso.gymInfo.coordenadas.lat},${acceso.gymInfo.coordenadas.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="location-link"
                        >
                           Mapa
                        </a>
                      </div>
                    </td>
                    <td data-label="Fecha/Hora" className="px-6 py-4 cell-time">{acceso.checkInTime.toLocaleString()}</td>
                    <td data-label="Método" className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-200 text-xs font-semibold">
                        {acceso.method.tipo}
                      </span>
                    </td>
                    <td data-label="Estado" className="px-6 py-4">
                      <span className={`badge-status ${isDenied ? 'denegado' : 'autorizado'}`}>
                        {acceso.status.estado}
                      </span>
                    </td>
                    <td data-label="Detalle" className="px-6 py-4 cell-reason">
                      {isDenied ? acceso.status.motivoDenegacion : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredAccesos.length === 0 && !loading && (
            <div className="empty-state">No se encontraron registros.</div>
          )}

          {hasMore && (
            <div className="pagination">
              <button onClick={() => setPage(p => p + 1)} disabled={loading} className="btn-load-more">
                {loading ? 'Cargando...' : 'Cargar más resultados'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const AuditoriaView = () => <AccesosPanel />;
