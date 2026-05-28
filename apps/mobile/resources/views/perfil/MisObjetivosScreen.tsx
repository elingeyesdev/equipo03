import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../../app/Shared/hooks/useAuth';
import { NumericInput } from '../../../app/Shared/components/ui/NumericInput';

type GoalType = 'perdida' | 'muscular' | 'mantenimiento';

type SavedGoal = {
  type: GoalType;
  targetValue: number;
  baselineValue: number;
};

const STORAGE_KEY = 'gymsync_objetivo';

const CARDS: { type: GoalType; icon: string; title: string; desc: string; color: string }[] = [
  { type: 'perdida',       icon: 'trending-down', title: 'Pérdida de Peso',               desc: 'Alcanza tu peso ideal con un déficit controlado.',        color: '#f05b22' },
  { type: 'muscular',      icon: 'arm-flex',      title: 'Ganancia Muscular',              desc: 'Aumenta tu masa muscular con entrenamiento progresivo.',  color: '#00c853' },
  { type: 'mantenimiento', icon: 'scale-balance', title: 'Mantenimiento / Recomposición',  desc: 'Mantén tu peso y mejora tu composición corporal.',        color: '#2196f3' },
];

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function calcProgress(goal: SavedGoal, current: number): number {
  if (goal.type === 'mantenimiento') return 100;
  const { targetValue: target, baselineValue: baseline } = goal;
  if (goal.type === 'perdida') {
    if (baseline <= target) return 100;
    return clamp(0, 100, ((baseline - current) / (baseline - target)) * 100);
  }
  if (target <= baseline) return 100;
  return clamp(0, 100, ((current - baseline) / (target - baseline)) * 100);
}

export const MisObjetivosScreen = () => {
  const { user } = useAuth();
  const pm = (user as any)?.profile?.physicalMetrics;

  const currentWeight = pm?.weightKg     ? Number(pm.weightKg)     : null;
  const currentMuscle = pm?.muscleMassKg ? Number(pm.muscleMassKg) : null;

  const [selectedType, setSelectedType] = useState<GoalType | null>(null);
  const [targetInput,  setTargetInput]  = useState('');
  const [savedGoal,    setSavedGoal]    = useState<SavedGoal | null>(null);
  const [saving,       setSaving]       = useState(false);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => { if (raw) setSavedGoal(JSON.parse(raw) as SavedGoal); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!selectedType) return;
    const needsValue = selectedType !== 'mantenimiento';
    const target = parseFloat(targetInput);
    if (needsValue && (isNaN(target) || target <= 0)) {
      Alert.alert('Error', 'Ingresa un valor objetivo válido.');
      return;
    }
    const baseline = selectedType === 'muscular' ? (currentMuscle ?? 0) : (currentWeight ?? 0);
    const goal: SavedGoal = { type: selectedType, targetValue: needsValue ? target : 0, baselineValue: baseline };
    setSaving(true);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(goal));
      setSavedGoal(goal);
      setSelectedType(null);
      setTargetInput('');
    } catch {
      Alert.alert('Error', 'No se pudo guardar el objetivo.');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    Alert.alert('Confirmar', '¿Eliminar objetivo actual?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        await AsyncStorage.removeItem(STORAGE_KEY);
        setSavedGoal(null);
        setSelectedType(null);
        setTargetInput('');
      }},
    ]);
  };

  if (loading) return (
    <SafeAreaView style={[s.container, s.center]}>
      <ActivityIndicator size="large" color="#f05b22" />
    </SafeAreaView>
  );

  // ── Objetivo activo ──────────────────────────────────────────────────────────
  if (savedGoal) {
    const card     = CARDS.find(c => c.type === savedGoal.type)!;
    const current  = savedGoal.type === 'muscular' ? (currentMuscle ?? savedGoal.baselineValue) : (currentWeight ?? savedGoal.baselineValue);
    const progress = calcProgress(savedGoal, current);
    const curLbl   = savedGoal.type === 'muscular' ? 'Músculo actual' : 'Peso actual';

    return (
      <SafeAreaView style={s.container}>
        <ScrollView contentContainerStyle={s.scrollContent}>

          <View style={[s.activeCard, { borderColor: card.color }]}>
            <View style={[s.activeIconBadge, { backgroundColor: card.color + '22' }]}>
              <MaterialCommunityIcons name={card.icon as any} size={32} color={card.color} />
            </View>
            <Text style={[s.activeTitle, { color: card.color }]}>{card.title}</Text>
            <Text style={s.activeDesc}>{card.desc}</Text>
          </View>

          <View style={s.statsRow}>
            <View style={s.statBox}>
              <Text style={s.statLbl}>{curLbl}</Text>
              <Text style={[s.statVal, { color: card.color }]}>
                {current > 0 ? `${current} kg` : '—'}
              </Text>
            </View>
            {savedGoal.type !== 'mantenimiento' && (
              <View style={s.statBox}>
                <Text style={s.statLbl}>Objetivo</Text>
                <Text style={[s.statVal, { color: '#fff' }]}>{savedGoal.targetValue} kg</Text>
              </View>
            )}
          </View>

          <View style={s.progressSection}>
            <View style={s.progressHeader}>
              <Text style={s.progressLabel}>Progreso</Text>
              <Text style={[s.progressPct, { color: card.color }]}>{Math.round(progress)}%</Text>
            </View>
            <View style={s.progressTrack}>
              <View style={[s.progressFill, { width: `${progress}%` as any, backgroundColor: card.color }]} />
            </View>
            {progress >= 100 && (
              <Text style={[s.goalReached, { color: card.color }]}>¡Objetivo alcanzado!</Text>
            )}
          </View>

          {current <= 0 && (
            <View style={s.warnBox}>
              <MaterialCommunityIcons name="information-outline" size={18} color="#f5a623" />
              <Text style={s.warnText}>Guarda tus métricas físicas para ver el progreso real.</Text>
            </View>
          )}

          <TouchableOpacity style={s.clearBtn} onPress={handleClear} activeOpacity={0.8}>
            <MaterialCommunityIcons name="delete-outline" size={18} color="#ff4444" />
            <Text style={s.clearBtnText}>Cambiar objetivo</Text>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Selección de objetivo ────────────────────────────────────────────────────
  const needsValue     = selectedType && selectedType !== 'mantenimiento';
  const currentForHint = selectedType === 'muscular' ? currentMuscle : currentWeight;

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scrollContent}>

        <Text style={s.heading}>¿Cuál es tu objetivo?</Text>
        <Text style={s.subheading}>Elige una meta y te ayudamos a seguir tu progreso.</Text>

        {CARDS.map(card => (
          <TouchableOpacity
            key={card.type}
            style={[s.card, selectedType === card.type && { borderColor: card.color, backgroundColor: card.color + '14' }]}
            onPress={() => { setSelectedType(card.type); setTargetInput(''); }}
            activeOpacity={0.85}
          >
            <View style={[s.cardIcon, { backgroundColor: card.color + '22' }]}>
              <MaterialCommunityIcons name={card.icon as any} size={28} color={card.color} />
            </View>
            <View style={s.cardBody}>
              <Text style={[s.cardTitle, selectedType === card.type && { color: card.color }]}>{card.title}</Text>
              <Text style={s.cardDesc}>{card.desc}</Text>
            </View>
            {selectedType === card.type && (
              <MaterialCommunityIcons name="check-circle" size={22} color={card.color} />
            )}
          </TouchableOpacity>
        ))}

        {needsValue && (
          <View style={s.inputSection}>
            <Text style={s.inputLabel}>
              {selectedType === 'perdida' ? 'Peso objetivo (kg)' : 'Masa muscular objetivo (kg)'}
            </Text>
            {currentForHint != null && (
              <Text style={s.inputHint}>Actual: {currentForHint} kg</Text>
            )}
            <NumericInput
              style={s.input}
              value={targetInput}
              onChangeText={setTargetInput}
              placeholder="Ej: 70.0"
              placeholderTextColor="#555"
            />
          </View>
        )}

        {selectedType && (
          <TouchableOpacity
            style={[s.saveBtn, saving && s.saveBtnOff]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={s.saveBtnText}>Guardar Objetivo</Text>
            }
          </TouchableOpacity>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#000000' },
  center:          { justifyContent: 'center', alignItems: 'center' },
  scrollContent:   { padding: 20, paddingBottom: 80 },

  // Selección
  heading:         { color: '#fff', fontSize: 24, fontWeight: '900', marginBottom: 6 },
  subheading:      { color: '#666', fontSize: 14, marginBottom: 28 },
  card:            { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1.5, borderColor: '#1e1e1e', gap: 14 },
  cardIcon:        { width: 52, height: 52, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardBody:        { flex: 1 },
  cardTitle:       { color: '#fff', fontWeight: '700', fontSize: 15, marginBottom: 3 },
  cardDesc:        { color: '#666', fontSize: 12, lineHeight: 17 },
  inputSection:    { backgroundColor: '#111', borderRadius: 14, padding: 16, marginTop: 8, marginBottom: 16, borderWidth: 1, borderColor: '#1e1e1e' },
  inputLabel:      { color: '#888', fontSize: 13, fontWeight: '600', marginBottom: 4 },
  inputHint:       { color: '#555', fontSize: 12, marginBottom: 8 },
  input:           { backgroundColor: '#1a1a1a', borderRadius: 10, padding: 14, color: '#fff', fontSize: 16, borderWidth: 1, borderColor: '#2a2a2a' },
  saveBtn:         { backgroundColor: '#f05b22', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 4 },
  saveBtnOff:      { opacity: 0.5 },
  saveBtnText:     { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  // Objetivo activo
  activeCard:      { borderRadius: 16, borderWidth: 1.5, padding: 20, alignItems: 'center', marginBottom: 20, backgroundColor: '#111' },
  activeIconBadge: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  activeTitle:     { fontSize: 20, fontWeight: '900', marginBottom: 4 },
  activeDesc:      { color: '#666', fontSize: 13, textAlign: 'center' },
  statsRow:        { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statBox:         { flex: 1, backgroundColor: '#111', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#1e1e1e' },
  statLbl:         { color: '#666', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 },
  statVal:         { fontSize: 20, fontWeight: '900' },
  progressSection: { backgroundColor: '#111', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#1e1e1e' },
  progressHeader:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressLabel:   { color: '#888', fontWeight: '700', fontSize: 13 },
  progressPct:     { fontWeight: '900', fontSize: 16 },
  progressTrack:   { height: 10, backgroundColor: '#1e1e1e', borderRadius: 5, overflow: 'hidden' },
  progressFill:    { height: 10, borderRadius: 5 },
  goalReached:     { marginTop: 10, fontWeight: '700', fontSize: 13, textAlign: 'center' },
  warnBox:         { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1a1400', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#332200', marginBottom: 16 },
  warnText:        { color: '#f5a623', fontSize: 12, flex: 1 },
  clearBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#2a0a0a', backgroundColor: '#110000' },
  clearBtnText:    { color: '#ff4444', fontWeight: '700', fontSize: 14 },
});
