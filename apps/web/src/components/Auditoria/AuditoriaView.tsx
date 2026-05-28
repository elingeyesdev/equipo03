import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import toast from 'react-hot-toast';
import { ConsultarHistorialAccesosUseCase } from '@gymsync/core';
import type { Acceso } from '@gymsync/core';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../infrastructure/api.config';
import { AxiosAccessApiAdapter } from '../../infrastructure/AxiosAccessApi.adapter';
import './AuditoriaView.css';

const apiAdapter = new AxiosAccessApiAdapter();
const consultarAccesosUseCase = new ConsultarHistorialAccesosUseCase(apiAdapter);

// ── Escáner QR ───────────────────────────────────────────────────────────────
const QrPanel = ({ onSuccess }: { onSuccess: () => void }) => {
  const pausedRef = useRef(false);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'qr-reader-auditoria',
      { fps: 10, qrbox: 250 },
      false,
    );

    scanner.render(
      async (decodedText) => {
        if (pausedRef.current) return;
        pausedRef.current = true;
        try {
          await apiClient.post('/checkins', { userId: decodedText, method: 'QR' });
          toast.success('Acceso registrado correctamente');
          onSuccess();
        } catch (e: any) {
          const msg = e?.response?.data?.message ?? e.message ?? 'Error al registrar acceso';
          toast.error(msg);
        }
        setTimeout(() => { pausedRef.current = false; }, 3000);
      },
      () => {},
    );

    return () => { scanner.clear().catch(() => {}); };
  }, []);

  return (
    <section style={{ marginBottom: '1.5rem' }}>
      <h2 style={{ color: 'var(--text-primary, #fff)', fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>
        📷 Escáner QR de Acceso
      </h2>
      <div id="qr-reader-auditoria" style={{ width: '100%', maxWidth: 480, margin: '0 auto' }} />
    </section>
  );
};

// ── Panel de Accesos ─────────────────────────────────────────────────────────
const AccesosPanel = () => {
  const { user } = useAuth();
  const [accesos,      setAccesos]      = useState<Acceso[]>([]);
  const [filtroSede,   setFiltroSede]   = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [page,         setPage]         = useState(1);
  const [hasMore,      setHasMore]      = useState(true);
  const [loading,      setLoading]      = useState(false);
  const [errorAcceso,  setErrorAcceso]  = useState<string | null>(null);
  const [refreshKey,   setRefreshKey]   = useState(0);

  const cargarAccesos = useCallback(async (resetPage = false) => {
    if (!user) return;
    setLoading(true);
    setErrorAcceso(null);
    const currentPage = resetPage ? 1 : page;

    const result = await consultarAccesosUseCase.execute(user, {
      gymId:  filtroSede   || undefined,
      estado: filtroEstado || undefined,
      page:   currentPage,
      limit:  20,
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
  }, [filtroSede, filtroEstado, user, refreshKey]);

  useEffect(() => {
    if (page > 1) cargarAccesos(false);
  }, [page]);

  return (
    <div className="auditoria-view">

      <QrPanel onSuccess={() => setRefreshKey(k => k + 1)} />

      {/* Cabecera + filtros */}
      <div className="view-header">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Auditoría de Accesos</h1>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
            Registros en tiempo real de la tabla <code>check_ins</code>
          </p>
        </div>
        <div className="view-filters">
          {user?.role === 'SUPER_ADMIN' && (
            <select
              value={filtroSede}
              onChange={e => setFiltroSede(e.target.value)}
              className="bg-white dark:bg-[#151521] border border-slate-200 dark:border-gray-800 text-slate-900 dark:text-white rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#2ecc71] transition-colors"
            >
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
          <select
            value={filtroEstado}
            onChange={e => setFiltroEstado(e.target.value)}
            className="bg-white dark:bg-[#151521] border border-slate-200 dark:border-gray-800 text-slate-900 dark:text-white rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#2ecc71] transition-colors"
          >
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
        <div className="bg-white dark:bg-[#1e1e2d] border border-slate-200 dark:border-gray-800 rounded-xl shadow-sm overflow-x-auto mt-4 transition-colors">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-[#151521] border-b border-slate-200 dark:border-gray-800 text-slate-500 dark:text-gray-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Usuario</th>
                <th className="px-6 py-4">Sede</th>
                <th className="px-6 py-4">Fecha/Hora</th>
                <th className="px-6 py-4">Método</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {accesos.map(acceso => {
                const isDenied = acceso.status.estado === 'DENEGADO';
                return (
                  <tr
                    key={acceso.id.value}
                    className={`border-b border-slate-100 dark:border-gray-800 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-slate-700 dark:text-gray-300 text-sm${isDenied ? ' row-denied' : ''}`}
                  >
                    <td data-label="ID" className="px-6 py-4 cell-id">...{acceso.id.value.slice(-6)}</td>
                    <td data-label="Usuario" className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={acceso.userInfo.avatarUrl}
                          alt="avatar"
                          className="w-8 h-8 rounded-full border border-slate-200 dark:border-gray-700 object-cover"
                        />
                        <div className="flex-1 flex flex-col gap-0.5">
                          <span className="font-semibold text-slate-900 dark:text-white">{acceso.userInfo.nombre}</span>
                          <span className="text-xs text-slate-500 dark:text-gray-400">{acceso.userInfo.email}</span>
                        </div>
                      </div>
                    </td>
                    <td data-label="Sede" className="px-6 py-4">
                      <div className="cell-gym">
                        <span className="name">{acceso.gymInfo.nombre}</span>
                        <a
                          href={`https://maps.google.com/?q=${acceso.gymInfo.coordenadas.lat},${acceso.gymInfo.coordenadas.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="location-link"
                        >
                          📍 Mapa
                        </a>
                      </div>
                    </td>
                    <td data-label="Fecha/Hora" className="px-6 py-4 cell-time">{acceso.checkInTime.toLocaleString()}</td>
                    <td data-label="Método" className="px-6 py-4">
                      <span className="badge-method">{acceso.method.tipo}</span>
                    </td>
                    <td data-label="Estado" className="px-6 py-4">
                      <span className={`badge-status ${isDenied ? 'denegado' : 'autorizado'}`}>
                        {acceso.status.estado}
                      </span>
                    </td>
                    <td data-label="Detalle" className="px-6 py-4 cell-reason">
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
              <button onClick={() => setPage(p => p + 1)} disabled={loading} className="btn-load-more">
                {loading ? 'Cargando...' : 'Cargar más resultados'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const AuditoriaView = () => <AccesosPanel />;
