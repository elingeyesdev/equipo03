import { Navigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../infrastructure/api.config';

const panelStyle: CSSProperties = {
  background: '#1C1C1E',
  border: '1px solid #3A3A3C',
  borderRadius: '12px',
  padding: '1.25rem',
  color: '#FFFFFF',
};

type GymDto = {
  id: number;
  name: string;
  description?: string;
  maxCapacity?: number;
  isActive?: boolean;
  isOpen?: boolean;
  aforoActual?: number;
  location?: {
    address?: string;
    city?: string;
  };
};

type UserDto = {
  id: number;
  email: string;
  isActive?: boolean;
  profile?: {
    firstName?: string;
    lastName?: string;
  };
};

type CheckinDto = {
  id: number;
  userId: number;
  gymId: number;
  status: string;
};

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

  return (
    <section style={panelStyle}>
      <h1 style={{ marginTop: 0 }}>Resumen</h1>
      <p>
        {user?.role === 'SUPER_ADMIN'
          ? 'Vista global de la cadena completa.'
          : `Vista limitada a tus sucursales asignadas (gym_id: ${user?.gymId || 'N/A'}).`}
      </p>

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
          <div style={{ background: '#0A0A0A', border: '1px solid #3A3A3C', borderRadius: '10px', padding: '0.8rem' }}>
            <div style={{ color: '#8E8E93', fontSize: '0.8rem' }}>Sedes Totales</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{totalGyms}</div>
          </div>
          <div style={{ background: '#0A0A0A', border: '1px solid #3A3A3C', borderRadius: '10px', padding: '0.8rem' }}>
            <div style={{ color: '#8E8E93', fontSize: '0.8rem' }}>Sedes Activas</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{activeGyms}</div>
          </div>
          <div style={{ background: '#0A0A0A', border: '1px solid #3A3A3C', borderRadius: '10px', padding: '0.8rem' }}>
            <div style={{ color: '#8E8E93', fontSize: '0.8rem' }}>Sedes Abiertas</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{openGyms}</div>
          </div>
          <div style={{ background: '#0A0A0A', border: '1px solid #3A3A3C', borderRadius: '10px', padding: '0.8rem' }}>
            <div style={{ color: '#8E8E93', fontSize: '0.8rem' }}>Usuarios Totales</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{totalUsers}</div>
          </div>
          <div style={{ background: '#0A0A0A', border: '1px solid #3A3A3C', borderRadius: '10px', padding: '0.8rem' }}>
            <div style={{ color: '#8E8E93', fontSize: '0.8rem' }}>Usuarios Activos</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{activeUsers}</div>
          </div>
          <div style={{ background: '#0A0A0A', border: '1px solid #3A3A3C', borderRadius: '10px', padding: '0.8rem' }}>
            <div style={{ color: '#8E8E93', fontSize: '0.8rem' }}>Check-ins</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{totalCheckins}</div>
          </div>
          <div style={{ background: '#0A0A0A', border: '1px solid #FF5E00', borderRadius: '10px', padding: '0.8rem' }}>
            <div style={{ color: '#FF5E00', fontSize: '0.8rem' }}>Denegados</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FF5E00' }}>{deniedCheckins}</div>
          </div>
        </div>
      )}
    </section>
  );
};

export const UsuariosView = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const cargarUsuarios = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const usersResponse = await apiClient.get('/users');
        const usersData: UserDto[] = Array.isArray(usersResponse.data) ? usersResponse.data : [];

        if (user.role === 'GERENTE' && user.gymId) {
          const checkinsResponse = await apiClient.get('/checkins', {
            params: { gym_id: user.gymId, page: 1, limit: 500 },
          });
          const checkinsData: CheckinDto[] = Array.isArray(checkinsResponse.data) ? checkinsResponse.data : [];
          const allowedUserIds = new Set(checkinsData.map(item => String(item.userId)));
          const scopedUsers = usersData.filter(u => allowedUserIds.has(String(u.id)));
          if (mounted) setUsers(scopedUsers);
        } else if (mounted) {
          setUsers(usersData);
        }
      } catch (err: any) {
        if (mounted) setError(err?.response?.data?.message || err?.message || 'No se pudo cargar usuarios.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    cargarUsuarios();
    return () => {
      mounted = false;
    };
  }, [user]);

  const usuariosActivos = useMemo(() => users.filter(u => !!u.isActive).length, [users]);

  return (
    <section style={panelStyle}>
      <h1 style={{ marginTop: 0 }}>Usuarios</h1>
      <p>
        {user?.role === 'SUPER_ADMIN'
          ? 'Gestion de usuarios de toda la red.'
          : 'Gestion de usuarios restringida a tus sucursales de la cadena.'}
      </p>

      <div style={{ marginTop: '1rem', color: '#8E8E93', fontSize: '0.9rem' }}>
        {loading ? 'Cargando usuarios...' : `Total: ${users.length} | Activos: ${usuariosActivos}`}
      </div>

      {error && <div style={{ marginTop: '0.75rem', color: '#FF5E00', fontSize: '0.9rem' }}>{error}</div>}

      {!loading && !error && (
        <div style={{ marginTop: '1rem', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '720px' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: '#8E8E93' }}>ID</th>
                <th style={{ textAlign: 'left', padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: '#8E8E93' }}>Nombre</th>
                <th style={{ textAlign: 'left', padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: '#8E8E93' }}>Email</th>
                <th style={{ textAlign: 'left', padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: '#8E8E93' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const fullName = [u?.profile?.firstName, u?.profile?.lastName].filter(Boolean).join(' ').trim();
                return (
                  <tr key={u.id}>
                    <td style={{ padding: '0.6rem', borderBottom: '1px solid #3A3A3C' }}>{u.id}</td>
                    <td style={{ padding: '0.6rem', borderBottom: '1px solid #3A3A3C' }}>{fullName || '-'}</td>
                    <td style={{ padding: '0.6rem', borderBottom: '1px solid #3A3A3C' }}>{u.email}</td>
                    <td style={{ padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: u.isActive ? '#30D158' : '#FF5E00' }}>
                      {u.isActive ? 'ACTIVO' : 'INACTIVO'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export const SedesView = () => {
  const { user } = useAuth();
  const [gyms, setGyms] = useState<GymDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const cargarSedes = async () => {
      try {
        setLoading(true);
        setError(null);
        const gymsResp = await apiClient.get('/gyms');
        const gymsData: GymDto[] = Array.isArray(gymsResp.data) ? gymsResp.data : [];
        if (mounted) setGyms(gymsData);
      } catch (err: any) {
        if (mounted) setError(err?.response?.data?.message || err?.message || 'No se pudo cargar sedes.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    cargarSedes();
    return () => {
      mounted = false;
    };
  }, []);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <section style={panelStyle}>
      <h1 style={{ marginTop: 0 }}>Sedes</h1>
      <p>
        {user.role === 'SUPER_ADMIN'
          ? 'Acceso completo a todas las sucursales.'
          : `Acceso restringido a tus sucursales de la cadena (gym_id: ${user.gymId || 'N/A'}).`}
      </p>

      <div style={{ marginTop: '1rem', color: '#8E8E93', fontSize: '0.9rem' }}>
        {loading ? 'Cargando sedes...' : `Total de sedes: ${gyms.length}`}
      </div>
      {error && <div style={{ marginTop: '0.75rem', color: '#FF5E00' }}>{error}</div>}

      {!loading && !error && (
        <div style={{ marginTop: '1rem', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '840px' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: '#8E8E93' }}>ID</th>
                <th style={{ textAlign: 'left', padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: '#8E8E93' }}>Sede</th>
                <th style={{ textAlign: 'left', padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: '#8E8E93' }}>Direccion</th>
                <th style={{ textAlign: 'left', padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: '#8E8E93' }}>Capacidad</th>
                <th style={{ textAlign: 'left', padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: '#8E8E93' }}>Aforo</th>
                <th style={{ textAlign: 'left', padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: '#8E8E93' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {gyms.map((g) => (
                <tr key={g.id}>
                  <td style={{ padding: '0.6rem', borderBottom: '1px solid #3A3A3C' }}>{g.id}</td>
                  <td style={{ padding: '0.6rem', borderBottom: '1px solid #3A3A3C' }}>{g.name}</td>
                  <td style={{ padding: '0.6rem', borderBottom: '1px solid #3A3A3C' }}>
                    {g.location?.address || g.description || '-'}
                  </td>
                  <td style={{ padding: '0.6rem', borderBottom: '1px solid #3A3A3C' }}>{g.maxCapacity ?? '-'}</td>
                  <td style={{ padding: '0.6rem', borderBottom: '1px solid #3A3A3C' }}>{g.aforoActual ?? '-'}</td>
                  <td style={{ padding: '0.6rem', borderBottom: '1px solid #3A3A3C' }}>
                    <span style={{ color: g.isActive ? '#30D158' : '#FF5E00' }}>
                      {g.isActive ? 'ACTIVA' : 'INACTIVA'}
                    </span>
                    <span style={{ color: '#8E8E93' }}>{g.isOpen ? ' | ABIERTA' : ' | CERRADA'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
