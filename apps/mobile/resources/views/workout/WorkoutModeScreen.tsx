import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SectionList, ActivityIndicator } from 'react-native';
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

type Exercise = { id: number; name: string; rateKey: string; trackingType: TrackingType };
type Section  = { category: string; icon: string; color: string; data: Exercise[] };

const CategoryMeta: Record<string, { icon: string; color: string; defaultRateKey: string; defaultTracking: TrackingType }> = {
  'Pecho':   { icon: 'arm-flex-outline',  color: '#e94560', defaultRateKey: 'FUERZA',       defaultTracking: 'PESO_REPS' },
  'Pierna':  { icon: 'run-fast',          color: '#9b5de5', defaultRateKey: 'FUERZA',       defaultTracking: 'PESO_REPS' },
  'Espalda': { icon: 'rowing',            color: '#06d6a0', defaultRateKey: 'FUERZA',       defaultTracking: 'PESO_REPS' },
  'Hombro':  { icon: 'weight-lifter',     color: '#0077b6', defaultRateKey: 'FUERZA',       defaultTracking: 'PESO_REPS' },
  'Brazo':   { icon: 'arm-flex',          color: '#ffd166', defaultRateKey: 'FUERZA',       defaultTracking: 'PESO_REPS' },
  'Cardio':  { icon: 'run',               color: '#f05b22', defaultRateKey: 'CARDIO',       defaultTracking: 'DISTANCE_TIME' },
  'HIIT':    { icon: 'lightning-bolt',    color: '#ef476f', defaultRateKey: 'HIIT',         defaultTracking: 'BODYWEIGHT_REPS' },
  'Core':    { icon: 'yoga',              color: '#00b4d8', defaultRateKey: 'FLEXIBILIDAD', defaultTracking: 'BODYWEIGHT_REPS' },
  'Fondos':  { icon: 'human-handsup',     color: '#48cae4', defaultRateKey: 'FUERZA',       defaultTracking: 'BODYWEIGHT_REPS' },
};

export const WorkoutModeScreen = () => {
  const navigation = useNavigation<any>();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const exercises = await trainingApi.getExercises();
        
        const groups: Record<string, Exercise[]> = {};
        
        exercises.forEach((ex: any) => {
          const groupName = ex.muscleGroup || 'Otro';
          if (!groups[groupName]) groups[groupName] = [];
          
          const meta = CategoryMeta[groupName] || { defaultRateKey: 'FUERZA', defaultTracking: 'PESO_REPS' };
          
          groups[groupName].push({
            id: ex.id,
            name: ex.name,
            rateKey: meta.defaultRateKey,
            trackingType: meta.defaultTracking,
          });
        });

        const parsedSections: Section[] = Object.keys(groups).map((category) => {
          const meta = CategoryMeta[category] || { icon: 'dumbbell', color: '#888' };
          return {
            category,
            icon: meta.icon,
            color: meta.color,
            data: groups[category],
          };
        });

        setSections(parsedSections);
      } catch (error) {
        console.error('Error fetching catalog:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Iniciar Entrenamiento</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.name}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          renderSectionHeader={({ section }) => (
            <View style={s.sectionHead}>
              <MaterialCommunityIcons name={section.icon as any} size={16} color={section.color} />
              <Text style={[s.sectionTitle, { color: section.color }]}>{section.category}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={s.row}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('WorkoutActive', {
                sport:        item.rateKey,
                exercise:     { id: item.id, name: item.name },
                trackingType: item.trackingType,
              })}
            >
              <Text style={s.rowLabel}>{item.name}</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#333" />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#0a0a0a' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, gap: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#161618',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#222',
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },

  list: { paddingHorizontal: 20, paddingBottom: 40 },

  sectionHead: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 28, marginBottom: 10,
  },
  sectionTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 1 },

  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#111', borderRadius: 14,
    paddingVertical: 16, paddingHorizontal: 18,
    marginBottom: 8, borderWidth: 1, borderColor: '#1c1c1e',
  },
  rowLabel: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
