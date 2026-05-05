import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Text } from 'react-native';
import { useAuth } from '../app/Shared/hooks/useAuth';
import { PerfilStack } from './PerfilStack';
import { BuscarStack } from './BuscarStack';
import { InicioScreen } from '../resources/views/inicio/InicioScreen';
import { LoginScreen } from '../resources/views/auth/LoginScreen';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MisReservasScreen } from '../app/Providers/reservations/screens/MisReservasScreen';
import { AuditHistoryScreen } from '../resources/views/audit/AuditHistoryScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const PlaceholderScreen = ({ name }: { name: string }) => (
  <View style={{ flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ color: '#ffffff', fontSize: 18 }}>{name} - En desarrollo</Text>
  </View>
);

const AppTabs = () => {
  const { user } = useAuth();

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
        tabBarIcon: ({ color }) => {
          let iconName: any = 'home';
          if (route.name === 'Inicio') iconName = 'home';
          else if (route.name === 'Buscar') iconName = 'magnify';
          else if (route.name === 'Reservas') iconName = 'calendar';
          else if (route.name === 'Perfil') iconName = 'account';
          else if (route.name === 'Auditoría') iconName = 'clipboard-text-outline';

          return <MaterialCommunityIcons name={iconName} size={28} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Inicio" component={InicioScreen} />
      <Tab.Screen name="Buscar" component={BuscarStack} />
      <Tab.Screen
        name="Mis Reservas"
        component={MisReservasScreen}
        options={{ headerShown: false }}
      />
      {user?.role === 'GERENTE' && (
        <Tab.Screen name="Auditoría" component={AuditHistoryScreen} />
      )}
      <Tab.Screen name="Perfil" component={PerfilStack} />
    </Tab.Navigator>
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

  return isAuthenticated ? <AppTabs /> : <AuthStack />;
};

export default RootNavigator;
