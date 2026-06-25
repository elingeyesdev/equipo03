import React from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { trainingApi, WorkoutSession } from '../../../app/Providers/training/api/training.api';
import { staffApi, ClientRoutineExercise } from '../../../app/Providers/staff/api/staff.api';
import { DumbbellSpinner } from '../../../app/Shared/components/ui/DumbbellSpinner';

// ─── Types ────────────────────────────────────────────────────────────────────

type RouteParams = { clientId: number; clientName: string; phone?: string | null };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return '—'; }
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  IN_PROGRESS: { label: 'En progreso', color: '#60a5fa' },
  COMPLETED:   { label: 'Completada',  color: '#22c55e' },
  PARTIAL:     { label: 'Parcial',     color: '#facc15' },
  FINISHED:    { label: 'Finalizada',  color: '#22c55e' },
  CANCELLED:   { label: 'Cancelada',   color: '#ef4444' },
};

const sessionsForExercise = (sessions: WorkoutSession[], exId: number): WorkoutSession[] =>
  sessions.filter(s => (s.sets ?? []).some(set => (set.routineExercise as any)?.id === exId));

const lastExecDate = (sessions: WorkoutSession[], exId: number): string | null => {
  const matched = sessionsForExercise(sessions, exId);
  if (!matched.length) return null;
  return fmtDate(matched[0].startedAt);
};

const bestStatus = (sessions: WorkoutSession[], exId: number): string | null => {
  const matched = sessionsForExercise(sessions, exId);
  if (!matched.length) return null;
  return matched[0].status;
};

// ─── Exercise Card (trainer view) ─────────────────────────────────────────────

const ExerciseCard = ({
  ex, sessions, onViewRecord,
}: {
  ex: ClientRoutineExercise;
  sessions: WorkoutSession[];
  onViewRecord: () => void;
}) => {
  const exSessions = sessionsForExercise(sessions, ex.id);
  const count      = exSessions.length;
  const lastDate   = count > 0 ? fmtDate(exSessions[0].startedAt) : null;
  const lastStatus = count > 0 ? exSessions[0].status : null;
  const meta       = lastStatus ? (STATUS_META[lastStatus] ?? { label: lastStatus, color: '#555' }) : null;

  return (
    <View style={s.exCard}>
      <View style={s.exCardLeft}>
        <View style={s.exNumCircle}>
          <Text style={s.exNumTxt}>{ex.orderPosition + 1}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.exName}>{ex.exercise?.name ?? '—'}</Text>
          {ex.exercise?.muscleGroup ? (
            <Text style={s.exMuscle}>{ex.exercise.muscleGroup}</Text>
          ) : null}
          <View style={s.exMeta}>
            <Text style={s.exMetaTxt}>
              {ex.setsRecommended} series · {ex.repsRecommended} reps
              {(ex.weightRecommendedKg ?? 0) > 0 ? ` · ${ex.weightRecommendedKg} kg` : ''}
            </Text>
          </View>
          <View style={s.exFooter}>
            {count > 0 ? (
              <>
                <View style={[s.statusDot, { backgroundColor: meta?.color ?? '#555' }]} />
                <Text style={s.exDateTxt}>{lastDate} · {count} sesión{count !== 1 ? 'es' : ''}</Text>
              </>
            ) : (
              <Text style={s.noSessionTxt}>Sin sesiones aún</Text>
            )}
          </View>
        </View>
      </View>
      <TouchableOpacity style={s.verRegistroBtn} onPress={onViewRecord} activeOpacity={0.85}>
        <MaterialCommunityIcons name="chart-line" size={14} color="#f05b22" />
        <Text style={s.verRegistroTxt}>Ver Registro</Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const HistorialRutinaScreen = () => {
  const navigation = useNavigation<any>();
  const route      = useRoute<RouteProp<Record<string, RouteParams>, string>>();
  const { clientId, clientName } = route.params;

  const { data: routinesResponse, isLoading: loadingRoutine } = useQuery({
    queryKey: ['client-routines', clientId],
    queryFn:  () => staffApi.getMyRoutines(clientId),
    staleTime: 30_000,
  });
  const routines = routinesResponse?.data ?? [];

  // Prefer the most recent routine that actually has exercises assigned
  const activeRoutine = routines.find(r => (r.exercises?.length ?? 0) > 0) ?? routines[0] ?? null;
  const routineId  = activeRoutine?.id;
  const exercises: ClientRoutineExercise[] = activeRoutine?.exercises ?? [];

  const { data: sessionsResponse, isLoading: loadingSessions, isError, refetch } = useQuery({
    queryKey: ['trainer-client-sessions', clientId, routineId],
    queryFn:  () => trainingApi.getClientSessions(clientId, routineId, { limit: 100 }), // obtenemos más por si acaso, no se pagina visualmente aquí
    enabled:  !loadingRoutine,
    staleTime: 30_000,
    retry: 1,
  });
  const sessions = sessionsResponse?.data ?? [];

  const isLoading = loadingRoutine || loadingSessions;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.topBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.topTitle} numberOfLines={1}>{clientName}</Text>
          {activeRoutine && <Text style={s.topSub} numberOfLines={1}>{activeRoutine.name}</Text>}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={s.center}><DumbbellSpinner size="large" color="#f05b22" /></View>
      ) : isError ? (
        <View style={s.center}>
          <MaterialCommunityIcons name="wifi-off" size={40} color="#333" />
          <Text style={s.errTxt}>No se pudo cargar el historial.</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => refetch()}>
            <Text style={s.retryTxt}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : exercises.length === 0 ? (
        <View style={s.center}>
          <MaterialCommunityIcons name="dumbbell" size={52} color="#1a1a1a" />
          <Text style={s.emptyTitle}>Sin rutina asignada</Text>
          <Text style={s.emptySubTxt}>Este cliente aún no tiene una rutina.</Text>
        </View>
      ) : (
        <FlatList
          data={exercises}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            sessions.length > 0 ? (
              <View style={s.summaryBar}>
                <MaterialCommunityIcons name="history" size={14} color="#555" />
                <Text style={s.summaryTxt}>{sessions.length} sesión{sessions.length !== 1 ? 'es' : ''} en total</Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <ExerciseCard
              ex={item}
              sessions={sessions}
              onViewRecord={() =>
                navigation.navigate('RegistroEjercicio', {
                  exercise:   item,
                  sessions:   sessionsForExercise(sessions, item.id),
                  clientName,
                })
              }
            />
          )}
        />
      )}
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: '#000' },
  list:  { padding: 16, paddingBottom: 100 },
  center:{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 },

  topBar:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#111' },
  backBtn:  { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  topTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  topSub:   { color: '#555', fontSize: 13, marginTop: 2 },

  summaryBar: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  summaryTxt: { color: '#555', fontSize: 13 },

  exCard: {
    backgroundColor: '#0e0e0e', borderRadius: 14,
    borderWidth: 1, borderColor: '#1a1a1a',
    padding: 14, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center',
  },
  exCardLeft:  { flex: 1, flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  exNumCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  exNumTxt:    { color: '#f05b22', fontSize: 12, fontWeight: '800' },
  exName:      { color: '#fff', fontSize: 15, fontWeight: '700' },
  exMuscle:    { color: '#555', fontSize: 12, marginTop: 2 },
  exMeta:      { marginTop: 4 },
  exMetaTxt:   { color: '#444', fontSize: 12 },
  exFooter:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  statusDot:   { width: 6, height: 6, borderRadius: 3 },
  exDateTxt:   { color: '#555', fontSize: 12 },
  noSessionTxt:{ color: '#333', fontSize: 12, fontStyle: 'italic' },

  verRegistroBtn: {
    backgroundColor: '#0a0a0a', borderRadius: 10, borderWidth: 1, borderColor: '#f05b2233',
    paddingVertical: 8, paddingHorizontal: 12,
    flexDirection: 'row', alignItems: 'center', gap: 5, marginLeft: 8,
  },
  verRegistroTxt: { color: '#f05b22', fontSize: 13, fontWeight: '700' },

  emptyTitle:  { color: '#555', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  emptySubTxt: { color: '#333', fontSize: 14, textAlign: 'center', lineHeight: 20, maxWidth: 280 },
  errTxt:      { color: '#555', fontSize: 14 },
  retryBtn:    { backgroundColor: '#1C1C1E', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  retryTxt:    { color: '#f05b22', fontWeight: '700', fontSize: 14 },
});
