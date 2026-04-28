/**
 * App.tsx — Punto de entrada de GymSync.
 * 
 * Configura:
 * - AuthProvider (contexto de autenticación)
 * - Navigation
 * - SafeArea
 * - Módulos principales
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './app/Providers/auth/AuthContext';
import { RootNavigator } from './routes/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}


