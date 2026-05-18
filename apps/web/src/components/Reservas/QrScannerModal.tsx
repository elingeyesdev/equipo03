import React, { useEffect, useRef, useState, useId } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import type { Reservation } from '../../infrastructure/Reservations.types';
import { reservationsApi } from '../../infrastructure/AxiosReservationsApi.adapter';
import './QrScannerModal.css';

interface QrScannerModalProps {
  onClose: () => void;
  onScanned: (reservation: Reservation) => void;
}

export const QrScannerModal = ({ onClose, onScanned }: QrScannerModalProps) => {
  const uid = useId().replace(/:/g, '_');
  const SCANNER_ID = `qr_scanner_${uid}`;

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [status, setStatus] = useState<'idle' | 'scanning' | 'validating' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const processingRef = useRef(false);

  // Sonido de éxito (beeper)
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.2);
    } catch (e) {
      console.warn('No se pudo reproducir el sonido de confirmación', e);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const startScanner = async () => {
      // Esperar a que el modal termine su animación de entrada
      await new Promise(r => setTimeout(r, 300));
      if (!isMounted) return;

      const scanner = new Html5Qrcode(SCANNER_ID);
      scannerRef.current = scanner;

      try {
        await scanner.start(
          { facingMode: 'environment' },
          { 
            fps: 15, 
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
              const qrboxSize = Math.floor(minEdge * 0.6);
              return { width: qrboxSize, height: qrboxSize };
            }
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
                // Éxito: Detener y pasar al siguiente paso
                await scanner.stop();
                onScanned(reservation);
                onClose();
              } else {
                // Error: Mostrar mensaje pero permitir reintentar después de un delay
                setErrorMsg(`Código QR no válido o reserva expirada: "${decodedText}"`);
                setStatus('error');
                // Auto-reset después de 3 segundos para permitir seguir escaneando sin clic manual
                setTimeout(() => {
                  if (isMounted) {
                    setStatus('scanning');
                    processingRef.current = false;
                  }
                }, 3000);
              }
            } catch (err) {
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
        setErrorMsg(`Cámara no disponible: ${err instanceof Error ? err.message : String(err)}`);
        setStatus('error');
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [SCANNER_ID]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleManualRetry = () => {
    setErrorMsg('');
    setStatus('scanning');
    processingRef.current = false;
  };

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

        <div className="qr-scanner-wrapper">
          <div id={SCANNER_ID} className="qr-scanner-video-container" />

          {/* Overlays de estado sobre la cámara */}
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
              <span className="icon">💡</span>
              <p>Asegúrate de que haya buena iluminación sobre el teléfono del cliente.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
