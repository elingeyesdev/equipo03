import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, FlatList,
  TouchableOpacity, ActivityIndicator, Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../app/Shared/hooks/useAuth';
import { staffApi, ClientRoutine, ClientRoutineExercise } from '../../../app/Providers/staff/api/staff.api';

// ─── Constants ────────────────────────────────────────────────────────────────
const DAYS = ['LUNES','MARTES','MIERCOLES','JUEVES','VIERNES','SABADO','DOMINGO'] as const;
type DayKey = typeof DAYS[number];

const DAY_SHORT: Record<DayKey, string> = {
  LUNES: 'Lun', MARTES: 'Mar', MIERCOLES: 'Mié',
  JUEVES: 'Jue', VIERNES: 'Vie', SABADO: 'Sáb', DOMINGO: 'Dom',
};
const DAY_FULL: Record<DayKey, string> = {
  LUNES: 'Lunes', MARTES: 'Martes', MIERCOLES: 'Miércoles',
  JUEVES: 'Jueves', VIERNES: 'Viernes', SABADO: 'Sábado', DOMINGO: 'Domingo',
};

const COL_W   = 90;
const LABEL_W = 120;

const formatCell = (ex: ClientRoutineExercise): string => {
  const p = ex.params as any;
  if (p) {
    if (p.durationMin   != null) return `${p.durationMin}min`;
    if (p.rounds        != null) return `${p.rounds}r`;
    if (p.durationSeconds != null) return `${p.durationSeconds}s`;
  }
  const sets = ex.setsRecommended ?? '—';
  const reps = ex.repsRecommended ?? '—';
  return `${sets}×${reps}`;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
type ByDay = Record<DayKey, ClientRoutineExercise[]>;

const buildByDay = (routines: ClientRoutine[]): ByDay => {
  const result = Object.fromEntries(DAYS.map(d => [d, []])) as ByDay;
  for (const r of routines) {
    for (const ex of r.exercises) {
      const day = ex.dayOfWeek as DayKey;
      if (day && result[day]) result[day].push(ex);
    }
  }
  return result;
};

const getUniqueExercises = (routines: ClientRoutine[]) =>
  Array.from(
    new Map(
      routines.flatMap(r => r.exercises)
        .filter(e => e.dayOfWeek)
        .map(e => [e.exercise.id, e.exercise])
    ).values()
  );

// ─── Weekly Matrix (preview) ──────────────────────────────────────────────────
const WeeklyMatrix = ({ uniqueExercises, byDay }: {
  uniqueExercises: { id: number; name: string; muscleGroup?: string }[];
  byDay: ByDay;
}) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
    <View>
      {/* Header row */}
      <View style={s.matrixRow}>
        <View style={[s.labelCell, s.headerCell]} />
        {DAYS.map(d => (
          <View key={d} style={[s.dataCell, s.headerCell, { width: COL_W }]}>
            <Text style={s.headerTxt}>{DAY_SHORT[d]}</Text>
          </View>
        ))}
      </View>

      {/* Exercise rows */}
      {uniqueExercises.map((ex, rowIdx) => (
        <View key={ex.id} style={[s.matrixRow, rowIdx % 2 === 1 && s.rowAlt]}>
          <View style={[s.labelCell, rowIdx % 2 === 1 && s.rowAlt]}>
            <MaterialCommunityIcons name="dumbbell" size={10} color="#f05b22" />
            <Text style={s.exLabelTxt} numberOfLines={2}>{ex.name}</Text>
          </View>
          {DAYS.map(day => {
            const entry = byDay[day]?.find(e => e.exercise.id === ex.id);
            const cell  = entry ? formatCell(entry) : null;
            return (
              <View key={day} style={[s.dataCell, { width: COL_W }, rowIdx % 2 === 1 && s.rowAlt]}>
                <Text style={cell ? s.cellTxt : s.cellEmpty} numberOfLines={1}>
                  {cell ?? '—'}
                </Text>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  </ScrollView>
);

// ─── Full Screen Routine Modal ─────────────────────────────────────────────────
const WeeklyRoutineModal = ({ byDay, visible, onClose, onEjecutar }: {
  byDay:      ByDay;
  visible:    boolean;
  onClose:    () => void;
  onEjecutar: (ex: ClientRoutineExercise) => void;
}) => {
  const insets = useSafeAreaInsets();
  const daysWithEx = DAYS.filter(d => byDay[d].length > 0);

  return (
    <Modal visible={visible} animationType="slide">
      <View style={[s.modalSafe, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        {/* Header */}
        <View style={s.modalHeader}>
          <MaterialCommunityIcons name="dumbbell" size={16} color="#f05b22" />
          <Text style={s.modalTitle}>Rutina Semanal</Text>
          <TouchableOpacity style={s.modalCloseBtn} onPress={onClose} activeOpacity={0.7}>
            <MaterialCommunityIcons name="close" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={s.modalScroll} showsVerticalScrollIndicator={false}>
          {daysWithEx.length === 0 ? (
            <View style={s.emptyCenter}>
              <MaterialCommunityIcons name="dumbbell" size={32} color="#222" />
              <Text style={s.emptyTxt}>Sin ejercicios planificados.</Text>
            </View>
          ) : (
            daysWithEx.map(day => (
              <View key={day} style={s.modalDayBlock}>
                <Text style={s.modalDayTitle}>{DAY_FULL[day]}</Text>
                {byDay[day].map((ex, idx) => (
                  <View key={ex.id} style={s.modalExRow}>
                    <View style={s.exNum}>
                      <Text style={s.exNumTxt}>{idx + 1}</Text>
                    </View>
                    <View style={s.exInfo}>
                      <Text style={s.exName}>{ex.exercise.name}</Text>
                      {ex.exercise.muscleGroup ? (
                        <Text style={s.exMuscle}>{ex.exercise.muscleGroup}</Text>
                      ) : null}
                      <View style={s.exStats}>
                        <Text style={s.exStatVal}>{formatCell(ex)}</Text>
                        {ex.weightRecommendedKg != null && ex.weightRecommendedKg > 0 ? (
                          <Text style={s.exStatLabel}> · {ex.weightRecommendedKg} kg</Text>
                        ) : null}
                        {ex.restSecondsBetweenSets != null && ex.restSecondsBetweenSets > 0 ? (
                          <Text style={s.exStatLabel}> · {ex.restSecondsBetweenSets}s desc.</Text>
                        ) : null}
                      </View>
                      {ex.notes ? <Text style={s.exNotes}>{ex.notes}</Text> : null}
                    </View>
                    <TouchableOpacity
                      style={s.exEjecutarBtn}
                      onPress={() => onEjecutar(ex)}
                      activeOpacity={0.85}
                    >
                      <MaterialCommunityIcons name="play-circle" size={14} color="#fff" />
                      <Text style={s.exEjecutarTxt}>Ejecutar</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

// ─── Legacy Card (routines without dayOfWeek) ──────────────────────────────────
const LegacyRoutineCard = ({ routine, onEjecutar }: {
  routine:   ClientRoutine;
  onEjecutar:(ex: ClientRoutineExercise) => void;
}) => {
  const [expanded, setExpanded] = useState(true);
  return (
    <View style={s.routineCard}>
      <TouchableOpacity style={s.routineHeader} onPress={() => setExpanded(e => !e)} activeOpacity={0.8}>
        <View style={s.routineHeaderLeft}>
          <MaterialCommunityIcons name="dumbbell" size={18} color="#f05b22" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={s.routineName} numberOfLines={1}>{routine.name}</Text>
            <Text style={s.routineMeta}>
              {routine.exercises?.length ?? 0} ejercicios
              {routine.difficultyLevel ? ` · ${routine.difficultyLevel}` : ''}
            </Text>
          </View>
        </View>
        <MaterialCommunityIcons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color="#555" />
      </TouchableOpacity>

      {expanded && (
        <View style={s.exList}>
          {routine.exercises?.length > 0 ? (
            routine.exercises.map(ex => (
              <View key={ex.id} style={s.legacyExRow}>
                <View style={s.exNum}><Text style={s.exNumTxt}>{ex.orderPosition + 1}</Text></View>
                <View style={s.exInfo}>
                  <Text style={s.exName}>{ex.exercise?.name ?? '—'}</Text>
                  {ex.exercise?.muscleGroup ? <Text style={s.exMuscle}>{ex.exercise.muscleGroup}</Text> : null}
                  <View style={s.exStats}>
                    <Text style={s.exStatVal}>{formatCell(ex)}</Text>
                    {ex.weightRecommendedKg != null && ex.weightRecommendedKg > 0 ? (
                      <Text style={s.exStatLabel}> · {ex.weightRecommendedKg} kg</Text>
                    ) : null}
                  </View>
                  {ex.notes ? <Text style={s.exNotes}>{ex.notes}</Text> : null}
                </View>
                <TouchableOpacity style={s.exEjecutarBtn} onPress={() => onEjecutar(ex)} activeOpacity={0.85}>
                  <MaterialCommunityIcons name="play-circle" size={14} color="#fff" />
                  <Text style={s.exEjecutarTxt}>Ejecutar</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={s.emptyTxt}>Sin ejercicios registrados.</Text>
          )}
        </View>
      )}
    </View>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────
export const MiRutinaScreen = () => {
  const navigation = useNavigation<any>();
  const { user }   = useAuth();
  const userId     = (user as any)?.userId ?? (user as any)?.id;

  const [showModal, setShowModal] = useState(false);

  const { data: routines = [], isLoading, isError, refetch } = useQuery<ClientRoutine[]>({
    queryKey: ['my-routines', userId],
    queryFn:  () => staffApi.getMyRoutines(userId),
    enabled:  !!userId,
    staleTime: 2 * 60_000,
    retry: 1,
  });

  const hasDayData  = routines.some(r => r.exercises.some(e => e.dayOfWeek));
  const byDay       = hasDayData ? buildByDay(routines) : null;
  const uniqueExs   = hasDayData ? getUniqueExercises(routines) : [];
  const hasExercises = hasDayData ? DAYS.some(d => byDay![d].length > 0) : false;

  const handleEjecutar = (ex: ClientRoutineExercise) => {
    setShowModal(false);
    const routine = routines.find(r => r.exercises.some(e => e.id === ex.id));
    if (routine) navigation.navigate('EjecutarRutina', { routine, exercise: ex });
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.topBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={s.topTitle}>Mi Rutina</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Full screen weekly modal */}
      {hasDayData && byDay && (
        <WeeklyRoutineModal
          byDay={byDay}
          visible={showModal}
          onClose={() => setShowModal(false)}
          onEjecutar={handleEjecutar}
        />
      )}

      {isLoading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#f05b22" />
        </View>
      ) : isError ? (
        <View style={s.center}>
          <MaterialCommunityIcons name="wifi-off" size={40} color="#444" />
          <Text style={s.errTxt}>No se pudo cargar tu rutina.</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => refetch()}>
            <Text style={s.retryTxt}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : routines.length === 0 ? (
        <View style={s.center}>
          <MaterialCommunityIcons name="dumbbell" size={52} color="#222" />
          <Text style={s.emptyTitle}>Sin rutina asignada</Text>
          <Text style={s.emptySubTxt}>Tu entrenador aún no te ha asignado una rutina de entrenamiento.</Text>
        </View>
      ) : hasDayData && byDay ? (
        /* ── Vista semanal (nueva) ── */
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
          {/* Tappable matrix preview */}
          {hasExercises ? (
            <TouchableOpacity
              style={[s.card, s.cardTappable]}
              activeOpacity={0.82}
              onPress={() => setShowModal(true)}
            >
              <View style={s.cardHeaderRow}>
                <MaterialCommunityIcons name="dumbbell" size={14} color="#f05b22" />
                <Text style={[s.cardTitle, { flex: 1, marginBottom: 0 }]}>Rutina Semanal</Text>
                <View style={s.expandBadge}>
                  <MaterialCommunityIcons name="arrow-expand" size={11} color="#f05b22" />
                  <Text style={s.expandBadgeTxt}>Ver todo</Text>
                </View>
              </View>
              <WeeklyMatrix uniqueExercises={uniqueExs} byDay={byDay} />
              <Text style={s.tapHint}>Toca para ver la semana completa</Text>
            </TouchableOpacity>
          ) : (
            <View style={s.card}>
              <Text style={s.cardTitle}>Rutina Semanal</Text>
              <View style={s.emptyCenter}>
                <MaterialCommunityIcons name="dumbbell" size={28} color="#222" />
                <Text style={s.emptyTxt}>Tu entrenador aún no ha completado el plan semanal.</Text>
              </View>
            </View>
          )}
        </ScrollView>
      ) : (
        /* ── Vista clásica (sin dayOfWeek) ── */
        <FlatList
          data={routines}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <LegacyRoutineCard
              routine={item}
              onEjecutar={(ex) =>
                navigation.navigate('EjecutarRutina', { routine: item, exercise: ex })
              }
            />
          )}
        />
      )}
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#000' },
  scroll: { padding: 16, paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 },

  topBar:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#111' },
  backBtn:  { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  topTitle: { flex: 1, color: '#fff', fontSize: 16, fontWeight: '700', textAlign: 'center' },

  // Card
  card:          { backgroundColor: '#0e0e0e', borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#1a1a1a' },
  cardTappable:  { borderColor: '#2a2a2a' },
  cardTitle:     { color: '#888', fontSize: 10, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  expandBadge:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#1a1a1a', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#2a2a2a' },
  expandBadgeTxt: { color: '#f05b22', fontSize: 9, fontWeight: '700' },
  tapHint:        { color: '#2e2e2e', fontSize: 10, textAlign: 'center', marginTop: 10 },

  // Matrix
  matrixRow:  { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  rowAlt:     { backgroundColor: '#0a0a0a' },
  headerCell: { backgroundColor: '#141414', borderBottomWidth: 2, borderBottomColor: '#f05b22' },
  labelCell:  { width: LABEL_W, paddingVertical: 10, paddingHorizontal: 8, justifyContent: 'center', flexDirection: 'row', alignItems: 'center', gap: 4, borderRightWidth: 1, borderRightColor: '#1a1a1a' },
  dataCell:   { paddingVertical: 10, paddingHorizontal: 6, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: '#1a1a1a' },
  headerTxt:  { color: '#f05b22', fontSize: 11, fontWeight: '800', textAlign: 'center' },
  exLabelTxt: { color: '#888', fontSize: 9, fontWeight: '600', flex: 1 },
  cellTxt:    { color: '#ddd', fontSize: 10, textAlign: 'center' },
  cellEmpty:  { color: '#2a2a2a', fontSize: 10, textAlign: 'center' },

  // Modal
  modalSafe:     { flex: 1, backgroundColor: '#000' },
  modalHeader:   { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  modalTitle:    { flex: 1, color: '#fff', fontSize: 15, fontWeight: '700' },
  modalCloseBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' },
  modalScroll:   { padding: 16, paddingBottom: 48 },

  modalDayBlock: { backgroundColor: '#0e0e0e', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#1a1a1a' },
  modalDayTitle: { color: '#f05b22', fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  modalExRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#111', gap: 10 },

  // Exercise shared
  exNum:       { width: 26, height: 26, borderRadius: 13, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  exNumTxt:    { color: '#f05b22', fontSize: 11, fontWeight: '700' },
  exInfo:      { flex: 1 },
  exName:      { color: '#fff', fontSize: 13, fontWeight: '600' },
  exMuscle:    { color: '#555', fontSize: 11, marginTop: 2 },
  exStats:     { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 4 },
  exStatVal:   { color: '#f05b22', fontSize: 12, fontWeight: '700' },
  exStatLabel: { color: '#444', fontSize: 12 },
  exNotes:     { color: '#444', fontSize: 11, marginTop: 4, fontStyle: 'italic' },
  exEjecutarBtn: { backgroundColor: '#f05b22', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0 },
  exEjecutarTxt: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Legacy card
  routineCard:       { backgroundColor: '#0e0e0e', borderRadius: 14, marginBottom: 12, borderWidth: 1, borderColor: '#1a1a1a', overflow: 'hidden' },
  routineHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  routineHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  routineName:       { color: '#fff', fontSize: 15, fontWeight: '700' },
  routineMeta:       { color: '#555', fontSize: 11, marginTop: 3 },
  exList:            { borderTopWidth: 1, borderTopColor: '#1a1a1a', paddingHorizontal: 16, paddingBottom: 4 },
  legacyExRow:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#111', gap: 10 },

  emptyCenter:  { alignItems: 'center', gap: 8, paddingVertical: 12 },
  emptyTitle:   { color: '#555', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  emptySubTxt:  { color: '#333', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  emptyTxt:     { color: '#333', fontSize: 12, textAlign: 'center' },
  errTxt:       { color: '#555', fontSize: 14 },
  retryBtn:     { backgroundColor: '#1C1C1E', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  retryTxt:     { color: '#f05b22', fontWeight: '700' },
});
