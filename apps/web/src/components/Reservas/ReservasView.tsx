import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { reservationsApi } from '../../infrastructure/AxiosReservationsApi.adapter';
import { DB_ROLES } from '../../config/rbac.constants';
import type { Reservation } from '../../infrastructure/Reservations.types';
import { QrScannerModal } from './QrScannerModal';
import { RecordDetailModal, DetailField } from '../Dashboard/Shared/DashboardShared';
import './ReservasView.css';

export const ReservasView = () => {
  const { user } = useAuth();
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

  // Usa roleId numérico de WebUser (Paso 1) — no depende de strings ni comparaciones mixtas
  const isGerente = user?.roleId === DB_ROLES.GERENTE;
  const isCliente = user?.roleId === DB_ROLES.CLIENTE;

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
    setActionLoading(id);
    await reservationsApi.cancelReservation(id);
    setActionLoading(null);
    loadReservations();
  };

  const handleAccept = async (res: Reservation) => {
    if (!window.confirm(`¿Confirmar entrada de ${res.user?.profile?.fullName || 'este usuario'}?`)) return;
    setActionLoading(res.id);
    const result = await reservationsApi.acceptReservation(res.id, res.userId, res.gymActivitySchedule?.gymActivity?.gymId ?? 0);
    setActionLoading(null);
    if (result.success) {
      loadReservations();
    } else {
      alert(`Error al aceptar: ${result.error}`);
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
              <div className="status-badge-valid">QR VÁLIDO</div>
              <button className="close-btn" onClick={() => setScannedReservation(null)}>✕</button>
            </div>
            
            <div className="confirm-icon-wrapper">
              <div className="check-ring" />
              <span className="check-icon">✅</span>
            </div>

            <div className="confirm-content">
              <h3 className="confirm-name">{scannedReservation.user?.profile?.fullName || 'Usuario'}</h3>
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
          <h1 className="view-title">Gestión de Reservas</h1>
          <p className="view-subtitle">Historial de las últimas reservas realizadas</p>
        </div>

        <div className="view-filters">
          <button className="btn-scan-qr" onClick={() => setShowScanner(true)}>
            📷 Escanear QR
          </button>

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

          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="filter-select">
            <option value="">Estado: Todos</option>
            <option value="CONFIRMED">Confirmadas</option>
            <option value="USED">Usadas</option>
            <option value="CANCELLED">Canceladas</option>
          </select>

          <button onClick={loadReservations} className="btn-refresh" title="Refrescar">🔄</button>
        </div>
      </div>

      {/* ── Tabla ── */}
      <div className="data-grid-container">
        {loading ? (
          <div className="loading-state">Cargando registros...</div>
        ) : (
          <>
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
                  const isConfirmed = res.status === 'CONFIRMED';
                  return (
                    <tr key={res.id}>
                      <td>
                        <div className="cell-user">
                          <div className="user-avatar-mini">
                            {res.user?.profile?.fullName?.charAt(0) || 'U'}
                          </div>
                          <div className="user-info-mini">
                            <span className="name">{res.user?.profile?.fullName || 'Usuario'}</span>
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
                        <span className={`badge-status ${res.status.toLowerCase()}`}>
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

        {reservations.length === 0 && !loading && (
          <div className="empty-state">No hay reservas registradas para estos filtros.</div>
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
