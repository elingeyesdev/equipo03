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


export const panelStyle: CSSProperties = {
  padding: '1.25rem',
  color: '#FFFFFF',
};

