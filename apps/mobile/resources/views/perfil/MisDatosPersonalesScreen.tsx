import { useState, useEffect } from 'react';
import {View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, Platform, Keyboard, KeyboardAvoidingView, Modal, Image} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../app/Shared/hooks/useAuth';
import { NumericInput } from '../../../app/Shared/components/ui/NumericInput';
import authAxios from '../../../app/Providers/auth/authAxios';
import { calculateIMC, getIMCCategory, calculateAge } from '../../../app/Shared/utils/healthMetrics';
import { DumbbellSpinner } from '../../../app/Shared/components/ui/DumbbellSpinner';

type ExperienceLevel = 'PRINCIPIANTE' | 'INTERMEDIO' | 'AVANZADO';
type SavingSection   = 'basic' | 'metrics' | 'medical' | null;

const AVATARS = [
  { id: '1', icon: 'face-man-profile',  image: require('../../../assets/avatarman.png')       },
  { id: '2', icon: 'face-woman-profile', image: require('../../../assets/avatarwoman.png')    },
  { id: '3', icon: 'robot-outline',      image: require('../../../assets/avatarrobot.png')    },
  { id: '4', icon: 'incognito',          image: require('../../../assets/avatarincognito.png') },
  { id: '5', icon: 'alien-outline',      image: require('../../../assets/avataralien.png')    },
  { id: '6', icon: 'cat',               image: require('../../../assets/avatarcat.png')       },
  { id: '7', icon: 'fire',              image: require('../../../assets/avatarfire.png')      },
  { id: '8', icon: 'crown',             image: require('../../../assets/avatarcrown.png')     },
  { id: '9', icon: 'star',              image: require('../../../assets/avatarstar.png')      },
];

export const MisDatosPersonalesScreen = () => {
  const navigation                              = useNavigation();
  const { user, updateProfile, logout }          = useAuth();
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
  const [waistCm,            setWaistCm]            = useState<string>(String(pm?.waistCm           ?? ''));
  const [experienceLevel,    setExperienceLevel]    = useState<ExperienceLevel>(
    (pm?.experienceLevel ?? 'PRINCIPIANTE') as ExperienceLevel
  );
  const [age,                setAge]                = useState<string>(
    p?.age != null ? String(p.age) : (p?.birthDate ? String(calculateAge(p.birthDate)) : '')
  );

  // IMC reactivo (solo lectura)
  const imcResult   = calculateIMC(Number(weightKg), Number(heightCm));
  const imcCategory = getIMCCategory(imcResult);
  const imcFloat    = parseFloat(imcResult);
  const imcColor    = imcFloat >= 18.5 && imcFloat <= 24.9 ? '#00E5A3' : '#FF5E00';

  const [isKeyboardVisible,  setKeyboardVisible]    = useState(false);
  const [isFetching,         setIsFetching]         = useState(!p);
  const [savingSection,      setSavingSection]      = useState<SavingSection>(null);
  const [errors,             setErrors]             = useState<Record<string, string>>({});


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
    setWaistCm(String(metrics.waistCm           ?? ''));
    setExperienceLevel((metrics.experienceLevel  ?? 'PRINCIPIANTE') as ExperienceLevel);
    const serverAge = prof.age ?? metrics.age;
    if (serverAge != null) setAge(String(serverAge));
  }, [user]);

  // ── Hidratación desde GET /api/auth/me ───────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const fetchProfile = async () => {
      try {
        const res = await authAxios.get('/api/auth/me');
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
        setWaistCm(String(metrics.waistCm           ?? ''));
        setExperienceLevel((metrics.experienceLevel  ?? 'PRINCIPIANTE') as ExperienceLevel);
        const serverAge = prof.age ?? metrics.age;
    if (serverAge != null) setAge(String(serverAge));
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 401) return; // manejado por axios401Guard
        if (status === 404) {
          Alert.alert('Sesión expirada', 'Tu sesión ya no es válida. Inicia sesión de nuevo.', [
            { text: 'OK', onPress: () => logout() },
          ]);
        }
      } finally {
        if (!cancelled) setIsFetching(false);
      }
    };
    fetchProfile();
    return () => { cancelled = true; };
  }, []);

  // ── Fetch específico de métricas (endpoints dedicados) ───────────────────────
  useEffect(() => {
    let cancelled = false;
    const fetchMetrics = async () => {
      try {
        const [profileRes, metricsRes] = await Promise.allSettled([
          authAxios.get('/api/users/me'),
          authAxios.get('/api/users/me/metrics/latest'),
        ]);

        if (cancelled) return;

        // 1. Peso viene de /metrics/latest
        if (metricsRes.status === 'fulfilled') {
          const m = metricsRes.value.data?.data ?? metricsRes.value.data;
          if (m?.weightKg != null) setWeightKg(m.weightKg.toString());
        }

        // 2. Altura y edad vienen de /users/me
        if (profileRes.status === 'fulfilled') {
          const raw     = profileRes.value.data?.data ?? profileRes.value.data;
          const profile = raw?.profile ?? raw;
          if (profile?.heightCm != null) setHeightCm(profile.heightCm.toString());
          const serverAge = profile?.age ?? raw?.age;
          if (serverAge != null) setAge(String(serverAge));
        }
      } catch {
        // silencioso — los datos del auth/me ya hidrataron el estado
      }
    };
    fetchMetrics();
    return () => { cancelled = true; };
  }, []);

  // ── PATCH helper ─────────────────────────────────────────────────────────────
  const patchProfile = async (payload: Record<string, unknown>) => {
    const res = await authAxios.patch('/api/users/me/profile', payload);
    return res.data?.data ?? res.data;
  };

  const handleApiError = (err: any) => {
    const status = err?.response?.status;
    if (status === 401) return; // manejado por axios401Guard
    const msg = err?.response?.data?.message ?? 'No se pudo guardar.';
    Alert.alert('Error', Array.isArray(msg) ? msg.join('\n') : msg);
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
      handleApiError(err);
    } finally {
      setSavingSection(null);
    }
  };

  // ── Guardar métricas ─────────────────────────────────────────────────────────
  const handleSaveMetrics = async () => {
    const parsedWeight = parseFloat(weightKg);
    const parsedHeight = parseInt(heightCm, 10);
    const newErrors: Record<string, string> = {};

    if (isNaN(parsedWeight) || parsedWeight <= 0) {
      newErrors.weight = 'Solo números permitidos';
    }
    if (isNaN(parsedHeight) || parsedHeight <= 0) {
      newErrors.height = 'Solo números permitidos';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    setSavingSection('metrics');
    try {
      // POST al endpoint dedicado de métricas con números estrictos
      await authAxios.post('/api/users/me/metrics', {
        weightKg: parsedWeight,
        heightCm: parsedHeight,
      });

      const parsedAge = parseInt(age, 10);
      if (parsedAge > 0) {
        await patchProfile({ age: parsedAge }).catch(() => null);
      }

      updateProfile({
        age: parsedAge > 0 ? parsedAge : undefined,
        physicalMetrics: {
          weightKg: parsedWeight,
          heightCm: parsedHeight,
        }
      });

      // Solo apaga edición si el servidor respondió OK — sin limpiar valores
      setIsEditing(false);
      Alert.alert('Éxito', 'Métricas actualizadas correctamente.');
    } catch (err: any) {
      handleApiError(err);
      // isEditing permanece true — el usuario puede corregir y reintentar
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
      handleApiError(err);
    } finally {
      setSavingSection(null);
    }
  };

  // ── Loading inicial ───────────────────────────────────────────────────────────
  if (isFetching) {
    return (
      <SafeAreaView style={[s.container, s.centered]} edges={['top', 'bottom']}>
        <DumbbellSpinner size="large" color="#f05b22" />
        <Text style={s.loadingText}>Cargando perfil...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['top', 'bottom']}>
      <View style={s.topBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.topBarTitle}>Mis Datos Personales</Text>
        <TouchableOpacity
          style={s.editBtn}
          onPress={() => setIsEditing(prev => !prev)}
          disabled={savingSection !== null}
        >
          <MaterialCommunityIcons name={isEditing ? 'close' : 'pencil-outline'} size={22} color="#FF5E00" />
        </TouchableOpacity>
      </View>
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
                      <Image
                        source={av.image}
                        style={{ width: 36, height: 36, resizeMode: 'contain', opacity: selectedAvatar === av.icon ? 1 : 0.5 }}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : (
              <View style={s.avatarReadWrap}>
                <View style={s.avatarReadBadge}>
                  <Image
                    source={AVATARS.find(av => av.icon === selectedAvatar)?.image ?? AVATARS[0].image}
                    style={{ width: 56, height: 56, resizeMode: 'contain' }}
                  />
                </View>
              </View>
            )}

            {/* Nombre */}
            <View style={s.field}>
              <Text style={s.label}>Nombre de Usuario</Text>
              {isEditing
                ? <TextInput style={s.input} value={username} onChangeText={setUsername} placeholder="Tu nombre de usuario" placeholderTextColor="#B0B0B0" />
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
                    placeholderTextColor="#B0B0B0"
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
                  ? <DumbbellSpinner color="#fff" size="small" />
                  : <Text style={s.saveBtnText}>Guardar Info Básica</Text>
                }
              </TouchableOpacity>
            )}
          </View>

          {/* ── Métricas Físicas — solo clientes ── */}
          {!isGerente && (
            <View style={s.section}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                <MaterialCommunityIcons name="chart-bar" size={15} color="#B0B0B0" />
                <Text style={s.sectionTitle}>Métricas Físicas</Text>
              </View>

              {/* Fila 1: Peso + Altura */}
              <View style={s.metricsRow}>
                <View style={[s.field, s.metricHalf]}>
                  <Text style={s.label}>PESO (kg)</Text>
                  {isEditing
                    ? <>
                        <NumericInput 
                          style={[s.input, errors.weight && { borderColor: '#FF3B30' }]} 
                          value={weightKg} 
                          onChangeText={(v) => { setWeightKg(v); if(errors.weight) setErrors(e => ({...e, weight: ''})); }} 
                          placeholder="0.0" 
                          placeholderTextColor="#B0B0B0" 
                          keyboardType="decimal-pad" 
                        />
                        {!!errors.weight && <Text style={{ color: '#FF3B30', fontSize: 12, marginTop: 4 }}>{errors.weight}</Text>}
                      </>
                    : <View style={s.metricCard}><Text style={s.metricCardValue}>{weightKg || '—'}</Text></View>
                  }
                </View>
                <View style={[s.field, s.metricHalf]}>
                  <Text style={s.label}>ALTURA (cm)</Text>
                  {isEditing
                    ? <>
                        <NumericInput 
                          style={[s.input, errors.height && { borderColor: '#FF3B30' }]} 
                          value={heightCm} 
                          onChangeText={(v) => { setHeightCm(v); if(errors.height) setErrors(e => ({...e, height: ''})); }} 
                          placeholder="0" 
                          placeholderTextColor="#B0B0B0" 
                          keyboardType="numeric" 
                        />
                        {!!errors.height && <Text style={{ color: '#FF3B30', fontSize: 12, marginTop: 4 }}>{errors.height}</Text>}
                      </>
                    : <View style={s.metricCard}><Text style={s.metricCardValue}>{heightCm || '—'}</Text></View>
                  }
                </View>
              </View>

              {/* Fila 2: Edad + IMC */}
              <View style={s.metricsRow}>
                <View style={[s.field, s.metricHalf]}>
                  <Text style={s.label}>EDAD</Text>
                  {isEditing ? (
                    <TextInput
                      style={[s.input, { textAlign: 'center', fontSize: 18, fontWeight: '700' }]}
                      value={age}
                      onChangeText={v => setAge(v.replace(/[^0-9]/g, ''))}
                      keyboardType="numeric"
                      maxLength={3}
                      placeholder="Ej: 25"
                      placeholderTextColor="#555"
                    />
                  ) : (
                    <View style={s.metricCard}>
                      <Text style={s.metricCardValue}>{age || '-'}</Text>
                    </View>
                  )}
                </View>

                {/* IMC — solo lectura */}
                <View style={[s.field, s.metricHalf]}>
                  <Text style={s.label}>IMC</Text>
                  <View style={[s.metricCard, { opacity: 0.9 }]}>
                    <Text style={[s.metricCardValue, { color: imcColor }]}>{imcResult}</Text>
                    <Text style={[s.imcCategory, { color: imcColor }]}>{imcCategory}</Text>
                  </View>
                </View>
              </View>

              {isEditing && (
                <TouchableOpacity
                  style={[s.saveBtn, savingSection === 'metrics' && s.saveBtnOff]}
                  onPress={handleSaveMetrics}
                  disabled={savingSection !== null}
                  activeOpacity={0.85}
                >
                  {savingSection === 'metrics'
                    ? <DumbbellSpinner color="#fff" size="small" />
                    : <Text style={s.saveBtnText}>Guardar Métricas</Text>
                  }
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Modal de fecha eliminado — ahora se usa input directo de edad */}

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
                    placeholderTextColor="#B0B0B0"
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
                  ? <DumbbellSpinner color="#fff" size="small" />
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
  container:          { flex: 1, backgroundColor: '#0A0A0A' },
  centered:           { justifyContent: 'center', alignItems: 'center' },
  loadingText:        { color: '#B0B0B0', marginTop: 12, fontSize: 14 },
  topBar:             { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  backBtn:            { width: 40, height: 40, backgroundColor: '#1C1C1E', borderRadius: 12, borderWidth: 1, borderColor: '#3A3A3C', justifyContent: 'center', alignItems: 'center' },
  topBarTitle:        { flex: 1, color: '#fff', fontSize: 18, fontWeight: '700' },
  editBtn:            { padding: 8 },
  scrollContent:      { padding: 20, paddingBottom: 100 },

  // ── Secciones
  section:            { marginBottom: 28, backgroundColor: '#1C1C1E', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#3A3A3C' },
  sectionHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle:       { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginBottom: 16 },

  // ── Read mode
  readValue:          { color: '#FFFFFF', fontSize: 16, paddingVertical: 4 },
  avatarReadWrap:     { alignItems: 'center', marginBottom: 20 },
  avatarReadBadge:    { width: 88, height: 88, borderRadius: 44, backgroundColor: '#0A0A0A', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#3A3A3C' },
  metricsReadGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  metricCard:         { flex: 1, backgroundColor: '#0A0A0A', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#3A3A3C' },
  metricCardEditable: { borderColor: '#FF5E00' },
  metricCardLabel:    { color: '#B0B0B0', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  metricCardValue:    { color: '#FF5E00', fontSize: 22, fontWeight: '900' },
  imcCategory:        { fontSize: 11, fontWeight: '700', marginTop: 4 },

  // ── Modal fecha ──
  modalOverlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  modalBox:           { backgroundColor: '#1C1C1E', borderRadius: 16, padding: 24, width: '100%', borderWidth: 1, borderColor: '#3A3A3C', gap: 12 },
  modalTitle:         { color: '#fff', fontSize: 16, fontWeight: '800' },
  modalHint:          { color: '#555', fontSize: 12 },
  modalInput:         { backgroundColor: '#0A0A0A', borderRadius: 10, padding: 14, color: '#fff', fontSize: 16, borderWidth: 1, borderColor: '#3A3A3C' },
  modalActions:       { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalCancel:        { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#3A3A3C', alignItems: 'center' },
  modalCancelTxt:     { color: '#888', fontWeight: '600' },
  modalConfirm:       { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#FF5E00', alignItems: 'center' },
  modalConfirmTxt:    { color: '#fff', fontWeight: '700' },

  // ── Edit mode — campos
  field:              { marginBottom: 16 },
  label:              { color: '#B0B0B0', fontSize: 13, marginBottom: 8, fontWeight: '600' },
  input:              { backgroundColor: '#0A0A0A', borderRadius: 12, padding: 15, color: '#FFFFFF', fontSize: 16, borderWidth: 1, borderColor: '#3A3A3C' },
  textArea:           { height: 90, textAlignVertical: 'top' },

  // ── Avatar grid
  avatarGrid:         { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  avatarOption:       { width: '30%', aspectRatio: 1, backgroundColor: '#0A0A0A', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: '#3A3A3C' },
  avatarSelected:     { borderColor: '#FF5E00', backgroundColor: '#1C1C1E' },

  // ── Género
  genderRow:          { flexDirection: 'row', justifyContent: 'space-between' },
  genderBtn:          { flex: 1, backgroundColor: '#0A0A0A', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginHorizontal: 4, borderWidth: 1, borderColor: '#3A3A3C' },
  genderBtnActive:    { backgroundColor: '#FF5E00', borderColor: '#FF5E00' },
  genderBtnText:      { color: '#B0B0B0', fontWeight: '600', fontSize: 13 },
  genderBtnTextActive:{ color: '#FFFFFF' },

  // ── Métricas edit
  metricsRow:         { flexDirection: 'row', gap: 10 },
  metricHalf:         { flex: 1 },
  radioRow:           { flexDirection: 'row', gap: 8 },
  radioItem:          { flex: 1, backgroundColor: '#0A0A0A', paddingVertical: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#3A3A3C' },
  radioItemActive:    { backgroundColor: '#FF5E00', borderColor: '#FF5E00' },
  radioText:          { color: '#B0B0B0', fontSize: 11, fontWeight: 'bold' },
  radioTextActive:    { color: '#FFFFFF' },

  // ── Botones de guardar
  saveBtn:            { alignSelf: 'flex-end', backgroundColor: '#FF5E00', paddingVertical: 9, paddingHorizontal: 18, borderRadius: 10, marginTop: 10, minWidth: 44, alignItems: 'center' },
  saveBtnOff:         {},
  saveBtnText:        { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },

  // ── Keyboard dismiss (iOS)
  dismissBtn:         { backgroundColor: '#1C1C1E', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: '#3A3A3C' },
  dismissBtnText:     { color: '#FF5E00', fontSize: 12, fontWeight: 'bold' },
});
