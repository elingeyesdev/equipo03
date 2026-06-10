import { useState, useEffect } from 'react';
import { Outlet, Navigate, useNavigate, NavLink } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../hooks/useNotifications';
import { getRoutesForRole } from '../../config/roles.config';
import './DashboardLayout.css';

export const DashboardLayout = () => {
  const { isAuthenticated, user, logout, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hasActiveFormModal, setHasActiveFormModal] = useState(false);

  // Detecta cuando un modal está abierto → oculta el header
  useEffect(() => {
    const check = () => setHasActiveFormModal(document.body.hasAttribute('data-modal-open'));
    const observer = new MutationObserver(check);
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-modal-open'] });
    check();
    return () => observer.disconnect();
  }, []);

  // Canal de notificaciones en tiempo real (Socket.io)
  useNotifications();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#f4f5f8] text-slate-500 text-sm tracking-wide">
        Verificando sesión...
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const handleLogout = () => {
    logout();
    localStorage.removeItem('gymsync_user');
    sessionStorage.clear();
    navigate('/login', { replace: true });
  };

  const closeSidebar = () => setIsSidebarOpen(false);

  // Iniciales del avatar
  const fName      = user?.firstName || 'U';
  const lName      = user?.lastName  || '';
  const initials   = `${fName.charAt(0)}${lName ? lName.charAt(0) : ''}`.toUpperCase();
  const displayName = lName ? `${fName} ${lName}` : fName;

  const visibleRoutes = getRoutesForRole(user?.role);

  return (
    <div className="flex h-screen w-full bg-[#f4f5f8] dark:bg-[#151521] overflow-hidden font-sans">

      {/* ── Overlay móvil ───────────────────────────────────────────────────── */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-10 bg-black/40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* ── Sidebar oscuro ──────────────────────────────────────────────────── */}
      <aside
        className={[
          'fixed md:relative z-20 h-full w-[260px] bg-[#1e1e2d] text-gray-300',
          'flex flex-col shadow-xl transition-transform duration-300',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        ].join(' ')}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-white/10 flex-shrink-0">
          <span className="text-white font-extrabold text-xl tracking-tight">
            GymSync <span className="text-cyan-400">Pro</span>
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {visibleRoutes.map(route => (
            <NavLink
              key={route.path}
              to={`/dashboard/${route.path}`}
              onClick={closeSidebar}
              className={({ isActive }) =>
                [
                  'block px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white',
                ].join(' ')
              }
            >
              {route.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer sidebar */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-white/10">
          <span className="text-xs text-gray-600 tracking-wide">v2.0 · PostgreSQL Mode</span>
        </div>
      </aside>

      {/* ── Zona derecha ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">

        {/* ── Header blanco ───────────────────────────────────────────────── */}
        <header
          className="h-16 bg-white dark:bg-[#1e1e2d] shadow-sm flex items-center justify-between px-6 z-10 border-b border-slate-200 dark:border-gray-800 flex-shrink-0 transition-transform duration-300"
          style={{
            transform: hasActiveFormModal ? 'translateY(-100%)' : 'translateY(0)',
            pointerEvents: hasActiveFormModal ? 'none' : 'auto',
          }}
        >
          {/* Izquierda */}
          <div className="flex items-center gap-4">
            {/* Botón hamburguesa móvil */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Abrir menú"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6"  x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Derecha */}
          <div className="flex items-center gap-4">

            {/* Toggle dark / light */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-600 dark:text-gray-300 transition-colors"
              title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Avatar + info */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-white font-bold text-sm select-none shadow-md flex-shrink-0">
                {initials}
              </div>
              <div className="hidden md:flex flex-col leading-tight">
                <span className="text-sm font-semibold text-slate-900 dark:text-gray-100">{displayName}</span>
                <span className="text-xs text-gray-400 uppercase tracking-wide">
                  {user?.role}{user?.gymName ? ` · ${user.gymName}` : ''}
                </span>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="hidden md:flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 border border-gray-200 hover:border-red-300 px-3 py-1.5 rounded-lg transition-colors"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Salir
            </button>

            {/* Logout móvil */}
            <button
              onClick={handleLogout}
              className="md:hidden p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Cerrar Sesión"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </header>

        {/* ── Contenido principal ─────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#f4f5f8] dark:bg-[#151521]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
