import { Navigate } from 'react-router-dom';
import { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import type { CSSProperties } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../infrastructure/api.config';
// Leaflet — Map Picker (tiles gratuitas de OpenStreetMap, sin API Key)
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow });

// --- MODAL COMPONENTS ---
const ModalOverlay = ({ children, onClose }: any) => (
  <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    {children}
  </div>
);

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }: any) => {
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

const UserModal = ({ isOpen, onClose, userToEdit, onSave }: any) => {
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', password: '', role: 'USER', isActive: true
  });
  
  useEffect(() => {
    if (userToEdit) {
      setFormData({
        firstName: userToEdit.profile?.firstName || '',
        lastName: userToEdit.profile?.lastName || '',
        email: userToEdit.email || '',
        password: '',
        role: userToEdit.role || 'USER',
        isActive: userToEdit.isActive ?? true
      });
    } else {
      setFormData({ firstName: '', lastName: '', email: '', password: '', role: 'USER', isActive: true });
    }
  }, [userToEdit, isOpen]);

  if (!isOpen) return null;

  return (
    <ModalOverlay onClose={onClose}>
      <div className="modal-content glass-panel">
        <div className="modal-header">
          <h2>{userToEdit ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
        </div>
        <div className="modal-form-group">
          <label>Nombre</label>
          <input type="text" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} placeholder="Ej. Juan" />
        </div>
        <div className="modal-form-group">
          <label>Apellido</label>
          <input type="text" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} placeholder="Ej. Pérez" />
        </div>
        <div className="modal-form-group">
          <label>Correo Electrónico</label>
          <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="correo@ejemplo.com" />
        </div>
        <div className="modal-form-group">
          <label>Contraseña {userToEdit && '(Déjalo en blanco para no cambiar)'}</label>
          <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="••••••••" />
        </div>
        <div className="modal-form-group">
          <label>Rol del Sistema</label>
          <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
            <option value="USER">Usuario Estándar</option>
            <option value="CLIENTE">Cliente Activo</option>
            <option value="ENTRENADOR">Entrenador</option>
            <option value="NUTRICIONISTA">Nutricionista</option>
            <option value="GERENTE">Gerente de Sede</option>
            <option value="SUPER_ADMIN">Super Administrador</option>
          </select>
        </div>
        <div className="modal-form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input type="checkbox" style={{ width: 'auto' }} checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} />
          <label style={{ margin: 0 }}>Usuario Activo</label>
        </div>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={() => onSave(formData)}>Guardar Usuario</button>
        </div>
      </div>
    </ModalOverlay>
  );
};


// ============================================================
// LOCATION PICKER — Mapa interactivo con Leaflet + OpenStreetMap
// ============================================================
const MapPicker = ({ lat, lng, onSelect }: { lat: number; lng: number; onSelect: (lat: number, lng: number, address: string) => void }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [geocoding, setGeocoding] = useState(false);

  const reverseGeocode = useCallback(async (latitude: number, longitude: number) => {
    setGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
        { headers: { 'Accept-Language': 'es' } }
      );
      const data = await res.json();
      const address = data.display_name || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
      onSelect(latitude, longitude, address);
    } catch {
      onSelect(latitude, longitude, `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
    } finally {
      setGeocoding(false);
    }
  }, [onSelect]);

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    const initialLat = lat || -17.7833;
    const initialLng = lng || -63.1667;

    const map = L.map(mapRef.current, { zoomControl: true }).setView([initialLat, initialLng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);
    marker.bindPopup('📍 Arrastra para ajustar la ubicación').openPopup();

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      reverseGeocode(pos.lat, pos.lng);
    });

    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      reverseGeocode(e.latlng.lat, e.latlng.lng);
    });

    leafletMap.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      leafletMap.current = null;
    };
  }, []);

  // Actualizar posición del marcador cuando cambian las props externas
  useEffect(() => {
    if (markerRef.current && lat && lng) {
      markerRef.current.setLatLng([lat, lng]);
      leafletMap.current?.setView([lat, lng], 14);
    }
  }, [lat, lng]);

  return (
    <div style={{ position: 'relative' }}>
      <div ref={mapRef} style={{ height: '260px', borderRadius: '10px', border: '1px solid #3A3A3C', overflow: 'hidden', zIndex: 0 }} />
      {geocoding && (
        <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.7)', color: '#00D9FF', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', zIndex: 1000 }}>
          🔍 Obteniendo dirección...
        </div>
      )}
      <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: '#8E8E93' }}>
        📌 Haz clic en el mapa o arrastra el marcador para seleccionar la ubicación exacta
      </p>
    </div>
  );
};

// ============================================================
// GymModal — Con Map Picker integrado
// ============================================================
const GymModal = ({ isOpen, onClose, gymToEdit, onSave }: any) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    maxCapacity: 100,
    isOpen: true,
    latitude: -17.7833,
    longitude: -63.1667,
    city: 'Santa Cruz de la Sierra',
  });
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    if (gymToEdit) {
      setFormData({
        name: gymToEdit.name || '',
        address: gymToEdit.location?.address || gymToEdit.description || '',
        maxCapacity: gymToEdit.maxCapacity || 100,
        isOpen: gymToEdit.isOpen ?? true,
        latitude: gymToEdit.location?.latitude || -17.7833,
        longitude: gymToEdit.location?.longitude || -63.1667,
        city: gymToEdit.location?.city || 'Santa Cruz de la Sierra',
      });
    } else {
      setFormData({ name: '', address: '', maxCapacity: 100, isOpen: true, latitude: -17.7833, longitude: -63.1667, city: 'Santa Cruz de la Sierra' });
    }
    setShowMap(false);
  }, [gymToEdit, isOpen]);

  const handleLocationSelect = useCallback((lat: number, lng: number, address: string) => {
    setFormData(prev => ({ ...prev, latitude: lat, longitude: lng, address }));
  }, []);

  if (!isOpen) return null;

  const hasCoords = formData.latitude !== -17.7833 || formData.longitude !== -63.1667;
  const isEditing = !!gymToEdit;

  return (
    <ModalOverlay onClose={onClose}>
      <div className="modal-content glass-panel" style={{ maxWidth: '560px', width: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <h2>{isEditing ? '✏️ Editar Sede' : '🏢 Nueva Sede'}</h2>
        </div>

        {/* Campos básicos */}
        <div className="modal-form-group">
          <label>Nombre de la Sede</label>
          <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ej. Sucursal Centro" />
        </div>
        <div className="modal-form-group">
          <label>Capacidad Máxima (Aforo)</label>
          <input type="number" value={formData.maxCapacity} onChange={e => setFormData({ ...formData, maxCapacity: parseInt(e.target.value) || 0 })} />
        </div>
        <div className="modal-form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input type="checkbox" style={{ width: 'auto' }} checked={formData.isOpen} onChange={e => setFormData({ ...formData, isOpen: e.target.checked })} />
          <label style={{ margin: 0 }}>Sede Abierta al Público</label>
        </div>

        {/* Sección de Ubicación */}
        <div style={{ borderTop: '1px solid #3A3A3C', paddingTop: '1rem', marginTop: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <label style={{ margin: 0, fontWeight: 600, color: '#E5E5EA' }}>📍 Ubicación Geográfica</label>
            {!isEditing && (
              <button
                type="button"
                onClick={() => setShowMap(v => !v)}
                style={{ background: showMap ? '#3A3A3C' : '#00D9FF', color: showMap ? '#fff' : '#0A0A0A', border: 'none', padding: '0.35rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s' }}
              >
                {showMap ? '🗺️ Ocultar Mapa' : '🗺️ Abrir Selector de Mapa'}
              </button>
            )}
          </div>

          {/* Dirección de texto (siempre visible, se autocompleta con el mapa) */}
          <div className="modal-form-group">
            <label>Dirección</label>
            <input
              type="text"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              placeholder="Haz clic en el mapa o escribe manualmente"
            />
          </div>

          {/* Coordenadas (solo lectura, pobladas por el mapa) */}
          {!isEditing && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div className="modal-form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.8rem' }}>Latitud</label>
                <input type="number" step="0.000001" value={formData.latitude} onChange={e => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })} style={{ fontSize: '0.85rem' }} />
              </div>
              <div className="modal-form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.8rem' }}>Longitud</label>
                <input type="number" step="0.000001" value={formData.longitude} onChange={e => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })} style={{ fontSize: '0.85rem' }} />
              </div>
            </div>
          )}

          {/* Ciudad */}
          {!isEditing && (
            <div className="modal-form-group">
              <label>Ciudad</label>
              <input type="text" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} placeholder="Santa Cruz de la Sierra" />
            </div>
          )}

          {/* Map Picker — renderizado solo en modo creación */}
          {!isEditing && showMap && (
            <div style={{ marginTop: '0.5rem' }}>
              <MapPicker lat={formData.latitude} lng={formData.longitude} onSelect={handleLocationSelect} />
              {hasCoords && (
                <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', background: 'rgba(0, 217, 255, 0.08)', borderRadius: '6px', border: '1px solid rgba(0, 217, 255, 0.2)', fontSize: '0.8rem', color: '#00D9FF' }}>
                  ✅ Coordenadas seleccionadas: {formData.latitude.toFixed(5)}, {formData.longitude.toFixed(5)}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={() => onSave(formData)}>Guardar Sede</button>
        </div>
      </div>
    </ModalOverlay>
  );
};
const panelStyle: CSSProperties = {
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

export const UsuariosView = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserDto | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<UserDto | null>(null);

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

  const handleDeleteUser = (u: UserDto) => {
    setDeleteConfirmUser(u);
  };

  const confirmDeleteUser = async () => {
    if (!deleteConfirmUser) return;
    try {
      await apiClient.delete(`/users/${deleteConfirmUser.id}`);
      setUsers(prev => prev.filter(item => item.id !== deleteConfirmUser.id));
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Error al eliminar usuario.');
    } finally {
      setDeleteConfirmUser(null);
    }
  };

  const handleCreateUser = () => {
    setUserToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditUser = (u: UserDto) => {
    setUserToEdit(u);
    setIsModalOpen(true);
  };

  const handleSaveUser = async (formData: any) => {
    try {
      const roleMap: Record<string, number> = {
        'SUPER_ADMIN': 1,
        'GERENTE': 2,
        'USER': 3,
        'CLIENTE': 3,
        'ENTRENADOR': 4,
        'NUTRICIONISTA': 4
      };

      const payload: any = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      console.log(`[Security Check]: Ejecutando acción para Rol ${user?.role} con Scope Gym ${user?.gymId || 'Global'}`);
      console.log("[Debug] Payload de Usuario saneado a enviar (/users):", JSON.stringify(payload, null, 2));

      let newUserId = userToEdit?.id;

      if (userToEdit) {
        await apiClient.put(`/users/${userToEdit.id}`, payload);
        setUsers(prev => prev.map(u => u.id === userToEdit.id ? { ...u, email: formData.email, isActive: formData.isActive, profile: { firstName: formData.firstName, lastName: formData.lastName } } : u));
      } else {
        const res = await apiClient.post('/users', payload);
        newUserId = res.data?.id || res.data?.data?.id || res.data?.userId;
        
        const newUser = res.data?.id ? res.data : { id: newUserId || Date.now(), email: formData.email, isActive: formData.isActive, profile: { firstName: formData.firstName, lastName: formData.lastName } };
        setUsers(prev => [...prev, newUser]);
      }

      // Flujo de Promesa Encadenada: Asignación de Rol
      if (newUserId) {
        let roleId = roleMap[formData.role] || 3;
        // Validación de Payload de Asignación: [1, 4]
        if (roleId < 1 || roleId > 4) roleId = 3;

        const assignPayload: any = {
          userId: parseInt(newUserId),
          roleId: roleId
        };
        // Scoping: Inyectar gymId si es Gerente
        if (user?.role === 'GERENTE' && user?.gymId) {
          assignPayload.gymId = parseInt(user.gymId as string);
        }
        
        console.log(`[Security Check]: Asignando Rol ID ${roleId} al Usuario ID ${newUserId}`);
        console.log("[Debug] Payload de Rol saneado a enviar (/roles/assign):", JSON.stringify(assignPayload, null, 2));
        
        await apiClient.post('/roles/assign', assignPayload).catch(e => {
          console.error("Error al asignar rol (ignorado localmente para continuar flujo):", e);
        });
      }

      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      // api.config.ts ya maneja el toast para errores 400
    }
  };

  return (
    <section style={panelStyle} className="glass-panel">
      <h1 style={{ marginTop: 0 }}>Usuarios</h1>
      <p>
        {user?.role === 'SUPER_ADMIN'
          ? 'Gestion de usuarios de toda la red.'
          : 'Gestion de usuarios restringida a tus sucursales de la cadena.'}
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
        <div style={{ color: '#8E8E93', fontSize: '0.9rem' }}>
          {loading ? 'Cargando usuarios...' : `Total: ${users.length} | Activos: ${usuariosActivos}`}
        </div>
        {(user?.role === 'SUPER_ADMIN' || user?.role === 'GERENTE') && (
          <button 
            onClick={handleCreateUser}
            style={{ background: '#00D9FF', color: '#0A0A0A', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
          >
            + Nuevo Usuario
          </button>
        )}
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
                <th style={{ textAlign: 'center', padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: '#8E8E93' }}>Acciones</th>
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
                    <td style={{ padding: '0.6rem', borderBottom: '1px solid #3A3A3C', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        {(user?.role === 'SUPER_ADMIN' || user?.role === 'GERENTE' || user?.role === 'ENTRENADOR' || user?.role === 'NUTRICIONISTA') && (
                          <button onClick={() => handleEditUser(u)} style={{ background: '#00D9FF', color: '#0A0A0A', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Editar</button>
                        )}
                        {(user?.role === 'SUPER_ADMIN' || user?.role === 'GERENTE') && (
                          <button onClick={() => handleDeleteUser(u)} style={{ background: 'rgba(255, 94, 0, 0.1)', color: '#FF5E00', border: '1px solid #FF5E00', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Eliminar</button>
                        )}
                        {(user?.role !== 'SUPER_ADMIN' && user?.role !== 'GERENTE' && user?.role !== 'ENTRENADOR' && user?.role !== 'NUTRICIONISTA') && (
                          <button style={{ background: '#3A3A3C', color: '#FFFFFF', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Ver Ficha</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <UserModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        userToEdit={userToEdit} 
        onSave={handleSaveUser} 
      />

      <ConfirmModal
        isOpen={!!deleteConfirmUser}
        onClose={() => setDeleteConfirmUser(null)}
        onConfirm={confirmDeleteUser}
        title="Confirmar Eliminación"
        message={`¿Estás seguro de querer eliminar al usuario "${deleteConfirmUser?.email}"? Esta acción no se puede deshacer y borrará permanentemente sus datos de acceso y perfil.`}
      />
    </section>
  );
};

export const SedesView = () => {
  const { user } = useAuth();
  const [gyms, setGyms] = useState<GymDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sedeToEdit, setSedeToEdit] = useState<GymDto | null>(null);
  const [deleteConfirmSede, setDeleteConfirmSede] = useState<GymDto | null>(null);

  useEffect(() => {
    let mounted = true;

    const cargarSedes = async () => {
      try {
        setLoading(true);
        setError(null);
        const gymsResp = await apiClient.get('/gyms');
        let gymsData: GymDto[] = Array.isArray(gymsResp.data) ? gymsResp.data : [];

        // Scoping de Gerente: Solo mostrar su propia sede
        if (user?.role === 'GERENTE' && user?.gymId) {
          const gerenteGymId = parseInt(user.gymId as string);
          const otherGymsCount = gymsData.filter(g => g.id !== gerenteGymId).length;
          if (otherGymsCount > 0) {
            console.warn(`[Security Guard]: Bloqueo de acceso a Sede ajena para Gerente ID ${user.userId}`);
          }
          gymsData = gymsData.filter(g => g.id === gerenteGymId);
        }

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

  const handleDeleteSede = (sede: GymDto) => {
    setDeleteConfirmSede(sede);
  };

  const confirmDeleteSede = async () => {
    if (!deleteConfirmSede) return;
    try {
      await apiClient.delete(`/gyms/${deleteConfirmSede.id}`);
      setGyms(prev => prev.filter(g => g.id !== deleteConfirmSede.id));
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Error al eliminar sede.');
    } finally {
      setDeleteConfirmSede(null);
    }
  };

  const handleCreateSede = () => {
    setSedeToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditSede = (sede: GymDto) => {
    if (user?.role === 'GERENTE' && user?.gymId && sede.id !== parseInt(user.gymId as string)) {
      console.warn(`[Security Guard]: Bloqueo de acceso a Sede ajena para Gerente ID ${user.userId}`);
      alert("Acceso denegado: No tienes permisos para editar una sede que no te pertenece.");
      return;
    }
    setSedeToEdit(sede);
    setIsModalOpen(true);
  };

  const handleSaveSede = async (formData: any) => {
    try {
      let payload: any = {};

      if (sedeToEdit) {
        // PUT: UpdateGymDto — Solo propiedades de identidad mutables, sin location
        payload = {
          name: formData.name,
          description: formData.description || '',
          maxCapacity: Number(formData.maxCapacity) || 0,
          isOpen: Boolean(formData.isOpen)
        };
      } else {
        // POST: CreateGymDto — Payload atómico con location anidada (Cascada TypeORM)
        payload = {
          name: formData.name,
          description: formData.description || '',
          maxCapacity: Number(formData.maxCapacity) || 0,
          location: {
            address: formData.address || '',
            city: formData.city || 'Santa Cruz de la Sierra',
            latitude: Number(formData.latitude) || 0,
            longitude: Number(formData.longitude) || 0
          }
        };
      }

      console.log(`[Security Check]: Ejecutando acción para Rol ${user?.role} con Scope Gym ${user?.gymId || 'Global'}`);
      console.log(`[Final Contract]: Enviando payload a /gyms -> ${JSON.stringify(payload)}`);

      if (sedeToEdit) {
        await apiClient.put(`/gyms/${sedeToEdit.id}`, payload);
        setGyms(prev => prev.map(g => g.id === sedeToEdit.id
          ? { ...g, name: formData.name, description: formData.description, maxCapacity: formData.maxCapacity, isOpen: formData.isOpen }
          : g
        ));
      } else {
        const res = await apiClient.post('/gyms', payload);
        const newSede = res.data?.id ? res.data : { id: res.data?.data?.id || Date.now(), ...payload };
        setGyms(prev => [...prev, newSede]);
      }

      setIsModalOpen(false);
    } catch (err: any) {
      console.error('[Debug] Error completo del servidor en handleSaveSede:', JSON.stringify(err?.response?.data, null, 2));
      if (err?.response?.status === 400) {
        console.error('[API Error 400] Arreglo de validaciones:', err?.response?.data?.message || err?.response?.data);
      }
      // api.config.ts maneja el toast
    }
  };


  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <section style={panelStyle} className="glass-panel">
      <h1 style={{ marginTop: 0 }}>Sedes</h1>
      <p>
        {user.role === 'SUPER_ADMIN'
          ? 'Acceso completo a todas las sucursales.'
          : `Acceso restringido a tus sucursales de la cadena (gym_id: ${user.gymId || 'N/A'}).`}
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
        <div style={{ color: '#8E8E93', fontSize: '0.9rem' }}>
          {loading ? 'Cargando sedes...' : `Total de sedes: ${gyms.length}`}
        </div>
        {user.role === 'SUPER_ADMIN' && (
          <button 
            onClick={handleCreateSede}
            style={{ background: '#00D9FF', color: '#0A0A0A', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
          >
            + Nueva Sede
          </button>
        )}
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
                {user.role === 'SUPER_ADMIN' && (
                  <th style={{ textAlign: 'center', padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: '#8E8E93' }}>Acciones</th>
                )}
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
                  {user.role === 'SUPER_ADMIN' && (
                    <td style={{ padding: '0.6rem', borderBottom: '1px solid #3A3A3C', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button onClick={() => handleEditSede(g)} style={{ background: '#00D9FF', color: '#0A0A0A', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Editar</button>
                        <button onClick={() => handleDeleteSede(g)} style={{ background: 'rgba(255, 94, 0, 0.1)', color: '#FF5E00', border: '1px solid #FF5E00', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Eliminar</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <GymModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        gymToEdit={sedeToEdit} 
        onSave={handleSaveSede} 
      />

      <ConfirmModal
        isOpen={!!deleteConfirmSede}
        onClose={() => setDeleteConfirmSede(null)}
        onConfirm={confirmDeleteSede}
        title="Confirmar Eliminación"
        message={`¿Estás seguro de querer eliminar la sede "${deleteConfirmSede?.name}"? Esta acción no se puede deshacer y borrará los registros asociados permanentemente.`}
      />
    </section>
  );
};

// --- MODULO DE RUTINAS ---

type RoutineDto = {
  id: number;
  name: string;
  difficulty: string;
  description: string;
};

const RoutineModal = ({ isOpen, onClose, routineToEdit, onSave }: any) => {
  const [formData, setFormData] = useState({
    name: '', difficulty: 'FACIL', description: ''
  });
  
  useEffect(() => {
    if (routineToEdit) {
      setFormData({
        name: routineToEdit.name || '',
        difficulty: routineToEdit.difficultyLevel || 'FACIL',
        description: routineToEdit.description || ''
      });
    } else {
      setFormData({ name: '', difficulty: 'FACIL', description: '' });
    }
  }, [routineToEdit, isOpen]);

  if (!isOpen) return null;

  return (
    <ModalOverlay onClose={onClose}>
      <div className="modal-content glass-panel">
        <div className="modal-header">
          <h2>{routineToEdit ? 'Editar Rutina' : 'Nueva Rutina'}</h2>
        </div>
        <div className="modal-form-group">
          <label>Nombre de la Rutina</label>
          <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej. Hipertrofia Full Body" />
        </div>
        <div className="modal-form-group">
          <label>Dificultad</label>
          <select value={formData.difficulty} onChange={e => setFormData({...formData, difficulty: e.target.value})}>
            <option value="FACIL">Fácil</option>
            <option value="INTERMEDIO">Intermedio</option>
            <option value="AVANZADO">Avanzado</option>
          </select>
        </div>
        <div className="modal-form-group">
          <label>Descripción</label>
          <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Descripción general de la rutina..." style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0, 0, 0, 0.2)', border: '1px solid #3A3A3C', color: '#FFF' }} rows={4} />
        </div>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={() => onSave(formData)}>Guardar Rutina</button>
        </div>
      </div>
    </ModalOverlay>
  );
};

export const RutinasView = () => {
  const { user } = useAuth();
  const [routines, setRoutines] = useState<RoutineDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [routineToEdit, setRoutineToEdit] = useState<RoutineDto | null>(null);
  const [deleteConfirmRoutine, setDeleteConfirmRoutine] = useState<RoutineDto | null>(null);

  const canDelete = user?.role === 'SUPER_ADMIN' || user?.role === 'GERENTE';

  useEffect(() => {
    let mounted = true;
    const fetchRoutines = async () => {
      try {
        setLoading(true);
        const resp = await apiClient.get('/routines');
        if (mounted) setRoutines(Array.isArray(resp.data) ? resp.data : []);
      } catch (err: any) {
        if (mounted) setError('No se pudieron cargar las rutinas.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchRoutines();
    return () => { mounted = false; };
  }, []);

  const handleDeleteRoutine = (r: RoutineDto) => setDeleteConfirmRoutine(r);
  
  const confirmDeleteRoutine = async () => {
    if (!deleteConfirmRoutine) return;
    try {
      await apiClient.delete(`/routines/${deleteConfirmRoutine.id}`);
      setRoutines(prev => prev.filter(r => r.id !== deleteConfirmRoutine.id));
    } catch (err) {
      // handled by api.config.ts
    } finally {
      setDeleteConfirmRoutine(null);
    }
  };

  const handleSaveRoutine = async (formData: any) => {
    try {
      let payload: any = {};
      
      if (routineToEdit) {
        payload = {
          name: formData.name,
          description: formData.description,
          difficultyLevel: formData.difficulty
        };
      } else {
        payload = {
          name: formData.name,
          description: formData.description,
          difficultyLevel: formData.difficulty,
          isTemplate: false,
          trainerId: Number(user?.userId) || 1
        };
      }
      
      console.log(`[Security Check]: Ejecutando acción para Rol ${user?.role} con Scope Gym ${user?.gymId || 'Global'}`);
      console.log(`[Final Contract]: Enviando payload a /routines -> ${JSON.stringify(payload)}`);

      if (routineToEdit) {
        await apiClient.put(`/routines/${routineToEdit.id}`, payload);
        setRoutines(prev => prev.map(r => r.id === routineToEdit.id ? { ...r, ...payload } : r));
      } else {
        const res = await apiClient.post('/routines', payload);
        const newRoutine = res.data?.id ? res.data : { id: res.data?.data?.id || Date.now(), ...payload };
        setRoutines(prev => [...prev, newRoutine]);
      }
      setIsModalOpen(false);
    } catch (err) {
      // Handled by api.config.ts
    }
  };

  return (
    <section style={panelStyle} className="glass-panel">
      <h1 style={{ marginTop: 0 }}>Rutinas de Entrenamiento</h1>
      <p>Gestión de planes de entrenamiento corporales.</p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
        <div style={{ color: '#8E8E93', fontSize: '0.9rem' }}>
          {loading ? 'Cargando rutinas...' : `Total de rutinas: ${routines.length}`}
        </div>
        {user?.role !== 'CLIENTE' && (
          <button 
            onClick={() => { setRoutineToEdit(null); setIsModalOpen(true); }}
            style={{ background: '#00D9FF', color: '#0A0A0A', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
          >
            + Nueva Rutina
          </button>
        )}
      </div>

      {error && <div style={{ marginTop: '0.75rem', color: '#FF5E00' }}>{error}</div>}

      {!loading && !error && (
        <div style={{ marginTop: '1rem', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: '#8E8E93' }}>Rutina</th>
                <th style={{ textAlign: 'left', padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: '#8E8E93' }}>Dificultad</th>
                <th style={{ textAlign: 'left', padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: '#8E8E93' }}>Descripción</th>
                {user?.role !== 'CLIENTE' && (
                  <th style={{ textAlign: 'center', padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: '#8E8E93' }}>Acciones</th>
                )}
              </tr>
            </thead>
            <tbody>
              {routines.map((r) => (
                <tr key={r.id}>
                  <td style={{ padding: '0.6rem', borderBottom: '1px solid #3A3A3C', fontWeight: 600 }}>{r.name}</td>
                  <td style={{ padding: '0.6rem', borderBottom: '1px solid #3A3A3C' }}>
                    <span style={{ 
                      padding: '0.2rem 0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.8rem',
                      background: r.difficultyLevel === 'FACIL' ? 'rgba(48, 209, 88, 0.1)' : r.difficultyLevel === 'INTERMEDIO' ? 'rgba(255, 159, 10, 0.1)' : 'rgba(255, 94, 0, 0.1)',
                      color: r.difficultyLevel === 'FACIL' ? '#30D158' : r.difficultyLevel === 'INTERMEDIO' ? '#FF9F0A' : '#FF5E00' 
                    }}>
                      {r.difficultyLevel || r.difficulty}
                    </span>
                  </td>
                  <td style={{ padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: '#E5E5EA' }}>{r.description || '-'}</td>
                  {user?.role !== 'CLIENTE' && (
                    <td style={{ padding: '0.6rem', borderBottom: '1px solid #3A3A3C', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button onClick={() => { setRoutineToEdit(r); setIsModalOpen(true); }} style={{ background: '#00D9FF', color: '#0A0A0A', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Editar</button>
                        {canDelete && (
                          <button onClick={() => handleDeleteRoutine(r)} style={{ background: 'rgba(255, 94, 0, 0.1)', color: '#FF5E00', border: '1px solid #FF5E00', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Eliminar</button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <RoutineModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        routineToEdit={routineToEdit} 
        onSave={handleSaveRoutine} 
      />

      <ConfirmModal
        isOpen={!!deleteConfirmRoutine}
        onClose={() => setDeleteConfirmRoutine(null)}
        onConfirm={confirmDeleteRoutine}
        title="Confirmar Eliminación"
        message={`¿Estás seguro de querer eliminar la rutina "${deleteConfirmRoutine?.name}"? Esta acción no se puede deshacer.`}
      />
    </section>
  );
};

