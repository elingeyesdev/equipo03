import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UseCaseFactory } from '../../infrastructure/UseCaseFactory';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import './RegisterScreen.css';

// --- SVG ICONS ---
const UserIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const MailIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const PhoneIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const LockIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const EyeIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" y1="2" x2="22" y2="22" />
  </svg>
);

const BACKGROUND_IMAGES = [
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=2070&auto=format&fit=crop'
];

export const RegisterScreen = () => {
  const navigate = useNavigate();

  // --- FORM STATE ---
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- VALIDATION AND ERROR STATES ---
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  // --- CAROUSEL BACKGROUND ---
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % BACKGROUND_IMAGES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // --- FRONTEND VALIDATIONS (VALIDACIÓN EN ESPEJO) ---
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 1. Nombre obligatorio
    if (!name.trim()) {
      newErrors.name = 'El nombre completo es obligatorio.';
    }

    // 2. Formato de Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = 'El correo electrónico es obligatorio.';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Introduce una dirección de correo válida.';
    }

    // 3. Validación de Contraseña
    if (!password) {
      newErrors.password = 'La contraseña es obligatoria.';
    } else {
      if (password.length < 8) {
        newErrors.password = 'Debe tener al menos 8 caracteres.';
      } else if (!/\d/.test(password)) {
        newErrors.password = 'Debe contener al menos un número.';
      } else if (!/[@#$*!%&?^+\-_=~]/.test(password)) {
        newErrors.password = 'Debe contener al menos un carácter especial (ej. @, #, $, *).';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setErrors({});

    // 1. Validar localmente (Pre-validación frontend)
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // 2. Disparar el caso de uso del core a través de la fábrica
      const registrarClienteUC = UseCaseFactory.getRegistrarClienteUC();
      const payload = {
        name,
        email,
        password,
        phone: phone.trim() ? phone : undefined
      };

      const result = await registrarClienteUC.execute(payload);

      if (result.isRight()) {
        toast.success('¡Registro exitoso! Ya puedes iniciar sesión.');
        navigate('/login');
      } else {
        // El caso de uso devolvió un error de negocio o de infraestructura
        const errorMsg = result.value.message;
        setApiError(errorMsg);
      }
    } catch (err: any) {
      setApiError(err.message || 'Ocurrió un error inesperado durante el registro.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="register-wrapper">
      {/* Background Carousel */}
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

      {/* Floating Navbar */}
      <nav className="landing-navbar">
        <div className="navbar-logo">GymSync <span>Pro</span></div>
        <Link to="/login" className="btn-ghost-cyan">
          Iniciar Sesión
        </Link>
      </nav>

      {/* Glassmorphism Card */}
      <div className="register-view-container">
        <motion.div 
          className="register-card"
          initial={{ scale: 0.9, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ type: "spring", damping: 25, stiffness: 280 }}
        >
          <div className="brand-logo-small">GymSync <span>Pro</span></div>
          <h1 className="register-title">Crear Cuenta</h1>
          <p className="register-subtitle">Únete como Cliente de la red de gimnasios más avanzada.</p>

          {/* Banner de errores del Backend (HttpExceptionFilter de NestJS) */}
          <AnimatePresence>
            {apiError && (
              <motion.div 
                className="register-api-error"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="error-icon">⚠️</div>
                <div className="error-text">
                  <strong>Error de Registro:</strong>
                  <p>{apiError}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="register-form" noValidate>
            {/* Input Nombre */}
            <div className="form-field">
              <div className={`input-group ${errors.name ? 'has-error' : ''}`}>
                <div className="input-icon">
                  <UserIcon size={18} />
                </div>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                  }}
                  placeholder="Nombre Completo" 
                  required 
                />
              </div>
              {errors.name && <span className="field-error-text">{errors.name}</span>}
            </div>

            {/* Input Email */}
            <div className="form-field">
              <div className={`input-group ${errors.email ? 'has-error' : ''}`}>
                <div className="input-icon">
                  <MailIcon size={18} />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                  }}
                  placeholder="Correo electrónico" 
                  required 
                />
              </div>
              {errors.email && <span className="field-error-text">{errors.email}</span>}
            </div>

            {/* Input Teléfono (Opcional) */}
            <div className="form-field">
              <div className="input-group">
                <div className="input-icon">
                  <PhoneIcon size={18} />
                </div>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Número de celular (opcional)" 
                />
              </div>
            </div>

            {/* Input Contraseña */}
            <div className="form-field">
              <div className={`input-group ${errors.password ? 'has-error' : ''}`}>
                <div className="input-icon">
                  <LockIcon size={18} />
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                  }}
                  placeholder="Contraseña" 
                  required 
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
              {errors.password && <span className="field-error-text">{errors.password}</span>}
            </div>

            {/* Ayuda de Contraseña */}
            <div className="password-requirements">
              <span className={password.length >= 8 ? 'met' : ''}>• Mínimo 8 caracteres</span>
              <span className={/\d/.test(password) ? 'met' : ''}>• Al menos un número</span>
              <span className={/[@#$*!%&?^+\-_=~]/.test(password) ? 'met' : ''}>• Al menos un símbolo</span>
            </div>

            {/* Botón de Submit */}
            <button type="submit" className="btn-register" disabled={isSubmitting}>
              {isSubmitting ? 'Procesando cuenta...' : 'Crear Cuenta'}
            </button>
          </form>

          {/* Enlace para volver */}
          <div className="register-footer">
            ¿Ya tienes una cuenta? <Link to="/login" className="login-link">Inicia sesión aquí</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
