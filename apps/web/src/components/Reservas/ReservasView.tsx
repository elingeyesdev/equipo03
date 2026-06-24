import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { reservationsApi } from '../../infrastructure/AxiosReservationsApi.adapter';
import { apiClient } from '../../infrastructure/api.config';
import { DB_ROLES } from '../../config/rbac.constants';
import type { Reservation } from '../../infrastructure/Reservations.types';
import { QrScannerModal } from './QrScannerModal';
import { RecordDetailModal, DetailField } from '../Dashboard/Shared/DashboardShared';
import './ReservasView.css';
import { Eye, CheckCircle, X, Loader2, RotateCw, QrCode } from 'lucide-react';

const STATUS_DISPLAY: Record<string, { label: string; cls: string }> = {
  // inglés (valores originales)
  CONFIRMED:  { label: 'GENERADA',   cls: 'confirmed' },
  USED:       { label: 'COMPLETADA', cls: 'used' },
  CANCELLED:  { label: 'CANCELADA',  cls: 'cancelled' },
  PENDING:    { label: 'PENDIENTE',  cls: 'pending' },
  // español (backend actualizado)
  CONFIRMADA: { label: 'GENERADA',   cls: 'confirmed' },
  COMPLETADA: { label: 'COMPLETADA', cls: 'used' },
  CANCELADA:  { label: 'CANCELADA',  cls: 'cancelled' },
  PENDIENTE:  { label: 'PENDIENTE',  cls: 'pending' },
};

const statusDisplay = (s: string) =>
  STATUS_DISPLAY[s] ?? { label: s, cls: s.toLowerCase() };

export const ReservasView = () => {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterGym, setFilterGym] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sucursales, setSucursales] = useState<{ id: number; name: string }[]>([]);
  // mapa gymId → { sucursalName, sedeName } construido desde /gyms
  const [gymInfoMap, setGymInfoMap] = useState<Map<number, { sucursalName: string; sedeName: string }>>(new Map());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Control de modales
  const [showScanner, setShowScanner] = useState(false);
  const [scannedReservation, setScannedReservation] = useState<Reservation | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [viewingReservation, setViewingReservation] = useState<Reservation | null>(null);

  // Usa roleId numérico de WebUser — no depende de strings ni comparaciones mixtas
  const isGerente = user?.roleId === DB_ROLES.GERENTE;
  const isCliente = user?.roleId === DB_ROLES.CLIENTE;

  // Carga /gyms una sola vez → construye lookup de sucursales + sedes
  useEffect(() => {
    apiClient.get('/gyms').then((data: any) => {
      const raw: any[] = Array.isArray(data) ? data : data?.data ?? [];

      // Mapa id → nombre de todas las entidades (sedes y sucursales)
      const allByIdName = new Map<number, string>(raw.map(g => [g.id, g.name]));

      // Marcas: sin parentId (raíz de la jerarquía)
      const sedesMap = new Map<number, string>(
        raw.filter(g => !g.parentId).map(g => [g.id, g.name])
      );

      // Sucursales: tienen parentId (pertenecen a una marca)
      const sucursalesData = raw
        .filter(g => !!g.parentId)
        .sort((a, b) => a.name.localeCompare(b.name));

      setSucursales(sucursalesData.map(g => ({ id: g.id, name: g.name })));

      // Construir mapa gymId → { sucursalName, sedeName }
      const infoMap = new Map<number, { sucursalName: string; sedeName: string }>();
      sucursalesData.forEach(g => {
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
    setLoading(true);
    const selectedGymId = isGerente && user?.gymId
      ? Number(user.gymId)
      : (filterGym ? Number(filterGym) : undefined);

    // HOY se filtra client-side (por fecha); el resto se delega al backend con ?status=
    const statusParam = (filterStatus && filterStatus !== 'HOY') ? filterStatus : undefined;
    const data = await reservationsApi.getReservations({
      gymId: selectedGymId,
      status: statusParam,
    });
    let sorted = [...data].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    if (isGerente && user?.gymId) {
      sorted = sorted.filter(res => {
        const gId = res.gymActivitySchedule?.gymActivity?.gymId;
        return gId == null || gId === Number(user.gymId);
      });
    } else if (isCliente && user?.id) {
      sorted = sorted.filter(res => res.userId === user.id);
    }

    setReservations(sorted);
    setLoading(false);
    setCurrentPage(1);
  }, [filterStatus, filterGym, isGerente, isCliente, user]);

  // Se dispara automáticamente cuando filterStatus, filterGym u otro dep cambia
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadReservations(); }, [loadReservations]);

  // ── Filtro client-side (nombre/CI + estado combinado) ────────
  const filteredData = reservations.filter(res => {
    const q = searchTerm.toLowerCase();
    const name = res.user?.profile?.fullName?.toLowerCase() || '';
    const ci   = res.user?.profile?.ci?.toLowerCase()       || '';
    if (q && !name.includes(q) && !ci.includes(q)) return false;

    if (filterStatus === 'HOY') {
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
      if ((res.reservationDate ?? '').substring(0, 10) !== todayStr) return false;
    } else if (filterStatus === 'CONFIRMADA' || filterStatus === 'COMPLETADA' || filterStatus === 'CANCELADA') {
      const st = res.status?.toUpperCase() ?? '';
      if (filterStatus === 'CONFIRMADA' && !['CONFIRMADA','CONFIRMED'].includes(st)) return false;
      if (filterStatus === 'COMPLETADA' && !['COMPLETADA','USED','USADA'].includes(st)) return false;
      if (filterStatus === 'CANCELADA'  && !['CANCELADA','CANCELLED'].includes(st)) return false;
    }
    return true;
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
    const result = await reservationsApi.acceptReservation(res.id, res.userId);
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
              <button onClick={() => setScannedReservation(null)} style={{ background: '#8e8e93', border: 'none', color: '#fff', fontSize: '0.85rem', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: '6px', cursor: 'pointer' }}>X</button>
            </div>
            
            <div className="confirm-icon-wrapper">
              <CheckCircle size={48} color="#00E5A3" />
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestión de Reservas</h1>
          <p className="text-sm text-slate-600 dark:text-gray-400 mt-1">Historial de las reservas de los clientes de la sucursal</p>
        </div>

        <div className="view-filters">
          <button onClick={() => setShowScanner(true)} className="bg-brand-orange text-white font-semibold px-4 py-2 rounded-lg border-0 cursor-pointer inline-flex items-center gap-1.5 text-sm">
            <QrCode size={15} />
            Escanear QR
          </button>

          <input
            type="text"
            placeholder="Buscar por Nombre o CI..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full bg-white dark:bg-bg-surface text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-md px-4 py-2 focus:outline-none"
            style={{ minWidth: '220px' }}
          />

          {!isGerente && sucursales.length > 0 && (
            <select value={filterGym} onChange={e => setFilterGym(e.target.value)}
              className="bg-white dark:bg-bg-surface text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-md px-4 py-2 focus:outline-none">
              <option value="">Sucursal: Todas</option>
              {sucursales.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}

          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            className="bg-white dark:bg-bg-surface text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-md px-4 py-2 focus:outline-none">
            <option value="">Todas las reservas</option>
            <option value="HOY">Hoy</option>
            <option value="CONFIRMADA">Generadas</option>
            <option value="COMPLETADA">Completadas</option>
            <option value="CANCELADA">Canceladas</option>
          </select>

          <button onClick={loadReservations} title="Refrescar" className="text-text-muted hover:text-brand-celeste dark:text-text-muted border border-gray-300 dark:border-gray-700 bg-transparent rounded-lg p-2 cursor-pointer inline-flex items-center">
            <RotateCw size={15} />
          </button>
        </div>
      </div>

      {/* ── Tabla ── */}
      <div className="bg-white dark:bg-bg-surface border border-gray-200 dark:border-bg-deep rounded-xl overflow-x-auto mt-4">
        {loading ? (
          <div className="loading-state">Cargando registros...</div>
        ) : (
          <>
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 dark:bg-bg-deep border-b border-gray-200 dark:border-bg-deep text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Usuario</th>
                  <th className="px-6 py-4">Carnet (CI)</th>
                  <th className="px-6 py-4">Actividad</th>
                  <th className="px-6 py-4">Sucursal</th>
                  <th className="px-6 py-4">Horario</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-center" style={{ minWidth: '220px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pagedData.map(res => {
                  const isLoading = actionLoading === res.id;
                  const isConfirmed = res.status === 'CONFIRMED' || res.status === 'CONFIRMADA';
                  const activityName =
                    res.freeActivity?.name ||
                    res.gymActivitySchedule?.gymActivity?.name ||
                    res.activity?.name ||
                    res.gymActivity?.name ||
                    '';
                  const activityGymId =
                    res.freeActivity?.gymId ||
                    res.gymActivitySchedule?.gymActivity?.gymId ||
                    res.activity?.gymId ||
                    res.gymActivity?.gymId ||
                    null;
                  return (
                    <tr key={res.id} className="border-b border-slate-100 dark:border-gray-800 hover:bg-slate-50 dark:hover:bg-bg-deep transition-colors text-slate-700 dark:text-gray-300 text-sm">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="user-avatar-mini">
                            {res.user?.profile?.fullName?.charAt(0) || 'U'}
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-slate-900 dark:text-white text-sm">{res.user?.profile?.fullName || 'Usuario'}</span>
                            <span className="text-xs text-slate-500 dark:text-gray-400">{res.user?.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 cell-ci">{res.user?.profile?.ci || '—'}</td>
                      <td className="px-6 py-4 cell-activity">{activityName || '—'}</td>
                      <td className="px-6 py-4">{(() => {
                        const gId = activityGymId;
                        const info = gId ? gymInfoMap.get(gId) : undefined;
                        return info ? info.sucursalName : (gId ? `Sucursal #${gId}` : '—');
                      })()}</td>
                      <td className="px-6 py-4">
                        <div className="cell-time">
                          {(() => {
                            const st = (res.startTime ?? res.gymActivitySchedule?.startTime)?.substring(0, 5);
                            const et = (res.endTime   ?? res.gymActivitySchedule?.endTime)?.substring(0, 5);
                            return st ? <span className="time">{st}{et ? ` – ${et}` : ''}</span> : null;
                          })()}
                          <span className="date">{res.reservationDate?.substring(0, 10)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {(() => { const d = statusDisplay(res.status); return (
                          <span className={`badge-status ${d.cls}`}>{d.label}</span>
                        ); })()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {/* Detalle */}
                          <button
                            className="bg-brand-celeste text-black p-1.5 rounded cursor-pointer flex items-center justify-center"
                            title="Ver detalle completo de reserva"
                            onClick={() => setViewingReservation(res)}
                            disabled={isLoading}
                          >
                            <Eye size={15} />
                          </button>

                          {/* Aceptar — solo para CONFIRMED */}
                          <button
                            className={`p-1.5 rounded flex items-center justify-center ${isConfirmed ? 'bg-brand-green text-black cursor-pointer' : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed opacity-50'}`}
                            title="Aceptar entrada"
                            onClick={() => handleAccept(res)}
                            disabled={!isConfirmed || isLoading}
                          >
                            {isLoading ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                          </button>

                          {/* Cancelar — solo para CONFIRMED */}
                          <button
                            className={`bg-transparent border-0 p-1.5 rounded flex items-center justify-center ${isConfirmed ? 'text-gray-500 dark:text-text-muted cursor-pointer' : 'text-gray-300 opacity-50 cursor-not-allowed'}`}
                            title="Cancelar reserva"
                            onClick={() => handleCancel(res.id)}
                            disabled={!isConfirmed || isLoading}
                          >
                            <X size={14} />
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
              <div className="flex justify-center items-center gap-5 px-4 py-4 border-t border-slate-100 dark:border-gray-800 bg-white dark:bg-bg-surface">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="text-sm bg-white dark:bg-bg-deep border border-gray-200 dark:border-gray-700 text-slate-700 dark:text-white px-4 py-2 rounded-md cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  onMouseEnter={e => { if (!e.currentTarget.disabled) { e.currentTarget.style.borderColor = '#FF5E00'; e.currentTarget.style.color = '#FF5E00'; } }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.color = ''; }}
                >
                  Anterior
                </button>
                <span className="text-slate-500 dark:text-gray-400 text-sm">
                  Página <strong className="text-slate-900 dark:text-white">{currentPage}</strong> de {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="text-sm bg-white dark:bg-bg-deep border border-gray-200 dark:border-gray-700 text-slate-700 dark:text-white px-4 py-2 rounded-md cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  onMouseEnter={e => { if (!e.currentTarget.disabled) { e.currentTarget.style.borderColor = '#FF5E00'; e.currentTarget.style.color = '#FF5E00'; } }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.color = ''; }}
                >
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
          value={(() => {
            const d = statusDisplay(viewingReservation?.status || '');
            return (
              <span className={`badge-status ${d.cls}`} style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '12px', fontWeight: 700, fontSize: '0.75rem' }}>
                {d.label}
              </span>
            );
          })()}
        />

        <DetailField label="Cliente" value={viewingReservation?.user?.profile?.fullName || 'No especificado'} />
        <DetailField label="Carnet de Identidad (CI)" value={viewingReservation?.user?.profile?.ci || 'Sin registrar'} />
        <DetailField label="Correo del Cliente" value={viewingReservation?.user?.email} isFullWidth />

        <DetailField label="Actividad Deportiva" value={viewingReservation?.gymActivitySchedule?.gymActivity?.name || '-'} />
        <DetailField
          label="Sucursal"
          value={(() => {
            const gId = viewingReservation?.gymActivitySchedule?.gymActivity?.gymId;
            const info = gId ? gymInfoMap.get(gId) : undefined;
            return info?.sucursalName ?? (gId ? `Sucursal #${gId}` : 'Sin información');
          })()}
        />
        <DetailField
          label="Marca"
          value={(() => {
            const gId = viewingReservation?.gymActivitySchedule?.gymActivity?.gymId;
            const info = gId ? gymInfoMap.get(gId) : undefined;
            return info?.sedeName ?? 'Sin información';
          })()}
        />
        
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
              <code style={{ wordBreak: 'break-all', background: '#0A0A0A', padding: '0.4rem 0.6rem', borderRadius: '6px', color: '#fff', fontSize: '0.8rem', display: 'block' }}>
                {viewingReservation.qrToken}
              </code>
            } 
          />
        )}
      </RecordDetailModal>
    </div>
  );
};
