import { useState, useEffect } from 'react';
import { Outlet, Navigate, useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import { getRoutesForRole } from '../../config/roles.config';
import './DashboardLayout.css';

export const DashboardLayout = () => {
  const { isAuthenticated, user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hasActiveFormModal, setHasActiveFormModal] = useState(false);

  useEffect(() => {
    const checkModals = () => {
      setHasActiveFormModal(document.body.hasAttribute('data-modal-open'));
    };

    const observer = new MutationObserver(checkModals);
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-modal-open'] });
    checkModals();

    return () => observer.disconnect();
  }, []);

  // 🔌 Activar canal de notificaciones en tiempo real (Socket.io)
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

  // ── Sidebar dinámico: solo se incluyen en el DOM los links permitidos ────────
  // getRoutesForRole filtra por el mismo criterio que RoleGuard → 0 desincronía.
  const visibleRoutes = getRoutesForRole(user?.role);

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
          {visibleRoutes.map((route) => (
            <NavLink
              key={route.path}
              to={`/dashboard/${route.path}`}
              onClick={closeSidebar}
              className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
            >
              {route.icon} {route.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span className="version">v2.0 (PostgreSQL Mode)</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Header will only hide when a form modal is active */}
        <header
          className="top-header glass-panel"
          style={{
            transform: hasActiveFormModal ? 'translateY(-100%)' : 'translateY(0)',
            transition: 'transform 0.3s ease-out',
            zIndex: 10000,
            pointerEvents: hasActiveFormModal ? 'none' : 'auto',
          }}
        >
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
              <img src={`https://i.pravatar.cc/150?u=${user?.id}`} alt="User" className="avatar" />
              <div className="user-info desktop-only">
                <span className="user-name">Usuario ({user?.id})</span>
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
