import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { HomePage } from './components/Home/HomePage';
import { LoginScreen } from './components/Auth/LoginScreen';
import { RegisterScreen } from './components/Auth/RegisterScreen';
import { DashboardLayout } from './components/Layout/DashboardLayout';
import { AuditoriaView } from './components/Auditoria/AuditoriaView';
import { ResumenView, UsuariosView, SedesView, SucursalesView, RolesView, MapaView, ActividadesView } from './components/Dashboard/DashboardViews';
import { RoleGuard } from './components/Auth/RoleGuard';
import { MedidasPlaceholder } from './components/Dashboard/Placeholders';
import { ReservasView } from './components/Reservas/ReservasView';
import { ExerciseCatalogScreen } from './pages/dashboard/ExerciseCatalogScreen';

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          containerStyle={{ zIndex: 99999 }}
          toastOptions={{
            style: {
              background: '#1C1C1E',
              color: '#fff',
              border: '1px solid #3A3A3C'
            }
          }}
        />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/register" element={<RegisterScreen />} />

          <Route path="/dashboard" element={<DashboardLayout />}>
            {/* Resumen: accesible a todos los roles autenticados */}
            <Route path="resumen" element={<ResumenView />} />

            {/* Las demás rutas pasan por RoleGuard v2 (consume NAV_ROUTES internamente) */}
            <Route path="auditoria" element={
              <RoleGuard routePath="auditoria"><AuditoriaView /></RoleGuard>
            } />

            <Route path="usuarios" element={
              <RoleGuard routePath="usuarios"><UsuariosView /></RoleGuard>
            } />

            <Route path="sedes" element={
              <RoleGuard routePath="sedes"><SedesView /></RoleGuard>
            } />

            <Route path="sucursales" element={
              <RoleGuard routePath="sucursales"><SucursalesView /></RoleGuard>
            } />

            <Route path="roles" element={
              <RoleGuard routePath="roles"><RolesView /></RoleGuard>
            } />

<Route path="mapa" element={
              <RoleGuard routePath="mapa"><MapaView /></RoleGuard>
            } />

            <Route path="actividades" element={
              <RoleGuard routePath="actividades"><ActividadesView /></RoleGuard>
            } />

            <Route path="ejercicios" element={
              <RoleGuard routePath="ejercicios"><ExerciseCatalogScreen /></RoleGuard>
            } />

            <Route path="reservas" element={
              <RoleGuard routePath="reservas"><ReservasView /></RoleGuard>
            } />

            <Route path="medidas" element={
              <RoleGuard routePath="medidas"><MedidasPlaceholder /></RoleGuard>
            } />

            <Route index element={<Navigate to="resumen" replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};
