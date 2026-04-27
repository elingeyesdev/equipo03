import React from 'react';
import { Outlet, Navigate, useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './DashboardLayout.css';

export const DashboardLayout = () => {
  const { isAuthenticated, user, logout, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) return <div className="layout-loading">Verificando sesión...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const handleLogout = () => {
    logout();
    localStorage.removeItem('gymsync_user');
    sessionStorage.clear();
    navigate('/login', { replace: true });
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand">
          GymSync <span>Pro</span>
        </div>
        <nav className="nav-menu">
          <NavLink to="/dashboard/resumen" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            📊 Resumen
          </NavLink>
          <NavLink to="/dashboard/auditoria" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            🛡️ Auditoría
          </NavLink>
          <NavLink to="/dashboard/usuarios" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            👥 Usuarios
          </NavLink>
          {(user?.role === 'SUPER_ADMIN' || user?.role === 'GERENTE') && (
            <NavLink to="/dashboard/sedes" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              🏢 Sedes
            </NavLink>
          )}
        </nav>
        <div className="sidebar-footer">
          <span className="version">v2.0 (PostgreSQL Mode)</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="top-header">
          <div className="header-search">
            <input type="text" placeholder="Buscar registros, usuarios o IDs..." />
          </div>
          
          <div className="header-actions">
            <div className="user-profile">
              <img src="https://i.pravatar.cc/150?u=admin" alt="Admin" className="avatar" />
              <div className="user-info">
                <span className="user-name">Administrador</span>
                <span className="user-role">{user?.role} {user?.gymId ? `(${user.gymId})` : ''}</span>
              </div>
            </div>
            <button onClick={handleLogout} className="btn-logout">
              Cerrar Sesión
            </button>
          </div>
        </header>

        <div className="page-container">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
