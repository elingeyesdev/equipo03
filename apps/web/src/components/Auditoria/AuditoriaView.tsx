import React, { useState, useEffect, useLayoutEffect, useCallback, useRef, useId } from 'react';
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

interface ScanPreview {
  id: number;
  fullName: string;
  role: string;
  branchName: string;
}

// Modal escáner QR de Check-In — flujo 3 pasos: escaneo → validación → confirmación
const CheckInScannerModal = ({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) => {
  const uid        = useId().replace(/:/g, '_');
  const SCANNER_ID = `checkin_scanner_${uid}`;
  const scannerRef    = useRef<Html5Qrcode | null>(null);
  const processingRef = useRef(false);
  const isMountedRef  = useRef(true);
  const onCloseRef    = useRef(onClose);
  const onSuccessRef  = useRef(onSuccess);
  useLayoutEffect(() => {
    onCloseRef.current   = onClose;
    onSuccessRef.current = onSuccess;
  });
  const [status,   setStatus]   = useState<'idle' | 'scanning' | 'validating' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [preview,  setPreview]  = useState<ScanPreview | null>(null);

  const playBeep = () => {
    try {
      const W = window as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
      const AudioCtor = W.AudioContext || W.webkitAudioContext;
      if (!AudioCtor) return;
      const ctx  = new AudioCtor();
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine'; osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.01);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
      osc.start(); osc.stop(ctx.currentTime + 0.2);
    } catch {
      void 0;
    }
  };

  const resumeScan = () => {
    setPreview(null);
    setErrorMsg('');
    setStatus('scanning');
    processingRef.current = false;
  };

  const handleConfirm = async (action: 'IN' | 'OUT') => {
    if (!preview) return;
    setStatus('validating');
    try {
      await apiClient.post('/checkins/register', { targetUserId: preview.id, action });
      toast.success(action === 'IN' ? 'Ingreso registrado correctamente' : 'Salida registrada correctamente');
      if (scannerRef.current?.isScanning) await scannerRef.current.stop().catch(() => {});
      onSuccessRef.current();
      onCloseRef.current();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      const msg = err?.response?.data?.message ?? err?.message ?? 'Error al registrar acceso';
      setErrorMsg(msg);
      setStatus('error');
      setPreview(null);
      setTimeout(() => { if (isMountedRef.current) resumeScan(); }, 3000);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    const start = async () => {
      await new Promise(r => setTimeout(r, 300));
      if (!isMountedRef.current) return;
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
            if (processingRef.current || !isMountedRef.current) return;
            processingRef.current = true;
            setStatus('validating');
            playBeep();
            try {
              const res = await apiClient.post<ScanPreview>('/checkins/scan-preview', { token: decodedText });
              if (isMountedRef.current) {
                setPreview(res.data);
                setStatus('scanning');
              }
            } catch (e: unknown) {
              const err = e as { response?: { data?: { message?: string } }; message?: string };
              const msg = err?.response?.data?.message ?? err?.message ?? 'Error al validar el QR';
              if (isMountedRef.current) {
                setErrorMsg(msg);
                setStatus('error');
                setTimeout(() => { if (isMountedRef.current) resumeScan(); }, 3000);
              }
            }
          },
          (errMsg: string) => {
            if (errMsg && !errMsg.includes('NotFoundException') && !errMsg.toLowerCase().includes('no qr code')) {
              console.warn('[QRScanner] Error de escaneo:', errMsg);
            }
          },
        );
        if (isMountedRef.current) setStatus('scanning');
      } catch (e) {
        if (!isMountedRef.current) return;
        setErrorMsg(`Cámara no disponible: ${e instanceof Error ? e.message : String(e)}`);
        setStatus('error');
      }
    };
    start();
    return () => {
      isMountedRef.current = false;
      if (scannerRef.current?.isScanning) scannerRef.current.stop().catch(() => {});
    };
  }, [SCANNER_ID]);

  return (
    <div className="qr-modal-overlay" onClick={onClose}>
      <div className="qr-modal-card" onClick={e => e.stopPropagation()}>
        <div className="qr-modal-header">
          <div className="qr-title-group">
            <h2 className="qr-modal-title">Registrar Acceso</h2>
            <div className={`qr-badge-live ${status === 'scanning' && !preview ? 'active' : ''}`}>
              <span className="dot" /> EN VIVO
            </div>
          </div>
          <button className="qr-modal-close" onClick={onClose}>✕</button>
        </div>
        <p className="qr-modal-subtitle">
          {preview ? 'Confirma el movimiento del personal' : 'Ubica el código QR del miembro dentro del recuadro'}
        </p>
        <div className="qr-scanner-wrapper">
          <div id={SCANNER_ID} className="qr-scanner-video-container" />
          {status === 'idle' && !preview && (
            <div className="qr-overlay-state">
              <div className="qr-loader-spinner" /><span>Iniciando cámara...</span>
            </div>
          )}
          {status === 'validating' && (
            <div className="qr-overlay-state success">
              <div className="qr-loader-spinner white" />
              <span>{preview ? 'Registrando...' : 'Validando...'}</span>
            </div>
          )}
          {status === 'scanning' && !preview && (
            <div className="qr-scan-guide">
              <div className="guide-corners" />
              <div className="guide-line" />
            </div>
          )}
          {preview && status !== 'validating' && (
            <div className="qr-overlay-state" style={{ flexDirection: 'column', gap: 16, padding: 20, background: 'rgba(0,0,0,0.88)' }}>
              <div
                className="flex flex-col items-center gap-3 w-full rounded-xl p-5 text-center"
                style={{ background: '#111111', border: '1px solid #2A2A2D', maxWidth: 300 }}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
                  style={{ background: '#FF5E00' }}
                >
                  {preview.fullName[0]?.toUpperCase() ?? '?'}
                </div>
                <div>
                  <p className="text-white font-bold text-base leading-tight">{preview.fullName}</p>
                  <p className="text-xs font-semibold mt-1" style={{ color: '#9CA3AF', letterSpacing: '0.05em' }}>{preview.role}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{preview.branchName}</p>
                </div>
                <p className="text-xs" style={{ color: '#D1D5DB' }}>Selecciona el tipo de movimiento:</p>
                <div className="flex gap-3 w-full justify-center">
                  <button
                    onClick={() => void handleConfirm('IN')}
                    className="flex-1 font-bold text-sm py-2.5 px-3 rounded-lg border-0 cursor-pointer text-white"
                    style={{ background: '#16A34A', maxWidth: 120 }}
                  >
                    INGRESO
                  </button>
                  <button
                    onClick={() => void handleConfirm('OUT')}
                    className="flex-1 font-bold text-sm py-2.5 px-3 rounded-lg border-0 cursor-pointer text-white"
                    style={{ background: '#DC2626', maxWidth: 120 }}
                  >
                    SALIDA
                  </button>
                </div>
                <button
                  onClick={resumeScan}
                  className="w-full font-semibold text-sm py-2 px-3 rounded-lg cursor-pointer"
                  style={{ background: 'transparent', border: '1px solid #3A3A3C', color: '#9CA3AF' }}
                >
                  CANCELAR
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="qr-footer-info">
          {status === 'error' ? (
            <div className="qr-msg-box error">
              <div className="content">
                <p>{errorMsg}</p>
                <button className="btn-inline-retry" onClick={resumeScan}>
                  Reintentar
                </button>
              </div>
            </div>
          ) : (
            <div className="qr-hint">
              <p>
                {preview
                  ? 'Confirma INGRESO o SALIDA, o cancela para escanear otro QR.'
                  : 'Asegúrate de que haya buena iluminación sobre el teléfono del miembro.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ROLE_AVATAR: Record<string, { letter: string; bg: string }> = {
  ENTRENADOR:           { letter: 'E', bg: '#38BDF8' },
  INSTRUCTOR:           { letter: 'I', bg: '#38BDF8' },
  NUTRICIONISTA:        { letter: 'N', bg: '#00E5A3' },
  PERSONAL_DE_LIMPIEZA: { letter: 'L', bg: '#B0B0B0' },
  COORDINADOR:          { letter: 'C', bg: '#38BDF8' },
  GERENTE:              { letter: 'G', bg: '#FF5E00' },
  CLIENTE:              { letter: 'U', bg: '#00E5A3' },
  SUPER_ADMIN:          { letter: 'S', bg: '#FF5E00' },
};

const RoleAvatar = ({ rol, nombre }: { rol?: string; nombre: string }) => {
  const mapped = rol ? ROLE_AVATAR[rol.toUpperCase()] : undefined;
  const letter = mapped?.letter ?? (nombre?.[0]?.toUpperCase() || 'U');
  const bg     = mapped?.bg ?? '#B0B0B0';
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white select-none"
      style={{ background: bg }}
    >
      {letter}
    </div>
  );
};

//Panel de Accesos
const AccesosPanel = () => {
  const { user } = useAuth();
  const [accesos,      setAccesos]      = useState<Acceso[]>([]);
  const [filtroSede,   setFiltroSede]   = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroTiempo, setFiltroTiempo] = useState('');
  const [fechaDesde,   setFechaDesde]   = useState('');
  const [fechaHasta,   setFechaHasta]   = useState('');
  const [page,         setPage]         = useState(1);
  const [hasMore,      setHasMore]      = useState(true);
  const [loading,      setLoading]      = useState(false);
  const [errorAcceso,  setErrorAcceso]  = useState<string | null>(null);
  const [refreshKey,   setRefreshKey]   = useState(0);
  const [showScanner,  setShowScanner]  = useState(false);
  const [gyms,         setGyms]         = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    if ((user?.level ?? 0) < 10) return;
    apiClient.get('/gyms')
      .then((res: { data?: Array<{ id: unknown; name: unknown }> }) => {
        const raw = res.data ?? [];
        setGyms(raw.map((g) => ({ id: Number(g.id), name: String(g.name) })));
      })
      .catch(() => {});
  }, [user?.level]);

  const cargarAccesos = useCallback(async (resetPage = false) => {
    if (!user) return;
    setLoading(true);
    setErrorAcceso(null);

    // Cuando hay filtro de tiempo activo, cargar todos los registros de una vez
    const timeFilterActive = Boolean(filtroTiempo);
    const currentPage = (resetPage || timeFilterActive) ? 1 : page;
    const limit = timeFilterActive ? 1000 : 20;

    const level = user.level ?? 0;
    const selectedGymId = level >= 4 && level < 10
      ? (user.gymId || (user.brandId ? String(user.brandId) : undefined))
      : (filtroSede || undefined);

    const authCtx = {
      ...user,
      userId: String(user.userId),
      brandId: user.brandId ? String(user.brandId) : undefined,
      level,
    };

    const result = await consultarAccesosUseCase.execute(authCtx, {
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
    void (async () => {
      setPage(1);
      await cargarAccesos(true);
    })();
  }, [filtroSede, filtroEstado, filtroTiempo, user, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (page > 1) void (async () => { await cargarAccesos(false); })();
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
    } else if (filtroTiempo === 'rango') {
      if (fechaDesde || fechaHasta) {
        const from = fechaDesde ? new Date(fechaDesde + 'T00:00:00').getTime() : 0;
        const to   = fechaHasta ? new Date(fechaHasta + 'T23:59:59').getTime() : Infinity;
        list = list.filter(a => {
          const t = new Date(a.checkInTime).getTime();
          return t >= from && t <= to;
        });
      }
    }

    return list;
  }, [accesos, filtroTiempo, fechaDesde, fechaHasta]);

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
            Historial diario de ingresos y cumplimiento de horarios del personal en todas las marcas.
          </p>
        </div>
        <div className="view-filters">
          {(user?.level ?? 0) < 10 && (
            <button
              onClick={() => setShowScanner(true)}
              className="bg-brand-orange text-white font-bold px-4 py-2 rounded-lg border-0 cursor-pointer inline-flex items-center gap-2 text-sm whitespace-nowrap"
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
          {(user?.level ?? 0) >= 10 && (
            <select
              value={filtroSede}
              onChange={e => setFiltroSede(e.target.value)}
              className="bg-white dark:bg-bg-surface text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-md px-4 py-2 focus:outline-none"
            >
              <option value="">Todas las Marcas</option>
              {gyms.map(g => (
                <option key={g.id} value={String(g.id)}>{g.name}</option>
              ))}
            </select>
          )}
          <select
            value={filtroEstado}
            onChange={e => setFiltroEstado(e.target.value)}
            className="bg-white dark:bg-bg-surface text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-md px-4 py-2 focus:outline-none font-semibold cursor-pointer text-sm"
          >
            <option value="">Todos los Estados</option>
            <option value="AUTORIZADO">Autorizados</option>
            <option value="DENEGADO">Denegados</option>
          </select>
          <select
            value={filtroTiempo}
            onChange={e => {
              setFiltroTiempo(e.target.value);
              if (e.target.value !== 'rango') { setFechaDesde(''); setFechaHasta(''); }
            }}
            className="bg-white dark:bg-bg-surface text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-md px-4 py-2 focus:outline-none font-semibold cursor-pointer text-sm"
          >
            <option value="">Todos los Registros</option>
            <option value="hoy">Hoy</option>
            <option value="semana">Esta Semana</option>
            <option value="mes">Este Mes</option>
            <option value="rango">Rango personalizado</option>
          </select>
          {filtroTiempo === 'rango' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <input
                type="date"
                value={fechaDesde}
                onChange={e => setFechaDesde(e.target.value)}
                max={fechaHasta || undefined}
                className="bg-white dark:bg-bg-surface text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 focus:outline-none text-sm cursor-pointer"
                style={{ colorScheme: 'dark' }}
              />
              <span style={{ color: '#888', fontSize: 13, fontWeight: 600, userSelect: 'none' }}>—</span>
              <input
                type="date"
                value={fechaHasta}
                onChange={e => setFechaHasta(e.target.value)}
                min={fechaDesde || undefined}
                className="bg-white dark:bg-bg-surface text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 focus:outline-none text-sm cursor-pointer"
                style={{ colorScheme: 'dark' }}
              />
            </div>
          )}
        </div>
      </div>

      {errorAcceso ? (
        <div className="error-panel">
          <h3>Error de Seguridad (RBAC)</h3>
          <p>{errorAcceso}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-bg-surface border border-gray-200 dark:border-bg-deep rounded-xl overflow-x-auto mt-4">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 dark:bg-bg-deep border-b border-gray-200 dark:border-bg-deep text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Usuario</th>
                <th className="px-6 py-4">Sucursal</th>
                <th className="px-6 py-4">Fecha/Hora</th>
                <th className="px-6 py-4">Tipo</th>
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
                    className={`border-b border-slate-100 dark:border-gray-800 hover:bg-slate-50 dark:hover:bg-bg-deep transition-colors text-slate-700 dark:text-gray-300 text-sm${isDenied ? ' row-denied' : ''}`}
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
                    <td data-label="Sucursal" className="px-6 py-4">
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
                    <td data-label="Tipo" className="px-6 py-4 whitespace-nowrap">
                      {acceso.actionType === 'IN' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-900/50 text-green-400 border border-green-700">
                          INGRESO
                        </span>
                      ) : acceso.actionType === 'OUT' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-900/50 text-orange-400 border border-orange-700">
                          SALIDA
                        </span>
                      ) : (
                        <span className="text-gray-500 text-xs">--</span>
                      )}
                    </td>
                    <td data-label="Método" className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-bg-surface text-slate-800 dark:text-text-main text-xs font-semibold">
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
            <div className="flex justify-center px-4 py-6 border-t border-slate-100 dark:border-gray-800">
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={loading}
                className="bg-transparent text-brand-celeste border border-brand-celeste px-6 py-2 rounded-full font-semibold text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = 'rgba(56,189,248,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
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
