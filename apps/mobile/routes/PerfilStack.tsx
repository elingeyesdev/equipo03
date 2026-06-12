import React from 'react';
import { TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PerfilMenuScreen }          from '../resources/views/perfil/PerfilMenuScreen';
import { PerfilManagerScreen }       from '../resources/views/perfil/PerfilManagerScreen';
import { AlertasConfigScreen }       from '../resources/views/alertas/AlertasConfigScreen';
import { AjustesScreen }             from '../resources/views/perfil/AjustesScreen';
import { MisDatosPersonalesScreen }  from '../resources/views/perfil/MisDatosPersonalesScreen';
import { AuditoriaSucursalScreen }   from '../resources/views/perfil/AuditoriaSucursalScreen';
import { MisObjetivosScreen }        from '../resources/views/perfil/MisObjetivosScreen';
import { CarnetVirtualScreen }       from '../resources/views/perfil/CarnetVirtualScreen';

const backBtnStyle = { width: 40, height: 40, marginLeft: 4, backgroundColor: '#1C1C1E', borderRadius: 12, borderWidth: 1, borderColor: '#3A3A3C', justifyContent: 'center' as const, alignItems: 'center' as const };

// ── Opciones de header compartidas ──────────────────────────────────────────
const hdr = (title: string) => ({ navigation }: { navigation: any }) => ({
  headerShown: true,
  title,
  headerStyle:       { backgroundColor: '#1E1E1E' },
  headerTintColor:   '#fff',
  headerBackVisible: false,
  headerLeft: () => (
    <TouchableOpacity style={backBtnStyle} onPress={() => navigation.goBack()}>
      <MaterialCommunityIcons name="chevron-left" size={22} color="#fff" />
    </TouchableOpacity>
  ),
});

// ── Param lists ──────────────────────────────────────────────────────────────
export type ClientePerfilParamList = {
  Menu: undefined;
  DatosPersonales: undefined;
  Manager: undefined;
  AlertasConfig: undefined;
  Ajustes: undefined;
  MisObjetivos: undefined;
  CarnetDigital: undefined;
};

export type GerentePerfilParamList = {
  Menu: undefined;
  DatosPersonales: undefined;
  Manager: undefined;
  AlertasConfig: undefined;
  Ajustes: undefined;
  AuditoriaSucursal: undefined;
};

const ClienteStack  = createNativeStackNavigator<ClientePerfilParamList>();
const GerenteStack  = createNativeStackNavigator<GerentePerfilParamList>();

const screenOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: '#000000' },
} as const;

// ── Stack para rol CLIENTE / USER ────────────────────────────────────────────
// NO contiene AuditoriaSucursalScreen — ruta físicamente inexistente para clientes
export const ClientePerfilStack = () => (
  <ClienteStack.Navigator screenOptions={screenOptions}>
    <ClienteStack.Screen name="Menu"             component={PerfilMenuScreen} />
    <ClienteStack.Screen name="DatosPersonales"  component={MisDatosPersonalesScreen}  options={hdr('Mis Datos Personales')} />
    <ClienteStack.Screen name="Manager"          component={PerfilManagerScreen}        options={hdr('Mi Perfil')} />
    <ClienteStack.Screen name="AlertasConfig"    component={AlertasConfigScreen}        options={hdr('Alertas de Salud')} />
    <ClienteStack.Screen name="Ajustes"          component={AjustesScreen}              options={hdr('Ajustes')} />
    <ClienteStack.Screen name="MisObjetivos"      component={MisObjetivosScreen}         options={{ headerShown: false }} />
    <ClienteStack.Screen name="CarnetDigital"     component={CarnetVirtualScreen}        options={hdr('Mi Carnet Digital')} />
  </ClienteStack.Navigator>
);

// ── Stack para rol GERENTE / COORDINADOR ─────────────────────────────────────
// NO contiene HistorialMetricasScreen — ruta físicamente inexistente para gerentes
export const GerentePerfilStack = () => (
  <GerenteStack.Navigator screenOptions={screenOptions}>
    <GerenteStack.Screen name="Menu"             component={PerfilMenuScreen} />
    <GerenteStack.Screen name="DatosPersonales"  component={MisDatosPersonalesScreen}  options={hdr('Mis Datos Personales')} />
    <GerenteStack.Screen name="Manager"          component={PerfilManagerScreen}        options={hdr('Mi Perfil')} />
    <GerenteStack.Screen name="AlertasConfig"    component={AlertasConfigScreen}        options={hdr('Alertas de Salud')} />
    <GerenteStack.Screen name="Ajustes"          component={AjustesScreen}              options={hdr('Ajustes')} />
    <GerenteStack.Screen name="AuditoriaSucursal" component={AuditoriaSucursalScreen}   options={hdr('Auditoría de Sucursal')} />
  </GerenteStack.Navigator>
);

// Alias legacy — evita romper imports existentes
export const PerfilStack = ClientePerfilStack;
export type  PerfilStackParamList = ClientePerfilParamList;
