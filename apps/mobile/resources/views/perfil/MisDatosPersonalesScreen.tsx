import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Alert, Platform, Keyboard, KeyboardAvoidingView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../app/Shared/hooks/useAuth';
import { NumericInput } from '../../../app/Shared/components/ui/NumericInput';
import axios from 'axios';
import { Env } from '../../../app/Providers/geolocation/config/environment';
import { AuthService } from '../../../app/Providers/auth/AuthService';

type ExperienceLevel = 'PRINCIPIANTE' | 'INTERMEDIO' | 'AVANZADO';
type SavingSection   = 'basic' | 'metrics' | 'medical' | null;

const AVATARS = [
  { id: '1', icon: 'face-man-profile'  },
  { id: '2', icon: 'face-woman-profile' },
  { id: '3', icon: 'robot-outline'      },
  { id: '4', icon: 'incognito'          },
  { id: '5', icon: 'alien-outline'      },
  { id: '6', icon: 'cat'               },
  { id: '7', icon: 'fire'              },
  { id: '8', icon: 'crown'             },
  { id: '9', icon: 'star'              },
];

export const MisDatosPersonalesScreen = () => {
  const navigation                              = useNavigation();
  const { user, updateProfile }                 = useAuth();
  const isGerente                               = user?.role === 'GERENTE';
  const p                                       = (user as any)?.profile;

  const [isEditing,          setIsEditing]          = useState(false);
  const [username,           setUsername]           = useState<string>(p?.username || (user as any)?.email?.split('@')[0] || '');
  const [gender,             setGender]             = useState<string>(p?.gender   || 'Masculino');
  const [favoriteSports,     setFavoriteSports]     = useState<string>(
    Array.isArray(p?.favoriteSports) ? p.favoriteSports.join(', ') : p?.favoriteSports || ''
  );
  const [selectedAvatar,     setSelectedAvatar]     = useState<string>(p?.avatarIcon || 'face-man-profile');
  const [medicalConditions,  setMedicalConditions]  = useState<string>(p?.medicalConditions || '');

  const pm = (p?.physicalMetrics ?? p) as any;
  const [weightKg,           setWeightKg]           = useState<string>(String(pm?.weightKg          ?? ''));
  const [heightCm,           setHeightCm]           = useState<string>(String(pm?.heightCm          ?? ''));
  const [bodyFatPercentage,  setBodyFatPercentage]  = useState<string>(String(pm?.bodyFatPercentage ?? ''));
  const [muscleMassKg,       setMuscleMassKg]       = useState<string>(String(pm?.muscleMassKg      ?? ''));
  const [experienceLevel,    setExperienceLevel]    = useState<ExperienceLevel>(
    (pm?.experienceLevel ?? 'PRINCIPIANTE') as ExperienceLevel
  );

  const [isKeyboardVisible,  setKeyboardVisible]    = useState(false);
  const [isFetching,         setIsFetching]         = useState(!p);
  const [savingSection,      setSavingSection]      = useState<SavingSection>(null);

  // ── Botón editar en header nativo ────────────────────────────────────────────
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setIsEditing(prev => !prev)}
          style={{ padding: 4, marginRight: 4 }}
          disabled={savingSection !== null}
        >
          <MaterialCommunityIcons
            name={isEditing ? 'close' : 'pencil-outline'}
            size={22}
            color="#f05b22"
          />
        </TouchableOpacity>
      ),
    });
  }, [isEditing, savingSection, navigation]);

  // ── Teclado ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  // ── Hidratación desde contexto ───────────────────────────────────────────────
  useEffect(() => {
    const prof: any = (user as any)?.profile;
    if (!prof) return;
    const metrics: any = prof?.physicalMetrics ?? {};
    setUsername(prof.username || (user as any)?.email?.split('@')[0] || '');
    setGender(prof.gender || 'Masculino');
    setSelectedAvatar(prof.avatarIcon || 'face-man-profile');
    setFavoriteSports(
      Array.isArray(prof.favoriteSports) ? prof.favoriteSports.join(', ') : prof.favoriteSports || ''
    );
    setMedicalConditions(prof.medicalConditions || '');
    setWeightKg(String(metrics.weightKg          ?? ''));
    setHeightCm(String(metrics.heightCm          ?? ''));
    setBodyFatPercentage(String(metrics.bodyFatPercentage ?? ''));
    setMuscleMassKg(String(metrics.muscleMassKg  ?? ''));
    setExperienceLevel((metrics.experienceLevel  ?? 'PRINCIPIANTE') as ExperienceLevel);
  }, [user]);

  // ── Hidratación desde GET /api/auth/me ───────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const fetchProfile = async () => {
      try {
        const token = await AuthService.getToken();
        const res   = await axios.get(
          `${Env.API_BASE_URL}/api/auth/me`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (cancelled) return;
        const data: any    = res.data?.data ?? res.data;
        const prof: any    = data?.profile ?? {};
        const metrics: any = prof?.physicalMetrics ?? {};
        setUsername(prof.username || data?.email?.split('@')[0] || '');
        setGender(prof.gender || 'Masculino');
        setSelectedAvatar(prof.avatarIcon || 'face-man-profile');
        setFavoriteSports(
          Array.isArray(prof.favoriteSports) ? prof.favoriteSports.join(', ') : prof.favoriteSports || ''
        );
        setMedicalConditions(prof.medicalConditions || '');
        setWeightKg(String(metrics.weightKg          ?? ''));
        setHeightCm(String(metrics.heightCm          ?? ''));
        setBodyFatPercentage(String(metrics.bodyFatPercentage ?? ''));
        setMuscleMassKg(String(metrics.muscleMassKg  ?? ''));
        setExperienceLevel((metrics.experienceLevel  ?? 'PRINCIPIANTE') as ExperienceLevel);
      } catch {
        // fallback: contexto ya hidratado
      } finally {
        if (!cancelled) setIsFetching(false);
      }
    };
    fetchProfile();
    return () => { cancelled = true; };
  }, []);

  // ── PATCH helper ─────────────────────────────────────────────────────────────
  const patchProfile = async (payload: Record<string, unknown>) => {
    const token = await AuthService.getToken();
    const res   = await axios.patch(
      `${Env.API_BASE_URL}/api/users/me/profile`,
      payload,
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );
    return res.data?.data ?? res.data;
  };

  // ── Guardar info básica ───────────────────────────────────────────────────────
  const handleSaveBasicInfo = async () => {
    const sportsArray = favoriteSports.split(',').map(s => s.trim()).filter(Boolean);
    setSavingSection('basic');
    try {
      await patchProfile({ gender, username, favoriteSports: sportsArray, avatarUrl: selectedAvatar });
      updateProfile({ gender, username, favoriteSports: sportsArray as any, avatarUrl: selectedAvatar });
      setIsEditing(false);
      Alert.alert('Guardado', 'Información básica actualizada.');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'No se pudo guardar.';
      Alert.alert('Error', Array.isArray(msg) ? msg.join('\n') : msg);
    } finally {
      setSavingSection(null);
    }
  };

  // ── Guardar métricas ─────────────────────────────────────────────────────────
  const handleSaveMetrics = async () => {
    setSavingSection('metrics');
    try {
      await patchProfile({
        weightKg:          Number(weightKg)          || undefined,
        heightCm:          Number(heightCm)          || undefined,
        bodyFatPercentage: Number(bodyFatPercentage) || undefined,
        muscleMassKg:      Number(muscleMassKg)      || undefined,
        experienceLevel,
      });
      updateProfile({
        physicalMetrics: {
          weightKg:          Number(weightKg)          || undefined,
          heightCm:          Number(heightCm)          || undefined,
          bodyFatPercentage: Number(bodyFatPercentage) || undefined,
          muscleMassKg:      Number(muscleMassKg)      || undefined,
          experienceLevel,
        },
      });
      Alert.alert('Guardado', 'Métricas físicas actualizadas.');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'No se pudo guardar.';
      Alert.alert('Error', Array.isArray(msg) ? msg.join('\n') : msg);
    } finally {
      setSavingSection(null);
    }
  };

  // ── Guardar condiciones médicas ───────────────────────────────────────────────
  const handleSaveMedical = async () => {
    setSavingSection('medical');
    try {
      await patchProfile({ medicalConditions });
      updateProfile({ medicalConditions });
      Alert.alert('Guardado', 'Condiciones médicas actualizadas.');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'No se pudo guardar.';
      Alert.alert('Error', Array.isArray(msg) ? msg.join('\n') : msg);
    } finally {
      setSavingSection(null);
    }
  };

  // ── Loading inicial ───────────────────────────────────────────────────────────
  if (isFetching) {
    return (
      <SafeAreaView style={[s.container, s.centered]}>
        <ActivityIndicator size="large" color="#f05b22" />
        <Text style={s.loadingText}>Cargando perfil...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">

          {/* ── Información Básica ── */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Información Básica</Text>
              {isEditing && Platform.OS === 'ios' && isKeyboardVisible && (
                <TouchableOpacity style={s.dismissBtn} onPress={() => Keyboard.dismiss()}>
                  <Text style={s.dismissBtnText}>LISTO</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Avatar */}
            {isEditing ? (
              <>
                <Text style={s.label}>Avatar</Text>
                <View style={s.avatarGrid}>
                  {AVATARS.map((av) => (
                    <TouchableOpacity
                      key={av.id}
                      style={[s.avatarOption, selectedAvatar === av.icon && s.avatarSelected]}
                      onPress={() => setSelectedAvatar(av.icon)}
                    >
                      <MaterialCommunityIcons
                        name={av.icon as any}
                        size={36}
                        color={selectedAvatar === av.icon ? '#f05b22' : '#ccc'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : (
              <View style={s.avatarReadWrap}>
                <View style={s.avatarReadBadge}>
                  <MaterialCommunityIcons name={selectedAvatar as any} size={56} color="#f05b22" />
                </View>
              </View>
            )}

            {/* Nombre */}
            <View style={s.field}>
              <Text style={s.label}>Nombre de Usuario</Text>
              {isEditing
                ? <TextInput style={s.input} value={username} onChangeText={setUsername} placeholder="Tu nombre de usuario" placeholderTextColor="#555" />
                : <Text style={s.readValue}>{username || '—'}</Text>
              }
            </View>

            {/* Género */}
            <View style={s.field}>
              <Text style={s.label}>Género</Text>
              {isEditing ? (
                <View style={s.genderRow}>
                  {['Masculino', 'Femenino', 'Otro'].map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[s.genderBtn, gender === g && s.genderBtnActive]}
                      onPress={() => setGender(g)}
                    >
                      <Text style={[s.genderBtnText, gender === g && s.genderBtnTextActive]}>{g}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text style={s.readValue}>{gender || '—'}</Text>
              )}
            </View>

            {/* Deportes */}
            <View style={s.field}>
              <Text style={s.label}>Deportes Favoritos</Text>
              {isEditing
                ? <TextInput
                    style={[s.input, s.textArea]}
                    value={favoriteSports}
                    onChangeText={setFavoriteSports}
                    placeholder="Ej: Calistenia, Natación, Yoga"
                    placeholderTextColor="#555"
                    multiline
                    numberOfLines={3}
                  />
                : <Text style={s.readValue}>{favoriteSports || '—'}</Text>
              }
            </View>

            {isEditing && (
              <TouchableOpacity
                style={[s.saveBtn, savingSection === 'basic' && s.saveBtnOff]}
                onPress={handleSaveBasicInfo}
                disabled={savingSection !== null}
                activeOpacity={0.85}
              >
                {savingSection === 'basic'
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={s.saveBtnText}>Guardar Info Básica</Text>
                }
              </TouchableOpacity>
            )}
          </View>

          {/* ── Métricas Físicas — solo clientes ── */}
          {!isGerente && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>📊 Métricas Físicas</Text>

              {isEditing ? (
                <>
                  <View style={s.metricsRow}>
                    <View style={[s.field, s.metricHalf]}>
                      <Text style={s.label}>Peso (kg)</Text>
                      <NumericInput style={s.input} value={weightKg} onChangeText={setWeightKg} placeholder="0.0" placeholderTextColor="#555" />
                    </View>
                    <View style={[s.field, s.metricHalf]}>
                      <Text style={s.label}>Altura (cm)</Text>
                      <NumericInput style={s.input} value={heightCm} onChangeText={setHeightCm} placeholder="0" placeholderTextColor="#555" />
                    </View>
                  </View>
                  <View style={s.metricsRow}>
                    <View style={[s.field, s.metricHalf]}>
                      <Text style={s.label}>Grasa corp. (%)</Text>
                      <NumericInput style={s.input} value={bodyFatPercentage} onChangeText={setBodyFatPercentage} placeholder="0.0" placeholderTextColor="#555" />
                    </View>
                    <View style={[s.field, s.metricHalf]}>
                      <Text style={s.label}>Músculo (kg)</Text>
                      <NumericInput style={s.input} value={muscleMassKg} onChangeText={setMuscleMassKg} placeholder="0.0" placeholderTextColor="#555" />
                    </View>
                  </View>
                  <View style={s.field}>
                    <Text style={s.label}>Nivel de Experiencia</Text>
                    <View style={s.radioRow}>
                      {(['PRINCIPIANTE', 'INTERMEDIO', 'AVANZADO'] as ExperienceLevel[]).map(lvl => (
                        <TouchableOpacity
                          key={lvl}
                          style={[s.radioItem, experienceLevel === lvl && s.radioItemActive]}
                          onPress={() => setExperienceLevel(lvl)}
                        >
                          <Text style={[s.radioText, experienceLevel === lvl && s.radioTextActive]}>{lvl}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[s.saveBtn, savingSection === 'metrics' && s.saveBtnOff]}
                    onPress={handleSaveMetrics}
                    disabled={savingSection !== null}
                    activeOpacity={0.85}
                  >
                    {savingSection === 'metrics'
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={s.saveBtnText}>Guardar Métricas</Text>
                    }
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={s.metricsReadGrid}>
                    {[
                      { label: 'Peso',    value: weightKg          ? `${weightKg} kg`         : '—' },
                      { label: 'Altura',  value: heightCm          ? `${heightCm} cm`         : '—' },
                      { label: 'Grasa',   value: bodyFatPercentage ? `${bodyFatPercentage} %` : '—' },
                      { label: 'Músculo', value: muscleMassKg      ? `${muscleMassKg} kg`     : '—' },
                    ].map(({ label, value }) => (
                      <View key={label} style={s.metricCard}>
                        <Text style={s.metricCardLabel}>{label}</Text>
                        <Text style={s.metricCardValue}>{value}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={[s.field, { marginTop: 4 }]}>
                    <Text style={s.label}>Nivel de Experiencia</Text>
                    <Text style={s.readValue}>{experienceLevel}</Text>
                  </View>
                </>
              )}
            </View>
          )}

          {/* ── Condiciones Médicas ── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>⚕️ Condiciones Médicas</Text>
            <View style={s.field}>
              <Text style={s.label}>Lesiones o condiciones de salud</Text>
              {isEditing
                ? <TextInput
                    style={[s.input, s.textArea]}
                    value={medicalConditions}
                    onChangeText={setMedicalConditions}
                    placeholder="Ej: Asma, lesión de rodilla, hipertensión..."
                    placeholderTextColor="#555"
                    multiline
                    numberOfLines={4}
                  />
                : <Text style={s.readValue}>{medicalConditions || '—'}</Text>
              }
            </View>
            {isEditing && (
              <TouchableOpacity
                style={[s.saveBtn, savingSection === 'medical' && s.saveBtnOff]}
                onPress={handleSaveMedical}
                disabled={savingSection !== null}
                activeOpacity={0.85}
              >
                {savingSection === 'medical'
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={s.saveBtnText}>Guardar Info Médica</Text>
                }
              </TouchableOpacity>
            )}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#000000' },
  centered:           { justifyContent: 'center', alignItems: 'center' },
  loadingText:        { color: '#888', marginTop: 12, fontSize: 14 },
  scrollContent:      { padding: 20, paddingBottom: 100 },

  // ── Secciones
  section:            { marginBottom: 28, backgroundColor: '#0d0d0d', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#1a1a1a' },
  sectionHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle:       { color: '#ffffff', fontSize: 18, fontWeight: 'bold', marginBottom: 16 },

  // ── Read mode
  readValue:          { color: '#ffffff', fontSize: 16, paddingVertical: 4 },
  avatarReadWrap:     { alignItems: 'center', marginBottom: 20 },
  avatarReadBadge:    { width: 88, height: 88, borderRadius: 44, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#2a2a2a' },
  metricsReadGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  metricCard:         { flex: 1, minWidth: '45%', backgroundColor: '#161618', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#222' },
  metricCardLabel:    { color: '#666', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  metricCardValue:    { color: '#f05b22', fontSize: 20, fontWeight: '900' },

  // ── Edit mode — campos
  field:              { marginBottom: 16 },
  label:              { color: '#888', fontSize: 13, marginBottom: 8, fontWeight: '600' },
  input:              { backgroundColor: '#161618', borderRadius: 12, padding: 15, color: '#ffffff', fontSize: 16, borderWidth: 1, borderColor: '#222' },
  textArea:           { height: 90, textAlignVertical: 'top' },

  // ── Avatar grid
  avatarGrid:         { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  avatarOption:       { width: '30%', aspectRatio: 1, backgroundColor: '#1E1E1E', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderWidth: 2, borderColor: 'transparent' },
  avatarSelected:     { borderColor: '#f05b22', backgroundColor: '#2a1a15' },

  // ── Género
  genderRow:          { flexDirection: 'row', justifyContent: 'space-between' },
  genderBtn:          { flex: 1, backgroundColor: '#161618', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginHorizontal: 4, borderWidth: 1, borderColor: '#222' },
  genderBtnActive:    { backgroundColor: '#f05b22', borderColor: '#f05b22' },
  genderBtnText:      { color: '#888', fontWeight: '600', fontSize: 13 },
  genderBtnTextActive:{ color: '#ffffff' },

  // ── Métricas edit
  metricsRow:         { flexDirection: 'row', gap: 10 },
  metricHalf:         { flex: 1 },
  radioRow:           { flexDirection: 'row', gap: 8 },
  radioItem:          { flex: 1, backgroundColor: '#222', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  radioItemActive:    { backgroundColor: '#f05b22' },
  radioText:          { color: '#aaa', fontSize: 11, fontWeight: 'bold' },
  radioTextActive:    { color: '#fff' },

  // ── Botones de guardar
  saveBtn:            { alignSelf: 'flex-end', backgroundColor: '#f05b22', paddingVertical: 9, paddingHorizontal: 18, borderRadius: 10, marginTop: 10, minWidth: 44, alignItems: 'center' },
  saveBtnOff:         { opacity: 0.5 },
  saveBtnText:        { color: '#ffffff', fontWeight: 'bold', fontSize: 13 },

  // ── Keyboard dismiss (iOS)
  dismissBtn:         { backgroundColor: '#1c1c1e', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: '#333' },
  dismissBtnText:     { color: '#f05b22', fontSize: 12, fontWeight: 'bold' },
});
