

import React, { useState, useEffect, useRef } from 'react';
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
  StatusBar,
  Animated,
  Dimensions,
  Keyboard,
  Linking,
} from 'react-native';
import { useAuth } from '../../../app/Shared/hooks/useAuth';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  content: {
    flex: 1,
    paddingHorizontal: 35,
    justifyContent: 'center',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#f05b22',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    transform: [{ rotate: '45deg' }],
    shadowColor: '#f05b22',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  logoIcon: {
    transform: [{ rotate: '-45deg' }],
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
    fontWeight: '400',
  },
  formContainer: {
    width: '100%',
  },
  inputWrapper: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    color: '#aaa',
    marginBottom: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161618',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#222',
    paddingHorizontal: 15,
    height: 60,
  },
  inputFocused: {
    borderColor: '#f05b22',
    backgroundColor: '#1a1a1c',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  eyeIcon: {
    padding: 10,
  },
  dismissButton: {
    position: 'absolute',
    top: -40,
    right: 0,
    backgroundColor: '#1c1c1e',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  dismissButtonText: {
    color: '#f05b22',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loginButton: {
    backgroundColor: '#f05b22',
    borderRadius: 16,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#f05b22',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  loginButtonDisabled: {
    backgroundColor: '#333',
    shadowOpacity: 0,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.3)',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerText: {
    color: '#444',
    fontSize: 12,
    fontWeight: '500',
  },
  forgotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 20,
    paddingVertical: 8,
  },
  forgotText: {
    color: '#666',
    fontSize: 13,
  },
  forgotTextBold: {
    color: '#f05b22',
    fontWeight: '700',
  },
  registerLinkContainer: {
    marginTop: 10,
    alignItems: 'center',
    paddingVertical: 10,
  },
  registerLinkText: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '500',
  },
  registerLinkTextCyan: {
    color: '#00D9FF',
    fontWeight: 'bold',
  },
});

export const LoginScreen = () => {
  const navigation = useNavigation<any>();
  const { login, error, isLoading, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Listeners para el teclado (especialmente para iOS)
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Acceso', 'Por favor ingresa tus credenciales');
      return;
    }

    const success = await login(email, password);
    if (success) {
      // Éxito
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <Animated.View 
          style={[
            styles.content, 
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          {/* Brand Section */}
          <View style={styles.brandContainer}>
            <View style={styles.logoBadge}>
              <MaterialCommunityIcons 
                name="lightning-bolt" 
                size={40} 
                color="white" 
                style={styles.logoIcon} 
              />
            </View>
            <Text style={styles.title}>GymSync</Text>
            <Text style={styles.subtitle}>Potenciando tu rendimiento</Text>
          </View>

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#ff4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Formulario */}
          <View style={styles.formContainer}>
            {/* Botón para ocultar teclado (Solo iOS) */}
            {Platform.OS === 'ios' && isKeyboardVisible && (
              <TouchableOpacity 
                style={styles.dismissButton} 
                onPress={() => Keyboard.dismiss()}
              >
                <Text style={styles.dismissButtonText}>LISTO</Text>
              </TouchableOpacity>
            )}

            {/* Email Field */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Correo Electrónico</Text>
              <View style={[styles.inputContainer, emailFocused && styles.inputFocused]}>
                <MaterialCommunityIcons 
                  name="email-outline" 
                  size={20} 
                  color={emailFocused ? '#f05b22' : '#666'} 
                  style={styles.inputIcon} 
                />
                <TextInput
                  style={styles.input}
                  placeholder="ejemplo@gymsync.com"
                  placeholderTextColor="#444"
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
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Contraseña</Text>
              <View style={[styles.inputContainer, passwordFocused && styles.inputFocused]}>
                <MaterialCommunityIcons 
                  name="lock-outline" 
                  size={20} 
                  color={passwordFocused ? '#f05b22' : '#666'} 
                  style={styles.inputIcon} 
                />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#444"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => {
                    setPasswordFocused(true);
                    clearError();
                  }}
                  onBlur={() => setPasswordFocused(false)}
                  editable={!isLoading}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <MaterialCommunityIcons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={22} 
                    color="#666" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              activeOpacity={0.8}
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
                <Text style={styles.loginButtonText}>Entrar al Sistema</Text>
              )}
            </TouchableOpacity>

            {/* Olvidaste contraseña */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.forgotContainer}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <MaterialCommunityIcons name="lock-reset" size={15} color="#f05b22" />
              <Text style={styles.forgotText}>
                ¿Has olvidado tu contraseña?{' '}
                <Text style={styles.forgotTextBold}>Recupérala aquí</Text>
              </Text>
            </TouchableOpacity>

            {/* Enlace para registrarse */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.registerLinkContainer}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.registerLinkText}>
                ¿No tienes una cuenta? <Text style={styles.registerLinkTextCyan}>Regístrate aquí</Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              SISTEMA DE GESTIÓN PRO • 2026
            </Text>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
