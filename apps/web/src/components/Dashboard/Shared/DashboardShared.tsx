import React from 'react';
import type { CSSProperties } from 'react';

export const ModalOverlay = ({ children, onClose }: any) => (
  <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    {children}
  </div>
);

export const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }: any) => {
  if (!isOpen) return null;
  return (
    <ModalOverlay onClose={onClose}>
      <div className="modal-content glass-panel">
        <div className="modal-header">
          <h2 style={{ color: '#FF5E00' }}>{title}</h2>
        </div>
        <p style={{ color: '#E5E5EA', lineHeight: '1.5' }}>{message}</p>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" style={{ background: '#FF5E00', color: '#FFFFFF' }} onClick={onConfirm}>Confirmar Eliminación</button>
        </div>
      </div>
    </ModalOverlay>
  );
};

export const DetailField = ({ label, value, isFullWidth = false }: { label: string, value: React.ReactNode, isFullWidth?: boolean }) => (
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
    <span style={{ fontSize: '0.7rem', color: '#8E8E93', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
    <div style={{ fontSize: '0.9rem', color: '#FFFFFF', fontWeight: 500 }}>{value || '-'}</div>
  </div>
);

export const RecordDetailModal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <ModalOverlay onClose={onClose}>
      <div className="modal-content glass-panel" style={{ maxWidth: '550px', width: '95vw', border: '1px solid rgba(0, 217, 255, 0.3)', boxShadow: '0 20px 40px rgba(0,0,0,0.4), 0 0 15px rgba(0, 217, 255, 0.1)' }}>
        <div className="modal-header" style={{ borderBottom: '1px solid rgba(0, 217, 255, 0.2)', paddingBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#00D9FF', margin: 0, fontSize: '1.4rem' }}>
            👁️ {title}
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#8E8E93', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1.25rem', overflowY: 'auto', maxHeight: '65vh', paddingRight: '0.25rem' }}>
          {children}
        </div>
        <div className="modal-actions" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', marginTop: '1.25rem', paddingTop: '0.75rem' }}>
          <button className="btn-cancel" style={{ width: '100%', background: 'rgba(255,255,255,0.05)' }} onClick={onClose}>Cerrar Detalle</button>
        </div>
      </div>
    </ModalOverlay>
  );
};

export const panelStyle: CSSProperties = {
  padding: '1.25rem',
  color: '#FFFFFF',
};
