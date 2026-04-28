/**
 * GUÍA DE INTEGRACIÓN: RootNavigator con Autenticación
 * 
 * Este archivo muestra cómo actualizar routes/RootNavigator.tsx para mostrar
 * una pantalla de login cuando el usuario no está autenticado.
 */

// apps/mobile/routes/RootNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../app/Shared/hooks/useAuth';
import { PerfilStack } from './PerfilStack';
import { BuscarStack } from './BuscarStack';
import { InicioScreen } from '../resources/views/inicio/InicioScreen';
import { LoginScreen } from '../resources/views/auth/LoginScreen'; // <-- Crear este archivo
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from 'react-native';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const PlaceholderScreen = ({ name }: { name: string }) => (
  <View style={{ flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ color: '#ffffff', fontSize: 18 }}>{name} - En desarrollo</Text>
  </View>
);

const AppTabs = () => {
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

          return <MaterialCommunityIcons name={iconName} size={28} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Inicio" component={InicioScreen} />
      <Tab.Screen name="Buscar" component={BuscarStack} />
      <Tab.Screen name="Reservas">
        {() => <PlaceholderScreen name="Reservas" />}
      </Tab.Screen>
      <Tab.Screen name="Perfil" component={PerfilStack} />
    </Tab.Navigator>
  );
};

/**
 * AuthStack — Navegación para usuarios no autenticados
 */
const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
};

/**
 * RootNavigator — Punto de decisión entre Auth y App
 * Verifica si el usuario está autenticado y muestra la navegación correspondiente
 */
export const RootNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Mientras se restaura la sesión, mostrar un loader
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#f05b22" />
      </View>
    );
  }

  // Mostrar Login si no está autenticado, App Tabs si sí
  return isAuthenticated ? <AppTabs /> : <AuthStack />;
};

export default RootNavigator;

/**
 * CAMBIOS A REALIZAR:
 * 
 * 1. Reemplazar todo el contenido de apps/mobile/routes/RootNavigator.tsx
 *    con el código anterior.
 * 
 * 2. Crear el archivo apps/mobile/resources/views/auth/LoginScreen.tsx
 *    (Ver EJEMPLO_LOGIN_SCREEN.txt)
 * 
 * 3. Asegurarse de que el AuthProvider envuelve la aplicación en App.tsx
 *    (Ya debe estar hecho según los cambios anteriores)
 * 
 * FLUJO RESULTANTE:
 * - Usuario inicia app sin sesión → LoginScreen
 * - Usuario hace login → Credenciales van a backend
 * - Backend retorna token → Se guarda en AsyncStorage
 * - AuthProvider actualiza estado → isAuthenticated = true
 * - RootNavigator re-renderiza → Muestra AppTabs
 * - Todas las peticiones llevan el token en Authorization header
 */
