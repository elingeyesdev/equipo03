import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { reservationsApi } from '../../infrastructure/AxiosReservationsApi.adapter';
import { apiClient } from '../../infrastructure/api.config';
import { activitiesApi } from '../../infrastructure/AxiosActivitiesApi.adapter';
import { DB_ROLES } from '../../config/rbac.constants';
import type { Reservation } from '../../infrastructure/Reservations.types';
import type { GymActivityListItem } from '../../infrastructure/activities.types';
import type { UserDto } from '../Dashboard/Shared/DashboardTypes';
import type { InstructorOption } from '../Dashboard/Activities/activities.types';
import { ActivityDetailView } from '../Dashboard/Activities/ActivityDetailView';
import { QrScannerModal } from './QrScannerModal';
import { RecordDetailModal, DetailField } from '../Dashboard/Shared/DashboardShared';
import './ReservasView.css';
import toast from 'react-hot-toast';

function unwrapApiList(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data != null && typeof data === 'object') {
    const o = data as Record<string, unknown>;
    const nested = o.data;
    if (Array.isArray(nested)) return nested;
    if (nested != null && typeof nested === 'object' && Array.isArray((nested as Record<string, unknown>).data)) {
      return (nested as { data: unknown[] }).data;
    }
  }
  return [];
}

/** Clases CSS existentes: confirmed | cancelled | used | pending */
function statusToBadgeClass(status: unknown): string {
  const u = String(status ?? '').toLowerCase();
  if (u === 'confirmed' || u === 'confirmada') return 'confirmed';
  if (u === 'cancelled' || u === 'cancelada') return 'cancelled';
  if (u === 'used' || u === 'usada') return 'used';
  if (u === 'pending') return 'pending';
  return 'pending';
}

export const ReservasView = () => {
  const { user } = useAuth();
  const isStaffReservasView = user?.role === 'GERENTE';

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterGym, setFilterGym] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Control de modales
  const [showScanner, setShowScanner] = useState(false);
  const [scannedReservation, setScannedReservation] = useState<Reservation | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [viewingReservation, setViewingReservation] = useState<Reservation | null>(null);

  /** Programación de horarios (solo GERENTE con sede asignada). */
  const [gerenteActivities, setGerenteActivities] = useState<GymActivityListItem[]>([]);
  const [gerenteInstructors, setGerenteInstructors] = useState<InstructorOption[]>([]);
  const [gerenteProgLoading, setGerenteProgLoading] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState<string>('');

  // Usa roleId numérico de WebUser (Paso 1) — no depende de strings ni comparaciones mixtas
  const isGerente = user?.roleId === DB_ROLES.GERENTE;
  const isCliente = user?.roleId === DB_ROLES.CLIENTE;

  const loadGerenteProgramming = useCallback(async () => {
    if (!isGerente || user?.gymId == null || String(user.gymId).trim() === '') {
      setGerenteActivities([]);
      setGerenteInstructors([]);
      setSelectedActivityId('');
      return;
    }
    const gymId = Number(user.gymId);
    setGerenteProgLoading(true);
    try {
      const [acts, usersRes] = await Promise.all([
        activitiesApi.getActivities(gymId),
        apiClient.get('/users'),
      ]);
      const rawUsers = unwrapApiList(usersRes.data) as UserDto[];
      const instructors: InstructorOption[] = rawUsers
        .filter((u) => {
          const rid = Number(u.userRoles?.[0]?.roleId ?? 0);
          return rid === DB_ROLES.ENTRENADOR && u.isActive !== false;
        })
        .map((u) => {
          const fn = u.profile?.firstName ?? '';
          const ln = u.profile?.lastName ?? '';
          const name = `${fn} ${ln}`.trim() || u.email || `Usuario ${u.id}`;
          return { id: u.id, label: `${name} (${u.email})` };
        });
      setGerenteActivities(acts);
      setGerenteInstructors(instructors);
    } catch (e) {
      console.error(e);
      toast.error('No se pudieron cargar actividades o instructores.');
      setGerenteActivities([]);
      setGerenteInstructors([]);
    } finally {
      setGerenteProgLoading(false);
    }
  }, [isGerente, user?.gymId]);

  useEffect(() => {
    loadGerenteProgramming();
  }, [loadGerenteProgramming]);

  const selectedActivity = useMemo(
    () => gerenteActivities.find((a) => String(a.id) === selectedActivityId),
    [gerenteActivities, selectedActivityId],
  );

  const loadReservations = useCallback(async () => {
    setLoading(true);
    const selectedGymId = isGerente && user?.gymId ? Number(user.gymId) : (filterGym ? Number(filterGym) : undefined);
    const data = await reservationsApi.getReservations({
      status: filterStatus || undefined,
      gymId: selectedGymId,
    });
    let sorted = [...data].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Filtrado de seguridad en frontend como capa adicional
    if (isGerente && user?.gymId) {
      sorted = sorted.filter(res => res.gymActivitySchedule?.gymActivity?.gymId === Number(user.gymId));
    } else if (isCliente && user?.id) {
      // user.id es number (WebUser.id) — comparación estricta con res.userId
      sorted = sorted.filter(res => res.userId === user.id);
    }

    setReservations(sorted);
    setLoading(false);
    setCurrentPage(1);
  }, [filterStatus, filterGym, isGerente, isCliente, user?.gymId, user?.id]);

  useEffect(() => { loadReservations(); }, [loadReservations]);

  const gymOptions = useMemo(() => {
    const uniqueGyms = new Map<number, string>();
    reservations.forEach((res) => {
      const gymId = res.gymActivitySchedule?.gymActivity?.gymId;
      if (!gymId) return;
      const gymName = res.gymActivitySchedule?.gymActivity?.gym?.name || `Sede #${gymId}`;
      if (!uniqueGyms.has(gymId)) uniqueGyms.set(gymId, gymName);
    });
    return Array.from(uniqueGyms.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [reservations]);

  // ── Filtro por Nombre o CI ─────────────────────────────────
  const filteredData = reservations.filter(res => {
    const q = searchTerm.toLowerCase();
    const name = res.user?.profile?.fullName?.toLowerCase() || '';
    const ci = res.user?.profile?.ci?.toLowerCase() || '';
    return name.includes(q) || ci.includes(q);
  });

  // ── Paginado ───────────────────────────────────────────────
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const pagedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ── Acciones ──────────────────────────────────────────────
  const handleCancel = async (id: number) => {
    if (!window.confirm('¿Cancelar esta reserva? Esta acción no se puede deshacer.')) return;
    try {
      setActionLoading(id);
      const cancelled = await reservationsApi.cancelReservation(id);
      if (!cancelled) {
        toast.error('No se pudo cancelar la reserva.');
        return;
      }
      toast.success('Reserva cancelada correctamente.');
      await loadReservations();
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      toast.error('Ocurrió un error al cancelar la reserva.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAccept = async (res: Reservation) => {
    // Ya no usamos confirm si viene del scanner, o podemos usar un modal más premium
    try {
      setActionLoading(res.id);
      const result = await reservationsApi.acceptReservation(res.id, res.userId, res.gymActivitySchedule?.gymActivity?.gymId ?? 0);
      if (result.success) {
        toast.success(`¡Entrada confirmada para ${res.user?.profile?.fullName || 'el usuario'}!`);
        await loadReservations();
      } else {
        toast.error(`Error al aceptar: ${result.error}`);
      }
    } catch (error) {
      console.error('Error accepting reservation:', error);
      toast.error('No se pudo aceptar la entrada.');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Post-escaneo: mostrar modal de confirmación ────────────
  const handleScanned = (reservation: Reservation) => {
    setScannedReservation(reservation);
  };

  const handleAcceptScanned = async () => {
    if (!scannedReservation) return;
    await handleAccept(scannedReservation);
    setScannedReservation(null);
  };

  return (
    <div className="reservas-view">

      {isGerente && user?.gymId != null && String(user.gymId).trim() !== '' && (
        <section className="gerente-activities-panel glass-panel" aria-label="Programación de actividades">
          <h2 className="gerente-activities-title">Programación de actividades</h2>
          <p className="gerente-activities-hint">
            Crea horarios para las clases de tu sede. Los conflictos de instructor u horario de apertura se indican con un mensaje claro.
          </p>
          {gerenteProgLoading ? (
            <p className="gerente-activities-muted">Cargando actividades e instructores…</p>
          ) : (
            <>
              <label className="gerente-activities-select-wrap">
                <span className="gerente-activities-label">Actividad</span>
                <select
                  value={selectedActivityId}
                  onChange={(e) => setSelectedActivityId(e.target.value)}
                  className="filter-select gerente-activities-select"
                >
                  <option value="">Selecciona una actividad…</option>
                  {gerenteActivities.map((a) => (
                    <option key={a.id} value={String(a.id)}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </label>
              {gerenteActivities.length === 0 && (
                <p className="gerente-activities-muted">No hay actividades disponibles para esta sede.</p>
              )}
              {selectedActivity && (
                <ActivityDetailView
                  activity={selectedActivity}
                  instructors={gerenteInstructors}
                  onRefreshActivities={loadGerenteProgramming}
                />
              )}
            </>
          )}
        </section>
      )}

      {/* ── Scanner Modal ── */}
      {showScanner && (
        <QrScannerModal
          onClose={() => setShowScanner(false)}
          onScanned={handleScanned}
        />
      )}

      {/* ── Modal de confirmación post-escaneo ── */}
      {scannedReservation && (
        <div className="qr-modal-overlay" onClick={() => setScannedReservation(null)}>
          <div className="confirm-card premium" onClick={e => e.stopPropagation()}>
            <div className="confirm-header">
              <div className="status-badge-valid">USUARIO VALIDADO</div>
              <button className="close-btn" onClick={() => setScannedReservation(null)}>✕</button>
            </div>
            
            <div className="confirm-icon-wrapper">
              <div className="check-ring" />
              <span className="check-icon">✅</span>
            </div>

            <div className="confirm-content">
              <h3 className="confirm-name">
                {scannedReservation.user?.profile?.fullName || 
                 (scannedReservation.user?.profile?.firstName ? `${scannedReservation.user.profile.firstName} ${scannedReservation.user.profile.lastName || ''}` : 
                 scannedReservation.user?.profile?.first_name ? `${scannedReservation.user.profile.first_name} ${scannedReservation.user.profile.last_name || ''}` : 
                 'Usuario')}
              </h3>
              <p className="confirm-email">{scannedReservation.user?.email}</p>
              
              <div className="confirm-details-box">
                <div className="detail-item">
                  <span className="label">Actividad</span>
                  <span className="value">{scannedReservation.gymActivitySchedule?.gymActivity?.name}</span>
                </div>
                <div className="detail-row">
                  <div className="detail-item">
                    <span className="label">Horario</span>
                    <span className="value">{scannedReservation.gymActivitySchedule?.startTime?.substring(0, 5)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Fecha</span>
                    <span className="value">{scannedReservation.reservationDate}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="confirm-actions">
              <button 
                className="btn-confirm-accept-premium" 
                onClick={handleAcceptScanned}
                disabled={actionLoading === scannedReservation.id}
              >
                {actionLoading === scannedReservation.id ? 'Confirmando...' : 'Aceptar Entrada'}
              </button>
              <button className="btn-confirm-cancel-text" onClick={() => setScannedReservation(null)}>
                Descartar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Cabecera ── */}
      <div className="view-header">
        <div>
          <h1 className="view-title">{isStaffReservasView ? 'Gestión de Reservas' : 'Mis reservas'}</h1>
          <p className="view-subtitle">
            {isStaffReservasView
              ? 'Historial de las últimas reservas realizadas'
              : 'Tus reservas confirmadas y pasadas'}
          </p>
        </div>

        <div className="view-filters">
          {isStaffReservasView && (
            <button className="btn-scan-qr" onClick={() => setShowScanner(true)}>
              📷 Escanear QR
            </button>
          )}

          <div className="search-box">
            <input
              type="text"
              placeholder="Buscar por Nombre o CI..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="filter-input-search"
            />
            <span className="search-icon">🔍</span>
          </div>

          {!isGerente && (
            <select value={filterGym} onChange={e => setFilterGym(e.target.value)} className="filter-select">
              <option value="">Sede: Todas</option>
              <option value="1">Smart Fit</option>
              <option value="2">Premier</option>
              <option value="3">Bio Fitness</option>
            </select>
          )}

          {isStaffReservasView && (
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="filter-select">
              <option value="">Estado: Todos</option>
              <option value="CONFIRMED">Confirmadas</option>
              <option value="USED">Usadas</option>
              <option value="CANCELLED">Canceladas</option>
            </select>
          )}

          <button onClick={loadReservations} className="btn-refresh" title="Refrescar">🔄</button>
        </div>
      </div>

      {/* ── Tabla ── */}
      <div className="data-grid-container">
        {loading ? (
          <div className="loading-state">Cargando registros...</div>
        ) : (
          <>
            <div className="data-grid-scroll">
              <table className="data-grid">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Carnet (CI)</th>
                  <th>Actividad</th>
                  <th>Sede</th>
                  <th>Horario</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'center', minWidth: '220px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pagedData.map(res => {
                  const isLoading = actionLoading === res.id;
                  const statusUpper = String(res.status ?? '').toUpperCase();
                  const isConfirmed =
                    statusUpper === 'CONFIRMED' || statusUpper === 'CONFIRMADA';
                  return (
                    <tr key={res.id}>
                      <td>
                        <div className="cell-user">
                          <div className="user-avatar-mini">
                            {(res.user?.profile?.fullName || res.user?.profile?.firstName || res.user?.email || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div className="user-info-mini">
                            <span className="name">
                              {res.user?.profile?.fullName || 
                               (res.user?.profile?.firstName ? `${res.user.profile.firstName} ${res.user.profile.lastName || ''}` : 
                               res.user?.profile?.first_name ? `${res.user.profile.first_name} ${res.user.profile.last_name || ''}` : 
                               'Usuario')}
                            </span>
                            <span className="email">{res.user?.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="cell-ci">{res.user?.profile?.ci || '—'}</td>
                      <td className="cell-activity">{res.gymActivitySchedule?.gymActivity?.name || '—'}</td>
                      <td>{res.gymActivitySchedule?.gymActivity?.gym?.name || `Sede #${res.gymActivitySchedule?.gymActivity?.gymId}`}</td>
                      <td>
                        <div className="cell-time">
                          <span className="time">{res.gymActivitySchedule?.startTime?.substring(0, 5)}</span>
                          <span className="date">{res.reservationDate}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge-status ${statusToBadgeClass(res.status)}`}>
                          {res.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-group">
                          {/* Detalle */}
                          <button
                            className="btn-action"
                            style={{ background: 'rgba(0, 217, 255, 0.1)', border: '1px solid rgba(0, 217, 255, 0.3)', color: '#00D9FF', borderRadius: '6px', padding: '0.4rem', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '36px' }}
                            title="Ver detalle completo de reserva"
                            onClick={() => setViewingReservation(res)}
                            disabled={isLoading}
                          >
                            👁️
                          </button>

                          {/* Escanear QR — siempre disponible */}
                          <button
                            className="btn-action btn-action-scan"
                            title="Escanear QR de este usuario"
                            onClick={() => setShowScanner(true)}
                            disabled={isLoading}
                          >
                            📷
                          </button>

                          {/* Aceptar — solo para CONFIRMED */}
                          <button
                            className="btn-action btn-action-accept"
                            title="Aceptar entrada"
                            onClick={() => handleAccept(res)}
                            disabled={!isConfirmed || isLoading}
                          >
                            {isLoading ? '⏳' : '✅'}
                          </button>

                          {/* Cancelar — solo para CONFIRMED */}
                          <button
                            className="btn-action btn-action-cancel-icon"
                            title="Cancelar reserva"
                            onClick={() => handleCancel(res.id)}
                            disabled={!isConfirmed || isLoading}
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              </table>
            </div>

            {/* ── Pager ── */}
            {totalPages > 1 && (
              <div className="pager">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="pager-btn">
                  Anterior
                </button>
                <span className="pager-info">Página <strong>{currentPage}</strong> de {totalPages}</span>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="pager-btn">
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}

        {filteredData.length === 0 && !loading && (
          <div className="empty-state">
            {reservations.length === 0
              ? 'No hay reservas registradas para estos filtros.'
              : 'No hay coincidencias para la búsqueda actual.'}
          </div>
        )}
      </div>

      <RecordDetailModal
        isOpen={!!viewingReservation}
        onClose={() => setViewingReservation(null)}
        title="Detalle Completo de Reserva"
      >
        <DetailField label="ID de Reserva" value={viewingReservation?.id} />
        <DetailField 
          label="Estado de Reserva" 
          value={
            <span className={`badge-status ${(viewingReservation?.status || '').toLowerCase()}`} style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '12px', fontWeight: 700, fontSize: '0.75rem' }}>
              {viewingReservation?.status}
            </span>
          } 
        />

        <DetailField label="Cliente" value={viewingReservation?.user?.profile?.fullName || 'No especificado'} />
        <DetailField label="Carnet de Identidad (CI)" value={viewingReservation?.user?.profile?.ci || 'Sin registrar'} />
        <DetailField label="Correo del Cliente" value={viewingReservation?.user?.email} isFullWidth />

        <DetailField label="Actividad Deportiva" value={viewingReservation?.gymActivitySchedule?.gymActivity?.name || '-'} />
        <DetailField label="Gimnasio / Sede" value={viewingReservation?.gymActivitySchedule?.gymActivity?.gym?.name || '-'} />
        
        <DetailField label="Fecha Reservada" value={viewingReservation?.reservationDate} />
        <DetailField 
          label="Horario de Actividad" 
          value={
            viewingReservation?.gymActivitySchedule?.startTime 
              ? `${viewingReservation.gymActivitySchedule.startTime.substring(0, 5)} - ${viewingReservation.gymActivitySchedule.endTime?.substring(0, 5) || ''}` 
              : '-'
          } 
        />

        <DetailField 
          label="Fecha de Registro (Creación)" 
          isFullWidth 
          value={viewingReservation?.createdAt ? new Date(viewingReservation.createdAt).toLocaleString('es-ES') : '-'} 
        />

        {viewingReservation?.qrToken && (
          <DetailField 
            label="Token de Seguridad QR" 
            isFullWidth 
            value={
              <code style={{ wordBreak: 'break-all', background: 'rgba(0,0,0,0.4)', padding: '0.4rem 0.6rem', borderRadius: '6px', color: '#00D9FF', fontSize: '0.8rem', display: 'block', border: '1px solid rgba(0, 217, 255, 0.1)' }}>
                {viewingReservation.qrToken}
              </code>
            } 
          />
        )}
      </RecordDetailModal>
    </div>
  );
};
