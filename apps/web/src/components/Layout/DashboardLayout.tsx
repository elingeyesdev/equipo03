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

  // Avatar de iniciales
  const fName   = user?.firstName || 'U';
  const lName   = user?.lastName  || '';
  const initials = `${fName.charAt(0)}${lName ? lName.charAt(0) : ''}`.toUpperCase();
  const displayName = lName ? `${fName} ${lName}` : fName;

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
              {/* Avatar de iniciales — sin dependencia externa */}
              <div style={{
                width: '38px', height: '38px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #00D9FF 0%, #0099CC 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#0A0A0A', fontWeight: 800, fontSize: '0.85rem',
                flexShrink: 0, letterSpacing: '0.02em',
                boxShadow: '0 0 0 2px rgba(0,217,255,0.3)',
                userSelect: 'none',
              }}>
                {initials}
              </div>
              <div className="user-info desktop-only">
                <span className="user-name">{displayName}</span>
                <span className="user-role">{user?.role}{user?.gymName ? ` · ${user.gymName}` : ''}</span>
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
