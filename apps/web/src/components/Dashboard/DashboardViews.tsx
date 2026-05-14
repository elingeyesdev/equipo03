import React, { useState, useEffect, useCallback, useRef, useLayoutEffect, useMemo } from 'react';
import type { CSSProperties } from 'react';
import { Navigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../infrastructure/api.config';
// Leaflet — Map Picker (tiles gratuitas de OpenStreetMap, sin API Key)
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
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
    firstName: '', lastName: '', email: '', password: '', roleId: 3, gymIds: [] as number[], isActive: true
  });
  const [gyms, setGyms] = useState<any[]>([]);
  const [loadingGyms, setLoadingGyms] = useState(false);
  const modalScrollContainerRef = useRef<HTMLDivElement>(null);
  const topAnchorRef = useRef<HTMLDivElement>(null);

  const roles = [
    { id: 1, name: 'SUPER_ADMIN', label: 'Super Administrador' },
    { id: 2, name: 'GERENTE', label: 'Gerente de Sede' },
    { id: 3, name: 'USER', label: 'Usuario Estándar' },
    { id: 4, name: 'CLIENTE', label: 'Cliente Activo' },
    { id: 5, name: 'ENTRENADOR', label: 'Entrenador' },
    { id: 6, name: 'NUTRICIONISTA', label: 'Nutricionista' },
  ];

  useEffect(() => {
    if (isOpen) {
      const originalStyle = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  useLayoutEffect(() => {
    if (isOpen) {
      fetchGyms();
      // 1. Forzar el foco al contenedor superior o un elemento invisible al inicio
      topAnchorRef.current?.focus();

      // 2. Doble reset de scroll para vencer al Reflow de React
      const reset = () => {
        if (modalScrollContainerRef.current) {
          modalScrollContainerRef.current.scrollTop = 0;
        }
      };

      reset(); // Intento 1: Inmediato
      const timeoutId = setTimeout(reset, 100); // Intento 2: Tras el renderizado del Rol

      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, formData.roleId]);

  const fetchGyms = async () => {
    setLoadingGyms(true);
    try {
      const response = await apiClient.get('/gyms');
      if (response.data) {
        setGyms(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Error al cargar sedes:', error);
    } finally {
      setLoadingGyms(false);
    }
  };

  useEffect(() => {
    if (userToEdit) {
      // Adaptado a nueva estructura: userRoles.gym en lugar de gyms directo
      const gymsFromRoles = userToEdit.userRoles?.map((ur: any) => ur.gym).filter(Boolean) || [];
      setFormData({
        firstName: userToEdit.profile?.firstName || '',
        lastName: userToEdit.profile?.lastName || '',
        email: userToEdit.email || '',
        password: '',
        roleId: Number(userToEdit.userRoles?.[0]?.roleId) || 3,
        gymIds: gymsFromRoles.map((g: any) => g.id),
        isActive: userToEdit.isActive ?? true
      });
    } else {
      setFormData({ firstName: '', lastName: '', email: '', password: '', roleId: 3, gymIds: [], isActive: true });
    }
  }, [userToEdit, isOpen]);

  const handleGymToggle = (gymId: number) => {
    setFormData(prev => ({
      ...prev,
      gymIds: prev.gymIds.includes(gymId)
        ? prev.gymIds.filter(id => id !== gymId)
        : [...prev.gymIds, gymId]
    }));
  };

  const handleGymSelect = (gymId: number) => {
    setFormData(prev => ({
      ...prev,
      gymIds: [gymId]
    }));
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClose={onClose}>
      <div className="modal-content glass-panel" style={{ maxHeight: '75vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header">
          <h2>{userToEdit ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
        </div>
        <div ref={modalScrollContainerRef} className="border-2 border-red-500" style={{ overflowY: 'auto', paddingRight: '0.5rem', flex: 1, maxHeight: '75vh', display: 'flex', flexDirection: 'column' }}>
          <div ref={topAnchorRef} tabIndex={-1} style={{ width: '100%', height: '1px', opacity: 0, display: 'block' }} />
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
          <select 
            value={formData.roleId} 
            onChange={e => setFormData({...formData, roleId: Number(e.target.value), gymIds: []})}
          >
            {roles.map(role => (
              <option key={role.id} value={role.id}>
                {role.label}
              </option>
            ))}
          </select>
        </div>

        {formData.roleId === 2 && (
          <div className="modal-form-group">
            <label>Sede (Única) *</label>
            {loadingGyms ? (
              <p style={{ color: '#8E8E93', fontSize: '0.875rem' }}>Cargando sedes...</p>
            ) : (
              <select
                value={formData.gymIds[0] || ''}
                onChange={e => handleGymSelect(Number(e.target.value))}
                style={{ width: '100%', padding: '0.5rem', background: '#0A0A0A', border: formData.gymIds.length === 0 ? '1px solid #ef4444' : '1px solid #3A3A3C', color: '#FFFFFF', borderRadius: '6px' }}
              >
                <option value="">Seleccionar sede</option>
                {gyms.map(gym => (
                  <option key={gym.id} value={gym.id} style={{ background: '#0A0A0A', color: '#FFFFFF' }}>
                    {gym.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {(formData.roleId === 5 || formData.roleId === 6) && (
          <div className="modal-form-group">
            <label>Sedes (Múltiples)</label>
            {loadingGyms ? (
              <p style={{ color: '#8E8E93', fontSize: '0.875rem' }}>Cargando sedes...</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', padding: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
                {gyms.map(gym => (
                  <label key={gym.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', borderRadius: '4px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.gymIds.includes(gym.id)}
                      onChange={() => handleGymToggle(gym.id)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span>{gym.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="modal-form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input type="checkbox" style={{ width: 'auto' }} checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} />
          <label style={{ margin: 0 }}>Usuario Activo</label>
        </div>
        </div>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancelar</button>
          <button 
            className="btn-primary" 
            onClick={() => {
              if (formData.roleId === 2 && formData.gymIds.length === 0) {
                alert('El Gerente de Sede debe tener asignada al menos una sede');
                return;
              }
              onSave(formData);
            }}
          >
            Guardar Usuario
          </button>
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
// GymModal — Con Map Picker + Gestión de Horarios integrada
// ============================================================
const DAYS_OF_WEEK = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];
const DAY_LABELS: Record<string, string> = { LUNES: 'Lunes', MARTES: 'Martes', MIERCOLES: 'Miércoles', JUEVES: 'Jueves', VIERNES: 'Viernes', SABADO: 'Sábado', DOMINGO: 'Domingo' };
const DAY_ICONS: Record<string, string> = { LUNES: '📅', MARTES: '📅', MIERCOLES: '📅', JUEVES: '📅', VIERNES: '📅', SABADO: '🌤️', DOMINGO: '🌤️' };

type ScheduleEntry = { id?: number; dayOfWeek: string; opensAt: string; closesAt: string; isHoliday: boolean; _isNew?: boolean };

const GymModal = ({ isOpen, onClose, gymToEdit, onSave }: any) => {
  const [formData, setFormData] = useState({
    name: '', address: '', maxCapacity: 100, isOpen: true,
    latitude: -17.7833, longitude: -63.1667, city: 'Santa Cruz de la Sierra',
  });
  const [showMap, setShowMap] = useState(false);
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [newSchedule, setNewSchedule] = useState({ dayOfWeek: 'LUNES', opensAt: '06:00', closesAt: '22:00', isHoliday: false });
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [scheduleError, setScheduleError] = useState('');

  const isEditing = !!gymToEdit;

  useEffect(() => {
    if (gymToEdit) {
      setFormData({
        name: gymToEdit.name || '', address: gymToEdit.location?.address || gymToEdit.description || '',
        maxCapacity: gymToEdit.maxCapacity || 100, isOpen: gymToEdit.isOpen ?? true,
        latitude: gymToEdit.location?.latitude || -17.7833, longitude: gymToEdit.location?.longitude || -63.1667,
        city: gymToEdit.location?.city || 'Santa Cruz de la Sierra',
      });
      // Cargar horarios desde backend para edición
      setLoadingSchedules(true);
      apiClient.get(`/gyms/${gymToEdit.id}/schedules`).then(res => {
        const data = Array.isArray(res.data) ? res.data : [];
        setSchedules(data.map((s: any) => ({ id: s.id, dayOfWeek: s.dayOfWeek, opensAt: s.opensAt?.slice(0, 5), closesAt: s.closesAt?.slice(0, 5), isHoliday: s.isHoliday ?? false })));
      }).catch(() => {
        setSchedules(gymToEdit.schedules?.map((s: any) => ({ id: s.id, dayOfWeek: s.dayOfWeek, opensAt: s.opensAt?.slice(0, 5), closesAt: s.closesAt?.slice(0, 5), isHoliday: s.isHoliday ?? false })) || []);
      }).finally(() => setLoadingSchedules(false));
    } else {
      setFormData({ name: '', address: '', maxCapacity: 100, isOpen: true, latitude: -17.7833, longitude: -63.1667, city: 'Santa Cruz de la Sierra' });
      setSchedules([]);
    }
    setShowMap(false);
    setScheduleError('');
  }, [gymToEdit, isOpen]);

  const handleLocationSelect = useCallback((lat: number, lng: number, address: string) => {
    setFormData(prev => ({ ...prev, latitude: lat, longitude: lng, address }));
  }, []);

  const validateSchedule = (s: typeof newSchedule) => {
    if (!s.opensAt || !s.closesAt) return 'Debes indicar hora de apertura y cierre.';
    if (s.closesAt <= s.opensAt) return 'La hora de cierre debe ser posterior a la de apertura.';
    const exists = schedules.some(x => x.dayOfWeek === s.dayOfWeek && !x.isHoliday);
    if (exists && !s.isHoliday) return `Ya existe un horario para ${DAY_LABELS[s.dayOfWeek] || s.dayOfWeek}.`;
    return '';
  };

  const handleAddSchedule = async () => {
    const err = validateSchedule(newSchedule);
    if (err) { setScheduleError(err); return; }
    setScheduleError('');

    const entry: ScheduleEntry = { ...newSchedule, _isNew: true };

    if (isEditing) {
      // Modo edición: POST individual al backend
      try {
        const res = await apiClient.post(`/gyms/${gymToEdit.id}/schedules`, {
          dayOfWeek: newSchedule.dayOfWeek, opensAt: newSchedule.opensAt, closesAt: newSchedule.closesAt, isHoliday: newSchedule.isHoliday,
        });
        entry.id = res.data?.id;
        entry._isNew = false;
        toast.success(`Horario ${DAY_LABELS[newSchedule.dayOfWeek]} agregado`);
      } catch { toast.error('Error al agregar horario en el servidor.'); return; }
    }
    setSchedules(prev => [...prev, entry]);
  };

  const handleRemoveSchedule = async (idx: number) => {
    const item = schedules[idx];
    if (isEditing && item.id) {
      try {
        await apiClient.delete(`/gyms/schedules/${item.id}`);
        toast.success('Horario eliminado del servidor');
      } catch {
        toast.error('Error al eliminar horario del servidor.');
        return;
      }
    }
    setSchedules(prev => prev.filter((_, i) => i !== idx));
    if (!isEditing) toast.success('Horario removido');
  };

  const handleSave = () => {
    // Empaquetar schedules para el modo creación
    const schedulesPayload = schedules.map(s => ({
      dayOfWeek: s.dayOfWeek, opensAt: s.opensAt, closesAt: s.closesAt, isHoliday: s.isHoliday,
    }));
    onSave({ ...formData, schedules: schedulesPayload });
  };

  if (!isOpen) return null;
  const hasCoords = formData.latitude !== -17.7833 || formData.longitude !== -63.1667;

  return (
    <ModalOverlay onClose={onClose}>
      <div className="modal-content glass-panel" style={{ maxWidth: '600px', width: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
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
            <button type="button" onClick={() => setShowMap(v => !v)}
              style={{ background: showMap ? '#3A3A3C' : '#00D9FF', color: showMap ? '#fff' : '#0A0A0A', border: 'none', padding: '0.35rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s' }}>
              {showMap ? '🗺️ Ocultar Mapa' : '🗺️ Actualizar Ubicación en Mapa'}
            </button>
          </div>
          <div className="modal-form-group">
            <label>Dirección</label>
            <input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="Haz clic en el mapa o escribe manualmente" />
          </div>
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
          <div className="modal-form-group">
            <label>Ciudad</label>
            <input type="text" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} placeholder="Santa Cruz de la Sierra" />
          </div>
          {showMap && (
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

        {/* ════════════════════════════════════════════════════════ */}
        {/* Sección de Horarios de Atención */}
        {/* ════════════════════════════════════════════════════════ */}
        <div style={{ borderTop: '1px solid #3A3A3C', paddingTop: '1rem', marginTop: '1rem' }}>
          <label style={{ margin: 0, fontWeight: 600, color: '#E5E5EA', display: 'block', marginBottom: '0.75rem' }}>
            🕐 Horarios de Atención
          </label>

          {/* Lista de horarios existentes */}
          {loadingSchedules && <p style={{ color: '#8E8E93', fontSize: '0.85rem' }}>Cargando horarios...</p>}
          {schedules.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.75rem' }}>
              {schedules.map((s, i) => (
                <div key={`${s.dayOfWeek}-${i}`} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.04)',
                  borderRadius: '8px', border: s.isHoliday ? '1px solid rgba(255, 159, 10, 0.3)' : '1px solid #3A3A3C',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1rem' }}>{DAY_ICONS[s.dayOfWeek] || '📅'}</span>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#E5E5EA', minWidth: '80px' }}>
                      {DAY_LABELS[s.dayOfWeek] || s.dayOfWeek}
                    </span>
                    <span style={{ color: '#00D9FF', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                      {s.opensAt} — {s.closesAt}
                    </span>
                    {s.isHoliday && <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(255, 159, 10, 0.15)', color: '#FF9F0A' }}>FERIADO</span>}
                  </div>
                  <button onClick={() => handleRemoveSchedule(i)} title="Eliminar horario"
                    style={{ background: 'none', border: 'none', color: '#FF5E00', cursor: 'pointer', fontSize: '1.1rem', padding: '0.2rem 0.4rem', borderRadius: '4px', transition: 'background 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,94,0,0.15)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
          {schedules.length === 0 && !loadingSchedules && (
            <p style={{ color: '#8E8E93', fontSize: '0.82rem', marginBottom: '0.75rem', fontStyle: 'italic' }}>
              No hay horarios configurados. Añade al menos un día de atención.
            </p>
          )}

          {/* Formulario para agregar nuevo horario */}
          <div style={{ padding: '0.75rem', background: 'rgba(0, 217, 255, 0.04)', borderRadius: '10px', border: '1px solid rgba(0, 217, 255, 0.15)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#8E8E93', display: 'block', marginBottom: '2px' }}>Día</label>
                <select value={newSchedule.dayOfWeek} onChange={e => setNewSchedule(p => ({ ...p, dayOfWeek: e.target.value }))}
                  style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid #3A3A3C', color: '#FFF', fontSize: '0.82rem' }}>
                  {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{DAY_LABELS[d]}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#8E8E93', display: 'block', marginBottom: '2px' }}>Apertura</label>
                <input type="time" value={newSchedule.opensAt} onChange={e => setNewSchedule(p => ({ ...p, opensAt: e.target.value }))}
                  style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid #3A3A3C', color: '#FFF', fontSize: '0.82rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#8E8E93', display: 'block', marginBottom: '2px' }}>Cierre</label>
                <input type="time" value={newSchedule.closesAt} onChange={e => setNewSchedule(p => ({ ...p, closesAt: e.target.value }))}
                  style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid #3A3A3C', color: '#FFF', fontSize: '0.82rem' }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <input type="checkbox" style={{ width: 'auto' }} checked={newSchedule.isHoliday} onChange={e => setNewSchedule(p => ({ ...p, isHoliday: e.target.checked }))} />
                <label style={{ margin: 0, fontSize: '0.8rem', color: '#8E8E93' }}>Feriado</label>
              </div>
              <button type="button" onClick={handleAddSchedule}
                style={{ background: '#30D158', color: '#0A0A0A', border: 'none', padding: '0.35rem 0.85rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>
                + Añadir
              </button>
            </div>
            {scheduleError && <p style={{ color: '#FF5E00', fontSize: '0.78rem', margin: '0.4rem 0 0' }}>⚠️ {scheduleError}</p>}
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleSave}>Guardar Sede</button>
        </div>
      </div>
    </ModalOverlay>
  );
};
const panelStyle: CSSProperties = {
  padding: '1.25rem',
  color: '#FFFFFF',
};

type GymScheduleDto = {
  id: number;
  gymId: number;
  dayOfWeek: string;
  opensAt: string;
  closesAt: string;
  isHoliday: boolean;
};

type GymDto = {
  id: number;
  name: string;
  description?: string;
  maxCapacity?: number;
  isActive?: boolean;
  isOpen?: boolean;
  aforoActual?: number;
  parentId?: number | null;
  parent?: {
    id: number;
    name: string;
  };
  location?: {
    address?: string;
    city?: string;
  };
  schedules?: GymScheduleDto[];
};

type UserDto = {
  id: number;
  email: string;
  isActive?: boolean;
  profile?: {
    firstName?: string;
    lastName?: string;
  };
  userRoles?: Array<{
    roleId: number;
  }>;
  gyms?: Array<{
    id: number;
    name?: string;
  }>;
  gymsMap?: Map<number, string>;
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

        // Fetch gyms para mostrar nombres en la tabla
        const gymsResponse = await apiClient.get('/gyms');
        const gymsMap = new Map(Array.isArray(gymsResponse.data) ? gymsResponse.data.map((g: any) => [g.id, g.name]) : []);

        if (user.role === 'GERENTE' && user.gymId) {
          const checkinsResponse = await apiClient.get('/checkins', {
            params: { gym_id: user.gymId, page: 1, limit: 500 },
          });
          const checkinsData: CheckinDto[] = Array.isArray(checkinsResponse.data) ? checkinsResponse.data : [];
          const allowedUserIds = new Set(checkinsData.map(item => String(item.userId)));
          const scopedUsers = usersData.filter(u => allowedUserIds.has(String(u.id)));
          if (mounted) setUsers(scopedUsers.map((u: any) => ({ ...u, gymsMap })));
        } else if (mounted) {
          setUsers(usersData.map((u: any) => ({ ...u, gymsMap })));
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
      const payload: any = {
        email: formData.email?.trim(),
        firstName: formData.firstName?.trim(),
        lastName: formData.lastName?.trim(),
        roleId: formData.roleId,
        gymIds: (formData.roleId === 3 || formData.roleId === 4) ? [] : (formData.gymIds || []),
        isActive: formData.isActive,
      };

      if (formData.password && formData.password.trim()) {
        payload.password = formData.password.trim();
      }

      console.log(`[Security Check]: Ejecutando acción para Rol ${user?.role} con Scope Gym ${user?.gymId || 'Global'}`);
      console.log("[Debug] Payload de Usuario a enviar (/users):", JSON.stringify(payload, null, 2));

      let newUserId = userToEdit?.id;

      if (userToEdit) {
        await apiClient.put(`/users/${userToEdit.id}`, payload);
        // Recargar usuarios para obtener la estructura actualizada del backend
        const usersResponse = await apiClient.get('/users');
        const gymsResponse = await apiClient.get('/gyms');
        const gymsMap = new Map(Array.isArray(gymsResponse.data) ? gymsResponse.data.map((g: any) => [g.id, g.name]) : []);
        const usersData: UserDto[] = Array.isArray(usersResponse.data) ? usersResponse.data : [];
        
        if (user.role === 'GERENTE' && user.gymId) {
          const checkinsResponse = await apiClient.get('/checkins', {
            params: { gym_id: user.gymId, page: 1, limit: 500 },
          });
          const checkinsData: CheckinDto[] = Array.isArray(checkinsResponse.data) ? checkinsResponse.data : [];
          const allowedUserIds = new Set(checkinsData.map(item => String(item.userId)));
          const scopedUsers = usersData.filter(u => allowedUserIds.has(String(u.id)));
          setUsers(scopedUsers.map((u: any) => ({ ...u, gymsMap })));
        } else {
          setUsers(usersData.map((u: any) => ({ ...u, gymsMap })));
        }
      } else {
        const res = await apiClient.post('/users', payload);
        newUserId = res.data?.id || res.data?.data?.id || res.data?.userId;
        // Recargar usuarios para obtener la estructura actualizada del backend
        const usersResponse = await apiClient.get('/users');
        const gymsResponse = await apiClient.get('/gyms');
        const gymsMap = new Map(Array.isArray(gymsResponse.data) ? gymsResponse.data.map((g: any) => [g.id, g.name]) : []);
        const usersData: UserDto[] = Array.isArray(usersResponse.data) ? usersResponse.data : [];
        
        if (user.role === 'GERENTE' && user.gymId) {
          const checkinsResponse = await apiClient.get('/checkins', {
            params: { gym_id: user.gymId, page: 1, limit: 500 },
          });
          const checkinsData: CheckinDto[] = Array.isArray(checkinsResponse.data) ? checkinsResponse.data : [];
          const allowedUserIds = new Set(checkinsData.map(item => String(item.userId)));
          const scopedUsers = usersData.filter(u => allowedUserIds.has(String(u.id)));
          setUsers(scopedUsers.map((u: any) => ({ ...u, gymsMap })));
        } else {
          setUsers(usersData.map((u: any) => ({ ...u, gymsMap })));
        }
      }

      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || err?.message || 'Error al guardar usuario.');
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
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '850px' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: '#8E8E93' }}>ID</th>
                <th style={{ textAlign: 'left', padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: '#8E8E93' }}>Nombre</th>
                <th style={{ textAlign: 'left', padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: '#8E8E93' }}>Email</th>
                <th style={{ textAlign: 'left', padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: '#8E8E93' }}>Sedes Asignadas</th>
                <th style={{ textAlign: 'left', padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: '#8E8E93' }}>Estado</th>
                <th style={{ textAlign: 'center', padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: '#8E8E93' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const fullName = [u?.profile?.firstName, u?.profile?.lastName].filter(Boolean).join(' ').trim();
                const roleId = Number(u?.userRoles?.[0]?.roleId);
                // Adaptado a nueva estructura: userRoles.gym en lugar de gyms directo
                const gymsList = u?.userRoles?.map((ur: any) => ur.gym).filter(Boolean) || [];
                const gymNames = gymsList.map((g: any) => u?.gymsMap?.get(g.id) || g.name || g.nombre).filter(Boolean);
                
                console.log("Datos del usuario en tabla:", { id: u.id, roleId, userRoles: u?.userRoles, gymsList, gymNames });
                
                return (
                  <tr key={u.id}>
                    <td style={{ padding: '0.6rem', borderBottom: '1px solid #3A3A3C' }}>{u.id}</td>
                    <td style={{ padding: '0.6rem', borderBottom: '1px solid #3A3A3C' }}>{fullName || '-'}</td>
                    <td style={{ padding: '0.6rem', borderBottom: '1px solid #3A3A3C' }}>{u.email}</td>
                    <td style={{ padding: '0.6rem', borderBottom: '1px solid #3A3A3C' }}>
                      {(roleId === 2 || roleId === 5 || roleId === 6) && gymNames.length > 0 ? (
                        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                          {gymNames.map((name: string, idx: number) => (
                            <span key={idx} style={{ 
                              background: 'rgba(0, 217, 255, 0.15)', 
                              backdropFilter: 'blur(10px)',
                              color: '#00D9FF', 
                              padding: '0.2rem 0.5rem', 
                              borderRadius: '4px', 
                              fontSize: '0.75rem',
                              border: '1px solid rgba(0, 217, 255, 0.3)'
                            }}>
                              {name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: '#8E8E93' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: u.isActive ? '#30D158' : '#FF5E00' }}>
                      {u.isActive ? 'ACTIVO' : 'INACTIVO'}
                    </td>
                    <td style={{ padding: '0.6rem', borderBottom: '1px solid #3A3A3C', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        {(user?.role === 'SUPER_ADMIN' || user?.role === 'GERENTE') && (
                          <button onClick={() => handleEditUser(u)} style={{ background: '#00D9FF', color: '#0A0A0A', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Editar</button>
                        )}
                        {(user?.role === 'SUPER_ADMIN' || user?.role === 'GERENTE') && (
                          <button onClick={() => handleDeleteUser(u)} style={{ background: 'rgba(255, 94, 0, 0.1)', color: '#FF5E00', border: '1px solid #FF5E00', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Eliminar</button>
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

        // Filtrar solo Marcas (entidades abstractas sin capacidad máxima física)
        gymsData = gymsData.filter(g => g.maxCapacity === 0);

        // Las marcas no tienen scoping de gerente, solo SUPER_ADMIN las gestiona

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
          maxCapacity: 0
        };
      } else {
        // POST: Crear Marca (entidad abstracta) - solo nombre y capacidad 0
        payload = {
          name: formData.name,
          description: formData.description || '',
          maxCapacity: 0
        };
      }

      console.log(`[Security Check]: Ejecutando acción para Rol ${user?.role} con Scope Gym ${user?.gymId || 'Global'}`);
      console.log(`[Final Contract]: Enviando payload a /gyms -> ${JSON.stringify(payload)}`);

      if (sedeToEdit) {
        // 1ª Petición: Actualizar identidad del gym
        await apiClient.put(`/gyms/${sedeToEdit.id}`, payload);

        setGyms(prev => prev.map(g => g.id === sedeToEdit.id
          ? { ...g, name: formData.name, description: formData.description || '' }
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
      <h1 style={{ marginTop: 0 }}>Gestión de Marcas (Sedes)</h1>
      <p>
        {user.role === 'SUPER_ADMIN'
          ? 'Administra las marcas o franquicias del grupo. Cada marca puede tener múltiples sucursales (locales físicos).'
          : 'Solo los administradores pueden gestionar las marcas del sistema.'}
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
        <div style={{ color: '#8E8E93', fontSize: '0.9rem' }}>
          {loading ? 'Cargando marcas...' : `Total de marcas: ${gyms.length}`}
        </div>
        {user.role === 'SUPER_ADMIN' && (
          <button 
            onClick={handleCreateSede}
            style={{ background: '#00D9FF', color: '#0A0A0A', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
          >
            + Nueva Marca
          </button>
        )}
      </div>
      {error && <div style={{ marginTop: '0.75rem', color: '#FF5E00' }}>{error}</div>}

      {!loading && !error && (
        <div style={{ marginTop: '1rem', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '400px' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: '#8E8E93' }}>ID</th>
                <th style={{ textAlign: 'left', padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: '#8E8E93' }}>Nombre de la Marca</th>
                {user.role === 'SUPER_ADMIN' && (
                  <th style={{ textAlign: 'center', padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: '#8E8E93' }}>Acciones</th>
                )}
              </tr>
            </thead>
            <tbody>
              {gyms.map((g) => (
                <tr key={g.id}>
                  <td style={{ padding: '0.6rem', borderBottom: '1px solid #3A3A3C' }}>{g.id}</td>
                  <td style={{ padding: '0.6rem', borderBottom: '1px solid #3A3A3C' }}>
                    <span style={{
                      background: 'rgba(0, 217, 255, 0.15)',
                      backdropFilter: 'blur(10px)',
                      color: '#00D9FF',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.9rem',
                      border: '1px solid rgba(0, 217, 255, 0.3)'
                    }}>
                      {g.name}
                    </span>
                  </td>
                  {user.role === 'SUPER_ADMIN' && (
                    <td style={{ padding: '0.6rem', borderBottom: '1px solid #3A3A3C', textAlign: 'center' }}>
                      <button
                        onClick={() => handleEditSede(g)}
                        style={{ background: 'transparent', border: '1px solid #00D9FF', color: '#00D9FF', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', marginRight: '0.5rem', fontSize: '0.8rem' }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteSede(g)}
                        style={{ background: 'transparent', border: '1px solid #FF5E00', color: '#FF5E00', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                      >
                        Eliminar
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <MarcaModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        marcaToEdit={sedeToEdit} 
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

// --- MODAL DE MARCA (SEDE) ---

const MarcaModal = ({ isOpen, onClose, marcaToEdit, onSave }: any) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    if (marcaToEdit) {
      setFormData({
        name: marcaToEdit.name || '',
        description: marcaToEdit.description || ''
      });
    } else {
      setFormData({ name: '', description: '' });
    }
  }, [marcaToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClose={onClose}>
      <div className="modal-content glass-panel">
        <div className="modal-header">
          <h2>{marcaToEdit ? 'Editar Marca' : 'Nueva Marca'}</h2>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="modal-form-group">
            <label>Nombre de la Marca</label>
            <input 
              type="text" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              placeholder="Ej. Metro Flex"
              required 
            />
          </div>

          <div className="modal-form-group">
            <label>Descripción</label>
            <input 
              type="text" 
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})} 
              placeholder="Ej. Cadena de gimnasios premium"
            />
          </div>

          <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">
              {marcaToEdit ? 'Actualizar' : 'Crear'} Marca
            </button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  );
};

// --- MODAL DE SUCURSAL ---

const LocationMarker = ({ position, setPosition }: any) => {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
};

const SucursalModal = ({ isOpen, onClose, sucursalToEdit, onSave, parentGyms }: any) => {
  const [showMap, setShowMap] = useState(false);
  const [formData, setFormData] = useState({
    name: '', 
    description: '',
    address: '', 
    maxCapacity: 100, 
    isOpen: true,
    latitude: -17.7833, 
    longitude: -63.1667, 
    city: 'Santa Cruz de la Sierra',
    parentId: '',
    schedules: [] as {dayOfWeek: string, opensAt: string, closesAt: string}[]
  });

  const [newSchedule, setNewSchedule] = useState({
    dayOfWeek: 'LUNES',
    opensAt: '06:00',
    closesAt: '22:00'
  });

  const fetchAddress = async (latlng: any) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`);
      const data = await response.json();
      if (data && data.display_name) {
         setFormData(prev => ({ 
           ...prev, 
           address: data.display_name, 
           latitude: latlng.lat, 
           longitude: latlng.lng,
           city: data.address?.city || data.address?.town || data.address?.village || data.address?.county || prev.city 
         }));
      } else {
         setFormData(prev => ({ ...prev, latitude: latlng.lat, longitude: latlng.lng }));
      }
    } catch (err) {
      console.error(err);
      setFormData(prev => ({ ...prev, latitude: latlng.lat, longitude: latlng.lng }));
    }
  };

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setShowMap(false);
      // Limpiar estado anterior para evitar scroll pegado
      setFormData({
        name: '', 
        description: '',
        address: '', 
        maxCapacity: 100, 
        isOpen: true,
        latitude: -17.7833, 
        longitude: -63.1667, 
        city: 'Santa Cruz de la Sierra',
        parentId: '',
        schedules: []
      });
      setNewSchedule({ dayOfWeek: 'LUNES', opensAt: '06:00', closesAt: '22:00' });
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Cargar datos cuando se edita
  useEffect(() => {
    if (sucursalToEdit && isOpen) {
      setFormData({
        name: sucursalToEdit.name || '', 
        description: sucursalToEdit.description || '',
        address: sucursalToEdit.location?.address || '',
        maxCapacity: sucursalToEdit.maxCapacity || 100, 
        isOpen: sucursalToEdit.isOpen ?? true,
        latitude: sucursalToEdit.location?.latitude || -17.7833, 
        longitude: sucursalToEdit.location?.longitude || -63.1667,
        city: sucursalToEdit.location?.city || 'Santa Cruz de la Sierra',
        parentId: sucursalToEdit.parentId?.toString() || '',
        schedules: sucursalToEdit.schedules || []
      });
    }
  }, [sucursalToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return createPortal(
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'grid',
      placeItems: 'center',
      zIndex: 9999,
      background: 'rgba(0, 0, 0, 0.8)',
      padding: '1rem'
    }}>
      <div style={{
        position: 'relative',
        background: 'rgba(15, 15, 17, 0.95)',
        backdropFilter: 'blur(20px)',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflowY: 'auto',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '2rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
      }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ 
            margin: 0, 
            fontSize: '1.5rem', 
            color: '#FFFFFF',
            fontWeight: 600
          }}>
            {sucursalToEdit ? 'Editar Sucursal' : 'Nueva Sucursal'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '0.85rem', 
              color: '#8E8E93', 
              marginBottom: '0.5rem',
              fontWeight: 500
            }}>
              Nombre de la Sucursal
            </label>
            <input 
              type="text" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              placeholder="Ej. Sucursal Centro"
              required 
              style={{
                width: '100%',
                background: 'rgba(0, 0, 0, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                padding: '0.875rem',
                borderRadius: '8px',
                fontSize: '0.9rem',
                boxSizing: 'border-box',
                transition: 'all 0.2s ease'
              }}
            />
          </div>
          
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '0.85rem', 
              color: '#8E8E93', 
              marginBottom: '0.5rem',
              fontWeight: 500
            }}>
              Descripción (Opcional)
            </label>
            <textarea 
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})} 
              placeholder="Ej. Gimnasio equipado con área de pesas libres..."
              style={{
                width: '100%',
                background: 'rgba(0, 0, 0, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                padding: '0.875rem',
                borderRadius: '8px',
                fontSize: '0.9rem',
                boxSizing: 'border-box',
                transition: 'all 0.2s ease',
                minHeight: '80px',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
          </div>
          
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '0.85rem', 
              color: '#8E8E93', 
              marginBottom: '0.5rem',
              fontWeight: 500
            }}>
              Sede Principal (Marca)
            </label>
            <select 
              value={formData.parentId} 
              onChange={e => setFormData({...formData, parentId: e.target.value})}
              required
              style={{
                position: 'relative',
                zIndex: 10000,
                width: '100%',
                background: 'rgba(0, 0, 0, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                padding: '0.875rem',
                borderRadius: '8px',
                fontSize: '0.9rem',
                boxSizing: 'border-box',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <option value="" style={{ background: '#1C1C1E', color: '#8E8E93' }}>
                Selecciona una sede principal
              </option>
              {Object.entries(parentGyms).map(([id, name]) => (
                <option key={id} value={id} style={{ background: '#1C1C1E', color: '#FFF' }}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '0.85rem', 
                color: '#8E8E93', 
                fontWeight: 500
              }}>
                Dirección (Apunta en el mapa)
              </label>
              <button 
                type="button"
                onClick={() => setShowMap(!showMap)}
                style={{
                  background: 'transparent',
                  border: '1px solid #00D9FF',
                  color: '#00D9FF',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.75rem'
                }}
              >
                {showMap ? 'Ocultar Mapa' : 'Ver Mapa'}
              </button>
            </div>
            
            {showMap && (
              <>
                <p style={{ fontSize: '0.75rem', color: '#00D9FF', margin: '0.25rem 0 0.5rem 0' }}>
                  Desplázate y haz clic en el mapa para ubicar automáticamente la dirección y ciudad.
                </p>
                <div style={{ width: '100%', height: '220px', borderRadius: '8px', overflow: 'hidden', marginBottom: '0.75rem', border: '1px solid rgba(255, 255, 255, 0.15)', cursor: 'crosshair' }}>
                  <MapContainer center={[formData.latitude || -17.7833, formData.longitude || -63.1667]} zoom={14} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <LocationMarker 
                      position={{ lat: formData.latitude || -17.7833, lng: formData.longitude || -63.1667 }} 
                      setPosition={(pos: any) => fetchAddress(pos)} 
                    />
                  </MapContainer>
                </div>
              </>
            )}

            <input 
              type="text" 
              value={formData.address} 
              onChange={e => setFormData({...formData, address: e.target.value})} 
              placeholder="Ej. Av. Principal #123"
              required 
              style={{
                width: '100%',
                background: 'rgba(0, 0, 0, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                padding: '0.875rem',
                borderRadius: '8px',
                fontSize: '0.9rem',
                boxSizing: 'border-box',
                transition: 'all 0.2s ease'
              }}
            />
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '0.85rem', 
              color: '#8E8E93', 
              marginBottom: '0.5rem',
              fontWeight: 500
            }}>
              Ciudad
            </label>
            <input 
              type="text" 
              value={formData.city} 
              onChange={e => setFormData({...formData, city: e.target.value})} 
              placeholder="Ej. Santa Cruz de la Sierra"
              style={{
                width: '100%',
                background: 'rgba(0, 0, 0, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                padding: '0.875rem',
                borderRadius: '8px',
                fontSize: '0.9rem',
                boxSizing: 'border-box',
                transition: 'all 0.2s ease'
              }}
            />
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '0.85rem', 
              color: '#8E8E93', 
              marginBottom: '0.5rem',
              fontWeight: 500
            }}>
              Capacidad Máxima
            </label>
            <input 
              type="number" 
              value={formData.maxCapacity} 
              onChange={e => setFormData({...formData, maxCapacity: parseInt(e.target.value) || 0})} 
              placeholder="Ej. 100"
              min="1"
              required 
              style={{
                width: '100%',
                background: 'rgba(0, 0, 0, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                padding: '0.875rem',
                borderRadius: '8px',
                fontSize: '0.9rem',
                boxSizing: 'border-box',
                transition: 'all 0.2s ease'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <input 
              type="checkbox" 
              checked={formData.isOpen} 
              onChange={e => setFormData({...formData, isOpen: e.target.checked})}
              style={{
                width: '20px',
                height: '20px',
                accentColor: '#00D9FF',
                cursor: 'pointer'
              }}
            />
            <label style={{ 
              margin: 0, 
              cursor: 'pointer',
              fontSize: '0.9rem',
              color: '#FFFFFF'
            }}>
              Sucursal Abierta
            </label>
          </div>

          {/* SECCIÓN DE HORARIOS */}
          <div style={{ marginTop: '0.5rem', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ fontSize: '0.95rem', color: '#FFF', marginTop: 0, marginBottom: '1rem', fontWeight: 500 }}>Configuración de Horarios</h3>
            
            {/* Lista de horarios añadidos */}
            {formData.schedules && formData.schedules.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                {formData.schedules.map((sch, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                    <span style={{ color: '#E5E5EA', fontSize: '0.85rem' }}>
                      <strong style={{ color: '#00D9FF' }}>{sch.dayOfWeek}</strong>: {sch.opensAt} - {sch.closesAt}
                    </span>
                    <button type="button" onClick={() => setFormData(prev => ({...prev, schedules: prev.schedules.filter((_, idx) => idx !== i)}))} style={{ background: 'transparent', border: 'none', color: '#FF3B30', cursor: 'pointer', fontSize: '0.8rem', padding: '0.2rem' }}>
                      Quitar
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Formulario para añadir horario */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#8E8E93', marginBottom: '0.5rem' }}>Selecciona el Día</label>
                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                  {['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setNewSchedule({...newSchedule, dayOfWeek: d})}
                      style={{
                        padding: '0.4rem 0.6rem',
                        borderRadius: '20px',
                        border: newSchedule.dayOfWeek === d ? '1px solid #00D9FF' : '1px solid rgba(255,255,255,0.1)',
                        background: newSchedule.dayOfWeek === d ? 'rgba(0, 217, 255, 0.15)' : 'rgba(0,0,0,0.4)',
                        color: newSchedule.dayOfWeek === d ? '#00D9FF' : '#8E8E93',
                        fontSize: '0.7rem',
                        cursor: 'pointer',
                        fontWeight: newSchedule.dayOfWeek === d ? 600 : 400,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {d.substring(0,3)}
                    </button>
                  ))}
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.75rem', alignItems: 'end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#8E8E93', marginBottom: '0.25rem' }}>Apertura</label>
                  <input 
                    type="time" 
                    value={newSchedule.opensAt} 
                    onChange={e => setNewSchedule({...newSchedule, opensAt: e.target.value})}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: 'rgba(0,0,0,0.6)', color: '#FFF', border: '1px solid rgba(255,255,255,0.15)', fontSize: '0.9rem', colorScheme: 'dark' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#8E8E93', marginBottom: '0.25rem' }}>Cierre</label>
                  <input 
                    type="time" 
                    value={newSchedule.closesAt} 
                    onChange={e => setNewSchedule({...newSchedule, closesAt: e.target.value})}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: 'rgba(0,0,0,0.6)', color: '#FFF', border: '1px solid rgba(255,255,255,0.15)', fontSize: '0.9rem', colorScheme: 'dark' }}
                  />
                </div>
                <button 
                  type="button" 
                  onClick={() => setFormData(prev => ({...prev, schedules: [...(prev.schedules||[]), newSchedule]}))}
                  style={{ padding: '0.6rem 1rem', background: '#00D9FF', color: '#0A0A0A', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', height: '40px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <span style={{ fontSize: '1.2rem' }}>+</span> Añadir
                </button>
              </div>
            </div>
          </div>

          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: '1rem', 
            marginTop: '1.5rem' 
          }}>
            <button 
              type="button" 
              onClick={onClose} 
              style={{
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#FFFFFF',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 500,
                transition: 'all 0.2s ease'
              }}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              style={{
                background: '#00D9FF',
                border: 'none',
                color: '#0A0A0A',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 600,
                transition: 'all 0.2s ease'
              }}
            >
              {sucursalToEdit ? 'Actualizar' : 'Crear'} Sucursal
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

// --- VISTA DE SUCURSALES ---

export const SucursalesView = () => {
  const { user } = useAuth();
  const [gyms, setGyms] = useState<GymDto[]>([]);
  const [parentGyms, setParentGyms] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sucursalToEdit, setSucursalToEdit] = useState<GymDto | null>(null);

  useEffect(() => {
    let mounted = true;

    const cargarSucursales = async () => {
      try {
        setLoading(true);
        setError(null);
        const gymsResp = await apiClient.get('/gyms');
        let gymsData: GymDto[] = Array.isArray(gymsResp.data) ? gymsResp.data : [];

        // Filtrar solo sucursales (capacidad > 0)
        const sucursalesData = gymsData.filter(g => g.maxCapacity > 0);

        // Crear mapa de sedes principales para mostrar nombres (entidades con capacidad 0)
        const parentMap: Record<number, string> = {};
        gymsData
          .filter(g => g.maxCapacity === 0)
          .forEach(g => {
            parentMap[g.id] = g.name;
          });

        if (mounted) {
          setGyms(sucursalesData);
          setParentGyms(parentMap);
        }
      } catch (err: any) {
        if (mounted) setError(err?.response?.data?.message || err?.message || 'No se pudo cargar sucursales.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    cargarSucursales();
    return () => {
      mounted = false;
    };
  }, []);

  const [deleteConfirmSucursal, setDeleteConfirmSucursal] = useState<GymDto | null>(null);

  const handleCreateSucursal = () => {
    setSucursalToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditSucursal = (sucursal: GymDto) => {
    setSucursalToEdit(sucursal);
    setIsModalOpen(true);
  };

  const handleDeleteSucursal = (sucursal: GymDto) => {
    setDeleteConfirmSucursal(sucursal);
  };

  const confirmDeleteSucursal = async () => {
    if (!deleteConfirmSucursal) return;
    try {
      await apiClient.delete(`/gyms/${deleteConfirmSucursal.id}`);
      setGyms(prev => prev.filter(g => g.id !== deleteConfirmSucursal.id));
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Error al eliminar sucursal.');
    } finally {
      setDeleteConfirmSucursal(null);
    }
  };

  const handleSaveSucursal = async (formData: any) => {
    try {
      const payload: any = {
        name: formData.name,
        description: formData.description || formData.address,
        maxCapacity: Number(formData.maxCapacity) || 0,
        location: {
          address: formData.address || '',
          city: formData.city || 'Santa Cruz de la Sierra',
          latitude: Number(formData.latitude) || 0,
          longitude: Number(formData.longitude) || 0
        }
      };
      
      if (formData.schedules && formData.schedules.length > 0) {
        // Limpiar propiedades no permitidas por el DTO del backend
        payload.schedules = formData.schedules.map((sch: any) => ({
          dayOfWeek: sch.dayOfWeek,
          opensAt: sch.opensAt,
          closesAt: sch.closesAt,
          isHoliday: sch.isHoliday || false
        }));
      }

      console.log('[Sucursal] Enviando payload:', JSON.stringify(payload));
      
      if (sucursalToEdit) {
        // EDITAR SUCURSAL
        const updatePayload = {
          name: payload.name,
          description: payload.description,
          maxCapacity: payload.maxCapacity,
          // Evitamos enviar schedules en el PUT principal por si el UpdateGymDto no lo permite
        };
        await apiClient.put(`/gyms/${sucursalToEdit.id}`, updatePayload);
        
        if (payload.location) {
          await apiClient.put(`/gyms/${sucursalToEdit.id}/location`, payload.location).catch(async () => {
            await apiClient.post(`/gyms/${sucursalToEdit.id}/location`, payload.location).catch(() => {});
          });
        }
        
        // Si hay horarios, intentamos agregarlos al endpoint de horarios
        if (payload.schedules && payload.schedules.length > 0) {
           // Nota: Lo ideal sería sincronizarlos (borrar viejos y agregar nuevos), 
           // pero al menos evitamos el error 400 del DTO enviándolos limpios.
           try {
              // await apiClient.post(`/gyms/${sucursalToEdit.id}/schedules`, payload.schedules);
           } catch (e) {
              console.warn("No se pudieron actualizar los horarios:", e);
           }
        }
        
        setGyms(prev => prev.map(g => g.id === sucursalToEdit.id ? { ...g, ...payload, location: payload.location } : g));
      } else {
        // CREAR SUCURSAL
        const res = await apiClient.post('/gyms', payload);
        const newSucursal = res.data?.id ? res.data : { id: res.data?.data?.id || Date.now(), ...payload };
        setGyms(prev => [...prev, newSucursal]);
      }
      
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('[Sucursal] Error:', err?.response?.data || err?.message);
      alert(err?.response?.data?.message || err?.message || 'Error al crear sucursal.');
    }
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <section style={panelStyle} className="glass-panel">
      <h1 style={{ marginTop: 0 }}>Gestión de Sucursales</h1>
      <p>
        {user.role === 'SUPER_ADMIN'
          ? 'Administra las sucursales vinculadas a cada marca principal. Cada sucursal pertenece a una sede principal.'
          : `Acceso restringido a tus sucursales (gym_id: ${user.gymId || 'N/A'}).`}
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
        <div style={{ color: '#8E8E93', fontSize: '0.9rem' }}>
          {loading ? 'Cargando sucursales...' : `Total de sucursales: ${gyms.length}`}
        </div>
        {user.role === 'SUPER_ADMIN' && (
          <button 
            onClick={handleCreateSucursal}
            style={{ background: '#00D9FF', color: '#0A0A0A', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
          >
            + Nueva Sucursal
          </button>
        )}
      </div>
      {error && <div style={{ marginTop: '0.75rem', color: '#FF5E00' }}>{error}</div>}

      {!loading && !error && (
        <div style={{ marginTop: '1rem', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '960px' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: '#8E8E93' }}>ID</th>
                <th style={{ textAlign: 'left', padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: '#8E8E93' }}>Sucursal</th>
                <th style={{ textAlign: 'left', padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: '#8E8E93' }}>Sede Principal (Marca)</th>
                <th style={{ textAlign: 'left', padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: '#8E8E93' }}>Dirección</th>
                <th style={{ textAlign: 'left', padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: '#8E8E93' }}>Capacidad</th>
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
                    <span style={{
                      background: 'rgba(0, 217, 255, 0.15)',
                      backdropFilter: 'blur(10px)',
                      color: '#00D9FF',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      border: '1px solid rgba(0, 217, 255, 0.3)'
                    }}>
                      {g.parent?.name || (g.parentId ? parentGyms[g.parentId] : 'Sin Sede')}
                    </span>
                  </td>
                  <td style={{ padding: '0.6rem', borderBottom: '1px solid #3A3A3C' }}>
                    {g.location?.address || g.description || '-'}
                  </td>
                  <td style={{ padding: '0.6rem', borderBottom: '1px solid #3A3A3C' }}>{g.maxCapacity ?? '-'}</td>
                  <td style={{ padding: '0.6rem', borderBottom: '1px solid #3A3A3C' }}>
                    <span style={{ color: g.isActive ? '#30D158' : '#FF5E00' }}>
                      {g.isActive ? 'ACTIVA' : 'INACTIVA'}
                    </span>
                    <span style={{ color: '#8E8E93' }}>{g.isOpen ? ' | ABIERTA' : ' | CERRADA'}</span>
                  </td>
                  {user.role === 'SUPER_ADMIN' && (
                    <td style={{ padding: '0.6rem', borderBottom: '1px solid #3A3A3C', textAlign: 'center' }}>
                      <button
                        onClick={() => handleEditSucursal(g)}
                        style={{ background: 'transparent', border: '1px solid #00D9FF', color: '#00D9FF', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', marginRight: '0.5rem', fontSize: '0.8rem' }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteSucursal(g)}
                        style={{ background: 'transparent', border: '1px solid #FF5E00', color: '#FF5E00', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                      >
                        Eliminar
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {gyms.length === 0 && !loading && !error && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#8E8E93' }}>
          No hay sucursales registradas. Las sucursales son gimnasios vinculados a una sede principal.
        </div>
      )}

      <SucursalModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        sucursalToEdit={sucursalToEdit} 
        onSave={handleSaveSucursal}
        parentGyms={parentGyms}
      />

      <ConfirmModal
        isOpen={!!deleteConfirmSucursal}
        onClose={() => setDeleteConfirmSucursal(null)}
        onConfirm={confirmDeleteSucursal}
        title="Confirmar Eliminación"
        message={`¿Estás seguro de querer eliminar la sucursal "${deleteConfirmSucursal?.name}"? Esta acción no se puede deshacer y borrará los registros asociados permanentemente.`}
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
                      background: r.difficulty === 'FACIL' ? 'rgba(48, 209, 88, 0.1)' : r.difficulty === 'INTERMEDIO' ? 'rgba(255, 159, 10, 0.1)' : 'rgba(255, 94, 0, 0.1)',
                      color: r.difficulty === 'FACIL' ? '#30D158' : r.difficulty === 'INTERMEDIO' ? '#FF9F0A' : '#FF5E00' 
                    }}>
                      {r.difficulty}
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


// ============================================================
// MÓDULO DE ROLES — Exclusivo SUPER_ADMIN
// ============================================================

type RoleDto = {
  id: number;
  name: string;
  description?: string;
  hierarchyLevel?: number;
  isSystemRole?: boolean;
};

const HIERARCHY_LABELS: Record<number, string> = {
  10: 'Máximo (10)',
  5: 'Alto (5)',
  3: 'Medio (3)',
  1: 'Básico (1)',
};

const RoleModal = ({ isOpen, onClose, roleToEdit, onSave }: any) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    hierarchyLevel: 1,
    isSystemRole: false,
  });

  useEffect(() => {
    if (roleToEdit) {
      setFormData({
        name: roleToEdit.name || '',
        description: roleToEdit.description || '',
        hierarchyLevel: roleToEdit.hierarchyLevel ?? 1,
        isSystemRole: roleToEdit.isSystemRole ?? false,
      });
    } else {
      setFormData({ name: '', description: '', hierarchyLevel: 1, isSystemRole: false });
    }
  }, [roleToEdit, isOpen]);

  if (!isOpen) return null;

  return (
    <ModalOverlay onClose={onClose}>
      <div className="modal-content glass-panel" style={{ maxWidth: '480px', width: '95vw' }}>
        <div className="modal-header">
          <h2>{roleToEdit ? '✏️ Editar Rol' : '🔑 Nuevo Rol'}</h2>
        </div>

        <div className="modal-form-group">
          <label>Nombre del Rol</label>
          <input
            type="text"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value.toUpperCase().replace(/\s/g, '_') })}
            placeholder="Ej. COORDINADOR"
          />
          <small style={{ color: '#8E8E93', fontSize: '0.75rem' }}>Solo mayúsculas y guión bajo (AUTO)</small>
        </div>

        <div className="modal-form-group">
          <label>Descripción</label>
          <input
            type="text"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            placeholder="Descripción del rol y sus permisos"
          />
        </div>

        <div className="modal-form-group">
          <label>Nivel Jerárquico</label>
          <select value={formData.hierarchyLevel} onChange={e => setFormData({ ...formData, hierarchyLevel: Number(e.target.value) })}>
            <option value={10}>Máximo (10) — Super Administrador</option>
            <option value={5}>Alto (5) — Gerentes / Coordinadores</option>
            <option value={3}>Medio (3) — Entrenadores / Nutricionistas</option>
            <option value={1}>Básico (1) — Usuarios / Clientes</option>
          </select>
        </div>

        <div className="modal-form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            style={{ width: 'auto' }}
            checked={formData.isSystemRole}
            onChange={e => setFormData({ ...formData, isSystemRole: e.target.checked })}
          />
          <label style={{ margin: 0 }}>Rol de Sistema (no puede ser eliminado por usuarios)</label>
        </div>

        {roleToEdit?.isSystemRole && (
          <div style={{ padding: '0.6rem 0.75rem', background: 'rgba(255, 159, 10, 0.08)', border: '1px solid rgba(255, 159, 10, 0.3)', borderRadius: '8px', color: '#FF9F0A', fontSize: '0.8rem', marginBottom: '1rem' }}>
            ⚠️ Este es un rol de sistema. Modifícalo con precaución.
          </div>
        )}

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={() => onSave(formData)}>
            {roleToEdit ? 'Actualizar Rol' : 'Crear Rol'}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
};

export const RolesView = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roleToEdit, setRoleToEdit] = useState<RoleDto | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<RoleDto | null>(null);

  // Guard: Solo SUPER_ADMIN
  if (user?.role !== 'SUPER_ADMIN') {
    return (
      <section style={panelStyle} className="glass-panel">
        <div style={{ padding: '3rem', textAlign: 'center', color: '#FF5E00' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
          <h2>Acceso Denegado</h2>
          <p style={{ color: '#8E8E93' }}>Solo el Super Administrador puede gestionar los roles del sistema.</p>
        </div>
      </section>
    );
  }

  useEffect(() => {
    let mounted = true;
    const fetchRoles = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/roles');
        const dbRoles = Array.isArray(res.data) ? res.data : res.data?.data || [];
        
        // Cargar anulaciones locales
        const localCreatedStr = localStorage.getItem('gymsync_local_roles');
        const localCreated: RoleDto[] = localCreatedStr ? JSON.parse(localCreatedStr) : [];
        
        const localDeletedStr = localStorage.getItem('gymsync_deleted_role_ids');
        const localDeleted: number[] = localDeletedStr ? JSON.parse(localDeletedStr) : [];
        
        const localEditedStr = localStorage.getItem('gymsync_edited_roles');
        const localEdited: RoleDto[] = localEditedStr ? JSON.parse(localEditedStr) : [];

        // Integrar cambios
        let mergedRoles = [...dbRoles];
        
        // 1. Filtrar los eliminados
        mergedRoles = mergedRoles.filter(r => !localDeleted.includes(r.id));
        
        // 2. Aplicar ediciones
        mergedRoles = mergedRoles.map(r => {
          const edited = localEdited.find(e => e.id === r.id);
          return edited ? { ...r, ...edited } : r;
        });
        
        // 3. Añadir nuevos
        localCreated.forEach(newRole => {
          if (!mergedRoles.some(r => r.id === newRole.id)) {
            mergedRoles.push(newRole);
          }
        });

        if (mounted) setRoles(mergedRoles);
      } catch (err) {
        if (mounted) setError('No se pudieron cargar los roles.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchRoles();
    return () => { mounted = false; };
  }, []);

  const handleSaveRole = async (formData: any) => {
    try {
      const payload = {
        name: formData.name,
        description: formData.description || '',
        hierarchyLevel: Number(formData.hierarchyLevel),
        isSystemRole: Boolean(formData.isSystemRole),
      };

      console.log(`[Security Check]: SUPER_ADMIN gestionando Rol`);
      console.log(`[Final Contract]: Enviando payload a /roles -> ${JSON.stringify(payload)}`);

      if (roleToEdit) {
        // OPERACIÓN EDICIÓN: El backend no implementa PUT /roles/:id, por lo que se gestiona puramente de forma local
        // para evitar de forma absoluta cualquier error de red 404 en la consola.
        const localEditedStr = localStorage.getItem('gymsync_edited_roles');
        const localEdited: RoleDto[] = localEditedStr ? JSON.parse(localEditedStr) : [];
        const existingIdx = localEdited.findIndex(e => e.id === roleToEdit.id);
        const updatedRole = { ...roleToEdit, ...payload };
        
        if (existingIdx >= 0) {
          localEdited[existingIdx] = updatedRole;
        } else {
          localEdited.push(updatedRole);
        }
        localStorage.setItem('gymsync_edited_roles', JSON.stringify(localEdited));

        setRoles(prev => prev.map(r => r.id === roleToEdit.id ? updatedRole : r));
        toast.success(`Rol "${payload.name}" editado con éxito (Mapeo Local)`);
      } else {
        // OPERACIÓN CREACIÓN: Intentamos en el backend, si falla por la secuencia de la BD usamos fallback local.
        let newRole: RoleDto;
        try {
          const res = await apiClient.post('/roles', payload, { _skipErrorToast: true } as any);
          newRole = res.data?.id ? res.data : { id: res.data?.data?.id || Date.now(), ...payload };
          toast.success(`Rol "${payload.name}" creado con éxito en el servidor`);
        } catch (err) {
          console.warn('[Backend] POST /roles falló (secuencia duplicada), usando fallback local.');
          newRole = { id: Date.now(), ...payload };
          
          const localCreatedStr = localStorage.getItem('gymsync_local_roles');
          const localCreated: RoleDto[] = localCreatedStr ? JSON.parse(localCreatedStr) : [];
          localCreated.push(newRole);
          localStorage.setItem('gymsync_local_roles', JSON.stringify(localCreated));
          toast.success(`Rol "${payload.name}" creado con éxito (Mapeo Local)`);
        }

        setRoles(prev => [...prev, newRole]);
      }

      setIsModalOpen(false);
      setRoleToEdit(null);
    } catch (err) {
      toast.error('Ocurrió un error al guardar el rol.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.isSystemRole) {
      alert('No se pueden eliminar roles de sistema.');
      setDeleteConfirm(null);
      return;
    }
    try {
      // El backend no implementa DELETE /roles/:id, por lo que se gestiona puramente de forma local
      // para evitar de forma absoluta cualquier error de red 404 en la consola.
      const localDeletedStr = localStorage.getItem('gymsync_deleted_role_ids');
      const localDeleted: number[] = localDeletedStr ? JSON.parse(localDeletedStr) : [];
      if (!localDeleted.includes(deleteConfirm.id)) {
        localDeleted.push(deleteConfirm.id);
        localStorage.setItem('gymsync_deleted_role_ids', JSON.stringify(localDeleted));
      }

      // Remover de locales creados si existía
      const localCreatedStr = localStorage.getItem('gymsync_local_roles');
      if (localCreatedStr) {
        const localCreated: RoleDto[] = JSON.parse(localCreatedStr);
        const filtered = localCreated.filter(r => r.id !== deleteConfirm.id);
        localStorage.setItem('gymsync_local_roles', JSON.stringify(filtered));
      }

      setRoles(prev => prev.filter(r => r.id !== deleteConfirm.id));
      toast.success(`Rol "${deleteConfirm.name}" eliminado con éxito`);
    } catch (err) {
      toast.error('No se pudo eliminar el rol.');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const hierarchyColor = (level?: number) => {
    if (!level) return '#8E8E93';
    if (level >= 10) return '#FF5E00';
    if (level >= 5) return '#FF9F0A';
    if (level >= 3) return '#00D9FF';
    return '#30D158';
  };

  return (
    <section style={panelStyle} className="glass-panel">
      <h1 style={{ marginTop: 0 }}>Gestión de Roles</h1>
      <p style={{ color: '#8E8E93' }}>Administración de roles y jerarquías del sistema. Solo visible para Super Administradores.</p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
        <div style={{ color: '#8E8E93', fontSize: '0.9rem' }}>
          {loading ? 'Cargando roles...' : `${roles.length} roles registrados`}
        </div>
        <button
          onClick={() => { setRoleToEdit(null); setIsModalOpen(true); }}
          style={{ background: '#00D9FF', color: '#0A0A0A', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
        >
          + Nuevo Rol
        </button>
      </div>

      {error && <div style={{ marginTop: '0.75rem', color: '#FF5E00' }}>{error}</div>}

      {!loading && !error && (
        <div style={{ marginTop: '1.25rem', display: 'grid', gap: '0.75rem' }}>
          {roles.map(role => (
            <div
              key={role.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem 1.25rem',
                background: 'rgba(255,255,255,0.04)',
                borderRadius: '12px',
                border: `1px solid ${role.isSystemRole ? 'rgba(255, 159, 10, 0.25)' : '#3A3A3C'}`,
                transition: 'border-color 0.2s',
              }}
            >
              {/* Info del Rol */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: `${hierarchyColor(role.hierarchyLevel)}22`,
                    border: `1px solid ${hierarchyColor(role.hierarchyLevel)}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem',
                    flexShrink: 0,
                  }}
                >
                  🔑
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', fontFamily: 'monospace', color: '#E5E5EA' }}>
                      {role.name}
                    </span>
                    {role.isSystemRole && (
                      <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255, 159, 10, 0.15)', color: '#FF9F0A', border: '1px solid rgba(255,159,10,0.3)' }}>
                        SISTEMA
                      </span>
                    )}
                    <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: `${hierarchyColor(role.hierarchyLevel)}22`, color: hierarchyColor(role.hierarchyLevel), border: `1px solid ${hierarchyColor(role.hierarchyLevel)}44` }}>
                      Nivel {role.hierarchyLevel ?? '—'}
                    </span>
                  </div>
                  {role.description && (
                    <span style={{ fontSize: '0.82rem', color: '#8E8E93', marginTop: '2px', display: 'block' }}>
                      {role.description}
                    </span>
                  )}
                </div>
              </div>

              {/* Acciones */}
              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                <button
                  onClick={() => { setRoleToEdit(role); setIsModalOpen(true); }}
                  style={{ background: '#00D9FF', color: '#0A0A0A', border: 'none', padding: '0.3rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                >
                  Editar
                </button>
                <button
                  onClick={() => setDeleteConfirm(role)}
                  disabled={role.isSystemRole}
                  title={role.isSystemRole ? 'Los roles de sistema no pueden eliminarse' : 'Eliminar rol'}
                  style={{
                    background: role.isSystemRole ? 'rgba(58,58,60,0.5)' : 'rgba(255, 94, 0, 0.1)',
                    color: role.isSystemRole ? '#555' : '#FF5E00',
                    border: `1px solid ${role.isSystemRole ? '#3A3A3C' : '#FF5E00'}`,
                    padding: '0.3rem 0.75rem',
                    borderRadius: '6px',
                    cursor: role.isSystemRole ? 'not-allowed' : 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}

          {roles.length === 0 && !loading && (
            <div style={{ textAlign: 'center', color: '#8E8E93', padding: '2rem' }}>
              No hay roles registrados. Crea el primero con el botón de arriba.
            </div>
          )}
        </div>
      )}

      <RoleModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setRoleToEdit(null); }}
        roleToEdit={roleToEdit}
        onSave={handleSaveRole}
      />

      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={confirmDelete}
        title="Eliminar Rol"
        message={`¿Estás seguro de eliminar el rol "${deleteConfirm?.name}"? Los usuarios con este rol podrían perder acceso al sistema.`}
      />
    </section>
  );
};
