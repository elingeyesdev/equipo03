import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Text } from 'react-native';
import { useAuth } from '../app/Shared/hooks/useAuth';
import { PerfilStack } from './PerfilStack';
import { BuscarStack } from './BuscarStack';
import { InicioScreen } from '../resources/views/inicio/InicioScreen';
import { LoginScreen } from '../resources/views/auth/LoginScreen';
import { RegisterScreen } from '../resources/views/auth/RegisterScreen';
import { ForgotPasswordScreen } from '../resources/views/auth/ForgotPasswordScreen';
import { ResetPasswordScreen } from '../resources/views/auth/ResetPasswordScreen';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MisReservasScreen } from '../app/Providers/reservations/screens/MisReservasScreen';
import { AuditoriaSucursalScreen } from '../resources/views/perfil/AuditoriaSucursalScreen';
import { EscanerScreen } from '../resources/views/audit/EscanerScreen';
import { ReservarHorarioScreen } from '../resources/views/reservas/ReservarHorarioScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ── Placeholders de staff (sin navegación aún) ────────────────────────────────
const AgendaScreenPlaceholder = () => (
  <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
    <MaterialCommunityIcons name="calendar-clock" size={52} color="#f05b22" />
    <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 16 }}>Mi Agenda</Text>
    <Text style={{ color: '#555', fontSize: 13, marginTop: 8 }}>Próximamente</Text>
  </View>
);

const PacientesScreenPlaceholder = () => (
  <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
    <MaterialCommunityIcons name="account-heart-outline" size={52} color="#06d6a0" />
    <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 16 }}>Mis Pacientes</Text>
    <Text style={{ color: '#555', fontSize: 13, marginTop: 8 }}>Próximamente</Text>
  </View>
);

// ── Mapa de iconos por nombre de tab ──────────────────────────────────────────
const TAB_ICON: Record<string, string> = {
  'Inicio':       'home',
  'Buscar':       'magnify',
  'Mis Reservas': 'calendar',
  'Auditoría':    'clipboard-text-outline',
  'Mi Agenda':    'calendar-clock',
  'Pacientes':    'account-heart-outline',
  'Perfil':       'account',
};

const AppTabs = () => {
  const { user } = useAuth();
  const role = user?.role ?? '';

  const isCliente    = role === 'USER'    || role === 'CLIENTE'  || role === '';
  const isGerente    = role === 'GERENTE' || role === 'COORDINADOR';
  const isTrainer    = role === 'INSTRUCTOR' || role === 'ENTRENADOR';
  const isNutri      = role === 'NUTRICIONISTA';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#f05b22',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#1c1c1e',
          borderTopWidth: 0,
          position: 'absolute',
          bottom: 24,
          left: 20,
          right: 20,
          borderRadius: 30,
          height: 65,
          paddingBottom: 10,
          paddingTop: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.3,
          shadowRadius: 10,
          elevation: 10,
        },
        tabBarIcon: ({ color }) => (
          <MaterialCommunityIcons
            name={(TAB_ICON[route.name] ?? 'circle') as any}
            size={28}
            color={color}
          />
        ),
      })}
    >
      {/* ── Tabs estáticos para todos ── */}
      <Tab.Screen name="Inicio" component={InicioScreen} />
      <Tab.Screen name="Buscar" component={BuscarStack} />

      {/* ── Solo CLIENTE / USER ── */}
      {isCliente && (
        <Tab.Screen
          name="Mis Reservas"
          component={MisReservasScreen}
          options={{ headerShown: false }}
        />
      )}

      {/* ── Solo GERENTE / COORDINADOR ── */}
      {isGerente && (
        <Tab.Screen name="Auditoría" component={AuditoriaSucursalScreen} />
      )}

      {/* ── Solo INSTRUCTOR / ENTRENADOR ── */}
      {isTrainer && (
        <Tab.Screen name="Mi Agenda" component={AgendaScreenPlaceholder} />
      )}

      {/* ── Solo NUTRICIONISTA ── */}
      {isNutri && (
        <Tab.Screen name="Pacientes" component={PacientesScreenPlaceholder} />
      )}

      {/* ── Perfil estático para todos ── */}
      <Tab.Screen name="Perfil" component={PerfilStack} />
    </Tab.Navigator>
  );
};

const AppStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MainTabs" component={AppTabs} />
      <Stack.Screen
        name="ReservarHorario"
        component={ReservarHorarioScreen}
        options={{
          headerShown: true,
          title: 'Nueva Reserva',
          headerStyle: { backgroundColor: '#050505' },
          headerTintColor: '#00D9FF',
          headerTitleStyle: { fontWeight: 'bold' },
          headerBackTitle: 'Atrás',
        }}
      />
      <Stack.Screen
        name="Escaner"
        component={EscanerScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'none',
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
};

export const RootNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#f05b22" />
      </View>
    );
  }

  return isAuthenticated ? <AppStack /> : <AuthStack />;
};

export default RootNavigator;
