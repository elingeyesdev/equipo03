import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BuscarScreen } from '../resources/views/buscar/BuscarScreen';
import { MapScreenContainer } from '../resources/views/geolocation/MapScreen/MapScreen.container';
import { HistorialScreen } from '../resources/views/buscar/HistorialScreen';
import { ScheduleSelectionScreen } from '../app/Providers/reservations/screens/ScheduleSelectionScreen';
import { MisReservasScreen } from '../app/Providers/reservations/screens/MisReservasScreen';

export type BuscarStackParamList = {
  BuscarHome: undefined;
  Mapa: undefined;
  Historial: undefined;
  // gymId en lugar de activityId — el endpoint real es /api/gyms/:gymId/activities
  ScheduleSelection: { gymId: number; gymName: string };
  MisReservas: undefined;
};

const Stack = createNativeStackNavigator<BuscarStackParamList>();

export const BuscarStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#000000' },
      }}
    >
      <Stack.Screen name="BuscarHome" component={BuscarScreen} />
      <Stack.Screen
        name="Mapa"
        component={MapScreenContainer}
        options={{
          headerShown: true,
          title: 'Sedes Cercanas',
          headerStyle: { backgroundColor: '#1E1E1E' },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen
        name="Historial"
        component={HistorialScreen}
        options={{
          headerShown: true,
          title: 'Historial de Gimnasios',
          headerStyle: { backgroundColor: '#1E1E1E' },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen
        name="ScheduleSelection"
        component={ScheduleSelectionScreen}
        options={{
          headerShown: true,
          title: 'Reservar Horario',
          headerStyle: { backgroundColor: '#1E1E1E' },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen
        name="MisReservas"
        component={MisReservasScreen}
        options={{
          headerShown: true,
          title: 'Mis Reservas',
          headerStyle: { backgroundColor: '#1E1E1E' },
          headerTintColor: '#fff',
        }}
      />
    </Stack.Navigator>
  );
};
