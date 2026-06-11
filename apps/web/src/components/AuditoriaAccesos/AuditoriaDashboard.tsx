import React, { useState, useEffect, useCallback } from 'react';
import { ConsultarHistorialAccesosUseCase } from '@gymsync/core';
import type { Acceso } from '@gymsync/core';
import './AuditoriaDashboard.css';
import { useAuth } from '../../contexts/AuthContext';

import { AxiosAccessApiAdapter } from '../../infrastructure/AxiosAccessApi.adapter';
const apiAdapter = new AxiosAccessApiAdapter();
const consultarAccesosUseCase = new ConsultarHistorialAccesosUseCase(apiAdapter);

export const AuditoriaDashboard: React.FC = () => {
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
        limit: 15
      }
    );
    
    if (result.isRight()) {
      const { data, total } = result.value;
      setAccesos(prev => resetPage ? data : [...prev, ...data]);
      setHasMore(data.length > 0 && (currentPage * 15) < total);
    } else {
      // Manejo de Error RBAC
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
    if (hasMore && !loading) {
      setPage(prev => prev + 1);
    }
  };

  return (
    <div className="admin-layout">
      {/* Sidebar de Navegación Lateral */}
      <aside className="admin-sidebar">
        <div className="brand">GymSync Pro</div>
        <nav className="nav-menu">
          <button className="nav-item"> Resumen</button>
          <button className="nav-item active"> Auditoría (Check-Ins)</button>
          <button className="nav-item"> Usuarios</button>
          <button className="nav-item"> Marcas</button>
        </nav>
      </aside>

      {/* Contenido Principal */}
      <main className="admin-main">
        {/* Header Superior */}
        <header className="admin-header">
          <div className="header-search">
            <input type="text" placeholder="Buscar usuario por nombre o ID..." className="search-input"/>
          </div>
          <div className="header-profile">
            <img src="https://i.pravatar.cc/150?u=admin" alt="Admin" className="avatar-small" />
            <div className="profile-info">
              <span className="profile-name">Administrador</span>
              <span className="profile-role">{user?.role || 'USER'}</span>
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          <div className="dashboard-title-row">
            <h1>Registro de Accesos</h1>
            <div className="filtros-container">
              {user?.role === 'SUPER_ADMIN' && (
                <select value={filtroSede} onChange={e => setFiltroSede(e.target.value)} className="filtro-select">
                  <option value="">Todas las Marcas</option>
                  <option value="g1">Smart Fit</option>
                  <option value="g2">Premier</option>
                  <option value="g3">Bio Fitness</option>
                </select>
              )}
              <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className="filtro-select">
                <option value="">Todos los Estados</option>
                <option value="AUTORIZADO">Autorizados</option>
                <option value="DENEGADO">Denegados (Alertas)</option>
              </select>
            </div>
          </div>

          {errorAcceso ? (
            <div className="rbac-error-box">
              <h2>ACCESO DENEGADO (Capa Core)</h2>
              <p>{errorAcceso}</p>
            </div>
          ) : (
            <div className="audit-responsive">
              <div className="table-wrapper">
                <table className="audit-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Usuario</th>
                      <th>Marca</th>
                      <th>Fecha/Hora</th>
                      <th>Metodo</th>
                      <th>Estado</th>
                      <th>Detalle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accesos.map(acceso => {
                      const isDenied = acceso.status.estado === 'DENEGADO';
                      return (
                        <tr key={acceso.id.value} className={isDenied ? 'row-denied' : ''}>
                          <td>{acceso.id.value.slice(-8)}</td>
                          <td>{acceso.userInfo.nombre}</td>
                          <td>{acceso.gymInfo.nombre}</td>
                          <td>{acceso.checkInTime.toLocaleString()}</td>
                          <td>{acceso.method.tipo}</td>
                          <td>
                            <span className={`status-badge ${acceso.status.estado.toLowerCase()}`}>
                              {acceso.status.estado}
                            </span>
                          </td>
                          <td>{isDenied ? acceso.status.motivoDenegacion : '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="grid-container">
                {accesos.map(acceso => {
                  const isDenied = acceso.status.estado === 'DENEGADO';
                  return (
                    <div key={acceso.id.value} className={`log-card ${isDenied ? 'alert-pulse' : ''}`}>
                      <div className="card-header">
                        <span className={`status-badge ${acceso.status.estado.toLowerCase()}`}>
                          {acceso.status.estado}
                        </span>
                        <span className="method-tag">Metodo: {acceso.method.tipo}</span>
                      </div>
                      <div className="user-info">
                        <img src={acceso.userInfo.avatarUrl || 'https://via.placeholder.com/40'} alt="Avatar" className="user-avatar" />
                        <div>
                          <h3 className="user-name">{acceso.userInfo.nombre}</h3>
                          <p className="user-email">{acceso.userInfo.email}</p>
                        </div>
                      </div>
                      <div className="gym-info">
                        <p className="gym-name">{acceso.gymInfo.nombre}</p>
                        <p className="gym-location">{acceso.gymInfo.direccion}</p>
                      </div>
                      <div className="timestamp-info">{acceso.checkInTime.toLocaleString()}</div>
                      {isDenied && <div className="error-reason">Alerta: {acceso.status.motivoDenegacion}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {hasMore && !errorAcceso && (
            <div className="load-more-container">
              <button className="btn-load-more" onClick={cargarMas} disabled={loading}>
                {loading ? 'Cargando...' : 'Cargar Más Registros'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
