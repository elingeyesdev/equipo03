

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Dimensions,
  Keyboard,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../app/Shared/hooks/useAuth';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const C = {
  bg:       '#0A0A0A',
  surface:  '#1C1C1E',
  border:   '#2A2A2C',
  orange:   '#FF5E00',
  white:    '#FFFFFF',
  textSoft: '#888888',
  textDim:  '#555555',
  error:    '#FF453A',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: C.white,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: C.textSoft,
    marginTop: 4,
  },
  formContainer: {
    width: '100%',
  },
  inputWrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: C.textSoft,
    marginBottom: 8,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    height: 52,
  },
  inputFocused: {
    borderColor: C.orange,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: C.white,
    fontSize: 15,
    fontWeight: '500',
  },
  eyeIcon: {
    padding: 8,
  },
  dismissButton: {
    position: 'absolute',
    top: -36,
    right: 0,
    backgroundColor: C.surface,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  dismissButtonText: {
    color: C.orange,
    fontSize: 12,
    fontWeight: '700',
  },
  loginButton: {
    backgroundColor: C.orange,
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    backgroundColor: '#333',
  },
  loginButtonText: {
    color: C.white,
    fontSize: 16,
    fontWeight: '700',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.error,
  },
  errorText: {
    color: C.error,
    fontSize: 13,
    marginLeft: 10,
    flex: 1,
    lineHeight: 18,
  },
  forgotContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    paddingVertical: 8,
  },
  forgotText: {
    color: C.textSoft,
    fontSize: 13,
  },
  forgotAction: {
    color: C.orange,
    fontWeight: '600',
  },
  registerContainer: {
    marginTop: 8,
    alignItems: 'center',
    paddingVertical: 8,
  },
  registerText: {
    color: C.textSoft,
    fontSize: 13,
  },
  registerAction: {
    color: C.orange,
    fontWeight: '600',
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerText: {
    color: C.textDim,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.5,
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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          bounces={false}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        <Animated.View
          style={[
            styles.content,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          {/* Brand */}
          <View style={styles.brandContainer}>
            <View style={styles.logoCircle}>
              <MaterialCommunityIcons name="dumbbell" size={32} color={C.orange} />
            </View>
            <Text style={styles.title}>GymSync</Text>
            <Text style={styles.subtitle}>Potenciando tu rendimiento</Text>
          </View>

          {/* Error */}
          {error && (
            <View style={styles.errorContainer}>
              <MaterialCommunityIcons name="alert-circle-outline" size={18} color={C.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Formulario */}
          <View style={styles.formContainer}>
            {Platform.OS === 'ios' && isKeyboardVisible && (
              <TouchableOpacity
                style={styles.dismissButton}
                onPress={() => Keyboard.dismiss()}
              >
                <Text style={styles.dismissButtonText}>Listo</Text>
              </TouchableOpacity>
            )}

            {/* Email */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Correo electrónico</Text>
              <View style={[styles.inputContainer, emailFocused && styles.inputFocused]}>
                <MaterialCommunityIcons
                  name="email-outline"
                  size={18}
                  color={emailFocused ? C.orange : C.textDim}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="ejemplo@gymsync.com"
                  placeholderTextColor={C.textDim}
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

            {/* Contraseña */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Contraseña</Text>
              <View style={[styles.inputContainer, passwordFocused && styles.inputFocused]}>
                <MaterialCommunityIcons
                  name="lock-outline"
                  size={18}
                  color={passwordFocused ? C.orange : C.textDim}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={C.textDim}
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
                    size={20}
                    color={C.textDim}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Botón principal */}
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
                <ActivityIndicator color={C.white} />
              ) : (
                <Text style={styles.loginButtonText}>Iniciar sesión</Text>
              )}
            </TouchableOpacity>

            {/* Recuperar contraseña */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.forgotContainer}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={styles.forgotText}>
                ¿Olvidaste tu contraseña?{' '}
                <Text style={styles.forgotAction}>Recupérala</Text>
              </Text>
            </TouchableOpacity>

            {/* Registrarse */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.registerContainer}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.registerText}>
                ¿No tienes cuenta?{' '}
                <Text style={styles.registerAction}>Regístrate</Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              GymSync Pro · 2026
            </Text>
          </View>
        </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
