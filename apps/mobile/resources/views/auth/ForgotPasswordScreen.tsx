import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, StatusBar,
  ActivityIndicator, Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthService } from '../../../app/Providers/auth/AuthService';

export const ForgotPasswordScreen = () => {
  const navigation = useNavigation<any>();
  const [email, setEmail]         = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSend = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) { setError('Ingresa tu correo electrónico'); return; }
    setError(null);
    setIsLoading(true);
    const result = await AuthService.forgotPassword(trimmed);
    setIsLoading(false);
    if (!result.success) { setError(result.error ?? 'Error al enviar el código'); return; }
    navigation.navigate('ResetPassword', { email: trimmed });
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <Animated.View style={[s.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

          {/* Back */}
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="#f05b22" />
          </TouchableOpacity>

          {/* Icon */}
          <View style={s.iconBadge}>
            <MaterialCommunityIcons name="lock-reset" size={36} color="white" style={s.iconInner} />
          </View>

          <Text style={s.title}>Recuperar{'\n'}Contraseña</Text>
          <Text style={s.subtitle}>Te enviaremos un código OTP a tu correo</Text>

          {/* Error */}
          {error && (
            <View style={s.errorBox}>
              <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#ff4444" />
              <Text style={s.errorTxt}>{error}</Text>
            </View>
          )}

          {/* Email */}
          <View style={s.inputWrapper}>
            <Text style={s.label}>Correo Electrónico</Text>
            <View style={[s.inputContainer, emailFocused && s.inputFocused]}>
              <MaterialCommunityIcons
                name="email-outline" size={20}
                color={emailFocused ? '#f05b22' : '#666'}
                style={s.inputIcon}
              />
              <TextInput
                style={s.input}
                placeholder="ejemplo@gymsync.com"
                placeholderTextColor="#444"
                value={email}
                onChangeText={t => { setEmail(t); setError(null); }}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>
          </View>

          {/* Button */}
          <TouchableOpacity
            style={[s.btn, isLoading && s.btnDisabled]}
            activeOpacity={0.8}
            onPress={handleSend}
            disabled={isLoading}
          >
            {isLoading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnTxt}>Enviar Código</Text>
            }
          </TouchableOpacity>

        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content:   { flex: 1, paddingHorizontal: 35, justifyContent: 'center' },

  backBtn:   { position: 'absolute', top: 20, left: 0, padding: 8 },

  iconBadge: {
    width: 72, height: 72, borderRadius: 18, backgroundColor: '#f05b22',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 24, transform: [{ rotate: '45deg' }],
    shadowColor: '#f05b22', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  iconInner: { transform: [{ rotate: '-45deg' }] },

  title:    { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: -0.5, marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 32 },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,68,68,0.1)', borderRadius: 12, padding: 14,
    marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,68,68,0.3)',
  },
  errorTxt: { color: '#ff4444', fontSize: 13, flex: 1 },

  inputWrapper:   { marginBottom: 20 },
  label:          { fontSize: 12, color: '#aaa', marginBottom: 8, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#161618', borderRadius: 16, borderWidth: 1, borderColor: '#222', paddingHorizontal: 15, height: 58 },
  inputFocused:   { borderColor: '#f05b22', backgroundColor: '#1a1a1c' },
  inputIcon:      { marginRight: 12 },
  input:          { flex: 1, color: '#fff', fontSize: 16, fontWeight: '500' },

  btn:         { backgroundColor: '#f05b22', borderRadius: 16, height: 58, justifyContent: 'center', alignItems: 'center', marginTop: 8, shadowColor: '#f05b22', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  btnDisabled: { backgroundColor: '#333', shadowOpacity: 0 },
  btnTxt:      { color: '#fff', fontSize: 17, fontWeight: 'bold' },
});
