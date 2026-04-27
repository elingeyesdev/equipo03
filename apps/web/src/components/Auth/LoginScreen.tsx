import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './LoginScreen.css';

export const LoginScreen = () => {
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    <div className="login-container">
      <div className="login-card">
        <div className="brand-logo">GymSync <span>Pro</span></div>
        <h1 className="login-title">Acceso Corporativo</h1>
        <p className="login-subtitle">Introduce tus credenciales para acceder al sistema.</p>
        
        {error && <div className="login-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label>Correo Electrónico</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@gymsync.com" 
              required 
            />
          </div>
          <div className="input-group">
            <label>Contraseña</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              required 
            />
          </div>
          <button type="submit" className="btn-login" disabled={isSubmitting}>
            {isSubmitting ? 'Verificando...' : 'Ingresar'}
          </button>
        </form>

      </div>
    </div>
  );
};
