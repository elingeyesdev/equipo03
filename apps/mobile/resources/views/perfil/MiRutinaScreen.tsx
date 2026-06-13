import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../app/Shared/hooks/useAuth';
import { staffApi, ClientRoutine, ClientRoutineExercise } from '../../../app/Providers/staff/api/staff.api';

// ─── Exercise Row ─────────────────────────────────────────────────────────────
const ExerciseRow = ({ ex }: { ex: ClientRoutineExercise }) => (
  <View style={s.exRow}>
    <View style={s.exNum}>
      <Text style={s.exNumTxt}>{ex.orderPosition + 1}</Text>
    </View>
    <View style={s.exInfo}>
      <Text style={s.exName}>{ex.exercise?.name ?? '—'}</Text>
      {ex.exercise?.muscleGroup ? (
        <Text style={s.exMuscle}>{ex.exercise.muscleGroup}</Text>
      ) : null}
      <View style={s.exStats}>
        <View style={s.exStat}>
          <Text style={s.exStatVal}>{ex.setsRecommended}</Text>
          <Text style={s.exStatLabel}>series</Text>
        </View>
        <View style={s.exStatDot} />
        <View style={s.exStat}>
          <Text style={s.exStatVal}>{ex.repsRecommended}</Text>
          <Text style={s.exStatLabel}>reps</Text>
        </View>
        {ex.weightRecommendedKg != null && ex.weightRecommendedKg > 0 ? (
          <>
            <View style={s.exStatDot} />
            <View style={s.exStat}>
              <Text style={s.exStatVal}>{ex.weightRecommendedKg}</Text>
              <Text style={s.exStatLabel}>kg</Text>
            </View>
          </>
        ) : null}
      </View>
      {ex.notes ? <Text style={s.exNotes}>{ex.notes}</Text> : null}
    </View>
  </View>
);

// ─── Routine Card ─────────────────────────────────────────────────────────────
const RoutineCard = ({ routine, isExpanded, onToggle }: {
  routine: ClientRoutine; isExpanded: boolean; onToggle: () => void;
}) => (
  <View style={s.routineCard}>
    <TouchableOpacity style={s.routineHeader} onPress={onToggle} activeOpacity={0.8}>
      <View style={s.routineHeaderLeft}>
        <MaterialCommunityIcons name="dumbbell" size={18} color="#f05b22" />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={s.routineName} numberOfLines={1}>{routine.name}</Text>
          <Text style={s.routineMeta}>
            {routine.exercises?.length ?? 0} ejercicios
            {routine.difficultyLevel ? ` · ${routine.difficultyLevel}` : ''}
            {routine.durationWeeks ? ` · ${routine.durationWeeks} sem.` : ''}
          </Text>
        </View>
      </View>
      <MaterialCommunityIcons
        name={isExpanded ? 'chevron-up' : 'chevron-down'}
        size={20}
        color="#555"
      />
    </TouchableOpacity>

    {isExpanded && (
      <View style={s.exList}>
        {routine.exercises?.length > 0 ? (
          routine.exercises.map((ex) => (
            <ExerciseRow key={ex.id} ex={ex} />
          ))
        ) : (
          <Text style={s.emptyTxt}>Sin ejercicios registrados.</Text>
        )}
      </View>
    )}
  </View>
);

export const MiRutinaScreen = () => {
  const navigation = useNavigation<any>();
  const { user }   = useAuth();
  const userId     = (user as any)?.userId ?? (user as any)?.id;

  const [expanded, setExpanded] = useState<number | null>(null);

  const { data: routines = [], isLoading, isError, refetch } = useQuery<ClientRoutine[]>({
    queryKey: ['my-routines', userId],
    queryFn:  () => staffApi.getMyRoutines(userId),
    enabled:  !!userId,
    staleTime: 2 * 60_000,
    retry: 1,
  });

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.topBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={s.topTitle}>Mi Rutina</Text>
        <View style={{ width: 40 }} />
      </View>

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
      ) : (
        <FlatList
          data={routines}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <RoutineCard
              routine={item}
              isExpanded={expanded === item.id}
              onToggle={() => setExpanded(expanded === item.id ? null : item.id)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#000' },
  list:   { padding: 16, paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 },

  topBar:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#111' },
  backBtn:  { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  topTitle: { flex: 1, color: '#fff', fontSize: 16, fontWeight: '700', textAlign: 'center' },

  routineCard:    { backgroundColor: '#0e0e0e', borderRadius: 14, marginBottom: 12, borderWidth: 1, borderColor: '#1a1a1a', overflow: 'hidden' },
  routineHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  routineHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  routineName:    { color: '#fff', fontSize: 15, fontWeight: '700' },
  routineMeta:    { color: '#555', fontSize: 11, marginTop: 3 },

  exList: { borderTopWidth: 1, borderTopColor: '#1a1a1a', paddingHorizontal: 16, paddingBottom: 8 },

  exRow:    { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#111', gap: 12 },
  exNum:    { width: 26, height: 26, borderRadius: 13, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  exNumTxt: { color: '#f05b22', fontSize: 11, fontWeight: '700' },
  exInfo:   { flex: 1 },
  exName:   { color: '#fff', fontSize: 14, fontWeight: '600' },
  exMuscle: { color: '#555', fontSize: 11, marginTop: 2 },
  exStats:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  exStat:   { alignItems: 'center' },
  exStatVal:   { color: '#f05b22', fontSize: 14, fontWeight: '700' },
  exStatLabel: { color: '#444', fontSize: 10 },
  exStatDot:   { width: 3, height: 3, borderRadius: 2, backgroundColor: '#333', marginTop: -8 },
  exNotes:  { color: '#444', fontSize: 11, marginTop: 6, fontStyle: 'italic' },

  emptyTitle:  { color: '#555', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  emptySubTxt: { color: '#333', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  emptyTxt:    { color: '#333', fontSize: 12, padding: 12, textAlign: 'center' },
  errTxt:      { color: '#555', fontSize: 14 },
  retryBtn:    { backgroundColor: '#1C1C1E', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  retryTxt:    { color: '#f05b22', fontWeight: '700' },
});
