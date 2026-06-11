import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MapScreenContainer } from '../resources/views/geolocation/MapScreen/MapScreen.container';

export type GeolocationStackParamList = {
  MapScreen: undefined;
};

const Stack = createNativeStackNavigator<GeolocationStackParamList>();

export const GeolocationStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#1a1a2e' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="MapScreen"
        component={MapScreenContainer}
        options={{
          title: 'Sedes Cercanas',
        }}
      />
    </Stack.Navigator>
  );
};
