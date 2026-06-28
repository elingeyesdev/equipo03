import React, { useState, useEffect, useRef } from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Alert, ScrollView, KeyboardAvoidingView, Platform, TextInput} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NumericInput } from '../../../app/Shared/components/ui/NumericInput';
import { useAuth } from '../../../app/Shared/hooks/useAuth';
import { staffApi, Exercise, ClientRoutine, ClientRoutineExercise } from '../../../app/Providers/staff/api/staff.api';
import { DumbbellSpinner } from '../../../app/Shared/components/ui/DumbbellSpinner';


const DAYS = ['LUNES','MARTES','MIERCOLES','JUEVES','VIERNES','SABADO','DOMINGO'] as const;
type DayKey = typeof DAYS[number];

const DAY_LABEL: Record<DayKey, string> = {
  LUNES: 'Lunes', MARTES: 'Martes', MIERCOLES: 'Miércoles',
  JUEVES: 'Jueves', VIERNES: 'Viernes', SABADO: 'Sábado', DOMINGO: 'Domingo',
};

type FieldDef = { key: string; label: string; placeholder: string; numeric: boolean };

const FIELD_CONFIGS: Record<string, FieldDef[]> = {
  STRENGTH: [
    { key: 'sets',   label: 'Series',          placeholder: '3',        numeric: true  },
    { key: 'reps',   label: 'Repeticiones',     placeholder: '10 ó 8-12', numeric: false },
    { key: 'weight', label: 'Peso rec. (kg)',   placeholder: '0.0',      numeric: true  },
    { key: 'rest',   label: 'Descanso (seg)',   placeholder: '60',       numeric: true  },
  ],
  FUNCTIONAL: [
    { key: 'sets', label: 'Series',          placeholder: '4',  numeric: true  },
    { key: 'reps', label: 'Repeticiones',     placeholder: '15', numeric: false },
    { key: 'rest', label: 'Descanso (seg)',   placeholder: '60', numeric: true  },
  ],
  CARDIO: [
    { key: 'duration', label: 'Duración (min)',   placeholder: '30', numeric: true },
    { key: 'distance', label: 'Distancia (km)',    placeholder: '5',  numeric: true },
    { key: 'speed',    label: 'Velocidad (km/h)',  placeholder: '10', numeric: true },
  ],
  HIIT: [
    { key: 'rounds',      label: 'Rondas',          placeholder: '8',  numeric: true },
    { key: 'workSeconds', label: 'Trabajo (seg)',     placeholder: '20', numeric: true },
    { key: 'restSeconds', label: 'Descanso (seg)',    placeholder: '10', numeric: true },
  ],
  MOBILITY: [
    { key: 'duration', label: 'Duración (seg)', placeholder: '30', numeric: true },
    { key: 'sets',     label: 'Series',          placeholder: '3',  numeric: true },
  ],
};

const DEFAULT_PARAMS: Record<string, Record<string, string>> = {
  STRENGTH:   { sets: '3', reps: '10', weight: '', rest: '', notes: '' },
  FUNCTIONAL: { sets: '4', reps: '15', rest: '60', notes: '' },
  CARDIO:     { duration: '30', distance: '', speed: '', notes: '' },
  HIIT:       { rounds: '8', workSeconds: '20', restSeconds: '10', notes: '' },
  MOBILITY:   { duration: '30', sets: '3', notes: '' },
};

const getDefaultParams = (exerciseType: string): Record<string, string> =>
  ({ ...(DEFAULT_PARAMS[exerciseType] ?? DEFAULT_PARAMS.STRENGTH) });

const TYPE_LABEL: Record<string, string> = {
  STRENGTH: 'Fuerza', FUNCTIONAL: 'Funcional', CARDIO: 'Cardio',
  HIIT: 'HIIT', MOBILITY: 'Movilidad',
};
const TYPE_COLOR: Record<string, string> = {
  STRENGTH: '#38BDF8', FUNCTIONAL: '#00E5A3', CARDIO: '#FF5E00',
  HIIT: '#FF5E00', MOBILITY: '#00E5A3',
};

//Types 
type ExEntry = {
  uid:          string;
  exerciseId:   number;
  exerciseType: string;
  name:         string;
  muscleGroup?: string;
  params:       Record<string, string>;
  notes:        string;
};

type WeekPlan = Record<DayKey, ExEntry[]>;

const emptyWeek = (): WeekPlan =>
  Object.fromEntries(DAYS.map(d => [d, []])) as unknown as WeekPlan;

//Entry display helper 
const formatEntryConf = (entry: ExEntry): string => {
  const p = entry.params;
  switch (entry.exerciseType) {
    case 'CARDIO':
      return [p.duration && `${p.duration}min`, p.distance && `${p.distance}km`, p.speed && `${p.speed}km/h`]
        .filter(Boolean).join(' · ') || '—';
    case 'HIIT':
      return [p.rounds && `${p.rounds} rondas`, p.workSeconds && `${p.workSeconds}s trabajo`, p.restSeconds && `${p.restSeconds}s desc.`]
        .filter(Boolean).join(' · ') || '—';
    case 'MOBILITY':
      return [p.duration && `${p.duration}s`, p.sets && `${p.sets} series`]
        .filter(Boolean).join(' · ') || '—';
    case 'FUNCTIONAL':
      return [p.sets && `${p.sets} series`, p.reps && `${p.reps} reps`, p.rest && `${p.rest}s desc.`]
        .filter(Boolean).join(' · ') || '—';
    default:
      return [p.sets && `${p.sets} series`, p.reps && `${p.reps} reps`, p.weight && `${p.weight}kg`, p.rest && `${p.rest}s`]
        .filter(Boolean).join(' · ') || '—';
  }
};

// ─── Convert existing routine → WeekPlan ─────────────────────────────────────
const routineToWeekPlan = (routine: ClientRoutine | null): WeekPlan => {
  const plan = emptyWeek();
  if (!routine?.exercises?.length) return plan;
  for (const ex of routine.exercises) {
    const day = ex.dayOfWeek as DayKey;
    if (!day || !DAYS.includes(day)) continue;
    const exerciseType = ex.exercise?.exerciseType ?? 'STRENGTH';
    const params: Record<string, string> = {};
    if (ex.setsRecommended != null)        params.sets     = String(ex.setsRecommended);
    if (ex.repsRecommended != null)        params.reps     = String(ex.repsRecommended);
    if ((ex.weightRecommendedKg ?? 0) > 0) params.weight   = String(ex.weightRecommendedKg);
    if ((ex.restSecondsBetweenSets ?? 0) > 0) params.rest  = String(ex.restSecondsBetweenSets);
    if (ex.params && typeof ex.params === 'object') {
      for (const [k, v] of Object.entries(ex.params)) {
        if (v != null) params[k] = String(v);
      }
    }
    plan[day].push({
      uid:          `${ex.exercise.id}-${ex.id}`,
      exerciseId:   ex.exercise.id,
      exerciseType,
      name:         ex.exercise.name,
      muscleGroup:  ex.exercise.muscleGroup,
      params,
      notes:        ex.notes ?? '',
    });
  }
  return plan;
};

//Day Card 
const DayCard = ({ day, entries, expanded, onToggle, onAdd, onEdit, onRemove }: {
  day:      DayKey;
  entries:  ExEntry[];
  expanded: boolean;
  onToggle: () => void;
  onAdd:    (day: DayKey) => void;
  onEdit:   (day: DayKey, entry: ExEntry) => void;
  onRemove: (day: DayKey, uid: string) => void;
}) => (
  <View style={s.dayCard}>
    <TouchableOpacity style={s.dayHeader} onPress={onToggle} activeOpacity={0.8}>
      <View style={s.dayLeft}>
        <Text style={s.dayName}>{DAY_LABEL[day]}</Text>
        {entries.length > 0 && (
          <View style={s.dayBadge}>
            <Text style={s.dayBadgeTxt}>{entries.length} ejercicio{entries.length !== 1 ? 's' : ''}</Text>
          </View>
        )}
      </View>
      <MaterialCommunityIcons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color="#555" />
    </TouchableOpacity>

    {expanded && (
      <View style={s.dayBody}>
        {entries.map(entry => {
          const typeColor = TYPE_COLOR[entry.exerciseType] ?? '#38BDF8';
          return (
            <TouchableOpacity key={entry.uid} style={s.exEntry} onPress={() => onEdit(day, entry)} activeOpacity={0.75}>
              <View style={[s.exIconWrap, { borderColor: typeColor + '44' }]}>
                <MaterialCommunityIcons name="dumbbell" size={16} color={typeColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.exEntryName}>{entry.name}</Text>
                {entry.muscleGroup ? <Text style={s.exEntrySub}>{entry.muscleGroup}</Text> : null}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <View style={[s.typePill, { borderColor: typeColor + '44' }]}>
                    <Text style={[s.typePillTxt, { color: typeColor }]}>{TYPE_LABEL[entry.exerciseType] ?? entry.exerciseType}</Text>
                  </View>
                  <Text style={s.exEntryConf} numberOfLines={1}>{formatEntryConf(entry)}</Text>
                </View>
                {entry.notes ? <Text style={s.exEntryNotes} numberOfLines={1}>{entry.notes}</Text> : null}
              </View>
              <TouchableOpacity onPress={() => onRemove(day, entry.uid)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialCommunityIcons name="close-circle" size={20} color="#EF4444" />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity style={s.addExBtn} onPress={() => onAdd(day)} activeOpacity={0.8}>
          <MaterialCommunityIcons name="plus" size={15} color="#FF5E00" />
          <Text style={s.addExTxt}>Agregar ejercicio</Text>
        </TouchableOpacity>
      </View>
    )}
  </View>
);

//Catalog Modal
const CatalogModal = ({ visible, day, exercises, weekPlan, filter, setFilter, onSelect, onClose, isLoading }: {
  visible:    boolean;
  day:        DayKey | null;
  exercises:  Exercise[];
  weekPlan:   WeekPlan;
  filter:     string;
  setFilter:  (f: string) => void;
  onSelect:   (ex: Exercise) => void;
  onClose:    () => void;
  isLoading:  boolean;
}) => {
  const insets  = useSafeAreaInsets();
  const filters = ['Todos', ...Array.from(new Set(exercises.map(e => e.muscleGroup).filter(Boolean) as string[])).sort()];
  const filtered = filter === 'Todos' ? exercises : exercises.filter(e => e.muscleGroup === filter);

  return (
    <Modal visible={visible} animationType="slide">
      <View style={[s.safe, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={s.catalogHeader}>
          <TouchableOpacity onPress={onClose} style={s.catalogCloseBtn}>
            <MaterialCommunityIcons name="close" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={s.catalogTitle} numberOfLines={1}>
            Ejercicios — {day ? DAY_LABEL[day] : ''}
          </Text>
          <View style={{ width: 38 }} />
        </View>

        <View style={s.filterBarOuter}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterBar} bounces={false}>
            {filters.map(f => (
              <TouchableOpacity key={f} style={[s.chip, filter === f && s.chipActive]} onPress={() => setFilter(f)} activeOpacity={0.7}>
                <Text style={[s.chipTxt, filter === f && s.chipTxtActive]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={{ flex: 1 }}>
          {isLoading ? (
            <View style={s.center}><DumbbellSpinner color="#FF5E00" size="large" /></View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={item => String(item.id)}
              contentContainerStyle={s.list}
              showsVerticalScrollIndicator={false}
              style={{ flex: 1 }}
              ListEmptyComponent={
                <View style={s.center}>
                  <Text style={s.soft}>Sin ejercicios{filter !== 'Todos' ? ` en "${filter}"` : ''}.</Text>
                </View>
              }
              renderItem={({ item }) => {
                const inDay     = day ? weekPlan[day].some(e => e.exerciseId === item.id) : false;
                const typeColor = TYPE_COLOR[item.exerciseType ?? 'STRENGTH'] ?? '#38BDF8';
                return (
                  <TouchableOpacity style={[s.card, inDay && s.cardAdded]} onPress={() => onSelect(item)} activeOpacity={0.85}>
                    <View style={s.cardLeft}>
                      <View style={[s.iconWrap, { borderColor: inDay ? '#00E5A3' : typeColor + '66' }]}>
                        <MaterialCommunityIcons
                          name={inDay ? 'check' : 'dumbbell'}
                          size={20}
                          color={inDay ? '#00E5A3' : typeColor}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.exName}>{item.name}</Text>
                        <View style={{ flexDirection: 'row', gap: 6, marginTop: 3 }}>
                          {item.muscleGroup ? <Text style={s.exMuscle}>{item.muscleGroup}</Text> : null}
                          {item.exerciseType ? (
                            <View style={[s.typePill, { borderColor: typeColor + '44' }]}>
                              <Text style={[s.typePillTxt, { color: typeColor }]}>{TYPE_LABEL[item.exerciseType] ?? item.exerciseType}</Text>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    </View>
                    <MaterialCommunityIcons
                      name={inDay ? 'pencil-outline' : 'plus-circle-outline'}
                      size={20}
                      color={inDay ? '#00E5A3' : typeColor}
                    />
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

//Config Sheet Modal 
const ConfigModal = ({ visible, exercise, exerciseType, isEdit, cfg, setCfg, onConfirm, onClose }: {
  visible:      boolean;
  exercise:     Exercise | null;
  exerciseType: string;
  isEdit:       boolean;
  cfg:          Record<string, string>;
  setCfg:       React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onConfirm:    () => void;
  onClose:      () => void;
}) => {
  const fields   = FIELD_CONFIGS[exerciseType] ?? FIELD_CONFIGS.STRENGTH;
  const typeColor = TYPE_COLOR[exerciseType] ?? '#38BDF8';

  // Render fields in rows of 2
  const rows: FieldDef[][] = [];
  for (let i = 0; i < fields.length; i += 2) rows.push(fields.slice(i, i + 2));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <TouchableOpacity style={s.modalBg} activeOpacity={1} onPress={onClose}>
          <TouchableOpacity style={s.modalSheet} activeOpacity={1}>
            <View style={s.modalHandle} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Text style={s.modalTitle} numberOfLines={2}>{exercise?.name ?? ''}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 18 }}>
              {exercise?.muscleGroup ? <Text style={s.modalSub}>{exercise.muscleGroup}</Text> : null}
              <View style={[s.typePill, { borderColor: typeColor + '66' }]}>
                <Text style={[s.typePillTxt, { color: typeColor }]}>{TYPE_LABEL[exerciseType] ?? exerciseType}</Text>
              </View>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {rows.map((row, ri) => (
                <View key={ri} style={s.cfgRow}>
                  {row.map(field => (
                    <View key={field.key} style={s.cfgField}>
                      <Text style={s.cfgLabel}>{field.label}</Text>
                      {field.numeric ? (
                        <NumericInput
                          style={s.cfgInput}
                          value={cfg[field.key] ?? ''}
                          onChangeText={v => setCfg(p => ({ ...p, [field.key]: v }))}
                          placeholder={field.placeholder}
                          placeholderTextColor="#555"
                        />
                      ) : (
                        <TextInput
                          style={s.cfgInput}
                          value={cfg[field.key] ?? ''}
                          onChangeText={v => setCfg(p => ({ ...p, [field.key]: v }))}
                          placeholder={field.placeholder}
                          placeholderTextColor="#555"
                          keyboardType="default"
                        />
                      )}
                    </View>
                  ))}
                  {row.length === 1 && <View style={s.cfgField} />}
                </View>
              ))}

              {/* Notes — always visible */}
              <View style={[s.cfgField, { marginBottom: 16 }]}>
                <Text style={s.cfgLabel}>Notas (opcional)</Text>
                <TextInput
                  style={[s.cfgInput, { height: 72, textAlignVertical: 'top', paddingTop: 10 }]}
                  value={cfg.notes ?? ''}
                  onChangeText={v => setCfg(p => ({ ...p, notes: v }))}
                  placeholder="Controlar el negativo, etc."
                  placeholderTextColor="#555"
                  multiline
                  maxLength={200}
                />
              </View>

              <TouchableOpacity style={[s.confirmBtn, { backgroundColor: typeColor }]} onPress={onConfirm} activeOpacity={0.85}>
                <MaterialCommunityIcons
                  name={isEdit ? 'pencil-circle-outline' : 'plus-circle-outline'}
                  size={18} color="#fff"
                />
                <Text style={s.confirmBtnTxt}>{isEdit ? 'Actualizar ejercicio' : 'Añadir al día'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
};

//Screen 
export const AsignarRutinaScreen = () => {
  const route       = useRoute<any>();
  const navigation  = useNavigation();
  const { user }    = useAuth();
  const queryClient = useQueryClient();
  const { studentId, studentName } = route.params as { studentId: number; studentName?: string };

  const [weekPlan,      setWeekPlan]      = useState<WeekPlan>(emptyWeek());
  const [openDay,       setOpenDay]       = useState<DayKey | null>('LUNES');
  const [catalogDay,    setCatalogDay]    = useState<DayKey | null>(null);
  const [catalogFilter, setCatalogFilter] = useState('Todos');
  const [configTarget,  setConfigTarget]  = useState<{
    day: DayKey; exercise: Exercise; uid?: string; exerciseType: string;
  } | null>(null);
  const [cfg, setCfg] = useState<Record<string, string>>({});
  const hasLoaded = useRef(false);

  //Cargar rutina existente del cliente
  const { data: routinesResponse, isLoading: loadingRoutine } = useQuery({
    queryKey:  ['client-routines', studentId],
    queryFn:   () => staffApi.getMyRoutines(studentId),
    staleTime: 60_000,
    retry: 1,
  });
  const existingRoutines = routinesResponse?.data ?? [];

  const existingRoutine = existingRoutines.find(r => (r.exercises?.length ?? 0) > 0)
    ?? existingRoutines[0]
    ?? null;
  const existingRoutineId = existingRoutine?.id ?? null;

  // Pre-cargar formulario con ejercicios existentes (solo una vez al cargar)
  useEffect(() => {
    if (!loadingRoutine && !hasLoaded.current) {
      hasLoaded.current = true;
      if (existingRoutine) {
        setWeekPlan(routineToWeekPlan(existingRoutine));
      }
    }
  }, [loadingRoutine, existingRoutine]);

  const { data: exercisesData, isLoading: loadingExercises } = useQuery({
    queryKey:  ['exercises-catalog'],
    queryFn:   () => staffApi.getExercises(),
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const exercises: Exercise[] = exercisesData ?? [];

  const isLoading = loadingRoutine || loadingExercises;
  const totalExercises = DAYS.reduce((acc, d) => acc + weekPlan[d].length, 0);

  //Build polymorphic payload 
  const buildExercisePayload = (e: ExEntry, idx: number) => {
    const p    = e.params;
    const base = { exerciseId: e.exerciseId, dayOfWeek: undefined as string | undefined, orderPosition: idx, notes: e.notes || undefined };
    switch (e.exerciseType) {
      case 'CARDIO':
        return { ...base, setsRecommended: 1, repsRecommended: `${p.duration || ''}min`,
          params: { durationMin: parseFloat(p.duration) || undefined, distanceKm: parseFloat(p.distance) || undefined, speedKmh: parseFloat(p.speed) || undefined } };
      case 'HIIT':
        return { ...base, setsRecommended: parseInt(p.rounds) || 1, repsRecommended: `${p.workSeconds || ''}s`,
          params: { rounds: parseInt(p.rounds) || undefined, workSeconds: parseInt(p.workSeconds) || undefined, restSeconds: parseInt(p.restSeconds) || undefined } };
      case 'MOBILITY':
        return { ...base, setsRecommended: parseInt(p.sets) || 1, repsRecommended: `${p.duration || ''}s`,
          params: { durationSeconds: parseInt(p.duration) || undefined, sets: parseInt(p.sets) || undefined } };
      case 'FUNCTIONAL':
        return { ...base, setsRecommended: parseInt(p.sets) || 4, repsRecommended: p.reps || '15',
          restSecondsBetweenSets: parseInt(p.rest) || undefined };
      default: // STRENGTH
        return { ...base, setsRecommended: parseInt(p.sets) || 3, repsRecommended: p.reps || '10',
          weightRecommendedKg: parseFloat(p.weight) || undefined, restSecondsBetweenSets: parseInt(p.rest) || undefined };
    }
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const allEx = DAYS.flatMap((day) =>
        weekPlan[day].map((e, idx) => ({
          ...buildExercisePayload(e, idx),
          dayOfWeek: day,
        }))
      );
      if (existingRoutineId) {
        return staffApi.updateRoutine(existingRoutineId, { exercises: allEx as any });
      }
      const trainerId = String((user as any)?.userId ?? (user as any)?.id ?? '');
      return staffApi.createRoutine({ trainerId, assignedUserId: studentId, exercises: allEx as any });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-routines', studentId] });
      queryClient.invalidateQueries({ queryKey: ['trainer-client-sessions', studentId] });
      Alert.alert('Rutina guardada', `Asignada a ${studentName ?? 'alumno'}`);
      navigation.goBack();
    },
    onError: (e: any) => {
      Alert.alert('Error', e?.response?.data?.message ?? e?.message ?? 'No se pudo guardar la rutina');
    },
  });

  const openCatalog = (day: DayKey) => {
    setCatalogDay(day);
    setCatalogFilter('Todos');
  };

  const selectFromCatalog = (exercise: Exercise) => {
    if (!catalogDay) return;
    const day          = catalogDay;
    const exerciseType = exercise.exerciseType ?? 'STRENGTH';
    const existing     = weekPlan[day].find(e => e.exerciseId === exercise.id);
    setCfg(existing ? { ...existing.params, notes: existing.notes } : getDefaultParams(exerciseType));
    setConfigTarget({ day, exercise, uid: existing?.uid, exerciseType });
    setCatalogDay(null);
  };

  const openEdit = (day: DayKey, entry: ExEntry) => {
    const exercise: Exercise = {
      id: entry.exerciseId, name: entry.name,
      muscleGroup: entry.muscleGroup, exerciseType: entry.exerciseType,
    };
    setCfg({ ...entry.params, notes: entry.notes });
    setConfigTarget({ day, exercise, uid: entry.uid, exerciseType: entry.exerciseType });
  };

  const confirmConfig = () => {
    if (!configTarget) return;
    const { day, exercise, uid, exerciseType } = configTarget;
    const params = Object.fromEntries(Object.entries(cfg).filter(([k]) => k !== 'notes'));
    const entry: ExEntry = {
      uid:          uid ?? `${exercise.id}-${Date.now()}`,
      exerciseId:   exercise.id,
      exerciseType,
      name:         exercise.name,
      muscleGroup:  exercise.muscleGroup,
      params,
      notes:        cfg.notes ?? '',
    };
    setWeekPlan(prev => ({
      ...prev,
      [day]: uid
        ? prev[day].map(e => e.uid === uid ? entry : e)
        : [...prev[day], entry],
    }));
    setConfigTarget(null);
    setCfg({});
  };

  const removeEntry = (day: DayKey, uid: string) =>
    setWeekPlan(prev => ({ ...prev, [day]: prev[day].filter(e => e.uid !== uid) }));

  const handleSave = () => {
    if (totalExercises === 0) {
      Alert.alert('Rutina vacía', 'Agrega al menos un ejercicio antes de guardar.');
      return;
    }
    saveMutation.mutate();
  };

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <View style={s.subHeader}>
        <MaterialCommunityIcons name="account-outline" size={16} color="#FF5E00" />
        <Text style={s.subHeaderTxt} numberOfLines={1}>{studentName ?? `Alumno #${studentId}`}</Text>
        {loadingRoutine ? (
          <DumbbellSpinner size="small" color="#38BDF8" style={{ marginLeft: 8 }} />
        ) : existingRoutineId ? (
          <View style={[s.badge, { borderColor: '#38BDF844', backgroundColor: '#0d2a3d' }]}>
            <Text style={[s.badgeTxt, { color: '#38BDF8' }]}>Editando rutina</Text>
          </View>
        ) : (
          <View style={[s.badge, { borderColor: '#00E5A344', backgroundColor: '#003d2a' }]}>
            <Text style={[s.badgeTxt, { color: '#00E5A3' }]}>Nueva rutina</Text>
          </View>
        )}
        {totalExercises > 0 && (
          <View style={s.badge}>
            <Text style={s.badgeTxt}>{totalExercises} ej.</Text>
          </View>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.list}>
        {DAYS.map(day => (
          <DayCard
            key={day}
            day={day}
            entries={weekPlan[day]}
            expanded={openDay === day}
            onToggle={() => setOpenDay(openDay === day ? null : day)}
            onAdd={openCatalog}
            onEdit={openEdit}
            onRemove={removeEntry}
          />
        ))}
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity
          style={[s.saveBtn, (saveMutation.isPending || totalExercises === 0) && s.saveBtnOff]}
          onPress={handleSave}
          disabled={saveMutation.isPending || totalExercises === 0}
          activeOpacity={0.85}
        >
          {saveMutation.isPending
            ? <DumbbellSpinner color="#fff" size="small" />
            : <>
                <MaterialCommunityIcons name="content-save-check-outline" size={18} color="#fff" />
                <Text style={s.saveBtnTxt}>
                  {existingRoutineId ? 'Actualizar Rutina' : 'Guardar Rutina'} ({totalExercises})
                </Text>
              </>
          }
        </TouchableOpacity>
      </View>

      <CatalogModal
        visible={catalogDay !== null}
        day={catalogDay}
        exercises={exercises}
        weekPlan={weekPlan}
        filter={catalogFilter}
        setFilter={setCatalogFilter}
        onSelect={selectFromCatalog}
        onClose={() => setCatalogDay(null)}
        isLoading={isLoading}
      />

      <ConfigModal
        visible={!!configTarget}
        exercise={configTarget?.exercise ?? null}
        exerciseType={configTarget?.exerciseType ?? 'STRENGTH'}
        isEdit={!!configTarget?.uid}
        cfg={cfg}
        setCfg={setCfg}
        onConfirm={confirmConfig}
        onClose={() => { setConfigTarget(null); setCfg({}); }}
      />
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  list:   { padding: 16, paddingBottom: 120 },

  subHeader:    { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  subHeaderTxt: { color: '#ccc', fontSize: 13, fontWeight: '600', flex: 1 },
  badge:        { backgroundColor: '#1C1C1E', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: '#FF5E00' },
  badgeTxt:     { color: '#FF5E00', fontSize: 11, fontWeight: '700' },

  dayCard:    { backgroundColor: '#0e0e0e', borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: '#1a1a1a', overflow: 'hidden' },
  dayHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  dayLeft:    { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  dayName:    { color: '#fff', fontSize: 16, fontWeight: '700' },
  dayBadge:   { backgroundColor: '#1a3320', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: '#22c55e44' },
  dayBadgeTxt:{ color: '#22c55e', fontSize: 11, fontWeight: '600' },
  dayBody:    { borderTopWidth: 1, borderTopColor: '#1a1a1a', padding: 12, gap: 8 },

  exEntry:     { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#141414', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#1a1a1a' },
  exIconWrap:  { width: 34, height: 34, borderRadius: 10, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  exEntryName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  exEntrySub:  { color: '#555', fontSize: 11, marginTop: 1 },
  exEntryConf: { color: '#22C55E', fontSize: 12, fontWeight: '600', flex: 1 },
  exEntryNotes:{ color: '#444', fontSize: 11, marginTop: 2, fontStyle: 'italic' },

  typePill:    { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1 },
  typePillTxt: { fontSize: 9, fontWeight: '700' },

  addExBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: '#FF5E0033', borderRadius: 10, paddingVertical: 10, borderStyle: 'dashed' },
  addExTxt: { color: '#FF5E00', fontSize: 13, fontWeight: '600' },

  footer:     { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#000', borderTopWidth: 1, borderTopColor: '#1a1a1a' },
  saveBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FF5E00', borderRadius: 14, paddingVertical: 14 },
  saveBtnOff: { opacity: 0.4 },
  saveBtnTxt: { color: '#fff', fontWeight: '900', fontSize: 15 },

  catalogHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  catalogCloseBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' },
  catalogTitle:    { flex: 1, color: '#fff', fontSize: 15, fontWeight: '700', textAlign: 'center', marginHorizontal: 8 },

  filterBarOuter: { height: 56, borderBottomWidth: 1, borderBottomColor: '#1a1a1a', justifyContent: 'center' },
  filterBar:      { paddingHorizontal: 16, alignItems: 'center' },
  chip:          { height: 36, minWidth: 76, paddingHorizontal: 18, borderRadius: 18, backgroundColor: '#1C1C1E', borderWidth: 1, borderColor: '#3A3A3C', marginRight: 10, justifyContent: 'center', alignItems: 'center' },
  chipActive:    { backgroundColor: '#FF5E00', borderColor: '#FF5E00' },
  chipTxt:       { color: '#ccc', fontSize: 13, fontWeight: '600' },
  chipTxtActive: { color: '#fff', fontSize: 13, fontWeight: '700' },

  card:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0e0e0e', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#3A3A3C', gap: 12 },
  cardAdded:{ borderColor: '#00E5A3', backgroundColor: '#1C1C1E' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  exName:   { color: '#fff', fontSize: 14, fontWeight: '700' },
  exMuscle: { color: '#555', fontSize: 11 },

  soft: { color: '#444', fontSize: 13, textAlign: 'center' },

  modalBg:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalSheet:  { backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, backgroundColor: '#333', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle:  { color: '#fff', fontSize: 18, fontWeight: '900', flex: 1 },
  modalSub:    { color: '#555', fontSize: 12 },

  cfgRow:   { flexDirection: 'row', gap: 12, marginBottom: 16 },
  cfgField: { flex: 1 },
  cfgLabel: { color: '#888', fontSize: 12, fontWeight: '600', marginBottom: 8 },
  cfgInput: { backgroundColor: '#1C1C1E', borderRadius: 12, padding: 14, color: '#fff', fontSize: 16, borderWidth: 1, borderColor: '#3A3A3C' },

  confirmBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 14, marginTop: 8 },
  confirmBtnTxt: { color: '#fff', fontWeight: '900', fontSize: 15 },
});
