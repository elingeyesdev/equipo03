import React from 'react';
import { createPortal } from 'react-dom';
import type { CSSProperties } from 'react';

// ─── Estilos del Portal (immune a z-index del Dashboard) ─────────────────────
const backdropStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 9999,
  background: 'rgba(0, 0, 0, 0.80)',
  backdropFilter: 'blur(6px)',
  display: 'grid',
  placeItems: 'center',
  padding: '1rem',
};

const modalBodyStyle: CSSProperties = {
  position: 'relative',
  background: 'rgba(15, 15, 17, 0.95)',
  backdropFilter: 'blur(20px)',
  width: '100%',
  maxWidth: '500px',
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  padding: '2rem',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
  maxHeight: '90vh',
  display: 'flex',
  flexDirection: 'column',
  animation: 'modalFadeIn 0.25s ease',
};

/**
 * ModalOverlay v2 — React Portal.
 * Se monta directamente en document.body, saliendo del árbol del Dashboard.
 * Inmune al z-index del header (10000) y a cualquier overflow:hidden padre.
 */
export const ModalOverlay = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => {
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return createPortal(
    <div style={backdropStyle} onClick={handleBackdropClick}>
      <div style={modalBodyStyle} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body
  );
};

// ─── Modal de Confirmación (Eliminar) ─────────────────────────────────────────
export const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}) => {
  if (!isOpen) return null;
  return (
    <ModalOverlay onClose={onClose}>
      <div className="modal-header">
        <h2 style={{ color: '#FF5E00', margin: 0 }}>{title}</h2>
      </div>
      <p style={{ color: '#E5E5EA', lineHeight: '1.6', margin: '1rem 0 1.5rem' }}>{message}</p>
      <div className="modal-actions">
        <button className="btn-cancel" onClick={onClose}>Cancelar</button>
        <button
          className="btn-primary"
          style={{ background: '#FF5E00', color: '#FFFFFF' }}
          onClick={onConfirm}
        >
          Confirmar Eliminación
        </button>
      </div>
    </ModalOverlay>
  );
};

// ─── Campo de detalle en la ficha de registro ──────────────────────────────────
export const DetailField = ({
  label, value, isFullWidth = false,
}: {
  label: string;
  value: React.ReactNode;
  isFullWidth?: boolean;
}) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
    gridColumn: isFullWidth ? 'span 2' : 'span 1',
    background: 'rgba(255, 255, 255, 0.03)',
    padding: '0.75rem',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
  }}>
    <span style={{ fontSize: '0.7rem', color: '#8E8E93', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {label}
    </span>
    <div style={{ fontSize: '0.9rem', color: '#FFFFFF', fontWeight: 500 }}>
      {value || '-'}
    </div>
  </div>
);

// ─── Modal de Detalle / Solo-Lectura ──────────────────────────────────────────
export const RecordDetailModal = ({
  isOpen, onClose, title, children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) => {
  if (!isOpen) return null;
  return (
    <ModalOverlay onClose={onClose}>
      <div style={{
        width: '100%', maxWidth: '100%',
        border: '1px solid rgba(0, 217, 255, 0.3)',
        boxShadow: '0 0 15px rgba(0, 217, 255, 0.1)',
        display: 'flex', flexDirection: 'column', flex: 1,
      }}>
        <div className="modal-header" style={{
          borderBottom: '1px solid rgba(0, 217, 255, 0.2)',
          paddingBottom: '0.75rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#00D9FF', margin: 0, fontSize: '1.3rem' }}>
            👁️ {title}
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#8E8E93', fontSize: '1.2rem', cursor: 'pointer' }}>
            ✕
          </button>
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem',
          marginTop: '1.25rem', overflowY: 'auto', flex: 1,
          paddingRight: '0.25rem',
        }}>
          {children}
        </div>
        <div className="modal-actions" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', marginTop: '1.25rem', paddingTop: '0.75rem' }}>
          <button className="btn-cancel" style={{ width: '100%', background: 'rgba(255,255,255,0.05)' }} onClick={onClose}>
            Cerrar Detalle
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
};

export const panelStyle: CSSProperties = {
  padding: '1.25rem',
  color: '#FFFFFF',
};
