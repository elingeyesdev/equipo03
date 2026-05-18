import React, { useState, useEffect, useCallback, useRef, useLayoutEffect, useMemo } from 'react';
import type { CSSProperties } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../infrastructure/api.config';
import { ModalOverlay, ConfirmModal, panelStyle } from './Shared/DashboardShared';
import type { GymDto, GymScheduleDto, UserDto, CheckinDto, ScheduleEntry } from './Shared/DashboardTypes';

export const ResumenView = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gyms, setGyms] = useState<GymDto[]>([]);
  const [users, setUsers] = useState<UserDto[]>([]);
  const [checkins, setCheckins] = useState<CheckinDto[]>([]);

  useEffect(() => {
    let mounted = true;

    const cargarResumen = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [gymsResp, usersResp, checkinsResp] = await Promise.all([
          apiClient.get('/gyms'),
          apiClient.get('/users'),
          apiClient.get('/checkins', { params: { page: 1, limit: 500 } }),
        ]);

        if (!mounted) return;
        setGyms(Array.isArray(gymsResp.data) ? gymsResp.data : []);
        setUsers(Array.isArray(usersResp.data) ? usersResp.data : []);
        setCheckins(Array.isArray(checkinsResp.data) ? checkinsResp.data : []);
      } catch (err: any) {
        if (mounted) setError(err?.response?.data?.message || err?.message || 'No se pudo cargar el resumen.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    cargarResumen();
    return () => {
      mounted = false;
    };
  }, [user]);

  const totalGyms = gyms.length;
  const activeGyms = gyms.filter(g => !!g.isActive).length;
  const openGyms = gyms.filter(g => !!g.isOpen).length;
  const totalUsers = users.length;
  const activeUsers = users.filter(u => !!u.isActive).length;
  const totalCheckins = checkins.length;
  const deniedCheckins = checkins.filter(c => c.status === 'DENIED').length;

  if (user?.role === 'CLIENTE') {
    return (
      <section style={panelStyle} className="glass-panel">
        <h1 style={{ marginTop: 0 }}>Mi Progreso Personal</h1>
        <p>Bienvenido. Aquí podrás ver tu progreso, medidas corporales y tu nivel de asistencia.</p>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="glass-panel" style={{ padding: '1.5rem', flex: 1, minWidth: '200px', border: '1px solid #30D158' }}>
            <div style={{ color: '#30D158', fontSize: '0.9rem' }}>Suscripción</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#30D158' }}>ACTIVA</div>
          </div>
          <div className="glass-panel" style={{ padding: '1.5rem', flex: 1, minWidth: '200px', border: '1px solid #00D9FF' }}>
            <div style={{ color: '#00D9FF', fontSize: '0.9rem' }}>Último Check-in</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>Hoy, 08:30 AM</div>
          </div>
        </div>
      </section>
    );
  }

  const roleText = user?.role === 'SUPER_ADMIN'
    ? 'Vista global de la cadena completa.'
    : user?.role === 'GERENTE' 
      ? `Vista limitada a tu sucursal (gym_id: ${user?.gymId || 'N/A'}).`
      : 'Vista de clientes y rutinas activas.';

  return (
    <section style={panelStyle} className="glass-panel">
      <h1 style={{ marginTop: 0 }}>Resumen</h1>
      <p>{roleText}</p>

      {loading && <p style={{ color: '#8E8E93' }}>Cargando metricas reales...</p>}
      {error && <p style={{ color: '#FF5E00' }}>{error}</p>}

      {!loading && !error && (
        <div
          style={{
            marginTop: '1rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '0.75rem',
          }}
        >
          <div className="glass-panel" style={{ padding: '0.8rem' }}>
            <div style={{ color: '#E5E5EA', fontSize: '0.8rem' }}>Sedes Totales</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{totalGyms}</div>
          </div>
          <div className="glass-panel" style={{ padding: '0.8rem' }}>
            <div style={{ color: '#E5E5EA', fontSize: '0.8rem' }}>Sedes Activas</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{activeGyms}</div>
          </div>
          <div className="glass-panel" style={{ padding: '0.8rem' }}>
            <div style={{ color: '#E5E5EA', fontSize: '0.8rem' }}>Sedes Abiertas</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{openGyms}</div>
          </div>
          <div className="glass-panel" style={{ padding: '0.8rem' }}>
            <div style={{ color: '#E5E5EA', fontSize: '0.8rem' }}>Usuarios Totales</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{totalUsers}</div>
          </div>
          <div className="glass-panel" style={{ padding: '0.8rem' }}>
            <div style={{ color: '#E5E5EA', fontSize: '0.8rem' }}>Usuarios Activos</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{activeUsers}</div>
          </div>
          <div className="glass-panel" style={{ padding: '0.8rem' }}>
            <div style={{ color: '#E5E5EA', fontSize: '0.8rem' }}>Check-ins</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{totalCheckins}</div>
          </div>
          <div className="glass-panel" style={{ border: '1px solid #FF5E00', padding: '0.8rem' }}>
            <div style={{ color: '#FF5E00', fontSize: '0.8rem' }}>Denegados</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FF5E00' }}>{deniedCheckins}</div>
          </div>
        </div>
      )}
    </section>
  );
};
