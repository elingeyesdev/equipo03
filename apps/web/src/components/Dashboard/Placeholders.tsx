import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

export const ReservasPlaceholder = () => (
  <section className="glass-panel" style={{ padding: '2rem', borderRadius: '16px' }}>
    <h1 style={{ marginTop: 0, color: '#00D9FF' }}>📅 Reservas de Clases</h1>
    <p style={{ color: '#E5E5EA' }}>Este módulo está en construcción. Aquí podrás gestionar las reservaciones a clases grupales.</p>
  </section>
);

export const MedidasPlaceholder = () => {
  const { user } = useAuth();
  const canDelete = user?.role === 'SUPER_ADMIN' || user?.role === 'GERENTE';

  return (
    <section className="glass-panel" style={{ padding: '2rem', borderRadius: '16px' }}>
      <h1 style={{ marginTop: 0, color: '#00D9FF' }}>📏 Medidas Corporales</h1>
      <p style={{ color: '#E5E5EA' }}>Este módulo está en construcción. Aquí podrás dar seguimiento a tu progreso físico.</p>
      
      <div className="glass-panel" style={{ marginTop: '2rem', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Medición Antropométrica - Dummy Data</span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {user?.role !== 'CLIENTE' && (
            <button style={{ background: '#3A3A3C', color: '#FFF', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer' }}>Editar</button>
          )}
          {canDelete && (
            <button style={{ background: 'rgba(255, 94, 0, 0.1)', color: '#FF5E00', border: '1px solid #FF5E00', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer' }}>Eliminar</button>
          )}
        </div>
      </div>
    </section>
  );
};
