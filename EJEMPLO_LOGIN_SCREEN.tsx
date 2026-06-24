/**
 * EJEMPLO: LoginScreen.tsx
 * 
 * Pantalla de login que utiliza el contexto de autenticación.
 * Crear en: apps/mobile/resources/views/auth/LoginScreen.tsx
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../../../app/Shared/hooks/useAuth';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#999999',
  },
  formContainer: {
    marginBottom: 30,
  },
  label: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#1c1c1e',
    borderColor: '#444',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 16,
  },
  inputFocused: {
    borderColor: '#f05b22',
  },
  loginButton: {
    backgroundColor: '#f05b22',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  loginButtonDisabled: {
    backgroundColor: '#666',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorContainer: {
    backgroundColor: '#ff4444',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#ffffff',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    textAlign: 'center',
    color: '#999999',
    fontSize: 12,
    marginTop: 20,
  },
});

export const LoginScreen = () => {
  const { login, error, isLoading, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor ingresa email y contraseña');
      return;
    }

    const success = await login(email, password);
    if (success) {
      // El RootNavigator se actualizará automáticamente cuando isAuthenticated sea true
      Alert.alert('Éxito', 'Bienvenido a GymSync');
    } else {
      // El error ya se muestra debajo del formulario
      Alert.alert('Error', error || 'Error al iniciar sesión');
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#f05b22" />
        <Text style={{ color: '#ffffff', marginTop: 10 }}>Cargando...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>GymSync</Text>
          <Text style={styles.subtitle}>Inicia sesión para continuar</Text>
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Formulario */}
        <View style={styles.formContainer}>
          {/* Email */}
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[
              styles.input,
              emailFocused && styles.inputFocused,
            ]}
            placeholder="correo@ejemplo.com"
            placeholderTextColor="#666"
            value={email}
            onChangeText={setEmail}
            onFocus={() => {
              setEmailFocused(true);
              clearError();
            }}
            onBlur={() => setEmailFocused(false)}
            editable={!isLoading}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* Password */}
          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={[
              styles.input,
              passwordFocused && styles.inputFocused,
            ]}
            placeholder="••••••••"
            placeholderTextColor="#666"
            value={password}
            onChangeText={setPassword}
            onFocus={() => {
              setPasswordFocused(true);
              clearError();
            }}
            onBlur={() => setPasswordFocused(false)}
            editable={!isLoading}
            secureTextEntry
          />

          {/* Login Button */}
          <TouchableOpacity
            style={[
              styles.loginButton,
              isLoading && styles.loginButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footerText}>
          © 2026 GymSync. Todos los derechos reservados.
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};


