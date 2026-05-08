import React, { useState } from 'react';
import { Outlet, Navigate, useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import './DashboardLayout.css';

export const DashboardLayout = () => {
  const { isAuthenticated, user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 🔌 Activar canal de notificaciones en tiempo real (Socket.io)
  // Se auto-une a la sala correcta según el rol (room_gym_{id} o room_admin_all)
  useNotifications();


  if (isLoading) return <div className="layout-loading">Verificando sesión...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const handleLogout = () => {
    logout();
    localStorage.removeItem('gymsync_user');
    sessionStorage.clear();
    navigate('/login', { replace: true });
  };

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="dashboard-layout">
      {/* Overlay for mobile */}
      {isSidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar} />}

      {/* Sidebar Navigation */}
      <aside className={`sidebar glass-panel ${isSidebarOpen ? 'open' : ''}`}>
        <div className="brand">
          GymSync <span>Pro</span>
        </div>
        <nav className="nav-menu">
          <NavLink to="/dashboard/resumen" onClick={closeSidebar} className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            📊 Resumen
          </NavLink>
          {(user?.role === 'SUPER_ADMIN' || user?.role === 'GERENTE') && (
            <NavLink to="/dashboard/auditoria" onClick={closeSidebar} className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              🛡️ Auditoría
            </NavLink>
          )}
          {(user?.role === 'SUPER_ADMIN' || user?.role === 'GERENTE' || user?.role === 'ENTRENADOR' || user?.role === 'NUTRICIONISTA') && (
            <NavLink to="/dashboard/usuarios" onClick={closeSidebar} className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              👥 Usuarios
            </NavLink>
          )}
          {user?.role === 'SUPER_ADMIN' && (
            <NavLink to="/dashboard/sedes" onClick={closeSidebar} className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              🏢 Sedes
            </NavLink>
          )}
          {user?.role === 'SUPER_ADMIN' && (
            <NavLink to="/dashboard/roles" onClick={closeSidebar} className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              🔑 Roles
            </NavLink>
          )}
          {(user?.role === 'SUPER_ADMIN' || user?.role === 'ENTRENADOR' || user?.role === 'NUTRICIONISTA' || user?.role === 'CLIENTE') && (
            <NavLink to="/dashboard/rutinas" onClick={closeSidebar} className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              🏋️ Rutinas
            </NavLink>
          )}
          {(user?.role === 'GERENTE' || user?.role === 'CLIENTE') && (
            <NavLink to="/dashboard/reservas" onClick={closeSidebar} className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              📅 Reservas
            </NavLink>
          )}
          {user?.role === 'CLIENTE' && (
            <NavLink to="/dashboard/medidas" onClick={closeSidebar} className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              📏 Medidas
            </NavLink>
          )}
        </nav>
        <div className="sidebar-footer">
          <span className="version">v2.0 (PostgreSQL Mode)</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="top-header glass-panel">
          <div className="header-left">
            <button className="menu-toggle" onClick={() => setIsSidebarOpen(true)}>
              ☰
            </button>
            <div className="header-search">
              <input type="text" placeholder="Buscar registros..." />
            </div>
          </div>

          <div className="header-actions">
            <div className="user-profile">
              <img src={`https://i.pravatar.cc/150?u=${user?.userId}`} alt="User" className="avatar" />
              <div className="user-info desktop-only">
                <span className="user-name">Usuario ({user?.userId})</span>
                <span className="user-role">{user?.role} {user?.gymId ? `(Gym: ${user.gymId})` : ''}</span>
              </div>
            </div>
            <button onClick={handleLogout} className="btn-logout desktop-only">
              Cerrar Sesión
            </button>
            <button onClick={handleLogout} className="btn-logout mobile-only" title="Cerrar Sesión">
              🚪
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
