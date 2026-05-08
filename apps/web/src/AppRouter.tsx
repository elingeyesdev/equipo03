import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { LoginScreen } from './components/Auth/LoginScreen';
import { DashboardLayout } from './components/Layout/DashboardLayout';
import { AuditoriaView } from './components/Auditoria/AuditoriaView';
import { ResumenView, UsuariosView, SedesView, RutinasView, RolesView } from './components/Dashboard/DashboardViews';
import { RoleGuard } from './components/Auth/RoleGuard';
import { ReservasPlaceholder, MedidasPlaceholder } from './components/Dashboard/Placeholders';

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1C1C1E',
              color: '#fff',
              border: '1px solid #3A3A3C'
            }
          }}
        />
        <Routes>
          <Route path="/login" element={<LoginScreen />} />

          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route path="resumen" element={<ResumenView />} />

            {/* Rutas para SUPER_ADMIN y GERENTE */}
            <Route path="auditoria" element={
              <RoleGuard allowedRoles={['SUPER_ADMIN', 'GERENTE']}>
                <AuditoriaView />
              </RoleGuard>
            } />

            {/* Rutas para SUPER_ADMIN, GERENTE, ENTRENADOR, NUTRICIONISTA */}
            <Route path="usuarios" element={
              <RoleGuard allowedRoles={['SUPER_ADMIN', 'GERENTE', 'ENTRENADOR', 'NUTRICIONISTA']}>
                <UsuariosView />
              </RoleGuard>
            } />

            {/* Rutas solo para SUPER_ADMIN */}
            <Route path="sedes" element={
              <RoleGuard allowedRoles={['SUPER_ADMIN']}>
                <SedesView />
              </RoleGuard>
            } />

            {/* Roles: Solo SUPER_ADMIN */}
            <Route path="roles" element={
              <RoleGuard allowedRoles={['SUPER_ADMIN']}>
                <RolesView />
              </RoleGuard>
            } />

            {/* Rutinas: SUPER_ADMIN, ENTRENADOR, NUTRICIONISTA, CLIENTE */}
            <Route path="rutinas" element={
              <RoleGuard allowedRoles={['SUPER_ADMIN', 'ENTRENADOR', 'NUTRICIONISTA', 'CLIENTE']}>
                <RutinasView />
              </RoleGuard>
            } />

            {/* Reservas: GERENTE, CLIENTE */}
            <Route path="reservas" element={
              <RoleGuard allowedRoles={['GERENTE', 'CLIENTE']}>
                <ReservasPlaceholder />
              </RoleGuard>
            } />

            {/* Medidas: CLIENTE */}
            <Route path="medidas" element={
              <RoleGuard allowedRoles={['CLIENTE']}>
                <MedidasPlaceholder />
              </RoleGuard>
            } />

            <Route index element={<Navigate to="resumen" replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard/resumen" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};
