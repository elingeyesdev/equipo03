import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SectionList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export type TrackingType =
  | 'PESO_REPS'
  | 'BODYWEIGHT_REPS'
  | 'TIME_BASED'
  | 'DISTANCE_TIME'
  | 'ASSISTED_WEIGHT';

type Exercise = { name: string; rateKey: string; trackingType: TrackingType };
type Section  = { category: string; icon: string; color: string; data: Exercise[] };

const CATALOG: Section[] = [
  {
    category: 'Pecho',   icon: 'arm-flex-outline',  color: '#e94560',
    data: [
      { name: 'Press de Banca',           rateKey: 'FUERZA', trackingType: 'PESO_REPS'       },
      { name: 'Press Inclinado',          rateKey: 'FUERZA', trackingType: 'PESO_REPS'       },
      { name: 'Aperturas con Mancuernas', rateKey: 'FUERZA', trackingType: 'PESO_REPS'       },
      { name: 'Fondos en Paralelas',      rateKey: 'FUERZA', trackingType: 'BODYWEIGHT_REPS' },
    ],
  },
  {
    category: 'Pierna',  icon: 'run-fast',           color: '#9b5de5',
    data: [
      { name: 'Sentadilla',               rateKey: 'FUERZA', trackingType: 'PESO_REPS' },
      { name: 'Prensa de Piernas',        rateKey: 'FUERZA', trackingType: 'PESO_REPS' },
      { name: 'Extensión de Cuádriceps',  rateKey: 'FUERZA', trackingType: 'PESO_REPS' },
      { name: 'Curl de Femoral',          rateKey: 'FUERZA', trackingType: 'PESO_REPS' },
      { name: 'Peso Muerto Rumano',       rateKey: 'FUERZA', trackingType: 'PESO_REPS' },
    ],
  },
  {
    category: 'Espalda', icon: 'rowing',             color: '#06d6a0',
    data: [
      { name: 'Dominadas',                rateKey: 'FUERZA', trackingType: 'BODYWEIGHT_REPS' },
      { name: 'Dominadas Asistidas',      rateKey: 'FUERZA', trackingType: 'ASSISTED_WEIGHT' },
      { name: 'Remo con Barra',           rateKey: 'FUERZA', trackingType: 'PESO_REPS'       },
      { name: 'Jalón al Pecho',           rateKey: 'FUERZA', trackingType: 'PESO_REPS'       },
      { name: 'Peso Muerto Convencional', rateKey: 'FUERZA', trackingType: 'PESO_REPS'       },
    ],
  },
  {
    category: 'Hombro',  icon: 'weight-lifter',      color: '#0077b6',
    data: [
      { name: 'Press Militar',            rateKey: 'FUERZA', trackingType: 'PESO_REPS' },
      { name: 'Elevaciones Laterales',    rateKey: 'FUERZA', trackingType: 'PESO_REPS' },
      { name: 'Face Pull',                rateKey: 'FUERZA', trackingType: 'PESO_REPS' },
    ],
  },
  {
    category: 'Brazo',   icon: 'arm-flex',           color: '#ffd166',
    data: [
      { name: 'Curl de Bíceps',           rateKey: 'FUERZA', trackingType: 'PESO_REPS' },
      { name: 'Extensión de Tríceps',     rateKey: 'FUERZA', trackingType: 'PESO_REPS' },
      { name: 'Curl Martillo',            rateKey: 'FUERZA', trackingType: 'PESO_REPS' },
    ],
  },
  {
    category: 'Cardio',  icon: 'run',                color: '#f05b22',
    data: [
      { name: 'Cinta / Trotadora',        rateKey: 'CARDIO', trackingType: 'DISTANCE_TIME' },
      { name: 'Bicicleta Estática',       rateKey: 'CARDIO', trackingType: 'DISTANCE_TIME' },
      { name: 'Remo Ergómetro',           rateKey: 'CARDIO', trackingType: 'DISTANCE_TIME' },
      { name: 'Elíptica',                 rateKey: 'CARDIO', trackingType: 'DISTANCE_TIME' },
    ],
  },
  {
    category: 'HIIT',    icon: 'lightning-bolt',     color: '#ef476f',
    data: [
      { name: 'Burpees',                  rateKey: 'HIIT', trackingType: 'BODYWEIGHT_REPS' },
      { name: 'Saltos al Cajón',          rateKey: 'HIIT', trackingType: 'BODYWEIGHT_REPS' },
      { name: 'Kettlebell Swing',         rateKey: 'HIIT', trackingType: 'PESO_REPS'       },
      { name: 'Mountain Climbers',        rateKey: 'HIIT', trackingType: 'TIME_BASED'      },
    ],
  },
  {
    category: 'Core',    icon: 'yoga',               color: '#00b4d8',
    data: [
      { name: 'Plancha',                  rateKey: 'FLEXIBILIDAD', trackingType: 'TIME_BASED'      },
      { name: 'Crunches',                 rateKey: 'FLEXIBILIDAD', trackingType: 'BODYWEIGHT_REPS' },
      { name: 'Rueda Abdominal',          rateKey: 'FUERZA',       trackingType: 'BODYWEIGHT_REPS' },
      { name: 'Russian Twist',            rateKey: 'FLEXIBILIDAD', trackingType: 'BODYWEIGHT_REPS' },
    ],
  },
  {
    category: 'Fondos',  icon: 'human-handsup',      color: '#48cae4',
    data: [
      { name: 'Fondos libres',            rateKey: 'FUERZA', trackingType: 'BODYWEIGHT_REPS' },
      { name: 'Fondos Asistidos',         rateKey: 'FUERZA', trackingType: 'ASSISTED_WEIGHT' },
    ],
  },
];

export const WorkoutModeScreen = () => {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#f05b22" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Iniciar Entrenamiento</Text>
      </View>

      <SectionList
        sections={CATALOG}
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
              exerciseName: item.name,
              trackingType: item.trackingType,
            })}
          >
            <Text style={s.rowLabel}>{item.name}</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#333" />
          </TouchableOpacity>
        )}
      />
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
