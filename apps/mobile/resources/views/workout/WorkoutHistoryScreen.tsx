import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, Animated,
  FlatList, ScrollView, ActivityIndicator, RefreshControl, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { trainingApi, WorkoutSession, WorkoutSet } from '../../../app/Providers/training/api/training.api';

const { height: SCREEN_H } = Dimensions.get('window');

type FilterKey = 'TODOS' | 'FUERZA' | 'CARDIO' | 'HIIT';
const FILTERS: FilterKey[] = ['TODOS', 'FUERZA', 'CARDIO', 'HIIT'];

const SPORT_LABEL: Record<string, string> = {
  MUSCULACION: 'Fuerza',
  CINTA:       'Cardio',
  BICICLETA:   'Cardio',
  NATACION:    'Natación',
  YOGA:        'Yoga',
  OTRO:        'HIIT',
  DEFAULT:     'Entrenamiento',
};

const SPORT_COLOR: Record<string, string> = {
  MUSCULACION: '#9b5de5',
  CINTA:       '#f05b22',
  BICICLETA:   '#f05b22',
  NATACION:    '#00b4d8',
  YOGA:        '#00b4d8',
  OTRO:        '#ef476f',
  DEFAULT:     '#555',
};

const SPORT_ICON: Record<string, string> = {
  MUSCULACION: 'weight-lifter',
  CINTA:       'run',
  BICICLETA:   'bike',
  NATACION:    'swim',
  YOGA:        'meditation',
  OTRO:        'lightning-bolt',
  DEFAULT:     'dumbbell',
};

const SPORT_CATEGORY: Record<string, FilterKey> = {
  MUSCULACION: 'FUERZA',
  CINTA:       'CARDIO',
  BICICLETA:   'CARDIO',
  NATACION:    'CARDIO',
  YOGA:        'CARDIO',
  OTRO:        'HIIT',
};

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  const dd   = d.getDate().toString().padStart(2, '0');
  const mm   = (d.getMonth() + 1).toString().padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh   = d.getHours().toString().padStart(2, '0');
  const min  = d.getMinutes().toString().padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
};

const formatDuration = (secs: number | null): string => {
  if (!secs) return '0 min';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return s > 0 ? `${m} min ${s} s` : `${m} min`;
};

// ── Tarjeta de la lista ───────────────────────────────────────────────────────
const SessionCard = ({
  item,
  onPress,
}: {
  item: WorkoutSession;
  onPress: () => void;
}) => {
  const sport       = String(item.sportType ?? 'DEFAULT').toUpperCase();
  const label       = SPORT_LABEL[sport]  ?? SPORT_LABEL.DEFAULT;
  let accent        = SPORT_COLOR[sport]  ?? SPORT_COLOR.DEFAULT;
  let icon          = SPORT_ICON[sport]   ?? SPORT_ICON.DEFAULT;
  const minutes     = Math.floor((item.durationSeconds ?? 0) / 60);
  const setsCount   = item.sets?.length ?? 0;
  const volume      = (item.sets ?? []).reduce(
    (acc, s) => acc + (s.weightUsedKg ?? 0) * (s.repsCompleted ?? 0), 0,
  );
  const isStrength  = sport === 'MUSCULACION';

  // ── Título dinámico ──────────────────────────────────────────────────────
  let displayTitle = '';
  let subtitleText = '';

  if (setsCount === 0 && !item.routine) {
    displayTitle = 'Sesión Vacía';
    subtitleText = 'Entrenamiento finalizado sin registrar series';
    icon = 'alert-circle-outline';
    accent = '#666';
  } else {
    const routineName = item.routine?.name;
    const setExerciseName =
      item.sets?.[0]?.routineExercise?.exercise?.name ||
      (item.sets?.[0] as any)?.exercise?.name ||
      (item.sets?.[0] as any)?.exerciseName;
    const routineFirstEx =
      (item.routine as any)?.exercises?.[0]?.exercise?.name ||
      (item.routine as any)?.routineExercises?.[0]?.exercise?.name;

    displayTitle =
      routineName ||
      setExerciseName ||
      routineFirstEx ||
      label ||
      'Entrenamiento Libre';

    // ── Subtítulo: lista de ejercicios únicos ────────────────────────────────
    const setNames = (item.sets ?? [])
      .map(
        s =>
          s.routineExercise?.exercise?.name ||
          (s as any).exercise?.name ||
          (s as any).exerciseName
      )
      .filter(Boolean);
    const uniqueSetNames = [...new Set(setNames)];

    subtitleText =
      uniqueSetNames.length > 0
        ? uniqueSetNames.join(', ')
        : item.routine
          ? 'Rutina predefinida'
          : '0 Ejercicios registrados';
  }

  return (
    <TouchableOpacity activeOpacity={0.75} onPress={onPress}>
      <View style={[card.container, { borderLeftColor: accent }]}>
        {/* Fila superior */}
        <View style={card.topRow}>
          <View style={[card.iconBox, { backgroundColor: '#1C1C1E' }]}>
            <MaterialCommunityIcons name={icon as any} size={18} color={accent} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={card.label} numberOfLines={1}>{displayTitle}</Text>
            <Text style={card.date}>{formatDate(item.startedAt)}</Text>
          </View>
          <View style={[card.badge, { backgroundColor: '#1C1C1E' }]}>
            <Text style={[card.badgeTxt, { color: accent }]}>{label}</Text>
          </View>
        </View>

        {/* Métricas principales */}
        <View style={card.metricsRow}>
          <View style={card.metric}>
            <MaterialCommunityIcons name="clock-outline" size={14} color="#666" />
            <Text style={card.metricTxt}>{minutes} min</Text>
          </View>
          <View style={card.metricDivider} />
          <View style={card.metric}>
            <MaterialCommunityIcons name="fire" size={14} color="#ef476f" />
            <Text style={card.metricTxt}>{item.caloriesBurned ?? 0} kcal</Text>
          </View>
          {isStrength && setsCount > 0 && (
            <>
              <View style={card.metricDivider} />
              <View style={card.metric}>
                <MaterialCommunityIcons name="format-list-numbered" size={14} color="#666" />
                <Text style={card.metricTxt}>{setsCount} series</Text>
              </View>
            </>
          )}
          {isStrength && volume > 0 && (
            <>
              <View style={card.metricDivider} />
              <View style={card.metric}>
                <MaterialCommunityIcons name="weight" size={14} color="#9b5de5" />
                <Text style={card.metricTxt}>{volume.toFixed(0)} kg vol.</Text>
              </View>
            </>
          )}
        </View>

        {/* Pie */}
        <View style={card.footer}>
          <Text style={card.footerTxt} numberOfLines={1}>{subtitleText}</Text>
          <MaterialCommunityIcons name="chevron-right" size={16} color="#333" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ── Bottom sheet de detalle ───────────────────────────────────────────────────
const DetailSheet = ({
  session,
  onClose,
}: {
  session: WorkoutSession;
  onClose: () => void;
}) => {
  const slideY = useRef(new Animated.Value(SCREEN_H)).current;

  useEffect(() => {
    Animated.spring(slideY, {
      toValue: 0,
      damping: 22,
      stiffness: 200,
      useNativeDriver: true,
    }).start();
  }, []);

  const close = () => {
    Animated.timing(slideY, {
      toValue: SCREEN_H,
      duration: 220,
      useNativeDriver: true,
    }).start(onClose);
  };

  const sport      = String(session.sportType ?? 'DEFAULT').toUpperCase();
  const label      = SPORT_LABEL[sport]  ?? SPORT_LABEL.DEFAULT;
  let accent       = SPORT_COLOR[sport]  ?? SPORT_COLOR.DEFAULT;
  let icon         = SPORT_ICON[sport]   ?? SPORT_ICON.DEFAULT;
  const isStrength = sport === 'MUSCULACION';
  const sets       = session.sets ?? [];

  // ── Título dinámico para el detail sheet ────────────────────────────────
  let sheetTitle = '';

  if (sets.length === 0 && !session.routine) {
    sheetTitle = 'Sesión Vacía';
    icon = 'alert-circle-outline';
    accent = '#666';
  } else {
    const routineName = session.routine?.name;
    const setExerciseName =
      sets[0]?.routineExercise?.exercise?.name ||
      (sets[0] as any)?.exercise?.name ||
      (sets[0] as any)?.exerciseName;
    const routineFirstEx =
      (session.routine as any)?.exercises?.[0]?.exercise?.name ||
      (session.routine as any)?.routineExercises?.[0]?.exercise?.name;

    sheetTitle =
      routineName ||
      setExerciseName ||
      routineFirstEx ||
      label ||
      'Entrenamiento Libre';
  }

  // ── Métricas agregadas ───────────────────────────────────────────────────
  const volume = sets.reduce((acc, s) => acc + (s.weightUsedKg ?? 0) * (s.repsCompleted ?? 0), 0);
  const bestSet = sets.reduce<WorkoutSet | null>(
    (best, s) => (!best || (s.weightUsedKg ?? 0) > (best.weightUsedKg ?? 0) ? s : best),
    null,
  );

  // ── Agrupación de ejercicios por nombre ──────────────────────────────────
  type ExerciseGroup = {
    name: string;
    setsCount: number;
    maxWeightKg: number | null;
    totalReps: number;
  };
  const exerciseGroups: ExerciseGroup[] = Object.values(
    sets.reduce<Record<string, ExerciseGroup>>((acc, s) => {
      const name =
        s.routineExercise?.exercise?.name ||
        (s as any).exercise?.name ||
        (s as any).exerciseName ||
        'Ejercicio libre';
      if (!acc[name]) {
        acc[name] = { name, setsCount: 0, maxWeightKg: null, totalReps: 0 };
      }
      acc[name].setsCount += 1;
      acc[name].totalReps += (s.repsCompleted ?? 0);
      if (s.weightUsedKg != null) {
        acc[name].maxWeightKg =
          acc[name].maxWeightKg == null
            ? s.weightUsedKg
            : Math.max(acc[name].maxWeightKg, s.weightUsedKg);
      }
      return acc;
    }, {}),
  );

  return (
    <Modal transparent visible animationType="none" onRequestClose={close}>
      {/* Backdrop */}
      <TouchableOpacity style={sheet.backdrop} activeOpacity={1} onPress={close} />

      <Animated.View style={[sheet.container, { transform: [{ translateY: slideY }] }]}>
        {/* Drag handle */}
        <View style={sheet.handle} />

        {/* Header */}
        <View style={[sheet.header, { backgroundColor: '#1C1C1E' }]}>
          <View style={[sheet.headerIcon, { backgroundColor: '#1C1C1E' }]}>
            <MaterialCommunityIcons name={icon as any} size={28} color={accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={sheet.headerTitle}>{sheetTitle}</Text>
            <Text style={sheet.headerSub}>{formatDate(session.startedAt)}</Text>
            {session.gym && (
              <Text style={sheet.headerGym}>
                <MaterialCommunityIcons name="map-marker-outline" size={12} color="#555" /> {session.gym.name}
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={close} style={sheet.closeBtn}>
            <MaterialCommunityIcons name="close" size={20} color="#555" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={sheet.body}>

          {/* Stats grid */}
          <View style={sheet.grid}>
            <View style={sheet.statCard}>
              <MaterialCommunityIcons name="clock-outline" size={20} color="#f05b22" />
              <Text style={sheet.statVal}>{formatDuration(session.durationSeconds)}</Text>
              <Text style={sheet.statLbl}>Duración</Text>
            </View>
            <View style={sheet.statCard}>
              <MaterialCommunityIcons name="fire" size={20} color="#ef476f" />
              <Text style={sheet.statVal}>{session.caloriesBurned ?? 0}</Text>
              <Text style={sheet.statLbl}>kcal</Text>
            </View>
            {sets.length > 0 && (
              <View style={sheet.statCard}>
                <MaterialCommunityIcons name="format-list-numbered" size={20} color="#9b5de5" />
                <Text style={sheet.statVal}>{sets.length}</Text>
                <Text style={sheet.statLbl}>Series</Text>
              </View>
            )}
            {volume > 0 && (
              <View style={sheet.statCard}>
                <MaterialCommunityIcons name="weight-lifter" size={20} color="#9b5de5" />
                <Text style={sheet.statVal}>{volume.toFixed(0)} kg</Text>
                <Text style={sheet.statLbl}>Volumen</Text>
              </View>
            )}
          </View>

          {/* Ejercicios realizados */}
          {exerciseGroups.length > 0 && (
            <View style={sheet.section}>
              <Text style={sheet.sectionTitle}>Ejercicios realizados</Text>
              {exerciseGroups.map((eg, i) => (
                <View key={eg.name + i} style={sheet.exerciseRow}>
                  <View style={[sheet.exerciseDot, { backgroundColor: accent }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={sheet.exerciseName}>{eg.name}</Text>
                    <Text style={sheet.exerciseMeta}>
                      {eg.setsCount} {eg.setsCount === 1 ? 'serie' : 'series'}
                      {eg.totalReps > 0 ? ` · ${eg.totalReps} reps` : ''}
                    </Text>
                  </View>
                  {eg.maxWeightKg != null && eg.maxWeightKg > 0 && (
                    <View style={sheet.exercisePR}>
                      <Text style={[sheet.exercisePRVal, { color: accent }]}>
                        {eg.maxWeightKg} kg
                      </Text>
                      <Text style={sheet.exercisePRLbl}>máx</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Mejor serie (cuando hay peso registrado) */}
          {bestSet != null && (bestSet.weightUsedKg ?? 0) > 0 && (
            <View style={sheet.section}>
              <Text style={sheet.sectionTitle}>Mejor serie</Text>
              <View style={[sheet.bestCard, { borderColor: accent }]}>
                <MaterialCommunityIcons name="trophy-outline" size={22} color={accent} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={sheet.bestMain}>
                    {bestSet.weightUsedKg} kg × {bestSet.repsCompleted ?? 0} reps
                  </Text>
                  {(bestSet.routineExercise?.exercise?.name || (bestSet as any).exercise?.name || (bestSet as any).exerciseName) && (
                    <Text style={sheet.bestSub}>
                      {bestSet.routineExercise?.exercise?.name || (bestSet as any).exercise?.name || (bestSet as any).exerciseName}
                    </Text>
                  )}
                  <Text style={sheet.bestSub}>
                    {((bestSet.weightUsedKg ?? 0) * (bestSet.repsCompleted ?? 0)).toFixed(0)} kg de volumen
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Todas las series */}
          {sets.length > 0 && (
            <View style={sheet.section}>
              <Text style={sheet.sectionTitle}>Todas las series</Text>
              {sets.map((s, i) => (
                <View key={s.id ?? i} style={sheet.setRow}>
                  <View style={sheet.setBadge}>
                    <Text style={sheet.setBadgeTxt}>{s.setNumber ?? i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    {(s.routineExercise?.exercise?.name || (s as any).exercise?.name || (s as any).exerciseName) && (
                      <Text style={sheet.setExercise}>
                        {s.routineExercise?.exercise?.name || (s as any).exercise?.name || (s as any).exerciseName}
                      </Text>
                    )}
                    <Text style={sheet.setMain}>
                      {s.distanceMeters != null
                        ? `${s.distanceMeters} m${s.durationSeconds != null ? ` · ${Math.round(s.durationSeconds / 60)} min` : ''}`
                        : s.durationSeconds != null
                          ? `${s.durationSeconds} s`
                          : `${s.weightUsedKg != null ? `${s.weightUsedKg} kg` : '—'} × ${s.repsCompleted ?? 0} reps`}
                    </Text>
                    {s.restTakenSeconds != null && (
                      <Text style={sheet.setSub}>Descanso: {s.restTakenSeconds} s</Text>
                    )}
                  </View>
                  <Text style={sheet.setVol}>
                    {((s.weightUsedKg ?? 0) * (s.repsCompleted ?? 0)).toFixed(0)} kg
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Estado vacío cuando no hay sets */}
          {sets.length === 0 && (
            <View style={sheet.emptySection}>
              <MaterialCommunityIcons name="dumbbell" size={32} color="#2a2a2a" />
              <Text style={sheet.emptySectionTxt}>Sin series registradas</Text>
            </View>
          )}

          {/* Rutina asociada */}
          {session.routine && (
            <View style={sheet.section}>
              <Text style={sheet.sectionTitle}>Rutina asociada</Text>
              <View style={sheet.infoRow}>
                <MaterialCommunityIcons name="clipboard-list-outline" size={18} color="#555" />
                <Text style={sheet.infoTxt}>{session.routine.name}</Text>
              </View>
            </View>
          )}

          {/* Estado */}
          <View style={sheet.section}>
            <Text style={sheet.sectionTitle}>Estado</Text>
            <View style={sheet.infoRow}>
              <MaterialCommunityIcons name="check-circle-outline" size={18} color="#4caf50" />
              <Text style={[sheet.infoTxt, { color: '#4caf50' }]}>
                {session.status === 'FINISHED' ? 'Completada' : session.status}
              </Text>
            </View>
          </View>

        </ScrollView>
      </Animated.View>
    </Modal>
  );
};

// ── Pantalla principal ────────────────────────────────────────────────────────
export const WorkoutHistoryScreen = () => {
  const navigation = useNavigation<any>();

  const [sessions, setSessions]         = useState<WorkoutSession[]>([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [filter, setFilter]             = useState<FilterKey>('TODOS');
  const [selected, setSelected]         = useState<WorkoutSession | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const data = await trainingApi.getHistory();
      const sorted = [...data].sort((a, b) =>
        new Date(b.startedAt ?? 0).getTime() - new Date(a.startedAt ?? 0).getTime(),
      );
      setSessions(sorted);
    } catch (e) {
      console.warn('[WorkoutHistory] Error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(true); };

  const filtered = filter === 'TODOS'
    ? sessions
    : sessions.filter(s =>
        (SPORT_CATEGORY[String(s.sportType ?? '').toUpperCase()] ?? 'TODOS') === filter,
      );

  return (
    <SafeAreaView style={s.container} edges={['top']}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Mi Historial</Text>
        <View style={s.headerRight} />
      </View>

      {/* Chips de filtro */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.chipsScroll}
        contentContainerStyle={s.chips}
      >
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[s.chip, filter === f && s.chipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[s.chipTxt, filter === f && s.chipTxtActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Lista */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#f05b22" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={filtered.length === 0 ? s.emptyList : s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#f05b22"
              colors={['#f05b22']}
            />
          }
          renderItem={({ item }) => (
            <SessionCard item={item} onPress={() => setSelected(item)} />
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              <MaterialCommunityIcons name="history" size={56} color="#222" />
              <Text style={s.emptyTitle}>Sin sesiones</Text>
              <Text style={s.emptySub}>
                {filter === 'TODOS'
                  ? 'Completa tu primer entrenamiento para verlo aquí.'
                  : `No hay sesiones de ${filter} registradas.`}
              </Text>
              {filter === 'TODOS' && (
                <TouchableOpacity style={s.startBtn} onPress={() => navigation.navigate('WorkoutMode')}>
                  <Text style={s.startBtnTxt}>Iniciar entrenamiento</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* Bottom sheet de detalle */}
      {selected && (
        <DetailSheet session={selected} onClose={() => setSelected(null)} />
      )}

    </SafeAreaView>
  );
};

// ── Estilos pantalla ──────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#222',
  },
  headerTitle:  { color: '#fff', fontSize: 20, fontWeight: '800' },
  headerRight:  { width: 40 },

  chipsScroll: { flexGrow: 0 },
  chips: { paddingHorizontal: 20, paddingBottom: 14, paddingTop: 4, gap: 8, alignItems: 'center' as const },
  chip: {
    height: 36, paddingHorizontal: 18,
    borderRadius: 18, backgroundColor: '#111',
    borderWidth: 1, borderColor: '#222',
    justifyContent: 'center', alignItems: 'center',
  },
  chipActive:    { backgroundColor: '#f05b22', borderColor: '#f05b22' },
  chipTxt:       { color: '#555', fontSize: 13, fontWeight: '700' },
  chipTxtActive: { color: '#fff' },

  list:      { paddingHorizontal: 20, paddingBottom: 120, gap: 12 },
  emptyList: { flex: 1 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 40, gap: 14, paddingTop: 60,
  },
  emptyTitle:  { color: '#fff', fontSize: 18, fontWeight: '800' },
  emptySub:    { color: '#555', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  startBtn:    { marginTop: 8, backgroundColor: '#f05b22', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28 },
  startBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

// ── Estilos tarjeta ───────────────────────────────────────────────────────────
const card = StyleSheet.create({
  container: {
    backgroundColor: '#111', borderRadius: 20,
    borderWidth: 1, borderColor: '#1c1c1e',
    borderLeftWidth: 4,
    padding: 16, gap: 12,
  },
  topRow:   { flexDirection: 'row', alignItems: 'center' },
  iconBox:  { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  label:    { color: '#fff', fontSize: 16, fontWeight: '800' },
  date:     { color: '#444', fontSize: 11, marginTop: 2 },
  badge:    { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  badgeTxt: { fontSize: 11, fontWeight: '800' },

  metricsRow: { flexDirection: 'row', alignItems: 'center', gap: 0 },
  metric:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8 },
  metricTxt:  { color: '#aaa', fontSize: 13, fontWeight: '600' },
  metricDivider: { width: 1, height: 14, backgroundColor: '#222' },

  footer:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  footerTxt: { color: '#333', fontSize: 12 },
});

// ── Estilos bottom sheet ──────────────────────────────────────────────────────
const sheet = StyleSheet.create({
  backdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  container: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#111',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    maxHeight: SCREEN_H * 0.88,
    overflow: 'hidden',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#333', alignSelf: 'center', marginVertical: 12,
  },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingVertical: 16,
    marginHorizontal: 16, borderRadius: 16,
  },
  headerIcon: {
    width: 52, height: 52, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle:  { color: '#fff', fontSize: 20, fontWeight: '900' },
  headerSub:    { color: '#555', fontSize: 12, marginTop: 3 },
  headerGym:    { color: '#444', fontSize: 11, marginTop: 2 },
  closeBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#1c1c1e',
    justifyContent: 'center', alignItems: 'center',
  },

  body: { paddingHorizontal: 20, paddingBottom: 48, gap: 20 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 },
  statCard: {
    flex: 1, minWidth: '44%',
    backgroundColor: '#1C1C1E', borderRadius: 16,
    borderWidth: 1, borderColor: '#222',
    paddingVertical: 18, paddingHorizontal: 14,
    alignItems: 'center', gap: 6,
  },
  statVal: { color: '#fff', fontSize: 22, fontWeight: '900' },
  statLbl: { color: '#555', fontSize: 12 },

  section: { gap: 10 },
  sectionTitle: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },

  bestCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1C1C1E', borderRadius: 16,
    borderWidth: 1, padding: 16, gap: 0,
  },
  bestMain: { color: '#fff', fontSize: 17, fontWeight: '800' },
  bestSub:  { color: '#555', fontSize: 12, marginTop: 3 },

  setRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#1C1C1E', borderRadius: 14,
    borderWidth: 1, borderColor: '#1c1c1e',
    paddingVertical: 12, paddingHorizontal: 14,
  },
  setBadge: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center', alignItems: 'center',
  },
  setBadgeTxt:  { color: '#f05b22', fontSize: 13, fontWeight: '800' },
  setExercise:  { color: '#888', fontSize: 11, fontWeight: '600', marginBottom: 2 },
  setMain:      { color: '#fff', fontSize: 15, fontWeight: '700' },
  setSub:       { color: '#555', fontSize: 11, marginTop: 2 },
  setVol:       { color: '#444', fontSize: 12 },

  // Ejercicios realizados
  exerciseRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#1C1C1E', borderRadius: 14,
    borderWidth: 1, borderColor: '#222',
    paddingVertical: 14, paddingHorizontal: 16,
  },
  exerciseDot:    { width: 8, height: 8, borderRadius: 4 },
  exerciseName:   { color: '#fff', fontSize: 14, fontWeight: '700' },
  exerciseMeta:   { color: '#555', fontSize: 12, marginTop: 3 },
  exercisePR:     { alignItems: 'flex-end' },
  exercisePRVal:  { fontSize: 16, fontWeight: '900' },
  exercisePRLbl:  { color: '#555', fontSize: 10, marginTop: 1 },

  // Estado vacío
  emptySection: {
    alignItems: 'center', gap: 10,
    paddingVertical: 32, backgroundColor: '#1C1C1E',
    borderRadius: 16, borderWidth: 1, borderColor: '#222',
  },
  emptySectionTxt: { color: '#333', fontSize: 13 },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoTxt: { color: '#aaa', fontSize: 14 },
});
