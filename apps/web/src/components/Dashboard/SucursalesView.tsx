import React, { useState, useEffect, useCallback, useRef, useLayoutEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import type { CSSProperties } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../infrastructure/api.config';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow });
import { ModalOverlay, ConfirmModal, panelStyle, RecordDetailModal, DetailField } from './Shared/DashboardShared';
import type { GymDto, GymScheduleDto, UserDto, CheckinDto, ScheduleEntry } from './Shared/DashboardTypes';

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

const HOURS_24_S   = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES_15_S = ['00', '15', '30', '45'];

const TimeSelect = ({ value, onChange, disabled = false }: {
  value: string; onChange: (v: string) => void; disabled?: boolean;
}) => {
  const parts = (value || '').split(':');
  const h = parts[0]?.padStart(2, '0') ?? '08';
  const m = parts[1]?.substring(0, 2) ?? '00';

  const sel: React.CSSProperties = {
    background: 'transparent', color: disabled ? '#636366' : '#E5E5EA',
    border: 'none', padding: '0.5rem 0.4rem',
    fontSize: '0.9rem', fontFamily: 'monospace', fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    outline: 'none', appearance: 'none', WebkitAppearance: 'none',
    textAlign: 'center' as const,
  };

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '1px',
      background: disabled ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.6)',
      border: `1px solid ${disabled ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.15)'}`,
      borderRadius: '8px', overflow: 'hidden', opacity: disabled ? 0.5 : 1,
      width: '100%',
    }}>
      <select value={h} onChange={e => !disabled && onChange(`${e.target.value}:${m}`)} disabled={disabled} style={sel}>
        {HOURS_24_S.map(hh => <option key={hh} value={hh} style={{ background: '#1C1C1E' }}>{hh}</option>)}
      </select>
      <span style={{ color: '#8E8E93', fontWeight: 700, fontSize: '0.9rem', userSelect: 'none' }}>:</span>
      <select value={m} onChange={e => !disabled && onChange(`${h}:${e.target.value}`)} disabled={disabled} style={sel}>
        {MINUTES_15_S.map(mm => <option key={mm} value={mm} style={{ background: '#1C1C1E' }}>{mm}</option>)}
      </select>
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

  const reloadSchedules = useCallback(async () => {
    if (!gymToEdit?.id) return;
    try {
      const res = await apiClient.get(`/gyms/${gymToEdit.id}/schedules`);
      const data = Array.isArray(res.data) ? res.data : [];
      setSchedules(data.map((s: any) => ({
        id: s.id,
        dayOfWeek: s.dayOfWeek,
        opensAt: s.opensAt?.slice(0, 5),
        closesAt: s.closesAt?.slice(0, 5),
        isHoliday: s.isHoliday ?? false,
      })));
    } catch {
      toast.error('Error al refrescar horarios.');
    }
  }, [gymToEdit?.id]);

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
      try {
        await apiClient.post(`/gyms/${gymToEdit.id}/schedules`, {
          dayOfWeek: newSchedule.dayOfWeek, opensAt: newSchedule.opensAt, closesAt: newSchedule.closesAt, isHoliday: newSchedule.isHoliday,
        });
        toast.success(`Horario ${DAY_LABELS[newSchedule.dayOfWeek]} agregado`);
        await reloadSchedules();
        return;
      } catch { toast.error('Error al agregar horario en el servidor.'); return; }
    }
    setSchedules(prev => [...prev, entry]);
  };

  const handleRemoveSchedule = async (idx: number) => {
    const item = schedules[idx];
    if (isEditing && item.id) {
      try {
        await apiClient.delete(`/gyms/schedules/${item.id}`);
        toast.success('Horario eliminado');
        await reloadSchedules();
        return;
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
                <TimeSelect value={newSchedule.opensAt} onChange={v => setNewSchedule(p => ({ ...p, opensAt: v }))} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#8E8E93', display: 'block', marginBottom: '2px' }}>Cierre</label>
                <TimeSelect value={newSchedule.closesAt} onChange={v => setNewSchedule(p => ({ ...p, closesAt: v }))} />
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
    schedules: [] as {dayOfWeek: string, opensAt: string, closesAt: string, isHoliday?: boolean}[]
  });

  const [newSchedule, setNewSchedule] = useState({
    dayOfWeek: 'LUNES',
    opensAt: '06:00',
    closesAt: '22:00',
    isHoliday: false
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

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.setAttribute('data-modal-open', 'true');
      setShowMap(false);
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
      setNewSchedule({ dayOfWeek: 'LUNES', opensAt: '06:00', closesAt: '22:00', isHoliday: false });
    } else {
      document.body.style.overflow = 'unset';
      document.body.removeAttribute('data-modal-open');
    }

    return () => {
      document.body.style.overflow = 'unset';
      document.body.removeAttribute('data-modal-open');
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
        parentId: sucursalToEdit.parentId?.toString() || sucursalToEdit.parent?.id?.toString() || '',
        schedules: []
      });
      // Cargar horarios reales desde el backend
      apiClient.get(`/gyms/${sucursalToEdit.id}/schedules`).then(res => {
        const data = Array.isArray(res.data) ? res.data : [];
        setFormData(prev => ({
          ...prev,
          schedules: data.map((s: any) => ({
            id: s.id,
            dayOfWeek: s.dayOfWeek,
            opensAt: s.opensAt?.slice(0, 5) || '06:00',
            closesAt: s.closesAt?.slice(0, 5) || '22:00',
            isHoliday: s.isHoliday ?? false,
          }))
        }));
      }).catch(() => {});
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
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 0.75rem', borderRadius: '6px', border: sch.isHoliday ? '1px solid rgba(255, 59, 48, 0.3)' : 'none' }}>
                    <span style={{ color: '#E5E5EA', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <strong style={{ color: '#00D9FF' }}>{sch.dayOfWeek}</strong>: 
                      {sch.isHoliday ? (
                        <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255, 59, 48, 0.15)', color: '#FF3B30', fontWeight: 600 }}>FERIADO / CERRADO</span>
                      ) : (
                        `${sch.opensAt} - ${sch.closesAt}`
                      )}
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
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#8E8E93', marginBottom: '0.25rem' }}>Apertura</label>
                  <TimeSelect
                    value={newSchedule.opensAt}
                    onChange={v => setNewSchedule({...newSchedule, opensAt: v})}
                    disabled={newSchedule.isHoliday}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#8E8E93', marginBottom: '0.25rem' }}>Cierre</label>
                  <TimeSelect
                    value={newSchedule.closesAt}
                    onChange={v => setNewSchedule({...newSchedule, closesAt: v})}
                    disabled={newSchedule.isHoliday}
                  />
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }} onClick={() => setNewSchedule({...newSchedule, isHoliday: !newSchedule.isHoliday})}>
                  <input 
                    type="checkbox" 
                    checked={newSchedule.isHoliday}
                    onChange={e => setNewSchedule({...newSchedule, isHoliday: e.target.checked})}
                    onClick={e => e.stopPropagation()}
                    style={{ width: '18px', height: '18px', accentColor: '#00D9FF', cursor: 'pointer' }}
                  />
                  <label style={{ margin: 0, fontSize: '0.8rem', color: '#E5E5EA', cursor: 'pointer' }}>Día Feriado / Cerrado</label>
                </div>
                
                <button 
                  type="button" 
                  onClick={() => {
                    const schToAdd = {
                      ...newSchedule,
                      opensAt: newSchedule.isHoliday ? '00:00' : newSchedule.opensAt,
                      closesAt: newSchedule.isHoliday ? '00:00' : newSchedule.closesAt
                    };
                    setFormData(prev => ({...prev, schedules: [...(prev.schedules||[]), schToAdd]}));
                    setNewSchedule(prev => ({ ...prev, isHoliday: false }));
                  }}
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
  const [viewingSucursal, setViewingSucursal] = useState<GymDto | null>(null);

  // ── Filtros ──
  const [search,        setSearch]        = useState('');
  const [filterParent,  setFilterParent]  = useState('');
  const [filterEstado,  setFilterEstado]  = useState<'all' | 'activa' | 'inactiva' | 'abierta' | 'cerrada'>('all');
  const [sortOrder,     setSortOrder]     = useState<'az' | 'za' | 'cap_asc' | 'cap_desc'>('az');

  // Opciones de sedes ordenadas A→Z
  const parentOptions = useMemo(() =>
    Object.entries(parentGyms)
      .map(([id, name]) => ({ id: Number(id), name }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    [parentGyms]
  );

  const filteredSucursales = useMemo(() => {
    const term = search.trim().toLowerCase();
    return gyms
      .filter(g => {
        if (term && !g.name.toLowerCase().includes(term) && !(g.location?.address ?? g.description ?? '').toLowerCase().includes(term)) return false;
        if (filterParent && String(g.parentId ?? g.parent?.id ?? '') !== filterParent) return false;
        if (filterEstado === 'activa'   && !g.isActive)  return false;
        if (filterEstado === 'inactiva' &&  g.isActive)  return false;
        if (filterEstado === 'abierta'  && !g.isOpen)    return false;
        if (filterEstado === 'cerrada'  &&  g.isOpen)    return false;
        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'az') return a.name.localeCompare(b.name);
        if (sortOrder === 'za') return b.name.localeCompare(a.name);
        if (sortOrder === 'cap_asc')  return (a.maxCapacity ?? 0) - (b.maxCapacity ?? 0);
        return (b.maxCapacity ?? 0) - (a.maxCapacity ?? 0);
      });
  }, [gyms, search, filterParent, filterEstado, sortOrder]);

  const hasFilters = search || filterParent || filterEstado !== 'all' || sortOrder !== 'az';
  const resetFilters = () => { setSearch(''); setFilterParent(''); setFilterEstado('all'); setSortOrder('az'); };

  useEffect(() => {
    let mounted = true;

    const cargarSucursales = async () => {
      try {
        setLoading(true);
        setError(null);
        const [gymsResp, brandsResp] = await Promise.all([
          apiClient.get('/gyms'),
          apiClient.get('/gyms/brands'),
        ]);
        const gymsData: GymDto[]   = Array.isArray(gymsResp.data)   ? gymsResp.data   : [];
        const brandsData: GymDto[] = Array.isArray(brandsResp.data) ? brandsResp.data : [];

        // Sucursales = todo lo que devuelve /gyms (parentId IS NOT NULL)
        const sucursalesData = gymsData;

        // Mapa de marcas desde /gyms/brands
        const parentMap: Record<number, string> = {};
        brandsData.forEach(g => { parentMap[g.id] = g.name; });

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
    const nameToDelete = deleteConfirmSucursal.name;
    try {
      await apiClient.delete(`/gyms/${deleteConfirmSucursal.id}`);
      toast.success(`Sucursal "${nameToDelete}" eliminada`);
      await recargarSucursales();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Error al eliminar sucursal.');
    } finally {
      setDeleteConfirmSucursal(null);
    }
  };

  /** Re-carga la lista completa de sucursales y el mapa de sedes desde el servidor */
  const recargarSucursales = async () => {
    const [gymsResp, brandsResp] = await Promise.all([
      apiClient.get('/gyms'),
      apiClient.get('/gyms/brands'),
    ]);
    const gymsData: GymDto[]   = Array.isArray(gymsResp.data)   ? gymsResp.data   : [];
    const brandsData: GymDto[] = Array.isArray(brandsResp.data) ? brandsResp.data : [];
    const sucursalesData = gymsData;
    const parentMap: Record<number, string> = {};
    brandsData.forEach(g => { parentMap[g.id] = g.name; });
    setGyms(sucursalesData);
    setParentGyms(parentMap);
  };

  const handleSaveSucursal = async (formData: any) => {
    try {
      const payload: any = {
        name: formData.name,
        description: formData.description || formData.address,
        maxCapacity: Number(formData.maxCapacity) || 0,
        parentId: Number(formData.parentId) || null,
        location: {
          address: formData.address || '',
          city: formData.city || 'Santa Cruz de la Sierra',
          latitude: Number(formData.latitude) || 0,
          longitude: Number(formData.longitude) || 0,
        },
      };

      const schedulesPayload = (formData.schedules ?? []).map((sch: any) => ({
        dayOfWeek: sch.dayOfWeek,
        opensAt: sch.isHoliday ? '00:00' : sch.opensAt,
        closesAt: sch.isHoliday ? '00:00' : sch.closesAt,
        isHoliday: sch.isHoliday || false,
      }));

      if (sucursalToEdit) {
        // ── EDITAR: datos principales ────────────────────────────────────────
        await apiClient.put(`/gyms/${sucursalToEdit.id}`, {
          name: payload.name,
          description: payload.description,
          maxCapacity: payload.maxCapacity,
          parentId: payload.parentId,
        });

        // Ubicación (intenta PUT, fallback a POST)
        if (payload.location) {
          await apiClient.put(`/gyms/${sucursalToEdit.id}/location`, payload.location)
            .catch(async () => {
              await apiClient.post(`/gyms/${sucursalToEdit.id}/location`, payload.location).catch(() => {});
            });
        }

        // Sincronizar horarios (borrar todos y recrear)
        try {
          const existingRes = await apiClient.get(`/gyms/${sucursalToEdit.id}/schedules`);
          const existing: any[] = Array.isArray(existingRes.data) ? existingRes.data : [];
          await Promise.allSettled(existing.map(s => apiClient.delete(`/gyms/schedules/${s.id}`)));
        } catch {}

        if (schedulesPayload.length > 0) {
          await Promise.allSettled(
            schedulesPayload.map((sch: any) =>
              apiClient.post(`/gyms/${sucursalToEdit.id}/schedules`, sch)
            )
          );
        }

        // Re-fetch completo para reflejar parentId + parent.name correctamente
        await recargarSucursales();
        toast.success(`Sucursal "${payload.name}" actualizada correctamente`);

      } else {
        // ── CREAR SUCURSAL ────────────────────────────────────────────────────
        if (schedulesPayload.length > 0) payload.schedules = schedulesPayload;
        await apiClient.post('/gyms', payload);

        // Re-fetch para obtener el ID real del servidor y el parent completo
        await recargarSucursales();
        toast.success(`Sucursal "${payload.name}" creada correctamente`);
      }

      setIsModalOpen(false);
    } catch (err: any) {
      console.error('[Sucursal] Error:', err?.response?.data || err?.message);
      // El interceptor de apiClient ya muestra el toast de error — no duplicar.
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

      {/* ── Barra de filtros ── */}
      {!loading && !error && gyms.length > 0 && (
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '0.85rem' }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍  Buscar por nombre o dirección..."
            style={{ flex: 1, minWidth: '200px', background: '#1C1C1E', color: '#E5E5EA', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '0.5rem 0.9rem', fontSize: '0.85rem', outline: 'none' }}
          />
          {/* Sede principal */}
          {parentOptions.length > 0 && (
            <div style={{ position: 'relative' }}>
              <select value={filterParent} onChange={e => setFilterParent(e.target.value)}
                style={{ background: '#1C1C1E', color: '#E5E5EA', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '0.5rem 2rem 0.5rem 0.9rem', fontSize: '0.85rem', appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer', outline: 'none', maxWidth: '175px' }}>
                <option value="" style={{ background: '#1C1C1E' }}>Todas las marcas</option>
                {parentOptions.map(p => <option key={p.id} value={p.id} style={{ background: '#1C1C1E' }}>{p.name}</option>)}
              </select>
              <span style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#8E8E93', fontSize: '0.7rem' }}>▼</span>
            </div>
          )}
          {/* Estado */}
          <div style={{ position: 'relative' }}>
            <select value={filterEstado} onChange={e => setFilterEstado(e.target.value as any)}
              style={{ background: '#1C1C1E', color: '#E5E5EA', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '0.5rem 2rem 0.5rem 0.9rem', fontSize: '0.85rem', appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer', outline: 'none' }}>
              <option value="all"      style={{ background: '#1C1C1E' }}>Todos los estados</option>
              <option value="activa"   style={{ background: '#1C1C1E' }}>Solo Activas</option>
              <option value="inactiva" style={{ background: '#1C1C1E' }}>Solo Inactivas</option>
              <option value="abierta"  style={{ background: '#1C1C1E' }}>Solo Abiertas</option>
              <option value="cerrada"  style={{ background: '#1C1C1E' }}>Solo Cerradas</option>
            </select>
            <span style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#8E8E93', fontSize: '0.7rem' }}>▼</span>
          </div>
          {/* Orden */}
          <div style={{ position: 'relative' }}>
            <select value={sortOrder} onChange={e => setSortOrder(e.target.value as any)}
              style={{ background: '#1C1C1E', color: '#E5E5EA', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '0.5rem 2rem 0.5rem 0.9rem', fontSize: '0.85rem', appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer', outline: 'none' }}>
              <option value="az"       style={{ background: '#1C1C1E' }}>Nombre A → Z</option>
              <option value="za"       style={{ background: '#1C1C1E' }}>Nombre Z → A</option>
              <option value="cap_asc"  style={{ background: '#1C1C1E' }}>Capacidad ↑</option>
              <option value="cap_desc" style={{ background: '#1C1C1E' }}>Capacidad ↓</option>
            </select>
            <span style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#8E8E93', fontSize: '0.7rem' }}>▼</span>
          </div>
          {hasFilters && (
            <button onClick={resetFilters}
              style={{ background: 'none', color: '#8E8E93', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.45rem 0.85rem', cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
              ✕ Limpiar
            </button>
          )}
        </div>
      )}
      {!loading && !error && gyms.length > 0 && (
        <div style={{ color: '#8E8E93', fontSize: '0.8rem', margin: '0.5rem 0' }}>
          {filteredSucursales.length === gyms.length ? `${gyms.length} sucursales` : `${filteredSucursales.length} de ${gyms.length} sucursales`}
        </div>
      )}

      {!loading && !error && (
        <div style={{ marginTop: '0.25rem', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '960px' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: '#8E8E93' }}>ID</th>
                <th style={{ textAlign: 'left', padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: '#8E8E93' }}>Sucursal</th>
                <th style={{ textAlign: 'left', padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: '#8E8E93' }}>Sede Principal (Marca)</th>
                <th style={{ textAlign: 'left', padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: '#8E8E93' }}>Dirección</th>
                <th style={{ textAlign: 'left', padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: '#8E8E93' }}>Capacidad</th>
                <th style={{ textAlign: 'left', padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: '#8E8E93' }}>Estado</th>
                <th style={{ textAlign: 'center', padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: '#8E8E93' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredSucursales.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#8E8E93' }}>
                  {gyms.length === 0 ? 'No hay sucursales registradas.' : 'Sin resultados para los filtros aplicados.'}
                </td></tr>
              ) : filteredSucursales.map((g) => (
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
                  <td style={{ padding: '0.6rem', borderBottom: '1px solid #3A3A3C', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}>
                      <button
                        onClick={async () => {
                          try {
                            const res = await apiClient.get(`/gyms/${g.id}/schedules`);
                            setViewingSucursal({ ...g, schedules: Array.isArray(res.data) ? res.data : [] });
                          } catch {
                            setViewingSucursal(g);
                          }
                        }}
                        style={{ background: 'rgba(0, 217, 255, 0.1)', border: '1px solid rgba(0, 217, 255, 0.3)', color: '#00D9FF', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                        title="Ver detalles de la sucursal"
                      >
                        👁️ Detalle
                      </button>
                      {user.role === 'SUPER_ADMIN' && (
                        <>
                          <button
                            onClick={() => handleEditSucursal(g)}
                            style={{ background: 'transparent', border: '1px solid #00D9FF', color: '#00D9FF', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteSucursal(g)}
                            style={{ background: 'transparent', border: '1px solid #FF5E00', color: '#FF5E00', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                          >
                            Eliminar
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

      <RecordDetailModal
        isOpen={!!viewingSucursal}
        onClose={() => setViewingSucursal(null)}
        title="Detalle de la Sucursal"
      >
        <DetailField label="ID de Registro" value={viewingSucursal?.id} />
        <DetailField label="Nombre de Sucursal" value={viewingSucursal?.name} />
        
        <DetailField 
          label="Sede Principal (Marca)" 
          value={viewingSucursal?.parent?.name || (viewingSucursal?.parentId ? parentGyms[viewingSucursal.parentId] : 'Sin Sede Vinculada')} 
        />
        <DetailField 
          label="Capacidad Máxima" 
          value={`${viewingSucursal?.maxCapacity || '0'} personas`} 
        />

        <DetailField label="Dirección Física" value={viewingSucursal?.location?.address || viewingSucursal?.description} isFullWidth />
        
        <DetailField label="Ciudad" value={viewingSucursal?.location?.city || 'Santa Cruz de la Sierra'} />
        <DetailField 
          label="Coordenadas Geográficas" 
          value={
            (viewingSucursal as any)?.location?.latitude 
              ? `${(viewingSucursal as any).location.latitude}, ${(viewingSucursal as any).location.longitude}` 
              : 'Sin coordenadas'
          } 
        />

        <DetailField 
          label="Estado Administrativo" 
          value={
            <span style={{ color: viewingSucursal?.isActive ? '#30D158' : '#FF5E00', fontWeight: 700 }}>
              {viewingSucursal?.isActive ? '● ACTIVA' : '● INACTIVA'}
            </span>
          } 
        />
        <DetailField 
          label="Estado de Puertas" 
          value={
            <span style={{ color: viewingSucursal?.isOpen ? '#00D9FF' : '#8E8E93', fontWeight: 700 }}>
              {viewingSucursal?.isOpen ? '🚪 ABIERTA AL PÚBLICO' : '🔒 CERRADA'}
            </span>
          } 
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: 'span 2', marginTop: '0.5rem', background: 'rgba(255, 255, 255, 0.03)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <span style={{ fontSize: '0.7rem', color: '#8E8E93', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Horarios de Atención</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.5rem', marginTop: '0.25rem' }}>
            {viewingSucursal?.schedules && viewingSucursal.schedules.length > 0 ? (
              viewingSucursal.schedules.map((sch: any, i: number) => (
                <div key={i} style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '0.5rem', borderRadius: '6px', border: sch.isHoliday ? '1px solid rgba(255, 94, 0, 0.2)' : '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ color: '#00D9FF', fontWeight: 600, fontSize: '0.75rem' }}>{sch.dayOfWeek}</div>
                  <div style={{ color: sch.isHoliday ? '#FF5E00' : '#FFFFFF', fontSize: '0.8rem', fontFamily: 'monospace', marginTop: '2px' }}>
                    {sch.isHoliday ? 'FERIADO' : `${sch.opensAt?.slice(0,5)} - ${sch.closesAt?.slice(0,5)}`}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: '#8E8E93', fontSize: '0.8rem', fontStyle: 'italic', gridColumn: 'span 2' }}>No hay horarios registrados para esta sucursal.</div>
            )}
          </div>
        </div>
      </RecordDetailModal>
    </section>
  );
};

// --- MODULO DE RUTINAS ---
