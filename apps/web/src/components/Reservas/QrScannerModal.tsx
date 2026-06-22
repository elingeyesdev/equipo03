import { useEffect, useRef, useState, useId } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

type CameraDevice = { id: string; label: string };
import type { Reservation } from '../../infrastructure/Reservations.types';
import { apiClient } from '../../infrastructure/api.config';

interface QrScannerModalProps {
  onClose: () => void;
  onScanned: (reservation: Reservation) => void;
}

const CAM_STORAGE_KEY = 'gymsync_qr_camera_id';
const FALLBACK_CAM = '__environment__';

function camConstraint(id: string): string | { facingMode: string } {
  return id === FALLBACK_CAM ? { facingMode: 'environment' } : id;
}

export const QrScannerModal = ({ onClose, onScanned }: QrScannerModalProps) => {
  const uid = useId().replace(/:/g, '_');
  const SCANNER_ID = `qr_scanner_${uid}`;

  const scannerRef   = useRef<Html5Qrcode | null>(null);
  const activeCamRef = useRef<string>(FALLBACK_CAM);

  const [status,   setStatus]   = useState<'idle' | 'scanning' | 'validating' | 'success' | 'error'>('idle');
  const [message,  setMessage]  = useState('');
  const [cameras,  setCameras]  = useState<CameraDevice[]>([]);
  const [activeCam, setActiveCam] = useState<string | null>(null);
  const processingRef = useRef(false);

  const enumerateCameras = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(t => t.stop());
    } catch {}
    try {
      const devices = await Html5Qrcode.getCameras();
      setCameras(devices);
      if (!devices.length) { setActiveCam(FALLBACK_CAM); return; }
      const saved = localStorage.getItem(CAM_STORAGE_KEY);
      const found = devices.find(d => d.id === saved);
      setActiveCam(found?.id ?? devices[devices.length - 1].id);
    } catch {
      setActiveCam(FALLBACK_CAM);
    }
  };

  useEffect(() => { void enumerateCameras(); }, []);

  useEffect(() => {
    if (activeCam === null) return;
    activeCamRef.current = activeCam;
    localStorage.setItem(CAM_STORAGE_KEY, activeCam);

    let mounted = true;

    const start = async () => {
      if (mounted) setStatus('idle');
      if (scannerRef.current?.isScanning) {
        try { await scannerRef.current.stop(); } catch {}
      }
      scannerRef.current = null;
      await new Promise(r => setTimeout(r, 300));
      if (!mounted) return;

      const scanner = new Html5Qrcode(SCANNER_ID);
      scannerRef.current = scanner;

      try {
        await scanner.start(
          camConstraint(activeCam),
          { fps: 12, qrbox: (w, h) => { const s = Math.floor(Math.min(w, h) * 0.55); return { width: s, height: s }; } },
          async (decoded) => {
            if (processingRef.current || !mounted) return;
            processingRef.current = true;
            setStatus('validating');
            setMessage('Validando reserva...');

            try {
              const res = await apiClient.post('/reservations/check-in/token', { token: decoded });
              const data = res.data;
              if (!mounted) return;

              try { await scanner.stop(); } catch {}
              setStatus('success');
              setMessage('Check-in registrado correctamente');
              setTimeout(() => {
                if (mounted) { onScanned(data.reservation ?? data); onClose(); }
              }, 1500);
            } catch (err: any) {
              if (!mounted) return;
              const httpStatus = err?.response?.status;
              const raw = err?.response?.data?.message ?? err?.message ?? 'Error desconocido';
              const msg = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw.join('. ') : 'Error al procesar el QR';
              setMessage(msg);
              setStatus('error');
              const isCrossBranch = httpStatus === 403;
              if (!isCrossBranch) {
                setTimeout(() => {
                  if (mounted) { setStatus('scanning'); setMessage(''); processingRef.current = false; }
                }, 6000);
              }
            }
          },
          () => {},
        );
        if (mounted) { setStatus('scanning'); setMessage(''); }
      } catch (err) {
        if (!mounted) return;
        if (activeCam !== FALLBACK_CAM) {
          try {
            await scanner.start({ facingMode: 'environment' }, { fps: 12, qrbox: { width: 220, height: 220 } }, async () => {}, () => {});
            if (mounted) setStatus('scanning');
            return;
          } catch {}
        }
        setMessage(`No se pudo acceder a la cámara.`);
        setStatus('error');
      }
    };

    start();
    return () => { mounted = false; scannerRef.current?.isScanning && scannerRef.current.stop().catch(() => {}); };
  }, [SCANNER_ID, activeCam]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCameraChange = (id: string) => {
    processingRef.current = false;
    setMessage('');
    setActiveCam(id);
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={card} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={header}>
          <div>
            <h2 style={title}>Escanear Reserva</h2>
            {status === 'scanning' && <span style={liveBadge}>Escaneando...</span>}
          </div>
          <button style={closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Camera selector */}
        {cameras.length > 1 && (
          <div style={{ padding: '0 20px 12px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {cameras.map(cam => (
              <button
                key={cam.id}
                onClick={() => handleCameraChange(cam.id)}
                style={{
                  ...camBtn,
                  borderColor: cam.id === activeCam ? '#FF5E00' : '#2A2A2C',
                  color: cam.id === activeCam ? '#FF5E00' : '#888',
                  fontWeight: cam.id === activeCam ? 700 : 400,
                }}
              >
                {(cam.label || cam.id).substring(0, 24)}
              </button>
            ))}
          </div>
        )}

        {/* Scanner area */}
        <div style={scannerArea}>
          <div id={SCANNER_ID} style={{ width: '100%', height: '100%' }} />
          {status === 'idle' && <div style={overlayMsg}><span style={spinner} />Iniciando cámara...</div>}
          {status === 'validating' && <div style={{ ...overlayMsg, background: 'rgba(0,0,0,0.7)' }}>Validando...</div>}
          {status === 'success' && <div style={{ ...overlayMsg, background: 'rgba(0,180,100,0.85)', color: '#fff' }}>✓ Check-in exitoso</div>}
        </div>

        {/* Message area */}
        {message && status === 'error' && (
          <div style={errorBox}>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>{message}</p>
            <button
              style={retryBtn}
              onClick={() => { setStatus('scanning'); setMessage(''); processingRef.current = false; }}
            >
              Escanear otro
            </button>
          </div>
        )}

        {!message && status === 'scanning' && (
          <p style={hint}>Apunta la cámara al código QR del cliente</p>
        )}
      </div>
    </div>
  );
};

// ── Inline styles (minimal, no CSS file needed) ──
const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 9999,
  background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
};
const card: React.CSSProperties = {
  background: '#111', borderRadius: 16, width: '100%', maxWidth: 420, overflow: 'hidden',
  border: '1px solid #2A2A2C',
};
const header: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px 20px 12px',
};
const title: React.CSSProperties = { margin: 0, color: '#fff', fontSize: 18, fontWeight: 700 };
const liveBadge: React.CSSProperties = { color: '#34C759', fontSize: 12, fontWeight: 600 };
const closeBtn: React.CSSProperties = {
  background: '#1C1C1E', border: '1px solid #2A2A2C', borderRadius: 8,
  color: '#888', cursor: 'pointer', padding: '4px 10px', fontSize: 14,
};
const camBtn: React.CSSProperties = {
  background: '#1C1C1E', border: '1px solid #2A2A2C', borderRadius: 8,
  padding: '5px 10px', fontSize: 12, cursor: 'pointer',
};
const scannerArea: React.CSSProperties = {
  position: 'relative', width: '100%', height: 300, background: '#000', overflow: 'hidden',
};
const overlayMsg: React.CSSProperties = {
  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(0,0,0,0.6)', color: '#ccc', fontSize: 14, fontWeight: 600, gap: 8,
};
const spinner: React.CSSProperties = {
  width: 16, height: 16, border: '2px solid #555', borderTopColor: '#fff',
  borderRadius: '50%', animation: 'spin 0.8s linear infinite',
};
const errorBox: React.CSSProperties = {
  margin: '12px 20px 16px', padding: 14, background: '#1C1C1E',
  border: '1px solid #FF5E00', borderRadius: 10, color: '#FF5E00',
};
const retryBtn: React.CSSProperties = {
  marginTop: 10, padding: '6px 16px', background: 'transparent', border: '1px solid #FF5E00',
  borderRadius: 8, color: '#FF5E00', cursor: 'pointer', fontSize: 12, fontWeight: 600,
};
const hint: React.CSSProperties = {
  color: '#666', fontSize: 13, textAlign: 'center', padding: '12px 20px 20px', margin: 0,
};
