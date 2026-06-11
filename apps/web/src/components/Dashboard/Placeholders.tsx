import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

export const ReservasPlaceholder = () => (
  <section className="glass-panel" style={{ padding: '2rem', borderRadius: '16px' }}>
    <h1 style={{ marginTop: 0 }}>Reservas de Clases</h1>
    <p>Este módulo está en construcción. Aquí podrás gestionar las reservaciones a clases grupales.</p>
  </section>
);

export const MedidasPlaceholder = () => {
  const { user } = useAuth();
  const canDelete = user?.role === 'SUPER_ADMIN' || user?.role === 'GERENTE';

  return (
    <section className="glass-panel" style={{ padding: '2rem', borderRadius: '16px' }}>
      <h1 style={{ marginTop: 0 }}>Medidas Corporales</h1>
      <p>Este módulo está en construcción. Aquí podrás dar seguimiento a tu progreso físico.</p>

      <div className="glass-panel" style={{ marginTop: '2rem', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Medición Antropométrica - Dummy Data</span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {user?.role !== 'CLIENTE' && (
            <button style={{ background: '#38BDF8', color: '#000', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Editar</button>
          )}
          {canDelete && (
            <button style={{ background: '#FF5E00', color: '#fff', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Eliminar</button>
          )}
        </div>
      </div>
    </section>
  );
};
