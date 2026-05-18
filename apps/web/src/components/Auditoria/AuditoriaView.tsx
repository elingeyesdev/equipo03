import React, { useState, useEffect, useCallback } from 'react';
import { ConsultarHistorialAccesosUseCase } from '@gymsync/core';
import type { Acceso } from '@gymsync/core';
import { useAuth } from '../../contexts/AuthContext';
import './AuditoriaView.css';

import { AxiosAccessApiAdapter } from '../../infrastructure/AxiosAccessApi.adapter';
const apiAdapter = new AxiosAccessApiAdapter();
const consultarAccesosUseCase = new ConsultarHistorialAccesosUseCase(apiAdapter);

export const AuditoriaView = () => {
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
    
    const result = await consultarAccesosUseCase.execute(
      user, 
      {
        gymId: filtroSede || undefined,
        estado: filtroEstado || undefined,
        page: currentPage,
        limit: 20 // Alta densidad
      }
    );
    
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
          {user?.role === 'GERENTE' && (
            <div className="filter-readonly">
              Filtrado estricto por Sede: <strong>{user.gymId}</strong>
            </div>
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
