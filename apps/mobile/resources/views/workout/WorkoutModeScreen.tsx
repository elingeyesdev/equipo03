import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SectionList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type Exercise = { name: string; rateKey: string };
type Section  = { category: string; icon: string; color: string; data: Exercise[] };

const CATALOG: Section[] = [
  {
    category: 'Pecho',   icon: 'arm-flex-outline',  color: '#e94560',
    data: [
      { name: 'Press de Banca',           rateKey: 'FUERZA' },
      { name: 'Press Inclinado',          rateKey: 'FUERZA' },
      { name: 'Aperturas con Mancuernas', rateKey: 'FUERZA' },
      { name: 'Fondos en Paralelas',      rateKey: 'FUERZA' },
    ],
  },
  {
    category: 'Pierna',  icon: 'run-fast',           color: '#9b5de5',
    data: [
      { name: 'Sentadilla',               rateKey: 'FUERZA' },
      { name: 'Prensa de Piernas',        rateKey: 'FUERZA' },
      { name: 'Extensión de Cuádriceps',  rateKey: 'FUERZA' },
      { name: 'Curl de Femoral',          rateKey: 'FUERZA' },
      { name: 'Peso Muerto Rumano',       rateKey: 'FUERZA' },
    ],
  },
  {
    category: 'Espalda', icon: 'rowing',             color: '#06d6a0',
    data: [
      { name: 'Dominadas',                rateKey: 'FUERZA' },
      { name: 'Remo con Barra',           rateKey: 'FUERZA' },
      { name: 'Jalón al Pecho',           rateKey: 'FUERZA' },
      { name: 'Peso Muerto Convencional', rateKey: 'FUERZA' },
    ],
  },
  {
    category: 'Hombro',  icon: 'weight-lifter',      color: '#0077b6',
    data: [
      { name: 'Press Militar',            rateKey: 'FUERZA' },
      { name: 'Elevaciones Laterales',    rateKey: 'FUERZA' },
      { name: 'Face Pull',                rateKey: 'FUERZA' },
    ],
  },
  {
    category: 'Brazo',   icon: 'arm-flex',           color: '#ffd166',
    data: [
      { name: 'Curl de Bíceps',           rateKey: 'FUERZA' },
      { name: 'Extensión de Tríceps',     rateKey: 'FUERZA' },
      { name: 'Curl Martillo',            rateKey: 'FUERZA' },
    ],
  },
  {
    category: 'Cardio',  icon: 'run',                color: '#f05b22',
    data: [
      { name: 'Cinta / Trotadora',        rateKey: 'CARDIO' },
      { name: 'Bicicleta Estática',       rateKey: 'CARDIO' },
      { name: 'Remo Ergómetro',           rateKey: 'CARDIO' },
      { name: 'Elíptica',                 rateKey: 'CARDIO' },
    ],
  },
  {
    category: 'HIIT',    icon: 'lightning-bolt',     color: '#ef476f',
    data: [
      { name: 'Burpees',                  rateKey: 'HIIT' },
      { name: 'Saltos al Cajón',          rateKey: 'HIIT' },
      { name: 'Kettlebell Swing',         rateKey: 'HIIT' },
      { name: 'Mountain Climbers',        rateKey: 'HIIT' },
    ],
  },
  {
    category: 'Core',    icon: 'yoga',               color: '#00b4d8',
    data: [
      { name: 'Plancha',                  rateKey: 'FLEXIBILIDAD' },
      { name: 'Crunches',                 rateKey: 'FLEXIBILIDAD' },
      { name: 'Rueda Abdominal',          rateKey: 'FUERZA' },
      { name: 'Russian Twist',            rateKey: 'FLEXIBILIDAD' },
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
              sessionId:    null,
              sport:        item.rateKey,
              exerciseName: item.name,
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
