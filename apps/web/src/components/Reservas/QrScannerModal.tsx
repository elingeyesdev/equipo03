import { useEffect, useRef, useState, useId } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

// CameraDevice no es re-exportado por todas las versiones del paquete
type CameraDevice = { id: string; label: string };
import type { Reservation } from '../../infrastructure/Reservations.types';
import { reservationsApi } from '../../infrastructure/AxiosReservationsApi.adapter';
import './QrScannerModal.css';

interface QrScannerModalProps {
  onClose: () => void;
  onScanned: (reservation: Reservation) => void;
}

const CAM_STORAGE_KEY = 'gymsync_qr_camera_id';
// Sentinel para cuando no hay deviceId (fallback a facingMode)
const FALLBACK_CAM = '__environment__';

/** Devuelve el constraint correcto para Html5Qrcode.start() */
function camConstraint(id: string): string | { facingMode: string } {
  return id === FALLBACK_CAM ? { facingMode: 'environment' } : id;
}

export const QrScannerModal = ({ onClose, onScanned }: QrScannerModalProps) => {
  const uid = useId().replace(/:/g, '_');
  const SCANNER_ID = `qr_scanner_${uid}`;

  const scannerRef    = useRef<Html5Qrcode | null>(null);
  const activeCamRef  = useRef<string>(FALLBACK_CAM); // siempre actualizado

  const [status,    setStatus]    = useState<'idle' | 'scanning' | 'validating' | 'error' | 'schedule-warn'>('idle');
  const [errorMsg,  setErrorMsg]  = useState('');
  const [cameras,   setCameras]   = useState<CameraDevice[]>([]);
  const [activeCam, setActiveCam] = useState<string | null>(null); // null = todavía enumerando
  const processingRef = useRef(false);
  const [schedWarn, setSchedWarn] = useState<{
    reservation: Reservation;
    autoAccept: boolean;
    activityName: string;
    horario: string;
    fechaFmt: string;
  } | null>(null);

  // ── 1. Enumerar cámaras disponibles ────────────────────────────────────────
  // El navegador solo devuelve los labels reales (ej: "DroidCam Source 2")
  // DESPUÉS de que se concede permiso de cámara. Por eso pedimos getUserMedia
  // primero, soltamos el stream y luego enumeramos con labels completos.
  const enumerateCameras = async () => {
    try {
      // Paso 1: pedir permiso para desbloquear los labels del sistema
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(t => t.stop()); // liberar inmediatamente
    } catch { /* sin permiso → enumeramos igual, sin labels */ }

    try {
      const devices = await Html5Qrcode.getCameras();
      setCameras(devices);
      if (!devices.length) { setActiveCam(FALLBACK_CAM); return; }

      const saved = localStorage.getItem(CAM_STORAGE_KEY);
      const found = devices.find(d => d.id === saved);
      // Sin guardada: preferir dispositivo externo/virtual (DroidCam suele ser el último)
      const pick  = found ?? devices[devices.length - 1];
      setActiveCam(pick.id);
    } catch {
      setActiveCam(FALLBACK_CAM);
    }
  };

  // Los setState dentro de enumerateCameras ocurren en callbacks asíncronos
  // (después de await), no de forma síncrona — se suprime la regla estática.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void enumerateCameras(); }, []);

  // ── Sonido de éxito ─────────────────────────────────────────────────────────
  const playBeep = () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc  = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
      gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2);
      osc.start(); osc.stop(audioCtx.currentTime + 0.2);
    } catch { /* ignorar si el navegador no soporta AudioContext */ }
  };

  // ── 2. Arrancar / reiniciar escáner cuando cambia la cámara activa ─────────
  useEffect(() => {
    if (activeCam === null) return; // esperar enumeración
    activeCamRef.current = activeCam;
    localStorage.setItem(CAM_STORAGE_KEY, activeCam);

    let isMounted = true;

    const startScanner = async () => {
      if (isMounted) setStatus('idle');
      // Parar el escáner anterior si estaba corriendo
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) await scannerRef.current.stop();
        } catch { /* ignorar error de stop */ }
        scannerRef.current = null;
      }

      // Esperar animación de entrada (o que el elemento esté en DOM)
      await new Promise(r => setTimeout(r, 300));
      if (!isMounted) return;

      const scanner = new Html5Qrcode(SCANNER_ID);
      scannerRef.current = scanner;

      try {
        await scanner.start(
          camConstraint(activeCam),
          {
            fps: 15,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
              return { width: Math.floor(minEdge * 0.6), height: Math.floor(minEdge * 0.6) };
            },
          },
          async (decodedText) => {
            if (processingRef.current || !isMounted) return;

            processingRef.current = true;
            setStatus('validating');
            playBeep();

            try {
              const reservation = await reservationsApi.validateQrToken(decodedText);
              if (!isMounted) return;

              if (reservation) {
                const resDate   = reservation.reservationDate;
                const endTime   = reservation.endTime   ?? reservation.gymActivitySchedule?.endTime;
                const startTime = reservation.startTime ?? reservation.gymActivitySchedule?.startTime;

                const s = reservation.status?.toUpperCase();
                if (s === 'COMPLETADA' || s === 'USED' || s === 'CANCELADA' || s === 'CANCELLED') {
                  setErrorMsg(`Esta reserva ya fue ${s === 'CANCELADA' || s === 'CANCELLED' ? 'cancelada' : 'utilizada'} y no puede ser escaneada nuevamente.`);
                  setStatus('error');
                  setTimeout(() => { if (isMounted) { setStatus('scanning'); processingRef.current = false; } }, 5000);
                  return;
                }

                const parsedDate = resDate ? (() => {
                  const [yr, mo, dy] = resDate.split('T')[0].split('-').map(Number);
                  return { yr, mo, dy };
                })() : null;

                if (parsedDate && endTime) {
                  const [endH, endM] = endTime.split(':').map(Number);
                  const classEnd = new Date(parsedDate.yr, parsedDate.mo - 1, parsedDate.dy, endH, endM, 0);
                  if (new Date() > classEnd) {
                    const dateFmt = new Date(parsedDate.yr, parsedDate.mo - 1, parsedDate.dy)
                      .toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
                    setErrorMsg(`Esta reserva ha caducado el ${dateFmt} a las ${endTime.substring(0, 5)}.`);
                    setStatus('error');
                    setTimeout(() => { if (isMounted) { setStatus('scanning'); processingRef.current = false; } }, 5000);
                    return;
                  }
                }

                const isScheduled = !!(reservation.gymActivitySchedule);
                if (isScheduled && parsedDate && startTime && endTime) {
                  const horario = `${startTime.substring(0, 5)} – ${endTime.substring(0, 5)}`;
                  const fechaFmt = new Date(parsedDate.yr, parsedDate.mo - 1, parsedDate.dy)
                    .toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
                  const activityName =
                    reservation.gymActivitySchedule?.gymActivity?.name ??
                    reservation.freeActivity?.name ?? 'Actividad programada';
                  const dayStart   = new Date(parsedDate.yr, parsedDate.mo - 1, parsedDate.dy, 0, 0, 0);
                  const autoAccept = new Date() >= dayStart;

                  await scanner.stop();
                  setSchedWarn({ reservation, autoAccept, activityName, horario, fechaFmt });
                  setStatus('schedule-warn');
                  return;
                }

                await scanner.stop();
                onScanned(reservation);
                onClose();
              } else {
                setErrorMsg('Código QR no válido o reserva no encontrada.');
                setStatus('error');
                setTimeout(() => {
                  if (isMounted) { setStatus('scanning'); processingRef.current = false; }
                }, 3000);
              }
            } catch {
              if (!isMounted) return;
              setErrorMsg('Error al comunicar con el servidor');
              setStatus('error');
              processingRef.current = false;
            }
          },
          () => {} // Frame silenciado
        );

        if (isMounted) setStatus('scanning');
      } catch (err) {
        if (!isMounted) return;
        // Si falló con deviceId específico, intentar facingMode como último recurso
        if (activeCam !== FALLBACK_CAM) {
          console.warn('[QrScanner] deviceId failed, retrying with facingMode', err);
          try {
            await scanner.start(
              { facingMode: 'environment' },
              { fps: 15, qrbox: { width: 250, height: 250 } },
              async () => {}, () => {}
            );
            if (isMounted) setStatus('scanning');
            return;
          } catch { /* muestra el error original */ }
        }
        setErrorMsg(`Cámara no disponible: ${err instanceof Error ? err.message : String(err)}`);
        setStatus('error');
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [SCANNER_ID, activeCam]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleCameraChange = (id: string) => {
    processingRef.current = false;
    setSchedWarn(null);
    setErrorMsg('');
    setActiveCam(id); // dispara el useEffect que reinicia el escáner
  };

  const handleManualRetry = () => {
    setErrorMsg('');
    setStatus('scanning');
    processingRef.current = false;
  };

  const handleSchedConfirm = () => {
    if (!schedWarn) return;
    onScanned(schedWarn.reservation);
    setSchedWarn(null);
    onClose();
  };

  const handleSchedCancel = () => {
    setSchedWarn(null);
    setStatus('scanning');
    processingRef.current = false;
    const scanner = scannerRef.current;
    if (scanner && !scanner.isScanning) {
      scanner.start(
        camConstraint(activeCamRef.current),
        { fps: 15, qrbox: (w, h) => { const s = Math.floor(Math.min(w, h) * 0.6); return { width: s, height: s }; } },
        () => {}, () => {}
      ).catch(() => {});
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="qr-modal-overlay" onClick={onClose}>
      <div className="qr-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="qr-modal-header">
          <div className="qr-title-group">
            <h2 className="qr-modal-title">Escanear Reserva</h2>
            <div className={`qr-badge-live ${status === 'scanning' ? 'active' : ''}`}>
              <span className="dot" /> EN VIVO
            </div>
          </div>
          <button className="qr-modal-close" onClick={onClose}>✕</button>
        </div>

        <p className="qr-modal-subtitle">
          Ubica el código QR del cliente dentro del recuadro
        </p>

        {/* ── Selector de cámara + botón refrescar ── */}
        <div style={{ padding: '0 16px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {cameras.length === 0 ? 'Sin cámaras detectadas' : `${cameras.length} cámara${cameras.length !== 1 ? 's' : ''} detectada${cameras.length !== 1 ? 's' : ''}`}
            </label>
            <button
              onClick={() => { void enumerateCameras(); }}
              title="Volver a buscar cámaras (útil si conectaste DroidCam después de abrir este modal)"
              style={{ background: 'none', border: '1px solid #334155', color: '#64748b', borderRadius: '6px', padding: '3px 8px', fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              ↺ Actualizar
            </button>
          </div>
          {cameras.length === 0 && (
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#475569', lineHeight: 1.5 }}>
              No se detectó ninguna cámara. Si usas DroidCam, asegúrate de que el cliente de PC esté conectado al teléfono y luego presiona <strong style={{ color: '#94a3b8' }}>↺ Actualizar</strong>.
            </p>
          )}
        </div>

        {cameras.length > 1 && (
          <div style={{ padding: '0 16px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Cámara activa
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {cameras.map(cam => {
                const isActive = cam.id === activeCam;
                const label = cam.label || `Cámara ${cam.id.slice(-6)}`;
                return (
                  <button
                    key={cam.id}
                    onClick={() => handleCameraChange(cam.id)}
                    title={cam.label}
                    style={{
                      flex: '1 1 auto',
                      maxWidth: '200px',
                      background:    isActive ? '#1C1C1E' : '#0A0A0A',
                      border:        `1px solid ${isActive ? '#FF5E00' : '#3A3A3C'}`,
                      color:         isActive ? '#FF5E00' : '#B0B0B0',
                      borderRadius:  '8px',
                      padding:       '5px 10px',
                      fontSize:      '0.75rem',
                      fontWeight:    isActive ? 700 : 500,
                      cursor:        'pointer',
                      whiteSpace:    'nowrap',
                      overflow:      'hidden',
                      textOverflow:  'ellipsis',
                      transition:    'all 0.15s',
                    }}
                  >
                    {isActive ? '● ' : ''}{label.length > 28 ? label.slice(0, 26) + '…' : label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="qr-scanner-wrapper">
          <div id={SCANNER_ID} className="qr-scanner-video-container" />

          {status === 'idle' && (
            <div className="qr-overlay-state">
              <div className="qr-loader-spinner" />
              <span>Iniciando cámara...</span>
            </div>
          )}
          {status === 'validating' && (
            <div className="qr-overlay-state success">
              <div className="qr-loader-spinner white" />
              <span>Validando...</span>
            </div>
          )}
          {status === 'scanning' && (
            <div className="qr-scan-guide">
              <div className="guide-corners" />
              <div className="guide-line" />
            </div>
          )}
        </div>

        {/* Panel de advertencia para actividades programadas */}
        {status === 'schedule-warn' && schedWarn && (
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ background: '#1C1C1E', border: `1px solid ${schedWarn.autoAccept ? '#00E5A3' : '#FF5E00'}`, borderRadius: '10px', padding: '14px 16px' }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: schedWarn.autoAccept ? '#00E5A3' : '#FF5E00', marginBottom: '6px' }}>
                {schedWarn.autoAccept ? '✓ Reserva vigente hoy' : '⚠ Reserva anticipada'}
              </p>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                La actividad <strong>{schedWarn.activityName}</strong> está programada para el horario{' '}
                <strong>{schedWarn.horario}</strong> el <strong>{schedWarn.fechaFmt}</strong>.
              </p>
              {schedWarn.autoAccept && (
                <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                  La reserva es válida para hoy. Se aceptará la entrada.
                </p>
              )}
            </div>
            {schedWarn.autoAccept ? (
              <button onClick={handleSchedConfirm} style={{ background: '#00E5A3', border: 'none', color: '#000', borderRadius: '8px', padding: '12px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>
                Aceptar Entrada
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={handleSchedCancel} style={{ flex: 1, background: 'transparent', border: '1px solid #475569', color: '#94a3b8', borderRadius: '8px', padding: '11px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                  No
                </button>
                <button onClick={handleSchedConfirm} style={{ flex: 2, background: '#FF5E00', border: 'none', color: '#fff', borderRadius: '8px', padding: '11px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                  Sí, confirmar entrada
                </button>
              </div>
            )}
          </div>
        )}

        {status !== 'schedule-warn' && (
          <div className="qr-footer-info">
            {status === 'error' ? (
              <div className="qr-msg-box error">
                <span className="icon">⚠️</span>
                <div className="content">
                  <p>{errorMsg}</p>
                  <button className="btn-inline-retry" onClick={handleManualRetry}>Reintentar ahora</button>
                </div>
              </div>
            ) : (
              <div className="qr-hint">
                <p>
                  {cameras.length > 1
                    ? 'Si DroidCam no aparece, selecciona otra cámara arriba.'
                    : 'Asegúrate de que haya buena iluminación sobre el teléfono del cliente.'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
