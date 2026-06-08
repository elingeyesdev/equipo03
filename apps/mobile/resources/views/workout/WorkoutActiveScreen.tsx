import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
  AppState, AppStateStatus, TextInput, KeyboardAvoidingView, Platform,
  TouchableWithoutFeedback, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useKeepAwake } from 'expo-keep-awake';
import { Audio } from 'expo-av';
import { AuthService } from '../../../app/Providers/auth/AuthService';
import { trainingApi } from '../../../app/Providers/training/api/training.api';

const CALORIE_RATE: Record<string, number> = {
  CARDIO:        0.15,
  FUERZA:        0.12,
  FLEXIBILIDAD:  0.08,
  HIIT:          0.18,
  DEFAULT:       0.10,
};

const formatTime = (sec: number): string =>
  `${Math.floor(sec / 60).toString().padStart(2, '0')}:${(sec % 60).toString().padStart(2, '0')}`;

type Serie = { peso: string; reps: string };

export const WorkoutActiveScreen = () => {
  useKeepAwake();

  const navigation = useNavigation<any>();
  const route      = useRoute<any>();
  const { sport = 'DEFAULT', exerciseName } = route.params ?? {};

  const displayName = (exerciseName ?? String(sport).toUpperCase()) as string;
  const isCardio    = sport === 'CARDIO' || sport === 'HIIT';

  const [countdown, setCountdown]             = useState(3);
  const [startTime, setStartTime]             = useState(Date.now());
  const [elapsedSeconds, setElapsedSeconds]   = useState(0);
  const [isPaused, setIsPaused]               = useState(false);
  const [peso, setPeso]                       = useState('');
  const [reps, setReps]                       = useState('');
  const [completedSeries, setCompletedSeries] = useState<Serie[]>([]);
  const [restDuration, setRestDuration]       = useState(60);
  const [restEndTime, setRestEndTime]         = useState<number | null>(null);
  const [restTimeLeft, setRestTimeLeft]       = useState(0);
  const [isFinished, setIsFinished]           = useState(false);

  const startTimeRef   = useRef(startTime);
  const pausedAtRef    = useRef<number | null>(null);
  const intervalRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const soundRef       = useRef<Audio.Sound | null>(null);
  const restEndTimeRef = useRef<number | null>(null);

  startTimeRef.current   = startTime;
  restEndTimeRef.current = restEndTime;

  // Beep de cuenta regresiva — guarda ref para corte forzado
  const playBeep = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../../assets/beep.m4a'),
        { shouldPlay: true, volume: 0.6 },
      );
      soundRef.current = sound;
    } catch {
      console.warn('[WorkoutActive] beep.m4a no encontrado en assets.');
    }
  };

  // Beep corto para fin de descanso — auto-descarga, sin ref
  const playShortBeep = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../../assets/beep.m4a'),
        { shouldPlay: true, volume: 0.8 },
      );
      sound.setOnPlaybackStatusUpdate((st) => {
        if (st.isLoaded && st.didJustFinish) sound.unloadAsync();
      });
    } catch {
      console.warn('[WorkoutActive] beep.m4a no encontrado en assets.');
    }
  };

  // Cuenta regresiva inicial 3→0
  useEffect(() => {
    playBeep();
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        const next = prev - 1;
        if (next <= 0) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          const now = Date.now();
          startTimeRef.current = now;
          setStartTime(now);
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Corta el audio de cuenta regresiva exactamente al llegar a 0
  useEffect(() => {
    if (countdown !== 0) return;
    (async () => {
      if (soundRef.current) {
        try {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
        } catch { /* el sonido ya terminó por sí solo */ }
        soundRef.current = null;
      }
    })();
  }, [countdown]);

  // Tick principal: tiempo total + descanso en el mismo reloj
  const tick = useCallback(() => {
    if (pausedAtRef.current !== null) return;
    setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));

    if (restEndTimeRef.current !== null) {
      const left = Math.ceil((restEndTimeRef.current - Date.now()) / 1000);
      if (left <= 0) {
        restEndTimeRef.current = null; // inmediato para evitar doble disparo
        setRestEndTime(null);
        setRestTimeLeft(0);
        playShortBeep();
      } else {
        setRestTimeLeft(left);
      }
    }
  }, []);

  // Cronómetro arranca cuando countdown llega a 0
  useEffect(() => {
    if (countdown > 0) return;
    intervalRef.current = setInterval(tick, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [countdown, tick]);

  // Recalcula tiempo total al volver de background
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active' && countdown === 0 && pausedAtRef.current === null)
        setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    });
    return () => sub.remove();
  }, [countdown]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      if (isFinished) return;
      e.preventDefault();
      Alert.alert(
        'Entrenamiento en progreso',
        '¿Deseas salir y dar por finalizada la rutina?',
        [
          { text: 'No', style: 'cancel' },
          { text: 'Sí, finalizar', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
        ],
      );
    });
    return unsubscribe;
  }, [navigation, isFinished]);

  const handlePause = () => { pausedAtRef.current = Date.now(); setIsPaused(true); };

  const handleResume = () => {
    if (pausedAtRef.current !== null) {
      const pausedDuration = Date.now() - pausedAtRef.current;
      setStartTime(prev => {
        const adjusted = prev + pausedDuration;
        startTimeRef.current = adjusted;
        return adjusted;
      });
      pausedAtRef.current = null;
    }
    setIsPaused(false);
  };

  const handleMarkSerie = () => {
    if (!peso && !reps) return;
    setCompletedSeries(prev => [...prev, { peso, reps }]);
    setReps(''); // mantiene el peso para la siguiente serie
    const end = Date.now() + restDuration * 1000;
    restEndTimeRef.current = end;
    setRestEndTime(end);
    setRestTimeLeft(restDuration);
  };

  const handleSkipRest = () => {
    restEndTimeRef.current = null;
    setRestEndTime(null);
    setRestTimeLeft(0);
  };

  const adjustRest = (delta: number) =>
    setRestDuration(prev => Math.max(15, Math.min(300, prev + delta)));

  const SPORT_TO_BACKEND: Record<string, string> = {
    FUERZA:       'MUSCULACION',
    CARDIO:       'CINTA',
    HIIT:         'OTRO',
    CINTA:        'CINTA',
    BICICLETA:    'BICICLETA',
    NATACION:     'NATACION',
    YOGA:         'YOGA',
    FLEXIBILIDAD: 'YOGA',
  };

  const handleFinish = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const duration_seconds = elapsedSeconds;
    const rate             = CALORIE_RATE[String(sport).toUpperCase()] ?? CALORIE_RATE.DEFAULT;
    const calories_burned  = Math.round(duration_seconds * rate);
    try {
      const user    = await AuthService.getCurrentUser();
      const payload: Parameters<typeof trainingApi.saveCompletedSession>[0] = {
        sportType:       SPORT_TO_BACKEND[String(sport).toUpperCase()] ?? 'OTRO',
        durationSeconds: duration_seconds,
        caloriesBurned:  calories_burned,
      };
      if (user?.gymId) payload.gymId = Number(user.gymId);
      await trainingApi.saveCompletedSession(payload);
    } catch (e) {
      console.warn('[WorkoutActive] No se pudo registrar la sesion:', e);
    }
    setIsFinished(true);
    navigation.replace('WorkoutSummary', {
      duration_seconds, calories_burned, sport, exerciseName, series: completedSeries,
    });
  };

  // ── Cuenta regresiva ───────────────────────────────────────────────────────────
  if (countdown > 0) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.countdownWrap}>
          <Text style={s.countdownNum}>{countdown}</Text>
          <Text style={s.countdownSub}>Preparate...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── CARDIO / HIIT ──────────────────────────────────────────────────────────────
  if (isCardio) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.topBackRow}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="#f05b22" />
          </TouchableOpacity>
        </View>
        <View style={s.cardioWrap}>
          <Text style={s.sportLabel}>{displayName}</Text>
          <Text style={s.timerBig}>{formatTime(elapsedSeconds)}</Text>
          {isPaused && <Text style={s.pausedBadge}>PAUSADO</Text>}

          <View style={s.statsRow}>
            <View style={s.statCard}>
              <Text style={s.statValue}>{Math.floor(elapsedSeconds * 0.15)}</Text>
              <Text style={s.statLabel}>Calorias kcal</Text>
            </View>
            <View style={s.statCard}>
              <Text style={s.statValue}>60-70%</Text>
              <Text style={s.statLabel}>Zona Aerobica FC</Text>
            </View>
          </View>

          <View style={s.actionsCardio}>
            {isPaused
              ? <TouchableOpacity style={[s.btn, s.btnResume]} onPress={handleResume}><Text style={s.btnTxt}>Reanudar</Text></TouchableOpacity>
              : <TouchableOpacity style={[s.btn, s.btnPause]}  onPress={handlePause}><Text style={s.btnTxt}>Pausa</Text></TouchableOpacity>
            }
            <TouchableOpacity style={[s.btn, s.btnFinish]} onPress={handleFinish}>
              <Text style={s.btnTxt}>Finalizar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── MUSCULACIÓN ────────────────────────────────────────────────────────────────
  const isResting = restEndTime !== null;

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>

        <View style={s.musTopBar}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="#f05b22" />
          </TouchableOpacity>
          <View style={s.musTopRight}>
            {isPaused && <Text style={s.pausedBadge}>PAUSADO</Text>}
            <Text style={s.timerSmall}>{formatTime(elapsedSeconds)}</Text>
          </View>
        </View>

        <View style={s.musCenterBlock}>
          <Text style={s.exerciseNameBig}>{displayName}</Text>

          {isResting ? (
            /* ── Descanso activo ── */
            <View style={s.restBlock}>
              <Text style={s.restLabel}>DESCANSO</Text>
              <Text style={s.restTimer}>{formatTime(restTimeLeft)}</Text>
              <TouchableOpacity style={s.skipBtn} activeOpacity={0.8} onPress={handleSkipRest}>
                <Text style={s.skipBtnTxt}>Omitir Descanso</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* ── Formulario de serie ── */
            <>
              <View style={s.inputsRow}>
                <View style={s.inputWrap}>
                  <Text style={s.inputLabel}>Peso en Máquina/Mancuerna</Text>
                  <TextInput
                    style={s.inputField}
                    value={peso}
                    onChangeText={setPeso}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor="#333"
                    maxLength={6}
                  />
                </View>
                <View style={s.inputWrap}>
                  <Text style={s.inputLabel}>Repeticiones completadas</Text>
                  <TextInput
                    style={s.inputField}
                    value={reps}
                    onChangeText={setReps}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor="#333"
                    maxLength={3}
                  />
                </View>
              </View>

              <TouchableOpacity style={s.markBtn} activeOpacity={0.8} onPress={handleMarkSerie}>
                <Text style={s.markBtnTxt}>Marcar Serie Completada</Text>
              </TouchableOpacity>

              {/* Ajuste de descanso */}
              <View style={s.restControl}>
                <Text style={s.restControlLabel}>Descanso entre series</Text>
                <View style={s.restControlRow}>
                  <TouchableOpacity
                    style={[s.restAdjBtn, !isPaused && s.restAdjDisabled]}
                    disabled={!isPaused}
                    onPress={() => adjustRest(-15)}
                  >
                    <Text style={s.restAdjTxt}>-15s</Text>
                  </TouchableOpacity>
                  <Text style={s.restDurationTxt}>{restDuration}s</Text>
                  <TouchableOpacity
                    style={[s.restAdjBtn, !isPaused && s.restAdjDisabled]}
                    disabled={!isPaused}
                    onPress={() => adjustRest(+15)}
                  >
                    <Text style={s.restAdjTxt}>+15s</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}

          {/* Historial de series — siempre visible */}
          {completedSeries.length > 0 && (
            <View style={s.seriesBox}>
              <Text style={s.seriesCount}>
                {completedSeries.length} {completedSeries.length === 1 ? 'serie' : 'series'} completadas
              </Text>
              {completedSeries.slice(-3).map((ser, i) => (
                <Text key={i} style={s.serieItem}>
                  {completedSeries.length - Math.min(completedSeries.length, 3) + i + 1}.{'  '}{ser.peso} kg × {ser.reps} reps
                </Text>
              ))}
            </View>
          )}
        </View>

        <View style={s.actionsMus}>
          {isPaused
            ? <TouchableOpacity style={[s.btn, s.btnResume]} onPress={handleResume}><Text style={s.btnTxt}>Reanudar</Text></TouchableOpacity>
            : <TouchableOpacity style={[s.btn, s.btnPause]}  onPress={handlePause}><Text style={s.btnTxt}>Pausa</Text></TouchableOpacity>
          }
          <TouchableOpacity style={[s.btn, s.btnFinish]} onPress={handleFinish}>
            <Text style={s.btnTxt}>Finalizar</Text>
          </TouchableOpacity>
        </View>

        </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#0a0a0a' },

  topBackRow: { paddingHorizontal: 20, paddingTop: 12 },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#161618',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#222',
  },

  countdownWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  countdownNum:  { color: '#fff', fontSize: 160, fontWeight: '900', lineHeight: 170 },
  countdownSub:  { color: '#555', fontSize: 16, marginTop: 8, letterSpacing: 2 },

  cardioWrap:   { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  sportLabel:   { color: '#f05b22', fontSize: 13, fontWeight: '700', letterSpacing: 3, marginBottom: 16 },
  timerBig:     { color: '#fff', fontSize: 88, fontWeight: '900', letterSpacing: -2 },
  pausedBadge:  { color: '#f05b22', fontSize: 12, fontWeight: '700', letterSpacing: 2, marginTop: 6 },

  statsRow:   { flexDirection: 'row', gap: 12, marginTop: 36 },
  statCard:   {
    flex: 1, backgroundColor: '#111', borderRadius: 18,
    paddingVertical: 22, paddingHorizontal: 12, alignItems: 'center',
    borderWidth: 1, borderColor: '#1c1c1e',
  },
  statValue:  { color: '#fff', fontSize: 26, fontWeight: '900' },
  statLabel:  { color: '#555', fontSize: 11, marginTop: 6, textAlign: 'center' },

  actionsCardio: { flexDirection: 'row', gap: 16, marginTop: 48 },

  musTopBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 16, paddingBottom: 4,
  },
  musTopRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  timerSmall: { color: '#444', fontSize: 22, fontWeight: '700' },

  musCenterBlock: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, gap: 20 },

  exerciseNameBig: {
    color: '#fff', fontSize: 30, fontWeight: '900',
    textAlign: 'center', letterSpacing: -0.5, marginBottom: 4,
  },

  inputsRow:  { flexDirection: 'row', gap: 12 },
  inputWrap:  { flex: 1 },
  inputLabel: {
    color: '#555', fontSize: 11, fontWeight: '700',
    letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase',
  },
  inputField: {
    backgroundColor: '#161618', borderRadius: 14, borderWidth: 1, borderColor: '#222',
    height: 58, textAlign: 'center', color: '#fff', fontSize: 24, fontWeight: '700',
  },

  markBtn: {
    backgroundColor: '#2ecc71', borderRadius: 16, height: 60,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#2ecc71', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 5,
  },
  markBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },

  restControl:      { alignItems: 'center', gap: 8 },
  restControlLabel: { color: '#444', fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  restControlRow:   { flexDirection: 'row', alignItems: 'center', gap: 16 },
  restAdjBtn:       {
    backgroundColor: '#161618', borderRadius: 10, borderWidth: 1, borderColor: '#222',
    paddingVertical: 7, paddingHorizontal: 14,
  },
  restAdjTxt:       { color: '#aaa', fontSize: 13, fontWeight: '700' },
  restAdjDisabled:  { opacity: 0.3 },
  restDurationTxt:  { color: '#f05b22', fontSize: 18, fontWeight: '900', minWidth: 48, textAlign: 'center' },

  restBlock: {
    backgroundColor: '#1a0e00', borderRadius: 20, borderWidth: 1, borderColor: '#f05b2244',
    paddingVertical: 28, paddingHorizontal: 24, alignItems: 'center', gap: 12,
  },
  restLabel: { color: '#f05b22', fontSize: 12, fontWeight: '800', letterSpacing: 3 },
  restTimer: { color: '#fff', fontSize: 64, fontWeight: '900', letterSpacing: -2 },
  skipBtn:   {
    backgroundColor: '#1c1c1e', borderRadius: 12, borderWidth: 1, borderColor: '#333',
    paddingVertical: 10, paddingHorizontal: 24, marginTop: 4,
  },
  skipBtnTxt: { color: '#aaa', fontSize: 13, fontWeight: '700' },

  seriesBox:   { gap: 5 },
  seriesCount: { color: '#f05b22', fontSize: 13, fontWeight: '700' },
  serieItem:   { color: '#555', fontSize: 12 },

  actionsMus: { flexDirection: 'row', gap: 16, paddingHorizontal: 24, paddingBottom: 24 },

  btn:       { flex: 1, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  btnPause:  { backgroundColor: '#1c1c1e', borderWidth: 1, borderColor: '#333' },
  btnResume: { backgroundColor: '#2ecc71' },
  btnFinish: { backgroundColor: '#f05b22' },
  btnTxt:    { color: '#fff', fontSize: 16, fontWeight: '700' },
});
