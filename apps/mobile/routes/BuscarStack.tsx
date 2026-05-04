import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BuscarScreen } from '../resources/views/buscar/BuscarScreen';
import { MapScreenContainer } from '../resources/views/geolocation/MapScreen/MapScreen.container';
import { HistorialScreen } from '../resources/views/buscar/HistorialScreen';
import { ScheduleSelectionScreen } from '../app/Providers/reservations/screens/ScheduleSelectionScreen';
import { ReservationSuccessScreen } from '../app/Providers/reservations/screens/ReservationSuccessScreen';

export type BuscarStackParamList = {
  BuscarHome: undefined;
  Mapa: undefined;
  Historial: undefined;
  ScheduleSelection: { activityId: number; gymName: string; defaultDate?: string };
  ReservationSuccess: { qrToken: string; activityName: string };
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
        name="ReservationSuccess"
        component={ReservationSuccessScreen}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
};
