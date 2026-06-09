import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import './LoginScreen.css';

const MailIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);

const LockIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const XIcon = ({ size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/>
    <path d="m6 6 12 12"/>
  </svg>
);

const EyeIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
    <line x1="2" y1="2" x2="22" y2="22"/>
  </svg>
);

const BACKGROUND_IMAGES = [
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?q=80&w=2070&auto=format&fit=crop'
];

export const LoginScreen = () => {
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  
  const [showLogin, setShowLogin] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % BACKGROUND_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) return <div className="login-loading">Cargando...</div>;
  if (isAuthenticated) return <Navigate to="/dashboard/auditoria" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const result = await login(email, password);
    if (result.success) {
      navigate('/dashboard/auditoria');
    } else {
      setError(result.error || 'Error al iniciar sesión');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="login-wrapper">
      <div className="carousel-container">
        <AnimatePresence mode="popLayout">
          <motion.img
            key={currentImageIndex}
            src={BACKGROUND_IMAGES[currentImageIndex]}
            alt="Gym Background"
            className="carousel-image"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
        </AnimatePresence>
        <div className="carousel-overlay" />
      </div>

      <nav className="landing-navbar">
        <div className="navbar-logo">GymSync <span>Pro</span></div>
        <AnimatePresence>
          {!showLogin && (
            <motion.button 
              className="btn-ghost-cyan"
              onClick={() => setShowLogin(true)}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              Iniciar Sesión
            </motion.button>
          )}
        </AnimatePresence>
      </nav>

      <AnimatePresence mode="wait">
        {!showLogin ? (
          <motion.div 
            key="landing"
            className="hero-section"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="hero-title">
              Eleva el Nivel de tu <br />
              <span className="hero-title-gradient">Gestión Fitness</span>
            </h1>
            <p className="hero-subtitle">
              La plataforma corporativa integral para administrar marcas, usuarios y actividades con máxima eficiencia.
            </p>
          </motion.div>
        ) : (
          <motion.div 
            key="login-form"
            className="login-view-container"
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(4px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.4 }}
          >
            <motion.div
              className="w-full max-w-md bg-white dark:bg-[#1e1e2d] border border-slate-200 dark:border-gray-800 rounded-2xl shadow-xl p-8 transition-colors relative"
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <button
                className="close-btn"
                onClick={() => setShowLogin(false)}
                title="Volver"
              >
                <XIcon size={24} />
              </button>

              <div className="text-xl font-extrabold text-slate-900 dark:text-white text-center mb-1 tracking-tight">
                GymSync <span style={{ color: '#00D9FF' }}>Pro</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white text-center">Acceso Corporativo</h1>
              <p className="text-sm text-slate-500 dark:text-gray-400 text-center mt-2 mb-6">Introduce tus credenciales para acceder al sistema.</p>
              
              {error && (
                <motion.div 
                  className="login-error"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                >
                  {error}
                </motion.div>
              )}
              
              <form onSubmit={handleSubmit} className="login-form">
                <div className="input-group">
                  <div className="input-icon">
                    <MailIcon size={18} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@gymsync.com"
                    required
                    className="w-full bg-slate-50 dark:bg-[#151521] border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white rounded-lg pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2ecc71] transition-all placeholder:text-slate-400 dark:placeholder:text-gray-500"
                  />
                </div>
                <div className="input-group">
                  <div className="input-icon">
                    <LockIcon size={18} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-slate-50 dark:bg-[#151521] border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white rounded-lg pl-11 pr-11 py-3 focus:outline-none focus:ring-2 focus:ring-[#2ecc71] transition-all placeholder:text-slate-400 dark:placeholder:text-gray-500"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                  </button>
                </div>
                <button type="submit" className="btn-login" disabled={isSubmitting}>
                  {isSubmitting ? 'Verificando...' : 'Iniciar Sesión'}
                </button>
              </form>
              <div className="text-sm text-slate-600 dark:text-gray-400 text-center mt-6">
                ¿No tienes una cuenta?{' '}
                <span
                  onClick={() => navigate('/register')}
                  style={{ color: '#00D9FF', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}
                >
                  Regístrate aquí
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
