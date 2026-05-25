import React, { useState, useEffect, useCallback } from 'react';
import { ConsultarHistorialAccesosUseCase } from '@gymsync/core';
import type { Acceso } from '@gymsync/core';
import { useAuth } from '../../contexts/AuthContext';
import './AuditoriaView.css';

// ── Vista de Reservas incrustada para GERENTE ────────────────────────────────
import { apiClient } from '../../infrastructure/api.config';
import { reservationsApi } from '../../infrastructure/AxiosReservationsApi.adapter';
import { DB_ROLES } from '../../config/rbac.constants';
import type { Reservation } from '../../infrastructure/Reservations.types';
import { QrScannerModal } from '../Reservas/QrScannerModal';
import { RecordDetailModal, DetailField } from '../Dashboard/Shared/DashboardShared';
import '../Reservas/ReservasView.css';

import { AxiosAccessApiAdapter } from '../../infrastructure/AxiosAccessApi.adapter';
const apiAdapter = new AxiosAccessApiAdapter();
const consultarAccesosUseCase = new ConsultarHistorialAccesosUseCase(apiAdapter);

// ── Sub-vista: Gestión de Reservas del Gym (GERENTE) ─────────────────────────
const GymReservasPanel = () => {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [gymInfoMap, setGymInfoMap] = useState<Map<number, { sucursalName: string; sedeName: string }>>(new Map());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [showScanner, setShowScanner] = useState(false);
  const [scannedReservation, setScannedReservation] = useState<Reservation | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [viewingReservation, setViewingReservation] = useState<Reservation | null>(null);

  // Construir lookup de sucursales/sedes
  useEffect(() => {
    apiClient.get('/gyms').then((data: any) => {
      const raw: any[] = Array.isArray(data) ? data : data?.data ?? [];
      const allByIdName = new Map<number, string>(raw.map((g: any) => [g.id, g.name]));
      const sedesMap = new Map<number, string>(
        raw.filter((g: any) => (g.maxCapacity ?? 0) === 0).map((g: any) => [g.id, g.name])
      );
      const sucursalesData = raw.filter((g: any) => (g.maxCapacity ?? 0) > 0);
      const infoMap = new Map<number, { sucursalName: string; sedeName: string }>();
      sucursalesData.forEach((g: any) => {
        const parentId = g.parentId ?? g.parent?.id;
        infoMap.set(g.id, {
          sucursalName: g.name,
          sedeName: parentId ? (sedesMap.get(parentId) ?? allByIdName.get(parentId) ?? 'Sin marca') : 'Sin marca',
        });
      });
      setGymInfoMap(infoMap);
    }).catch(() => {});
  }, []);

  const loadReservations = useCallback(async () => {
    if (!user?.gymId) return;
    setLoading(true);
    const data = await reservationsApi.getReservations({
      status: filterStatus || undefined,
      gymId: Number(user.gymId),
    });
    const sorted = [...data]
      .filter(res => {
        const gId = res.gymActivitySchedule?.gymActivity?.gymId;
        return gId == null || gId === Number(user.gymId);
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setReservations(sorted);
    setLoading(false);
    setCurrentPage(1);
  }, [filterStatus, user?.gymId]);

  useEffect(() => { loadReservations(); }, [loadReservations]);

  const filteredData = reservations.filter(res => {
    const q = searchTerm.toLowerCase();
    const name = res.user?.profile?.fullName?.toLowerCase() || '';
    const ci = res.user?.profile?.ci?.toLowerCase() || '';
    return name.includes(q) || ci.includes(q);
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const pagedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleAccept = async (res: Reservation) => {
    if (!window.confirm(`¿Confirmar entrada de ${res.user?.profile?.fullName || 'este usuario'}?`)) return;
    setActionLoading(res.id);
    const result = await reservationsApi.acceptReservation(
      res.id,
      res.userId,
      res.gymActivitySchedule?.gymActivity?.gymId ?? Number(user?.gymId ?? 0)
    );
    setActionLoading(null);
    if (result.success) {
      loadReservations();
    } else {
      alert(`Error al aceptar: ${result.error}`);
    }
  };

  const handleCancel = async (id: number) => {
    if (!window.confirm('¿Cancelar esta reserva? Esta acción no se puede deshacer.')) return;
    setActionLoading(id);
    await reservationsApi.cancelReservation(id);
    setActionLoading(null);
    loadReservations();
  };

  const handleScanned = (reservation: Reservation) => setScannedReservation(reservation);

  const handleAcceptScanned = async () => {
    if (!scannedReservation) return;
    await handleAccept(scannedReservation);
    setScannedReservation(null);
  };

  const gymInfo = user?.gymId ? gymInfoMap.get(Number(user.gymId)) : undefined;
  const gymLabel = gymInfo?.sucursalName ?? (user?.gymId ? `Sede #${user.gymId}` : 'Tu Sede');

  return (
    <div className="reservas-view">

      {showScanner && (
        <QrScannerModal onClose={() => setShowScanner(false)} onScanned={handleScanned} />
      )}

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

      {/* Cabecera */}
      <div className="view-header">
        <div>
          <h1 className="view-title">Administración de Reservas</h1>
          <p className="view-subtitle">
            Reservas activas en <strong style={{ color: '#FF5E00' }}>{gymLabel}</strong> — acepta o rechaza solicitudes de tu sede
          </p>
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
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="filter-select">
            <option value="">Estado: Todos</option>
            <option value="CONFIRMED">Confirmadas</option>
            <option value="USED">Usadas</option>
            <option value="CANCELLED">Canceladas</option>
          </select>
          <button onClick={loadReservations} className="btn-refresh" title="Refrescar">🔄</button>
        </div>
      </div>

      {/* Tabla */}
      <div className="data-grid-container">
        {loading ? (
          <div className="loading-state">Cargando reservas...</div>
        ) : (
          <>
            <table className="data-grid">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Carnet (CI)</th>
                  <th>Actividad</th>
                  <th>Horario</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'center', minWidth: '180px' }}>Acciones</th>
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
                      <td>
                        <span style={{ fontFamily: 'monospace', color: '#00D9FF' }}>
                          {res.gymActivitySchedule?.startTime?.substring(0, 5) || '—'}
                          {res.gymActivitySchedule?.endTime ? ` – ${res.gymActivitySchedule.endTime.substring(0, 5)}` : ''}
                        </span>
                      </td>
                      <td style={{ color: '#E5E5EA', fontSize: '0.85rem' }}>{res.reservationDate}</td>
                      <td>
                        <span className={`badge-status ${res.status.toLowerCase()}`}>
                          {res.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-group">
                          {/* Ver detalle */}
                          <button
                            className="btn-action"
                            style={{ background: 'rgba(0,217,255,0.1)', border: '1px solid rgba(0,217,255,0.3)', color: '#00D9FF', borderRadius: '6px', padding: '0.4rem', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '36px' }}
                            title="Ver detalle"
                            onClick={() => setViewingReservation(res)}
                            disabled={isLoading}
                          >👁️</button>

                          {/* Escanear QR */}
                          <button
                            className="btn-action btn-action-scan"
                            title="Escanear QR"
                            onClick={() => setShowScanner(true)}
                            disabled={isLoading}
                          >📷</button>

                          {/* Aceptar entrada */}
                          <button
                            className="btn-action btn-action-accept"
                            title="Aceptar entrada"
                            onClick={() => handleAccept(res)}
                            disabled={!isConfirmed || isLoading}
                          >{isLoading ? '⏳' : '✅'}</button>

                          {/* Rechazar / Cancelar */}
                          <button
                            className="btn-action btn-action-cancel-icon"
                            title="Rechazar reserva"
                            onClick={() => handleCancel(res.id)}
                            disabled={!isConfirmed || isLoading}
                          >✕</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

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
          <div className="empty-state">No hay reservas registradas para tu sede.</div>
        )}
      </div>

      <RecordDetailModal
        isOpen={!!viewingReservation}
        onClose={() => setViewingReservation(null)}
        title="Detalle de Reserva"
      >
        <DetailField label="ID de Reserva" value={viewingReservation?.id} />
        <DetailField
          label="Estado"
          value={
            <span className={`badge-status ${(viewingReservation?.status || '').toLowerCase()}`} style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '12px', fontWeight: 700, fontSize: '0.75rem' }}>
              {viewingReservation?.status}
            </span>
          }
        />
        <DetailField label="Cliente" value={viewingReservation?.user?.profile?.fullName || 'No especificado'} />
        <DetailField label="Carnet (CI)" value={viewingReservation?.user?.profile?.ci || 'Sin registrar'} />
        <DetailField label="Correo" value={viewingReservation?.user?.email} isFullWidth />
        <DetailField label="Actividad" value={viewingReservation?.gymActivitySchedule?.gymActivity?.name || '—'} />
        <DetailField
          label="Horario"
          value={
            viewingReservation?.gymActivitySchedule?.startTime
              ? `${viewingReservation.gymActivitySchedule.startTime.substring(0, 5)} – ${viewingReservation.gymActivitySchedule.endTime?.substring(0, 5) || ''}`
              : '—'
          }
        />
        <DetailField label="Fecha Reservada" value={viewingReservation?.reservationDate} />
        <DetailField
          label="Fecha de Registro"
          isFullWidth
          value={viewingReservation?.createdAt ? new Date(viewingReservation.createdAt).toLocaleString('es-ES') : '—'}
        />
        {viewingReservation?.qrToken && (
          <DetailField
            label="Token QR"
            isFullWidth
            value={
              <code style={{ wordBreak: 'break-all', background: 'rgba(0,0,0,0.4)', padding: '0.4rem 0.6rem', borderRadius: '6px', color: '#00D9FF', fontSize: '0.8rem', display: 'block', border: '1px solid rgba(0,217,255,0.1)' }}>
                {viewingReservation.qrToken}
              </code>
            }
          />
        )}
      </RecordDetailModal>
    </div>
  );
};

// ── Sub-vista: Auditoría de Accesos (SUPER_ADMIN) ────────────────────────────
const AccesosPanel = () => {
  const { user } = useAuth();
  const [accesos, setAccesos] = useState<Acceso[]>([]);
  const [filtroSede, setFiltroSede] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorAcceso, setErrorAcceso] = useState<string | null>(null);

  const cargarAccesos = useCallback(async (resetPage = false) => {
    if (!user) return;
    setLoading(true);
    setErrorAcceso(null);
    const currentPage = resetPage ? 1 : page;

    const result = await consultarAccesosUseCase.execute(user, {
      gymId: filtroSede || undefined,
      estado: filtroEstado || undefined,
      page: currentPage,
      limit: 20,
    });

    if (result.isRight()) {
      const { data, total } = result.value;
      setAccesos(prev => resetPage ? data : [...prev, ...data]);
      setHasMore(data.length > 0 && (currentPage * 20) < total);
    } else {
      setErrorAcceso(result.value.message);
      setAccesos([]);
      setHasMore(false);
    }
    setLoading(false);
  }, [filtroSede, filtroEstado, page, user]);

  useEffect(() => {
    cargarAccesos(true);
    setPage(1);
  }, [filtroSede, filtroEstado, user]);

  const cargarMas = () => {
    if (hasMore && !loading) setPage(prev => prev + 1);
  };

  useEffect(() => {
    if (page > 1) cargarAccesos(false);
  }, [page]);

  return (
    <div className="auditoria-view">
      <div className="view-header">
        <div>
          <h1 className="view-title">Auditoría de Accesos</h1>
          <p className="view-subtitle">Registros en tiempo real de la tabla <code>check_ins</code></p>
        </div>
        <div className="view-filters">
          {user?.role === 'SUPER_ADMIN' && (
            <select value={filtroSede} onChange={e => setFiltroSede(e.target.value)} className="filter-select">
              <option value="">Todas las Sedes</option>
              <option value="1">Smart Fit</option>
              <option value="2">Premier</option>
              <option value="3">Bio Fitness</option>
              <option value="4">Reyes Gym</option>
              <option value="5">Megatlon</option>
              <option value="6">Bodytech</option>
              <option value="7">Energy Club</option>
              <option value="8">Fitness 24/7</option>
              <option value="9">Iron Gym</option>
              <option value="10">Power Club</option>
            </select>
          )}
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className="filter-select">
            <option value="">Todos los Estados</option>
            <option value="AUTORIZADO">Autorizados</option>
            <option value="DENEGADO">Denegados</option>
          </select>
        </div>
      </div>

      {errorAcceso ? (
        <div className="error-panel">
          <h3>Error de Seguridad (RBAC)</h3>
          <p>{errorAcceso}</p>
        </div>
      ) : (
        <div className="data-grid-container">
          <table className="data-grid">
            <thead>
              <tr>
                <th>ID</th>
                <th>Usuario</th>
                <th>Sede</th>
                <th>Fecha/Hora</th>
                <th>Método</th>
                <th>Estado</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {accesos.map(acceso => {
                const isDenied = acceso.status.estado === 'DENEGADO';
                return (
                  <tr key={acceso.id.value} className={isDenied ? 'row-denied' : ''}>
                    <td data-label="ID" className="cell-id">...{acceso.id.value.slice(-6)}</td>
                    <td data-label="Usuario">
                      <div className="cell-user">
                        <img src={acceso.userInfo.avatarUrl} alt="avatar" />
                        <div className="cell-user-info">
                          <span className="name">{acceso.userInfo.nombre}</span>
                          <span className="email">{acceso.userInfo.email}</span>
                        </div>
                      </div>
                    </td>
                    <td data-label="Sede">
                      <div className="cell-gym">
                        <span className="name">{acceso.gymInfo.nombre}</span>
                        <a
                          href={`https://maps.google.com/?q=${acceso.gymInfo.coordenadas.lat},${acceso.gymInfo.coordenadas.lng}`}
                          target="_blank" rel="noreferrer" className="location-link"
                        >
                          📍 Mapa
                        </a>
                      </div>
                    </td>
                    <td data-label="Fecha/Hora" className="cell-time">{acceso.checkInTime.toLocaleString()}</td>
                    <td data-label="Método"><span className="badge-method">{acceso.method.tipo}</span></td>
                    <td data-label="Estado">
                      <span className={`badge-status ${isDenied ? 'denegado' : 'autorizado'}`}>
                        {acceso.status.estado}
                      </span>
                    </td>
                    <td data-label="Detalle" className="cell-reason">
                      {isDenied ? acceso.status.motivoDenegacion : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {accesos.length === 0 && !loading && (
            <div className="empty-state">No se encontraron registros.</div>
          )}

          {hasMore && (
            <div className="pagination">
              <button onClick={cargarMas} disabled={loading} className="btn-load-more">
                {loading ? 'Cargando...' : 'Cargar más resultados'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Componente principal: enruta por rol ─────────────────────────────────────
export const AuditoriaView = () => {
  const { user } = useAuth();
  if (user?.roleId === DB_ROLES.GERENTE) return <GymReservasPanel />;
  return <AccesosPanel />;
};
