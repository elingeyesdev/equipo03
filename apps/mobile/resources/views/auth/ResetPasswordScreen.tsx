import React, { useState, useRef, useEffect } from 'react';
import {View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Animated, Alert, Keyboard} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthService } from '../../../app/Providers/auth/AuthService';
import { DumbbellSpinner } from '../../../app/Shared/components/ui/DumbbellSpinner';

export const ResetPasswordScreen = () => {
  const navigation = useNavigation<any>();
  const route      = useRoute<any>();
  const email      = route.params?.email ?? '';

  const [otp, setOtp]                   = useState('');
  const [newPassword, setNewPassword]   = useState('');
  const [showPass, setShowPass]         = useState(false);
  const [otpFocused, setOtpFocused]     = useState(false);
  const [passFocused, setPassFocused]   = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  const handleReset = async () => {
    if (!otp.trim())             { setError('Ingresa el código OTP');                                      return; }
    if (!newPassword)            { setError('Ingresa la nueva contraseña');                                return; }
    if (newPassword.length < 8)  { setError('La contraseña debe tener al menos 8 caracteres');            return; }
    if (!/[^a-zA-Z0-9]/.test(newPassword)) { setError('La contraseña debe incluir al menos un caracter especial'); return; }
    setError(null);
    setIsLoading(true);
    const result = await AuthService.resetPassword(email, otp.trim(), newPassword);
    setIsLoading(false);
    if (!result.success) {
      const msg = result.error ?? 'Código inválido o expirado';
      // contraseña débil u otro error 400 → Alert prominente
      const isPasswordError = msg.toLowerCase().includes('password') ||
                              msg.toLowerCase().includes('contraseña') ||
                              msg.toLowerCase().includes('weak') ||
                              msg.toLowerCase().includes('débil');
      if (isPasswordError) {
        Alert.alert('Contraseña inválida', msg);
      } else {
        setError(msg);
      }
      return;
    }
    Alert.alert(
      '¡Contraseña actualizada!',
      'Ahora puedes iniciar sesión con tu nueva contraseña.',
      [{ text: 'Ir al Login', onPress: () => navigation.popToTop() }],
    );
  };

  return (
    <SafeAreaView style={s.container} edges={['top', 'bottom']}>
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
        <Animated.View style={[s.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

          {/* Back */}
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="chevron-left" size={22} color="#fff" />
          </TouchableOpacity>

          {/* Icon */}
          <View style={s.iconBadge}>
            <MaterialCommunityIcons name="shield-key-outline" size={34} color="white" style={s.iconInner} />
          </View>

          <Text style={s.title}>Nueva{'\n'}Contraseña</Text>
          <Text style={s.subtitle}>
            Código enviado a{'\n'}
            <Text style={s.emailHighlight}>{email}</Text>
          </Text>

          {/* Dismiss keyboard — solo iOS */}
          {Platform.OS === 'ios' && isKeyboardVisible && (
            <TouchableOpacity style={s.dismissBtn} onPress={() => Keyboard.dismiss()}>
              <Text style={s.dismissBtnTxt}>LISTO</Text>
            </TouchableOpacity>
          )}

          {/* Error */}
          {error && (
            <View style={s.errorBox}>
              <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#ff4444" />
              <Text style={s.errorTxt}>{error}</Text>
            </View>
          )}

          {/* OTP */}
          <View style={s.inputWrapper}>
            <Text style={s.label}>Código OTP</Text>
            <View style={[s.inputContainer, otpFocused && s.inputFocused]}>
              <MaterialCommunityIcons
                name="numeric" size={20}
                color={otpFocused ? '#f05b22' : '#666'}
                style={s.inputIcon}
              />
              <TextInput
                style={s.input}
                placeholder="123456"
                placeholderTextColor="#444"
                value={otp}
                onChangeText={t => { setOtp(t); setError(null); }}
                onFocus={() => setOtpFocused(true)}
                onBlur={() => setOtpFocused(false)}
                keyboardType="number-pad"
                maxLength={6}
                editable={!isLoading}
              />
            </View>
          </View>

          {/* New password */}
          <View style={s.inputWrapper}>
            <Text style={s.label}>Nueva Contraseña</Text>
            <View style={[s.inputContainer, passFocused && s.inputFocused]}>
              <MaterialCommunityIcons
                name="lock-outline" size={20}
                color={passFocused ? '#f05b22' : '#666'}
                style={s.inputIcon}
              />
              <TextInput
                style={s.input}
                placeholder="••••••••"
                placeholderTextColor="#444"
                value={newPassword}
                onChangeText={t => { setNewPassword(t); setError(null); }}
                onFocus={() => setPassFocused(true)}
                onBlur={() => setPassFocused(false)}
                secureTextEntry={!showPass}
                editable={!isLoading}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={s.eyeIcon}>
                <MaterialCommunityIcons
                  name={showPass ? 'eye-off-outline' : 'eye-outline'}
                  size={22} color="#666"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Hints de contraseña — aparecen mientras el usuario escribe */}
          {newPassword.length > 0 && (
            <View style={s.hintBox}>
              <Text style={[s.hint, newPassword.length >= 8 ? s.hintOk : s.hintFail]}>
                {newPassword.length >= 8 ? '+ ' : '- '}Minimo 8 caracteres
              </Text>
              <Text style={[s.hint, /[^a-zA-Z0-9]/.test(newPassword) ? s.hintOk : s.hintFail]}>
                {/[^a-zA-Z0-9]/.test(newPassword) ? '+ ' : '- '}Al menos 1 caracter especial
              </Text>
            </View>
          )}

          {/* Button */}
          <TouchableOpacity
            style={[s.btn, isLoading && s.btnDisabled]}
            activeOpacity={0.8}
            onPress={handleReset}
            disabled={isLoading}
          >
            {isLoading
              ? <DumbbellSpinner color="#fff" />
              : <Text style={s.btnTxt}>Actualizar Contraseña</Text>
            }
          </TouchableOpacity>

          {/* Resend hint */}
          <TouchableOpacity style={s.resendRow} onPress={() => navigation.goBack()}>
            <Text style={s.resendTxt}>
              ¿No recibiste el código?{' '}
              <Text style={s.resendBold}>Reenviar</Text>
            </Text>
          </TouchableOpacity>

        </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content:   { flex: 1, paddingHorizontal: 35, justifyContent: 'center' },

  backBtn:   { position: 'absolute', top: 52, left: 16, width: 40, height: 40, backgroundColor: '#1C1C1E', borderRadius: 12, borderWidth: 1, borderColor: '#3A3A3C', justifyContent: 'center', alignItems: 'center' },

  iconBadge: {
    width: 72, height: 72, borderRadius: 18, backgroundColor: '#f05b22',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 24, transform: [{ rotate: '45deg' }],
  },
  iconInner: { transform: [{ rotate: '-45deg' }] },

  title:          { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: -0.5, marginBottom: 8 },
  subtitle:       { fontSize: 14, color: '#666', marginBottom: 32, lineHeight: 22 },
  emailHighlight: { color: '#f05b22', fontWeight: '700' },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#1C1C1E', borderRadius: 12, padding: 14,
    marginBottom: 20, borderWidth: 1, borderColor: '#FF453A',
  },
  errorTxt: { color: '#ff4444', fontSize: 13, flex: 1 },

  inputWrapper:   { marginBottom: 20 },
  label:          { fontSize: 12, color: '#aaa', marginBottom: 8, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1C1E', borderRadius: 16, borderWidth: 1, borderColor: '#222', paddingHorizontal: 15, height: 58 },
  inputFocused:   { borderColor: '#f05b22', backgroundColor: '#1a1a1c' },
  inputIcon:      { marginRight: 12 },
  input:          { flex: 1, color: '#fff', fontSize: 16, fontWeight: '500' },
  eyeIcon:        { padding: 10 },

  btn:         { backgroundColor: '#f05b22', borderRadius: 16, height: 58, justifyContent: 'center', alignItems: 'center', marginTop: 8, shadowColor: '#f05b22', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  btnDisabled: { backgroundColor: '#333', shadowOpacity: 0 },
  btnTxt:      { color: '#fff', fontSize: 17, fontWeight: 'bold' },

  dismissBtn:    { alignSelf: 'flex-end', backgroundColor: '#1c1c1e', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#333', marginBottom: 8 },
  dismissBtnTxt: { color: '#f05b22', fontSize: 12, fontWeight: 'bold' },

  hintBox: { marginTop: -10, marginBottom: 16, gap: 4 },
  hint:    { fontSize: 12, fontWeight: '600' },
  hintOk:  { color: '#2ecc71' },
  hintFail:{ color: '#888' },

  resendRow: { marginTop: 20, alignItems: 'center' },
  resendTxt: { color: '#555', fontSize: 13 },
  resendBold:{ color: '#f05b22', fontWeight: '700' },
});
