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
import { TrackingType } from './WorkoutModeScreen';

const CALORIE_RATE: Record<string, number> = {
  CARDIO:        0.15,
  FUERZA:        0.12,
  FLEXIBILIDAD:  0.08,
  HIIT:          0.18,
  DEFAULT:       0.10,
};

const formatTime = (sec: number): string =>
  `${Math.floor(sec / 60).toString().padStart(2, '0')}:${(sec % 60).toString().padStart(2, '0')}`;

type Serie = {
  // PESO_REPS
  peso?: string;
  reps?: string;
  // TIME_BASED
  duracionSec?: string;
  // DISTANCE_TIME
  distanciaM?: string;
  tiempoMin?: string;
  // ASSISTED_WEIGHT
  ayudaKg?: string;
};

export const WorkoutActiveScreen = () => {
  useKeepAwake();

  const navigation = useNavigation<any>();
  const route      = useRoute<any>();
  const { sport = 'DEFAULT', exerciseName, trackingType = 'PESO_REPS' as TrackingType } = route.params ?? {};

  const displayName  = (exerciseName ?? String(sport).toUpperCase()) as string;
  const isCardio     = (trackingType as TrackingType) === 'DISTANCE_TIME';

  const [countdown, setCountdown]             = useState(3);
  const [startTime, setStartTime]             = useState(Date.now());
  const [elapsedSeconds, setElapsedSeconds]   = useState(0);
  const [isPaused, setIsPaused]               = useState(false);
  const [completedSeries, setCompletedSeries] = useState<Serie[]>([]);
  const [restDuration, setRestDuration]       = useState(60);
  const [restEndTime, setRestEndTime]         = useState<number | null>(null);
  const [restTimeLeft, setRestTimeLeft]       = useState(0);
  const [isFinished, setIsFinished]           = useState(false);

  // Inputs por tipo
  const [peso, setPeso]           = useState(''); // PESO_REPS
  const [reps, setReps]           = useState(''); // PESO_REPS, BODYWEIGHT_REPS, ASSISTED_WEIGHT
  const [duracion, setDuracion]   = useState(''); // TIME_BASED
  const [distancia, setDistancia] = useState(''); // DISTANCE_TIME
  const [tiempoMin, setTiempoMin] = useState(''); // DISTANCE_TIME
  const [ayuda, setAyuda]         = useState(''); // ASSISTED_WEIGHT

  const startTimeRef   = useRef(startTime);
  const pausedAtRef    = useRef<number | null>(null);
  const intervalRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const soundRef       = useRef<Audio.Sound | null>(null);
  const restEndTimeRef = useRef<number | null>(null);

  startTimeRef.current   = startTime;
  restEndTimeRef.current = restEndTime;

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

  useEffect(() => {
    if (countdown !== 0) return;
    (async () => {
      if (soundRef.current) {
        try {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
        } catch { /* ya terminó */ }
        soundRef.current = null;
      }
    })();
  }, [countdown]);

  const tick = useCallback(() => {
    if (pausedAtRef.current !== null) return;
    setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    if (restEndTimeRef.current !== null) {
      const left = Math.ceil((restEndTimeRef.current - Date.now()) / 1000);
      if (left <= 0) {
        restEndTimeRef.current = null;
        setRestEndTime(null);
        setRestTimeLeft(0);
        playShortBeep();
      } else {
        setRestTimeLeft(left);
      }
    }
  }, []);

  useEffect(() => {
    if (countdown > 0) return;
    intervalRef.current = setInterval(tick, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [countdown, tick]);

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
    const serie: Serie = {};
    switch (trackingType as TrackingType) {
      case 'PESO_REPS':
        if (!peso && !reps) return;
        serie.peso = peso;
        serie.reps = reps;
        setReps('');
        break;
      case 'BODYWEIGHT_REPS':
        if (!reps) return;
        serie.reps = reps;
        setReps('');
        break;
      case 'TIME_BASED':
        if (!duracion) return;
        serie.duracionSec = duracion;
        setDuracion('');
        break;
      case 'ASSISTED_WEIGHT':
        if (!ayuda && !reps) return;
        serie.ayudaKg = ayuda;
        serie.reps    = reps;
        setReps('');
        break;
      default:
        return;
    }
    setCompletedSeries(prev => [...prev, serie]);
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

  const renderSerieLabel = (ser: Serie): string => {
    switch (trackingType as TrackingType) {
      case 'PESO_REPS':       return `${ser.peso} kg × ${ser.reps} reps`;
      case 'BODYWEIGHT_REPS': return `${ser.reps} reps`;
      case 'TIME_BASED':      return `${ser.duracionSec} seg`;
      case 'ASSISTED_WEIGHT': return `${ser.ayudaKg} kg ayuda × ${ser.reps} reps`;
      default:                return '-';
    }
  };

  const renderInputBlock = () => {
    switch (trackingType as TrackingType) {
      case 'PESO_REPS':
        return (
          <View style={s.inputsRow}>
            <View style={s.inputWrap}>
              <Text style={s.inputLabel}>Carga (kg)</Text>
              <TextInput
                style={s.inputField} value={peso} onChangeText={setPeso}
                keyboardType="decimal-pad" placeholder="0" placeholderTextColor="#333" maxLength={6}
              />
            </View>
            <View style={s.inputWrap}>
              <Text style={s.inputLabel}>Repeticiones</Text>
              <TextInput
                style={s.inputField} value={reps} onChangeText={setReps}
                keyboardType="number-pad" placeholder="0" placeholderTextColor="#333" maxLength={3}
              />
            </View>
          </View>
        );

      case 'BODYWEIGHT_REPS':
        return (
          <View style={s.inputsRow}>
            <View style={[s.inputWrap, { flex: 1 }]}>
              <Text style={s.inputLabel}>Repeticiones completadas</Text>
              <TextInput
                style={s.inputField} value={reps} onChangeText={setReps}
                keyboardType="number-pad" placeholder="0" placeholderTextColor="#333" maxLength={3}
              />
            </View>
          </View>
        );

      case 'TIME_BASED':
        return (
          <View style={s.inputsRow}>
            <View style={[s.inputWrap, { flex: 1 }]}>
              <Text style={s.inputLabel}>Tiempo completado (seg)</Text>
              <View style={s.timerInputRow}>
                <TextInput
                  style={[s.inputField, { flex: 1 }]} value={duracion} onChangeText={setDuracion}
                  keyboardType="number-pad" placeholder="0" placeholderTextColor="#333" maxLength={4}
                />
                <TouchableOpacity style={s.copyTimerBtn} onPress={() => setDuracion(String(elapsedSeconds))}>
                  <MaterialCommunityIcons name="timer-outline" size={22} color="#f05b22" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );

      case 'ASSISTED_WEIGHT':
        return (
          <View style={s.inputsRow}>
            <View style={s.inputWrap}>
              <Text style={s.inputLabel}>Ayuda máquina (kg)</Text>
              <TextInput
                style={s.inputField} value={ayuda} onChangeText={setAyuda}
                keyboardType="decimal-pad" placeholder="0" placeholderTextColor="#333" maxLength={6}
              />
            </View>
            <View style={s.inputWrap}>
              <Text style={s.inputLabel}>Repeticiones</Text>
              <TextInput
                style={s.inputField} value={reps} onChangeText={setReps}
                keyboardType="number-pad" placeholder="0" placeholderTextColor="#333" maxLength={3}
              />
            </View>
          </View>
        );

      default:
        return null;
    }
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

  // ── CARDIO (DISTANCE_TIME) ────────────────────────────────────────────────────
  if (isCardio) {
    return (
      <SafeAreaView style={s.container}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
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

            {/* Inputs distancia / tiempo para registrar al finalizar */}
            <View style={[s.inputsRow, { marginTop: 24 }]}>
              <View style={s.inputWrap}>
                <Text style={s.inputLabel}>Distancia (metros)</Text>
                <TextInput
                  style={s.inputField} value={distancia} onChangeText={setDistancia}
                  keyboardType="decimal-pad" placeholder="0" placeholderTextColor="#333" maxLength={6}
                />
              </View>
              <View style={s.inputWrap}>
                <Text style={s.inputLabel}>Tiempo (minutos)</Text>
                <TextInput
                  style={s.inputField} value={tiempoMin} onChangeText={setTiempoMin}
                  keyboardType="decimal-pad" placeholder="0" placeholderTextColor="#333" maxLength={5}
                />
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
        </View>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    );
  }

  // ── MUSCULACIÓN / HIIT / CORE ──────────────────────────────────────────────────
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
            <View style={s.restBlock}>
              <Text style={s.restLabel}>DESCANSO</Text>
              <Text style={s.restTimer}>{formatTime(restTimeLeft)}</Text>
              <TouchableOpacity style={s.skipBtn} activeOpacity={0.8} onPress={handleSkipRest}>
                <Text style={s.skipBtnTxt}>Omitir Descanso</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {renderInputBlock()}

              <TouchableOpacity style={s.markBtn} activeOpacity={0.8} onPress={handleMarkSerie}>
                <Text style={s.markBtnTxt}>Marcar Serie Completada</Text>
              </TouchableOpacity>

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

          {completedSeries.length > 0 && (
            <View style={s.seriesBox}>
              <Text style={s.seriesCount}>
                {completedSeries.length} {completedSeries.length === 1 ? 'serie' : 'series'} completadas
              </Text>
              {completedSeries.slice(-3).map((ser, i) => (
                <Text key={i} style={s.serieItem}>
                  {completedSeries.length - Math.min(completedSeries.length, 3) + i + 1}.{'  '}{renderSerieLabel(ser)}
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

  actionsCardio: { flexDirection: 'row', gap: 16, marginTop: 32 },

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

  timerInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  copyTimerBtn: {
    backgroundColor: '#161618', borderRadius: 14, borderWidth: 1, borderColor: '#f05b2244',
    width: 58, height: 58, justifyContent: 'center', alignItems: 'center',
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
