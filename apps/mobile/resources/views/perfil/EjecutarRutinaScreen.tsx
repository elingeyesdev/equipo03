import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as Location from 'expo-location';
import { ClientRoutine, ClientRoutineExercise } from '../../../app/Providers/staff/api/staff.api';
import { trainingApi } from '../../../app/Providers/training/api/training.api';

// ─── Types ────────────────────────────────────────────────────────────────────

type ExMode = 'strength' | 'cardio';

type SetRow = {
  setNumber:         number;
  totalSets:         number;
  // strength
  repsRecommended:   string;
  weightRecommended: number;
  repsInput:         string;
  weightInput:       string;
  // cardio
  distanceInput:     string;   // meters
  durationInput:     string;   // minutes
  done:              boolean;
};

type Phase = 'detecting' | 'ready' | 'active' | 'finishing';
type RouteParams = { routine: ClientRoutine; exercise: ClientRoutineExercise };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const GYM_RADIUS_KM = 0.2;

const getExMode = (ex: ClientRoutineExercise): ExMode => {
  const cat  = (ex.exercise?.category ?? '').toUpperCase();
  const name = (ex.exercise?.name     ?? '').toUpperCase();
  const cardioKws = ['CARDIO', 'AEROB', 'BICICLETA', 'CINTA', 'NATACION', 'TROTADORA', 'ELIPTICA', 'REMO'];
  return cardioKws.some(k => cat.includes(k) || name.includes(k)) ? 'cardio' : 'strength';
};

const buildSets = (ex: ClientRoutineExercise): SetRow[] => {
  const total  = ex.setsRecommended ?? 1;
  const reps   = String(ex.repsRecommended ?? 10);
  const weight = ex.weightRecommendedKg ?? 0;
  return Array.from({ length: total }, (_, i) => ({
    setNumber:         i + 1,
    totalSets:         total,
    repsRecommended:   reps,
    weightRecommended: weight,
    repsInput:         reps.replace(/[^0-9]/g, ''),
    weightInput:       weight > 0 ? String(weight) : '0',
    distanceInput:     '0',
    durationInput:     '0',
    done:              false,
  }));
};

const fmt = (secs: number) => {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const EjecutarRutinaScreen = () => {
  const navigation = useNavigation<any>();
  const route      = useRoute<RouteProp<Record<string, RouteParams>, string>>();
  const { routine, exercise } = route.params;

  const mode = getExMode(exercise);

  const [phase,     setPhase]     = useState<Phase>('detecting');
  const [gymId,     setGymId]     = useState<number | null>(null);
  const [gymLabel,  setGymLabel]  = useState<string>('Fuera de Sucursales');
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [sets,      setSets]      = useState<SetRow[]>(() => buildSets(exercise));
  const [cursor,    setCursor]    = useState(0);
  const [elapsed,   setElapsed]   = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── GPS ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') { setPhase('ready'); return; }
        const pos  = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const locs = await trainingApi.getGymLocations();
        let nearestId: number | null = null;
        let nearestLabel = 'Fuera de Sucursales';
        let minDist = Infinity;
        for (const loc of locs) {
          const dist = haversineKm(pos.coords.latitude, pos.coords.longitude, loc.latitude, loc.longitude);
          if (dist < minDist) {
            minDist = dist;
            if (dist <= GYM_RADIUS_KM) {
              nearestId    = loc.gymId;
              nearestLabel = loc.brandName ? `${loc.brandName} - ${loc.gymName}` : loc.gymName;
            }
          }
        }
        setGymId(nearestId);
        setGymLabel(nearestLabel);
      } catch {/* sin GPS */}
      finally { setPhase('ready'); }
    })();
  }, []);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
  }, []);

  // ── Start session ────────────────────────────────────────────────────────────
  const handleStart = async () => {
    try {
      setPhase('active');
      const session = await trainingApi.startRoutineSession({
        routineId: routine.id,
        gymId,
        sportType: mode === 'cardio' ? 'CARDIO' : 'MUSCULACION',
      });
      setSessionId(session.id);
      startTimer();
    } catch {
      Alert.alert('Error', 'No se pudo iniciar la sesión. Revisa tu conexión.');
      setPhase('ready');
    }
  };

  // ── Complete a set ───────────────────────────────────────────────────────────
  const handleCompleteSet = async () => {
    if (!sessionId) return;
    const set = sets[cursor];

    if (mode === 'cardio') {
      const dist = parseInt(set.distanceInput) || 0;
      const secs = Math.round((parseFloat(set.durationInput) || 0) * 60);
      trainingApi.addSet(sessionId, {
        routineExerciseId: exercise.id,
        exerciseId:        exercise.exercise?.id ?? undefined,
        setNumber:         set.setNumber,
        distanceMeters:    dist,
        durationSeconds:   secs,
      }).catch(() => {});
    } else {
      const reps   = parseInt(set.repsInput) || 0;
      const weight = parseFloat(set.weightInput) || 0;
      trainingApi.addSet(sessionId, {
        routineExerciseId: exercise.id,
        exerciseId:        exercise.exercise?.id ?? undefined,
        setNumber:         set.setNumber,
        repsCompleted:     reps,
        weightUsedKg:      weight,
      }).catch(() => {});
    }

    const next = sets.map((s, i) => i === cursor ? { ...s, done: true } : s);
    setSets(next);
    const nextIdx = cursor + 1;
    if (nextIdx < next.length) {
      setCursor(nextIdx);
    } else {
      finishSession(next, 'COMPLETED');
    }
  };

  const handleSkipSet = () => {
    const nextIdx = cursor + 1;
    if (nextIdx < sets.length) { setCursor(nextIdx); }
    else { finishSession(sets, 'PARTIAL'); }
  };

  const handleFinishEarly = () => {
    const allDone = sets.every(s => s.done);
    if (allDone) { finishSession(sets, 'COMPLETED'); return; }
    Alert.alert(
      'Ejercicio incompleto',
      'No has completado todas las series. El entrenador monitorea tu progreso.\n\n¿Estás seguro de finalizar ahora?',
      [
        { text: 'Continuar', style: 'cancel' },
        { text: 'Finalizar de todos modos', style: 'destructive', onPress: () => finishSession(sets, 'PARTIAL') },
      ],
    );
  };

  const finishSession = async (finalSets: SetRow[], status: 'COMPLETED' | 'PARTIAL') => {
    if (!sessionId || phase === 'finishing') return;
    setPhase('finishing');
    if (timerRef.current) clearInterval(timerRef.current);
    try { await trainingApi.finishSession(sessionId, status, elapsed); } catch {/**/}

    navigation.replace('ResumenEjercicio', {
      status,
      label:        status === 'COMPLETED' ? 'Completada' : 'Parcial',
      color:        status === 'COMPLETED' ? '#22c55e' : '#facc15',
      routineName:  routine.name,
      exerciseName: exercise.exercise?.name ?? 'Ejercicio',
      elapsed,
      gymLabel,
      totalSets:    finalSets.length,
      doneSets:     finalSets.filter(s => s.done).length,
    });
  };

  // ── Loading states ───────────────────────────────────────────────────────────
  if (phase === 'detecting') {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <ActivityIndicator size="large" color="#f05b22" />
          <Text style={s.infoTxt}>Detectando ubicación...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (phase === 'finishing') {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <ActivityIndicator size="large" color="#f05b22" />
          <Text style={s.infoTxt}>Guardando sesión...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── READY phase ──────────────────────────────────────────────────────────────
  if (phase === 'ready') {
    const isCardio = mode === 'cardio';
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.topBar}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="chevron-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={s.topTitle} numberOfLines={1}>{exercise.exercise?.name ?? 'Ejercicio'}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={s.readyContent}>
          <View style={s.gymBadge}>
            <MaterialCommunityIcons
              name={gymId ? 'map-marker-check' : 'map-marker-off'}
              size={18} color={gymId ? '#22c55e' : '#888'}
            />
            <Text style={[s.gymTxt, { color: gymId ? '#22c55e' : '#888' }]}>{gymLabel}</Text>
          </View>

          <Text style={s.readyTitle}>¿Listo para entrenar?</Text>

          <View style={s.previewCard}>
            <View style={s.previewRow}>
              <MaterialCommunityIcons name="dumbbell" size={20} color="#f05b22" />
              <Text style={s.previewExName}>{exercise.exercise?.name ?? '—'}</Text>
              {isCardio && (
                <View style={[s.typeBadge, { backgroundColor: '#60a5fa22' }]}>
                  <Text style={[s.typeTxt, { color: '#60a5fa' }]}>Cardio</Text>
                </View>
              )}
            </View>
            <View style={s.previewStats}>
              <View style={s.previewStat}>
                <Text style={s.previewStatVal}>{exercise.setsRecommended}</Text>
                <Text style={s.previewStatLbl}>series</Text>
              </View>
              {isCardio ? (
                <>
                  <View style={s.previewStatDiv} />
                  <View style={s.previewStat}>
                    <Text style={s.previewStatVal}>{exercise.repsRecommended}</Text>
                    <Text style={s.previewStatLbl}>tiempo/dist.</Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={s.previewStatDiv} />
                  <View style={s.previewStat}>
                    <Text style={s.previewStatVal}>{exercise.repsRecommended}</Text>
                    <Text style={s.previewStatLbl}>reps</Text>
                  </View>
                  {(exercise.weightRecommendedKg ?? 0) > 0 && (
                    <>
                      <View style={s.previewStatDiv} />
                      <View style={s.previewStat}>
                        <Text style={s.previewStatVal}>{exercise.weightRecommendedKg} kg</Text>
                        <Text style={s.previewStatLbl}>peso rec.</Text>
                      </View>
                    </>
                  )}
                </>
              )}
            </View>
            {exercise.notes ? <Text style={s.previewNotes}>{exercise.notes}</Text> : null}
          </View>

          <TouchableOpacity style={s.startBtn} onPress={handleStart} activeOpacity={0.85}>
            <MaterialCommunityIcons name="play-circle" size={22} color="#fff" />
            <Text style={s.startTxt}>Iniciar</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── ACTIVE phase ─────────────────────────────────────────────────────────────
  const current  = sets[cursor];
  const doneSets = sets.filter(s => s.done).length;
  const progress = doneSets / sets.length;

  const updateField = (field: keyof SetRow, value: string) =>
    setSets(prev => prev.map((r, i) => i === cursor ? { ...r, [field]: value } : r));

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.topBar}>
        <TouchableOpacity style={s.backBtn} onPress={handleFinishEarly}>
          <MaterialCommunityIcons name="close" size={22} color="#888" />
        </TouchableOpacity>
        <Text style={s.topTitle} numberOfLines={1}>{exercise.exercise?.name ?? 'Ejercicio'}</Text>
        <Text style={s.timerTxt}>{fmt(elapsed)}</Text>
      </View>

      {/* Progress bar */}
      <View style={s.progressBar}>
        <View style={[s.progressFill, { width: `${Math.round(progress * 100)}%` as any }]} />
      </View>
      <Text style={s.progressTxt}>{doneSets} / {sets.length} series</Text>

      <ScrollView contentContainerStyle={s.activeContent}>
        {/* Set card */}
        <View style={s.setCard}>
          <Text style={s.setCardTitle}>Serie {current.setNumber} de {current.totalSets}</Text>

          {mode === 'strength' ? (
            <View style={s.setRow}>
              <View style={s.setField}>
                <Text style={s.setFieldLabel}>Repeticiones</Text>
                <Text style={s.setFieldHint}>Rec: {current.repsRecommended}</Text>
                <TextInput
                  style={s.setInput}
                  value={sets[cursor].repsInput}
                  onChangeText={v => updateField('repsInput', v)}
                  keyboardType="numeric"
                  selectTextOnFocus
                />
              </View>
              <View style={s.setField}>
                <Text style={s.setFieldLabel}>Peso (kg)</Text>
                <Text style={s.setFieldHint}>Rec: {current.weightRecommended} kg</Text>
                <TextInput
                  style={s.setInput}
                  value={sets[cursor].weightInput}
                  onChangeText={v => updateField('weightInput', v)}
                  keyboardType="decimal-pad"
                  selectTextOnFocus
                />
              </View>
            </View>
          ) : (
            <View style={s.setRow}>
              <View style={s.setField}>
                <Text style={s.setFieldLabel}>Distancia (m)</Text>
                <Text style={s.setFieldHint}> </Text>
                <TextInput
                  style={s.setInput}
                  value={sets[cursor].distanceInput}
                  onChangeText={v => updateField('distanceInput', v)}
                  keyboardType="numeric"
                  selectTextOnFocus
                />
              </View>
              <View style={s.setField}>
                <Text style={s.setFieldLabel}>Tiempo (min)</Text>
                <Text style={s.setFieldHint}> </Text>
                <TextInput
                  style={s.setInput}
                  value={sets[cursor].durationInput}
                  onChangeText={v => updateField('durationInput', v)}
                  keyboardType="decimal-pad"
                  selectTextOnFocus
                />
              </View>
            </View>
          )}

          <TouchableOpacity style={s.doneBtn} onPress={handleCompleteSet} activeOpacity={0.85}>
            <MaterialCommunityIcons name="check-circle" size={20} color="#fff" />
            <Text style={s.doneTxt}>Serie Completada</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.skipBtn} onPress={handleSkipSet} activeOpacity={0.7}>
            <Text style={s.skipTxt}>
              {cursor === sets.length - 1 ? 'Finalizar sin esta serie' : 'Omitir serie →'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Dots overview */}
        <View style={s.setsOverview}>
          {sets.map((st, i) => (
            <View key={i} style={[
              s.setDot,
              st.done           && s.setDotDone,
              i === cursor && !st.done && s.setDotCurrent,
            ]} />
          ))}
        </View>

        <TouchableOpacity style={s.earlyFinishBtn} onPress={handleFinishEarly} activeOpacity={0.75}>
          <Text style={s.earlyFinishTxt}>Finalizar ejercicio</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: '#000' },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14 },
  infoTxt: { color: '#555', fontSize: 14 },

  topBar:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#111' },
  backBtn:  { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  topTitle: { flex: 1, color: '#fff', fontSize: 15, fontWeight: '700', textAlign: 'center' },
  timerTxt: { color: '#f05b22', fontWeight: '700', fontSize: 15, minWidth: 50, textAlign: 'right' },

  progressBar:  { height: 3, backgroundColor: '#1a1a1a' },
  progressFill: { height: 3, backgroundColor: '#f05b22' },
  progressTxt:  { color: '#444', fontSize: 11, textAlign: 'right', paddingRight: 16, paddingTop: 4 },

  // READY
  readyContent: { padding: 20, paddingBottom: 100 },
  gymBadge:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  gymTxt:       { fontSize: 13, fontWeight: '600' },
  readyTitle:   { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 16 },

  previewCard:    { backgroundColor: '#0e0e0e', borderRadius: 14, padding: 16, marginBottom: 32, borderWidth: 1, borderColor: '#1a1a1a' },
  previewRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  previewExName:  { color: '#fff', fontSize: 15, fontWeight: '700', flex: 1 },
  typeBadge:      { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  typeTxt:        { fontSize: 11, fontWeight: '700' },
  previewStats:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  previewStat:    { alignItems: 'center' },
  previewStatVal: { color: '#f05b22', fontSize: 18, fontWeight: '800' },
  previewStatLbl: { color: '#444', fontSize: 11 },
  previewStatDiv: { width: 1, height: 24, backgroundColor: '#1a1a1a' },
  previewNotes:   { color: '#444', fontSize: 12, marginTop: 10, fontStyle: 'italic' },

  startBtn: { backgroundColor: '#f05b22', borderRadius: 14, paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  startTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // ACTIVE
  activeContent: { padding: 20, paddingBottom: 120 },
  setCard:      { backgroundColor: '#0e0e0e', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#1a1a1a', marginBottom: 20 },
  setCardTitle: { color: '#888', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16, textAlign: 'center' },
  setRow:       { flexDirection: 'row', gap: 16, marginBottom: 20 },
  setField:     { flex: 1, alignItems: 'center' },
  setFieldLabel:{ color: '#888', fontSize: 11, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  setFieldHint: { color: '#333', fontSize: 10, marginBottom: 8, height: 14 },
  setInput:     { backgroundColor: '#151515', borderRadius: 10, borderWidth: 1, borderColor: '#2a2a2a', color: '#fff', fontSize: 28, fontWeight: '800', textAlign: 'center', paddingVertical: 12, width: '100%' },

  doneBtn: { backgroundColor: '#f05b22', borderRadius: 12, paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 12 },
  doneTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
  skipBtn: { alignItems: 'center', paddingVertical: 6 },
  skipTxt: { color: '#444', fontSize: 13 },

  setsOverview:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 24 },
  setDot:        { width: 10, height: 10, borderRadius: 5, backgroundColor: '#1a1a1a' },
  setDotDone:    { backgroundColor: '#22c55e' },
  setDotCurrent: { backgroundColor: '#f05b22' },

  earlyFinishBtn: { borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#2a2a2a' },
  earlyFinishTxt: { color: '#555', fontSize: 13, fontWeight: '600' },
});
