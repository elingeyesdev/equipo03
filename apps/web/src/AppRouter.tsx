import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LoginScreen } from './components/Auth/LoginScreen';
import { DashboardLayout } from './components/Layout/DashboardLayout';
import { AuditoriaView } from './components/Auditoria/AuditoriaView';
import { ResumenView, UsuariosView, SedesView } from './components/Dashboard/DashboardViews';

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginScreen />} />
          
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route path="resumen" element={<ResumenView />} />
            <Route path="auditoria" element={<AuditoriaView />} />
            <Route path="usuarios" element={<UsuariosView />} />
            <Route path="sedes" element={<SedesView />} />
            <Route index element={<Navigate to="auditoria" replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard/auditoria" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};
