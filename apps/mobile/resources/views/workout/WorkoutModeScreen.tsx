import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { trainingApi } from '../../../app/Providers/training/api/training.api';

export type TrackingType =
  | 'PESO_REPS'
  | 'BODYWEIGHT_REPS'
  | 'TIME_BASED'
  | 'DISTANCE_TIME'
  | 'ASSISTED_WEIGHT';

type ExerciseItem = {
  id:           number;
  name:         string;
  muscleGroup:  string;
  category:     string;
  exerciseType: string;
  trackingType: TrackingType;
  youtubeVideoId?: string | null;
  imageUrl?: string | null;
};

type SubGroup = {
  title: string;
  icon:  string;
  color: string;
  data:  ExerciseItem[];
};

// ── Category meta ──────────────────────────────────────────────────────────────
const CATEGORY_META: Record<string, { label: string; icon: string; color: string }> = {
  FUERZA:    { label: 'Fuerza e Hipertrofia', icon: 'dumbbell',        color: '#38BDF8' },
  CARDIO:    { label: 'Cardio',               icon: 'run',             color: '#FF5E00' },
  FUNCIONAL: { label: 'Funcional y Potencia', icon: 'lightning-bolt',  color: '#00E5A3' },
};

const MUSCLE_META: Record<string, { icon: string; color: string }> = {
  Pectorales:     { icon: 'arm-flex-outline', color: '#38BDF8' },
  Dorsales:       { icon: 'rowing',           color: '#00E5A3' },
  Hombros:        { icon: 'weight-lifter',    color: '#FF5E00' },
  'Bíceps':       { icon: 'arm-flex',         color: '#38BDF8' },
  'Tríceps':      { icon: 'dumbbell',         color: '#FF5E00' },
  'Cuádriceps':   { icon: 'run-fast',         color: '#00E5A3' },
  Isquiotibiales: { icon: 'human-male',       color: '#FF5E00' },
  Gemelos:        { icon: 'walk',             color: '#38BDF8' },
  Core:           { icon: 'yoga',             color: '#00E5A3' },
  Cardio:         { icon: 'run',              color: '#FF5E00' },
  Funcional:      { icon: 'crosshairs',       color: '#38BDF8' },
  HIIT:           { icon: 'lightning-bolt',   color: '#FF5E00' },
  Movilidad:      { icon: 'human',            color: '#00E5A3' },
};

const TRACKING_MAP: Record<string, TrackingType> = {
  STRENGTH:  'PESO_REPS',
  FUNCTIONAL:'BODYWEIGHT_REPS',
  CARDIO:    'DISTANCE_TIME',
  HIIT:      'BODYWEIGHT_REPS',
  MOBILITY:  'TIME_BASED',
};

const CATEGORY_ORDER = ['FUERZA', 'CARDIO', 'FUNCIONAL'];

// ── Component ─────────────────────────────────────────────────────────────────
export const WorkoutModeScreen = () => {
  const navigation = useNavigation<any>();
  const [sections,  setSections]  = useState<{ categoryKey: string; subGroups: SubGroup[] }[]>([]);
  const [expanded,  setExpanded]  = useState<Record<string, boolean>>({});
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const raw: any[] = await trainingApi.getExercises();

        // Group: category → muscleGroup → exercises
        const tree: Record<string, Record<string, ExerciseItem[]>> = {};
        for (const ex of raw) {
          const cat  = ex.category     ?? 'FUERZA';
          const mg   = ex.muscleGroup  ?? 'Otro';
          const et   = ex.exerciseType ?? 'STRENGTH';
          if (!tree[cat])     tree[cat]    = {};
          if (!tree[cat][mg]) tree[cat][mg] = [];
          tree[cat][mg].push({
            id:           ex.id,
            name:         ex.name,
            muscleGroup:  mg,
            category:     cat,
            exerciseType: et,
            trackingType: TRACKING_MAP[et] ?? 'PESO_REPS',
            youtubeVideoId: ex.youtubeVideoId ?? null,
            imageUrl: ex.imageUrl ?? null,
          });
        }

        const built = CATEGORY_ORDER
          .filter(cat => tree[cat])
          .map(cat => ({
            categoryKey: cat,
            subGroups: Object.entries(tree[cat]).map(([mg, items]) => {
              const meta = MUSCLE_META[mg] ?? { icon: 'dumbbell', color: '#38BDF8' };
              return { title: mg, icon: meta.icon, color: meta.color, data: items };
            }),
          }));

        // Expand first category by default
        const initExpanded: Record<string, boolean> = {};
        built.forEach((c, ci) => {
          c.subGroups.forEach((_, si) => {
            initExpanded[`${ci}-${si}`] = ci === 0;
          });
        });

        setSections(built);
        setExpanded(initExpanded);
      } catch (err) {
        console.warn('Error fetching catalog:', (err as Error)?.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  const toggleSubGroup = (catIdx: number, sgIdx: number) => {
    const key = `${catIdx}-${sgIdx}`;
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Iniciar Entrenamiento</Text>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#38BDF8" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
        >
          {sections.map((catSection, catIdx) => {
            const catMeta = CATEGORY_META[catSection.categoryKey] ?? { label: catSection.categoryKey, icon: 'dumbbell', color: '#38BDF8' };
            return (
              <View key={catSection.categoryKey}>
                {/* Category header */}
                <View style={s.catHeader}>
                  <MaterialCommunityIcons name={catMeta.icon as any} size={18} color={catMeta.color} />
                  <Text style={[s.catTitle, { color: catMeta.color }]}>{catMeta.label}</Text>
                </View>

                {catSection.subGroups.map((sg, sgIdx) => {
                  const key      = `${catIdx}-${sgIdx}`;
                  const isOpen   = expanded[key] ?? false;
                  return (
                    <View key={sg.title} style={s.subGroup}>
                      {/* Subcategory header (tappable) */}
                      <TouchableOpacity
                        style={s.sgHeader}
                        onPress={() => toggleSubGroup(catIdx, sgIdx)}
                        activeOpacity={0.75}
                      >
                        <View style={[s.sgDot, { backgroundColor: sg.color }]} />
                        <MaterialCommunityIcons name={sg.icon as any} size={14} color={sg.color} />
                        <Text style={[s.sgTitle, { color: sg.color }]}>{sg.title}</Text>
                        <Text style={s.sgCount}>{sg.data.length}</Text>
                        <MaterialCommunityIcons
                          name={isOpen ? 'chevron-up' : 'chevron-down'}
                          size={16} color="#555"
                        />
                      </TouchableOpacity>

                      {/* Exercise list */}
                      {isOpen && sg.data.map(item => (
                        <TouchableOpacity
                          key={item.id}
                          style={s.row}
                          activeOpacity={0.7}
                          onPress={() => navigation.navigate('WorkoutReady', {
                            sport:        item.exerciseType,
                            exercise:     { id: item.id, name: item.name },
                            trackingType: item.trackingType,
                            youtubeVideoId: item.youtubeVideoId,
                            imageUrl: item.imageUrl,
                          })}
                        >
                          <View style={[s.rowDot, { backgroundColor: sg.color + '22', borderColor: sg.color + '44' }]}>
                            <MaterialCommunityIcons name={sg.icon as any} size={13} color={sg.color} />
                          </View>
                          <Text style={s.rowLabel}>{item.name}</Text>
                          <MaterialCommunityIcons name="chevron-right" size={18} color="#333" />
                        </TouchableOpacity>
                      ))}
                    </View>
                  );
                })}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll:    { paddingHorizontal: 16, paddingBottom: 48 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#161618',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#222',
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },

  catHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 28, marginBottom: 10,
  },
  catTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 0.5, flex: 1 },

  subGroup: { marginBottom: 6 },

  sgHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: '#111', borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 14,
    borderWidth: 1, borderColor: '#1c1c1e',
    marginBottom: 2,
  },
  sgDot:   { width: 6, height: 6, borderRadius: 3 },
  sgTitle: { fontSize: 13, fontWeight: '700', flex: 1 },
  sgCount: { color: '#444', fontSize: 11, fontWeight: '600', marginRight: 4 },

  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0d0d0d', borderRadius: 10,
    paddingVertical: 13, paddingHorizontal: 14,
    marginBottom: 4, borderWidth: 1, borderColor: '#1a1a1a',
    gap: 10,
  },
  rowDot: {
    width: 32, height: 32, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1,
  },
  rowLabel: { color: '#ddd', fontSize: 14, fontWeight: '600', flex: 1 },
});
