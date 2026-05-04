import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PerfilMenuScreen } from '../resources/views/perfil/PerfilMenuScreen';
import { PerfilManagerScreen } from '../resources/views/perfil/PerfilManagerScreen';
import { AlertasConfigScreen } from '../resources/views/alertas/AlertasConfigScreen';
import { AjustesScreen } from '../resources/views/perfil/AjustesScreen';

export type PerfilStackParamList = {
  Menu: undefined;
  Manager: undefined;
  AlertasConfig: undefined;
  Ajustes: undefined;
};

const Stack = createNativeStackNavigator<PerfilStackParamList>();

export const PerfilStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#000000' },
      }}
    >
      <Stack.Screen name="Menu" component={PerfilMenuScreen} />
      <Stack.Screen 
        name="Manager" 
        component={PerfilManagerScreen} 
        options={{
          headerShown: true,
          title: 'Gestor de Perfil',
          headerStyle: { backgroundColor: '#1E1E1E' },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen 
        name="AlertasConfig" 
        component={AlertasConfigScreen} 
        options={{
          headerShown: true,
          title: 'Alertas de Salud',
          headerStyle: { backgroundColor: '#1E1E1E' },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen 
        name="Ajustes" 
        component={AjustesScreen} 
        options={{
          headerShown: true,
          title: 'Ajustes',
          headerStyle: { backgroundColor: '#1E1E1E' },
          headerTintColor: '#fff',
        }}
      />
    </Stack.Navigator>
  );
};
