import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAuth } from '../app/Shared/hooks/useAuth';

// ── Auth ─────────────────────────────────────────────────────────────────────
import { LoginScreen }          from '../resources/views/auth/LoginScreen';
import { RegisterScreen }       from '../resources/views/auth/RegisterScreen';
import { ForgotPasswordScreen } from '../resources/views/auth/ForgotPasswordScreen';
import { ResetPasswordScreen }  from '../resources/views/auth/ResetPasswordScreen';

// ── Pantallas comunes ─────────────────────────────────────────────────────────
import { InicioScreen }         from '../resources/views/inicio/InicioScreen';
import { BuscarStack }          from './BuscarStack';
import { ReservarHorarioScreen } from '../resources/views/reservas/ReservarHorarioScreen';

// ── Pantallas exclusivas por rol ──────────────────────────────────────────────
import { MisReservasScreen }      from '../app/Providers/reservations/screens/MisReservasScreen';
import { AuditoriaSucursalScreen } from '../resources/views/perfil/AuditoriaSucursalScreen';
import { EscanerScreen }          from '../resources/views/audit/EscanerScreen';

// ── Dashboards de inicio por rol ──────────────────────────────────────────────
import { ManagerDashboard }       from '../resources/views/inicio/ManagerDashboard';
import { InstructorDashboard }    from '../resources/views/inicio/InstructorDashboard';
import { TrainerDashboard }       from '../resources/views/inicio/TrainerDashboard';
import { NutritionistDashboard }  from '../resources/views/inicio/NutritionistDashboard';

// ── Stacks de Perfil segregados ───────────────────────────────────────────────
import { ClientePerfilStack, GerentePerfilStack } from './PerfilStack';

// ── Iconos de tabs ────────────────────────────────────────────────────────────
const TAB_ICON: Record<string, string> = {
  'Inicio':      'home',
  'Buscar':      'magnify',
  'Mis Reservas':'calendar',
  'Auditoría':   'clipboard-text-outline',
  'Perfil':      'account',
};

const tabScreenOptions = ({ route }: { route: { name: string } }) => ({
  headerShown: false,
  tabBarActiveTintColor:   '#f05b22',
  tabBarInactiveTintColor: '#666',
  tabBarStyle: {
    backgroundColor: '#1c1c1e',
    borderTopWidth:  0,
    position:        'absolute' as const,
    bottom:          24,
    left:            20,
    right:           20,
    borderRadius:    30,
    height:          65,
    paddingBottom:   10,
    paddingTop:      10,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: -4 },
    shadowOpacity:   0.3,
    shadowRadius:    10,
    elevation:       10,
  },
  tabBarIcon: ({ color }: { color: string }) => (
    <MaterialCommunityIcons
      name={(TAB_ICON[route.name] ?? 'circle') as any}
      size={28}
      color={color}
    />
  ),
});

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH STACK — sin acceso a pantallas autenticadas
// ═══════════════════════════════════════════════════════════════════════════════
const AuthNav = createNativeStackNavigator();
const AuthStack = () => (
  <AuthNav.Navigator screenOptions={{ headerShown: false, animation: 'none' }}>
    <AuthNav.Screen name="Login"          component={LoginScreen} />
    <AuthNav.Screen name="Register"       component={RegisterScreen} />
    <AuthNav.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <AuthNav.Screen name="ResetPassword"  component={ResetPasswordScreen} />
  </AuthNav.Navigator>
);

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENTE STACK — solo rutas de cliente; Auditoría y Escaner NO existen aquí
// ═══════════════════════════════════════════════════════════════════════════════
const ClienteTab = createBottomTabNavigator();
const ClienteTabs = () => (
  <ClienteTab.Navigator screenOptions={tabScreenOptions}>
    <ClienteTab.Screen name="Inicio"      component={InicioScreen} />
    <ClienteTab.Screen name="Buscar"      component={BuscarStack} />
    <ClienteTab.Screen name="Mis Reservas" component={MisReservasScreen} options={{ headerShown: false }} />
    <ClienteTab.Screen name="Perfil"      component={ClientePerfilStack} />
  </ClienteTab.Navigator>
);

const ClienteNav = createNativeStackNavigator();
const ClienteStack = () => (
  <ClienteNav.Navigator screenOptions={{ headerShown: false }}>
    <ClienteNav.Screen name="MainTabs"      component={ClienteTabs} />
    <ClienteNav.Screen
      name="ReservarHorario"
      component={ReservarHorarioScreen}
      options={{
        headerShown:       true,
        title:             'Nueva Reserva',
        headerStyle:       { backgroundColor: '#050505' },
        headerTintColor:   '#00D9FF',
        headerTitleStyle:  { fontWeight: 'bold' },
        headerBackTitle:   'Atrás',
      }}
    />
  </ClienteNav.Navigator>
);

// ═══════════════════════════════════════════════════════════════════════════════
// GERENTE STACK — solo rutas de gerente; MisReservas y HistorialMetricas NO existen aquí
// ═══════════════════════════════════════════════════════════════════════════════
const GerenteTab = createBottomTabNavigator();
const GerenteTabs = () => (
  <GerenteTab.Navigator screenOptions={tabScreenOptions}>
    <GerenteTab.Screen name="Inicio"    component={ManagerDashboard} />
    <GerenteTab.Screen name="Buscar"    component={BuscarStack} />
    <GerenteTab.Screen name="Auditoría" component={AuditoriaSucursalScreen} />
    <GerenteTab.Screen name="Perfil"    component={GerentePerfilStack} />
  </GerenteTab.Navigator>
);

const GerenteNav = createNativeStackNavigator();
const GerenteStack = () => (
  <GerenteNav.Navigator screenOptions={{ headerShown: false }}>
    <GerenteNav.Screen name="MainTabs" component={GerenteTabs} />
    <GerenteNav.Screen
      name="Escaner"
      component={EscanerScreen}
      options={{ headerShown: false }}
    />
  </GerenteNav.Navigator>
);

// ── Selector de inicio por subrole de Staff ───────────────────────────────────
const StaffHomeSelector = () => {
  const { user } = useAuth();
  if (user?.role === 'NUTRICIONISTA') return <NutritionistDashboard />;
  if (user?.role === 'INSTRUCTOR')    return <InstructorDashboard />;
  if (user?.role === 'ENTRENADOR')    return <TrainerDashboard />;
  return <InicioScreen />;
};

// ═══════════════════════════════════════════════════════════════════════════════
// STAFF STACK — ENTRENADOR / INSTRUCTOR / NUTRICIONISTA
// Sin MisReservasScreen ni rutas exclusivas de cliente
// ═══════════════════════════════════════════════════════════════════════════════
const StaffTab = createBottomTabNavigator();
const StaffTabs = () => (
  <StaffTab.Navigator screenOptions={tabScreenOptions}>
    <StaffTab.Screen name="Inicio"  component={StaffHomeSelector} />
    <StaffTab.Screen name="Buscar"  component={BuscarStack} />
    <StaffTab.Screen name="Perfil"  component={ClientePerfilStack} />
  </StaffTab.Navigator>
);

const StaffNav = createNativeStackNavigator();
const StaffStack = () => (
  <StaffNav.Navigator screenOptions={{ headerShown: false }}>
    <StaffNav.Screen name="MainTabs" component={StaffTabs} />
  </StaffNav.Navigator>
);

// ═══════════════════════════════════════════════════════════════════════════════
// ROL DESCONOCIDO — nunca permite acceso a pantallas autenticadas
// ═══════════════════════════════════════════════════════════════════════════════
const UnknownRoleScreen = () => (
  <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
    <MaterialCommunityIcons name="shield-off-outline" size={52} color="#666" />
    <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 16 }}>Rol no reconocido</Text>
    <Text style={{ color: '#555', fontSize: 13, marginTop: 8, textAlign: 'center', paddingHorizontal: 32 }}>
      Contacta al administrador.
    </Text>
  </View>
);

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT NAVIGATOR — switch exhaustivo por rol normalizado
// ═══════════════════════════════════════════════════════════════════════════════
export const RootNavigator = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#f05b22" />
      </View>
    );
  }

  if (!isAuthenticated) return <AuthStack />;

  switch (user?.role?.toUpperCase()) {
    case 'SUPER_ADMIN':
    case 'GERENTE':
    case 'COORDINADOR':
      return <GerenteStack />;

    case 'ENTRENADOR':
    case 'INSTRUCTOR':
    case 'NUTRICIONISTA':
      return <StaffStack />;

    case 'USER':
    case 'CLIENTE':
      return <ClienteStack />;

    default:
      return <UnknownRoleScreen />;
  }
};

export default RootNavigator;
