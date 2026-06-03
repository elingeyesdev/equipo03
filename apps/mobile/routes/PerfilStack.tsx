import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PerfilMenuScreen }          from '../resources/views/perfil/PerfilMenuScreen';
import { PerfilManagerScreen }       from '../resources/views/perfil/PerfilManagerScreen';
import { AlertasConfigScreen }       from '../resources/views/alertas/AlertasConfigScreen';
import { AjustesScreen }             from '../resources/views/perfil/AjustesScreen';
import { MisDatosPersonalesScreen }  from '../resources/views/perfil/MisDatosPersonalesScreen';
import { AuditoriaSucursalScreen }   from '../resources/views/perfil/AuditoriaSucursalScreen';
import { HistorialMetricasScreen }   from '../resources/views/perfil/HistorialMetricasScreen';
import { MisObjetivosScreen }        from '../resources/views/perfil/MisObjetivosScreen';
import { CarnetVirtualScreen }       from '../resources/views/perfil/CarnetVirtualScreen';

// ── Opciones de header compartidas ──────────────────────────────────────────
const hdr = (title: string) => ({
  headerShown: true,
  title,
  headerStyle: { backgroundColor: '#1E1E1E' },
  headerTintColor: '#fff',
} as const);

// ── Param lists ──────────────────────────────────────────────────────────────
export type ClientePerfilParamList = {
  Menu: undefined;
  DatosPersonales: undefined;
  Manager: undefined;
  AlertasConfig: undefined;
  Ajustes: undefined;
  HistorialMetricas: undefined;
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
    <ClienteStack.Screen name="HistorialMetricas" component={HistorialMetricasScreen}   options={hdr('Historial Físico')} />
    <ClienteStack.Screen name="MisObjetivos"      component={MisObjetivosScreen}         options={hdr('Mis Objetivos')} />
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
