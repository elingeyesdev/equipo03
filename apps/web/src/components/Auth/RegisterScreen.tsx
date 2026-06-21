import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { apiClient } from '../../infrastructure/api.config';
import './RegisterScreen.css';

// ─── SVG Icons ───────────────────────────────────────────────────────────────
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
const PhoneIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);
const IdCardIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="14" x="2" y="5" rx="2" />
    <circle cx="8" cy="12" r="2" />
    <path d="M14 9h4M14 12h4M14 15h2" />
  </svg>
);
const CheckCircleIcon = ({ size = 48 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const BACKGROUND_IMAGES = [
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1920',
  'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1920',
];

const inputCls = (hasError: boolean) =>
  `w-full bg-slate-50 dark:bg-[#151521] border ${hasError ? 'border-red-500' : 'border-slate-200 dark:border-gray-700'} text-slate-900 dark:text-white rounded-lg pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2ecc71] transition-all placeholder:text-slate-400 dark:placeholder:text-gray-500`;

export const RegisterScreen = () => {
  const navigate = useNavigate();

  const [name,         setName]         = useState('');
  const [phone,        setPhone]        = useState('');
  const [ci,           setCi]           = useState('');
  const [email,        setEmail]        = useState('');
  const [gender,       setGender]       = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSubmitting,      setIsSubmitting]      = useState(false);
  const [errors,            setErrors]            = useState<Record<string, string>>({});
  const [apiError,          setApiError]          = useState<string | null>(null);
  const [registered,        setRegistered]        = useState(false); // vista de éxito

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % BACKGROUND_IMAGES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim())                                       errs.name     = 'El nombre completo es obligatorio.';
    if (!phone.trim())                                      errs.phone    = 'El número de teléfono es obligatorio.';
    else if (!/^\d{7,15}$/.test(phone.trim()))              errs.phone    = 'Introduce un número de teléfono válido (solo dígitos, 7-15).';
    if (!ci.trim())                                         errs.ci       = 'El carnet de identidad es obligatorio.';
    if (!email.trim())                                      errs.email    = 'El correo electrónico es obligatorio.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))    errs.email    = 'Introduce una dirección de correo válida.';
    if (!password)                                          errs.password = 'La contraseña es obligatoria.';
    else if (password.length < 8)                          errs.password = 'Debe tener al menos 8 caracteres.';
    else if (!/\d/.test(password))                         errs.password = 'Debe contener al menos un número.';
    else if (!/[@#$*!%&?^+\-_=~]/.test(password))         errs.password = 'Debe contener al menos un carácter especial.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setErrors({});
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const parts     = name.trim().split(' ');
      const firstName = parts[0] || '';
      const lastName  = parts.slice(1).join(' ') || '-';

      // El endpoint público /auth/register solo acepta campos básicos.
      // La asignación del rol GERENTE + sucursal la hace el Super Admin
      // desde el panel Usuarios → "Nuevo Usuario".
      await apiClient.post(
        '/auth/register',
        {
          firstName, lastName,
          email: email.trim().toLowerCase(),
          password,
          phone: phone.trim(),
          ci: ci.trim(),
          ...(gender ? { gender } : {}),
        },
        { _skipErrorToast: true } as any,
      );

      setRegistered(true);
    } catch (err: any) {
      const body   = err?.response?.data;
      const status = err?.response?.status;
      if (status === 400 && body) {
        const raw = body.message || 'Error de validación';
        setApiError(Array.isArray(raw) ? '• ' + raw.join('\n• ') : String(raw));
      } else {
        setApiError(body?.message || err?.message || 'Ocurrió un error inesperado.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="register-wrapper">
      {/* Background */}
      <div className="carousel-container">
        <AnimatePresence mode="popLayout">
          <motion.img key={currentImageIndex} src={BACKGROUND_IMAGES[currentImageIndex]}
            alt="Gym Background" className="carousel-image"
            initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
          />
        </AnimatePresence>
        <div className="carousel-overlay" />
      </div>

      <nav className="landing-navbar">
        <div>
          <div className="navbar-logo">GymSync <span>Suite</span></div>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '5px 14px', borderRadius: 6, background: 'rgba(255,255,255,0.1)', color: '#fff', textDecoration: 'none', fontSize: 12, fontWeight: 600 }}>← Inicio</Link>
        </div>
        <Link to="/login" className="btn-ghost-cyan">Iniciar Sesión</Link>
      </nav>

      <div className="register-view-container">
        <motion.div
          className="w-full max-w-md bg-white dark:bg-bg-surface border border-slate-200 dark:border-bg-deep rounded-2xl p-8"
          initial={{ scale: 0.9, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
        >
          <div className="text-xl font-extrabold text-slate-900 dark:text-white text-center mb-1 tracking-tight">
            GymSync <span style={{ color: '#F97316' }}>Suite</span>
          </div>

          {/* ── Vista de éxito ── */}
          {registered ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '16px 0' }}>
              <div style={{ color: '#00E5A3' }}><CheckCircleIcon size={56} /></div>
              <h2 style={{ color: 'inherit', fontSize: '1.25rem', fontWeight: 800, textAlign: 'center', margin: 0 }}>
                ¡Cuenta creada!
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.88rem', textAlign: 'center', lineHeight: 1.6, margin: 0 }}>
                Tu cuenta fue registrada con el correo <strong style={{ color: '#94a3b8' }}>{email}</strong>.
              </p>

              {/* Instrucción para el admin */}
              <div style={{ background: '#1C1C1E', border: '1px solid #38BDF8', borderRadius: '12px', padding: '14px 16px', width: '100%' }}>
                <p style={{ margin: '0 0 8px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#38BDF8' }}>
                  Paso siguiente
                </p>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b', lineHeight: 1.6 }}>
                  Para acceder a la plataforma, un <strong style={{ color: '#e2e8f0' }}>Super Administrador</strong> debe
                  asignarte el rol de <strong style={{ color: '#FF5E00' }}>Gerente</strong> y tu sucursal desde el
                  panel <strong style={{ color: '#e2e8f0' }}>Usuarios → Editar usuario</strong>.
                </p>
              </div>

              <button
                onClick={() => navigate('/login')}
                className="w-full bg-brand-celeste text-black font-medium py-3 rounded-lg"
              >
                Ir al Inicio de Sesión
              </button>
            </div>
          ) : (
            /* ── Formulario de registro ── */
            <>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white text-center">Crear Cuenta</h1>
              <p className="text-sm text-slate-500 dark:text-gray-400 text-center mt-2 mb-4">
                Crea tu cuenta y luego el administrador te asignará el acceso.
              </p>

              {/* Aviso informativo */}
              <div style={{ background: '#1C1C1E', border: '1px solid #FF5E00', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1rem', flexShrink: 0 }}>ℹ️</span>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5 }}>
                  Esta plataforma es de uso <strong style={{ color: '#FF5E00' }}>administrativo</strong>.
                  Tras registrarte, un Super Admin te asignará el rol de <strong>Gerente</strong> y tu sucursal.
                </p>
              </div>

              <AnimatePresence>
                {apiError && (
                  <motion.div className="register-api-error"
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                    <div className="error-icon">⚠️</div>
                    <div className="error-text">
                      <strong>Error de Registro:</strong>
                      <p style={{ whiteSpace: 'pre-line' }}>{apiError}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="register-form" noValidate>
                {/* Nombre */}
                <div className="form-field">
                  <div className={`input-group ${errors.name ? 'has-error' : ''}`}>
                    <div className="input-icon"><UserIcon size={18} /></div>
                    <input type="text" value={name}
                      onChange={e => { setName(e.target.value); if (errors.name) setErrors(p => ({ ...p, name: '' })); }}
                      placeholder="Nombre Completo" required className={inputCls(!!errors.name)} />
                  </div>
                  {errors.name && <span className="field-error-text">{errors.name}</span>}
                </div>

                {/* Teléfono */}
                <div className="form-field">
                  <div className={`input-group ${errors.phone ? 'has-error' : ''}`}>
                    <div className="input-icon"><PhoneIcon size={18} /></div>
                    <input type="tel" value={phone}
                      onChange={e => { setPhone(e.target.value); if (errors.phone) setErrors(p => ({ ...p, phone: '' })); }}
                      placeholder="Número de teléfono" required className={inputCls(!!errors.phone)} />
                  </div>
                  {errors.phone && <span className="field-error-text">{errors.phone}</span>}
                </div>

                {/* Carnet de Identidad */}
                <div className="form-field">
                  <div className={`input-group ${errors.ci ? 'has-error' : ''}`}>
                    <div className="input-icon"><IdCardIcon size={18} /></div>
                    <input type="text" value={ci}
                      onChange={e => { setCi(e.target.value); if (errors.ci) setErrors(p => ({ ...p, ci: '' })); }}
                      placeholder="Carnet de Identidad (CI)" required className={inputCls(!!errors.ci)} />
                  </div>
                  {errors.ci && <span className="field-error-text">{errors.ci}</span>}
                </div>

                {/* Género */}
                <div className="form-field">
                  <label className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">Género — opcional</label>
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value)}
                    className={inputCls(false)}
                    style={{ paddingLeft: '0.75rem' }}
                  >
                    <option value="">Sin especificar</option>
                    <option value="MALE">Masculino</option>
                    <option value="FEMALE">Femenino</option>
                    <option value="OTHER">Otro</option>
                  </select>
                </div>

                {/* Email */}
                <div className="form-field">
                  <div className={`input-group ${errors.email ? 'has-error' : ''}`}>
                    <div className="input-icon"><MailIcon size={18} /></div>
                    <input type="email" value={email}
                      onChange={e => { setEmail(e.target.value); if (errors.email) setErrors(p => ({ ...p, email: '' })); }}
                      placeholder="Correo electrónico" required className={inputCls(!!errors.email)} />
                  </div>
                  {errors.email && <span className="field-error-text">{errors.email}</span>}
                </div>

                {/* Contraseña */}
                <div className="form-field">
                  <div className={`input-group ${errors.password ? 'has-error' : ''}`}>
                    <div className="input-icon"><LockIcon size={18} /></div>
                    <input
                      type={showPassword ? 'text' : 'password'} value={password}
                      onChange={e => { setPassword(e.target.value); if (errors.password) setErrors(p => ({ ...p, password: '' })); }}
                      placeholder="Contraseña" required
                      className={`w-full bg-slate-50 dark:bg-[#151521] border ${errors.password ? 'border-red-500' : 'border-slate-200 dark:border-gray-700'} text-slate-900 dark:text-white rounded-lg pl-11 pr-11 py-3 focus:outline-none focus:ring-2 focus:ring-[#2ecc71] transition-all placeholder:text-slate-400 dark:placeholder:text-gray-500`}
                    />
                    <button type="button" className="password-toggle-btn" onClick={() => setShowPassword(v => !v)} tabIndex={-1}>
                      {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                    </button>
                  </div>
                  {errors.password && <span className="field-error-text">{errors.password}</span>}
                  <div className="text-xs text-slate-500 dark:text-gray-400 space-y-1 mt-1 pl-1">
                    <span className={`block ${password.length >= 8 ? 'met' : ''}`}>• Mínimo 8 caracteres</span>
                    <span className={`block ${/\d/.test(password) ? 'met' : ''}`}>• Al menos un número</span>
                    <span className={`block ${/[@#$*!%&?^+\-_=~]/.test(password) ? 'met' : ''}`}>• Al menos un símbolo</span>
                  </div>
                </div>

                <button type="submit" disabled={isSubmitting}
                  className="w-full bg-brand-celeste text-black font-medium py-3 rounded-lg mt-6 disabled:opacity-60 disabled:cursor-not-allowed">
                  {isSubmitting ? 'Creando cuenta...' : 'Crear Cuenta'}
                </button>
              </form>

              <div className="text-sm text-slate-600 dark:text-gray-400 text-center mt-6">
                ¿Ya tienes una cuenta? <Link to="/login" className="login-link">Inicia sesión aquí</Link>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};
