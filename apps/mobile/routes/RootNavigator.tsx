import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { PerfilStack } from './PerfilStack';
import { BuscarStack } from './BuscarStack';
import { InicioScreen } from '../resources/views/inicio/InicioScreen';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text } from 'react-native';

const Tab = createBottomTabNavigator();

const PlaceholderScreen = ({ name }: { name: string }) => (
  <View style={{ flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ color: '#ffffff', fontSize: 18 }}>{name} - En desarrollo</Text>
  </View>
);

export const RootNavigator = () => {
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
