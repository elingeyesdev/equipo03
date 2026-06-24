/**
 * RegisterScreen.tsx
 * 
 * Pantalla de registro pública para clientes en la app móvil.
 * Exclusiva para Rol CLIENTE (Miembro).
 */

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
  Animated,
  Dimensions,
  Keyboard,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AuthService } from '../../../app/Providers/auth/AuthService';
import { useAuth } from '../../../app/Shared/hooks/useAuth';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 35,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  logoIcon: {
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  inputWrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    color: '#888',
    marginBottom: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161618',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#222',
    paddingHorizontal: 15,
    height: 55,
  },
  inputFocused: {
    borderColor: '#f05b22',
    backgroundColor: '#1a1a1c',
  },
  inputError: {
    borderColor: '#ff4444',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '500',
  },
  eyeIcon: {
    padding: 10,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 5,
    fontWeight: '500',
    paddingLeft: 4,
  },
  requirementText: {
    fontSize: 12,
    color: '#555',
    marginBottom: 4,
  },
  requirementMet: {
    color: '#4caf50',
  },
  passwordRequirements: {
    paddingHorizontal: 4,
    marginBottom: 18,
  },
  registerButton: {
    backgroundColor: '#f05b22',
    borderRadius: 14,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  registerButtonDisabled: {
    backgroundColor: '#222',
  },
  registerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  apiErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FF453A',
  },
  apiErrorText: {
    color: '#ff4444',
    fontSize: 13,
    marginLeft: 10,
    flex: 1,
    lineHeight: 18,
  },
  footer: {
    marginTop: 30,
    alignItems: 'center',
  },
  footerText: {
    color: '#555',
    fontSize: 14,
    fontWeight: '500',
  },
  footerTextLink: {
    color: '#f05b22',
    fontWeight: 'bold',
  },
});

export const RegisterScreen = () => {
  const navigation = useNavigation<any>();
  const { login } = useAuth();

  // --- FORM STATE ---
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [password, setPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // --- VALIDATION AND ERROR STATES ---
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  // --- FOCUS STATES ---
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // --- ANIMATIONS ---
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // --- FRONTEND VALIDATIONS (VALIDACIÓN EN ESPEJO) ---
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 1. Nombre completo
    if (!name.trim()) {
      newErrors.name = 'El nombre completo es obligatorio.';
    }

    // 2. Correo electrónico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = 'El correo electrónico es obligatorio.';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Introduce una dirección de correo válida.';
    }

    // 3. Contraseña
    if (!password) {
      newErrors.password = 'La contraseña es obligatoria.';
    } else {
      if (password.length < 8) {
        newErrors.password = 'Debe tener al menos 8 caracteres.';
      } else if (!/\d/.test(password)) {
        newErrors.password = 'Debe contener al menos un número.';
      } else if (!/[@#$*!%&?^+\-_=~]/.test(password)) {
        newErrors.password = 'Debe contener al menos un símbolo especial.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    Keyboard.dismiss();
    setApiError(null);
    setErrors({});

    // Validar en espejo local
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await AuthService.register(
        name,
        email,
        password,
        phone.trim() ? phone : undefined,
        gender || undefined,
      );

      if (response.success) {
        const loggedIn = await login(email, password);
        if (!loggedIn) {
          Alert.alert(
            'Cuenta creada',
            'Tu cuenta fue creada correctamente. Inicia sesión para continuar.',
            [{ text: 'Aceptar', onPress: () => navigation.navigate('Login') }],
          );
        }
      } else {
        setApiError(response.error || 'No se pudo crear la cuenta.');
      }
    } catch (err: any) {
      setApiError(err.message || 'Error de conexión con el servidor.');
    } finally {
      setIsLoading(false);
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
          contentContainerStyle={styles.scrollViewContent}
          bounces={false}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            
            {/* Header / Brand */}
            <View style={styles.brandContainer}>
              <View style={styles.logoBadge}>
                <MaterialCommunityIcons
                  name="dumbbell"
                  size={28}
                  color="#FF5E00"
                  style={styles.logoIcon}
                />
              </View>
              <Text style={styles.title}>Crear Cuenta</Text>
              <Text style={styles.subtitle}>Únete como cliente de GymSync Pro</Text>
            </View>

            {/* Error General de API (NestJS Validation) */}
            {apiError && (
              <View style={styles.apiErrorContainer}>
                <MaterialCommunityIcons name="alert-circle-outline" size={22} color="#ff4444" />
                <Text style={styles.apiErrorText}>{apiError}</Text>
              </View>
            )}

            <View style={styles.formContainer}>
              {/* Campo Nombre */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Nombre Completo</Text>
                <View style={[
                  styles.inputContainer, 
                  nameFocused && styles.inputFocused,
                  !!errors.name && styles.inputError
                ]}>
                  <MaterialCommunityIcons 
                    name="account-outline" 
                    size={20} 
                    color={nameFocused ? '#f05b22' : '#666'} 
                    style={styles.inputIcon} 
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Nombre Completo"
                    placeholderTextColor="#444"
                    value={name}
                    onChangeText={(val) => {
                      setName(val);
                      if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                    }}
                    onFocus={() => setNameFocused(true)}
                    onBlur={() => setNameFocused(false)}
                    editable={!isLoading}
                    autoCapitalize="words"
                  />
                </View>
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              </View>

              {/* Campo Email */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Correo Electrónico</Text>
                <View style={[
                  styles.inputContainer, 
                  emailFocused && styles.inputFocused,
                  !!errors.email && styles.inputError
                ]}>
                  <MaterialCommunityIcons 
                    name="email-outline" 
                    size={20} 
                    color={emailFocused ? '#f05b22' : '#666'} 
                    style={styles.inputIcon} 
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="correo@ejemplo.com"
                    placeholderTextColor="#444"
                    value={email}
                    onChangeText={(val) => {
                      setEmail(val);
                      if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                    }}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    editable={!isLoading}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>

              {/* Campo Celular (Opcional) */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Celular (Opcional)</Text>
                <View style={[
                  styles.inputContainer, 
                  phoneFocused && styles.inputFocused
                ]}>
                  <MaterialCommunityIcons 
                    name="phone-outline" 
                    size={20} 
                    color={phoneFocused ? '#f05b22' : '#666'} 
                    style={styles.inputIcon} 
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Número de celular"
                    placeholderTextColor="#444"
                    value={phone}
                    onChangeText={setPhone}
                    onFocus={() => setPhoneFocused(true)}
                    onBlur={() => setPhoneFocused(false)}
                    editable={!isLoading}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              {/* Campo Género (Opcional) */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Género — opcional</Text>
                <View style={styles.inputContainer}>
                  <MaterialCommunityIcons name="account-outline" size={20} color="#666" style={styles.inputIcon} />
                  <View style={{ flex: 1, flexDirection: 'row', gap: 8 }}>
                    {([
                      { value: 'Masculino', label: 'Masculino' },
                      { value: 'Femenino', label: 'Femenino' },
                      { value: 'Otro', label: 'Otro' },
                    ] as const).map(opt => (
                      <TouchableOpacity
                        key={opt.value}
                        onPress={() => setGender(gender === opt.value ? '' : opt.value)}
                        style={{
                          flex: 1,
                          paddingVertical: 8,
                          borderRadius: 8,
                          backgroundColor: gender === opt.value ? '#FF5E00' : '#222',
                          alignItems: 'center',
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={{ color: gender === opt.value ? '#fff' : '#888', fontSize: 12, fontWeight: '600' }}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              {/* Campo Contraseña */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Contraseña</Text>
                <View style={[
                  styles.inputContainer, 
                  passwordFocused && styles.inputFocused,
                  !!errors.password && styles.inputError
                ]}>
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
                    onChangeText={(val) => {
                      setPassword(val);
                      if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                    }}
                    onFocus={() => setPasswordFocused(true)}
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
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
              </View>

              {/* Requisitos visuales de Contraseña */}
              <View style={styles.passwordRequirements}>
                <Text style={[
                  styles.requirementText, 
                  password.length >= 8 && styles.requirementMet
                ]}>
                  • Mínimo 8 caracteres
                </Text>
                <Text style={[
                  styles.requirementText, 
                  /\d/.test(password) && styles.requirementMet
                ]}>
                  • Al menos un número
                </Text>
                <Text style={[
                  styles.requirementText, 
                  /[@#$*!%&?^+\-_=~]/.test(password) && styles.requirementMet
                ]}>
                  • Al menos un símbolo (@, #, $, *)
                </Text>
              </View>

              {/* Botón de Registro */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.registerButton,
                  isLoading && styles.registerButtonDisabled,
                ]}
                onPress={handleRegister}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.registerButtonText}>Crear Cuenta</Text>
                )}
              </TouchableOpacity>

              {/* Volver al Login */}
              <TouchableOpacity 
                activeOpacity={0.7}
                style={styles.footer}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.footerText}>
                  ¿Ya tienes una cuenta? <Text style={styles.footerTextLink}>Inicia sesión</Text>
                </Text>
              </TouchableOpacity>
            </View>

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
