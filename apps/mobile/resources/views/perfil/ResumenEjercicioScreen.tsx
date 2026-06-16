import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

const fmt = (secs: number) => {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export const ResumenEjercicioScreen = () => {
  const navigation = useNavigation<any>();
  const route      = useRoute<any>();
  const {
    status       = 'COMPLETED',
    label        = 'Completada',
    color        = '#22c55e',
    exerciseName = '',
    routineName  = 'Rutina',
    elapsed      = 0,
    gymLabel     = 'Fuera de Sucursales',
    totalSets    = 0,
    doneSets     = 0,
  } = route.params ?? {};

  const icon: any = status === 'COMPLETED' ? 'trophy-outline' : 'flag-checkered';
  const pct = totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <View style={s.header}>
          <View style={[s.iconCircle, { borderColor: color }]}>
            <MaterialCommunityIcons name={icon} size={40} color={color} />
          </View>
          <Text style={[s.statusLabel, { color }]}>{label}</Text>
          {exerciseName ? <Text style={s.exerciseName}>{exerciseName}</Text> : null}
          <Text style={s.routineName}>{routineName}</Text>
        </View>

        <View style={s.statsGrid}>
          <View style={s.statCard}>
            <MaterialCommunityIcons name="timer-outline" size={20} color="#f05b22" />
            <Text style={s.statVal}>{fmt(elapsed)}</Text>
            <Text style={s.statLbl}>Tiempo</Text>
          </View>
          <View style={s.statCard}>
            <MaterialCommunityIcons name="dumbbell" size={20} color="#818cf8" />
            <Text style={s.statVal}>{doneSets}/{totalSets}</Text>
            <Text style={s.statLbl}>Series</Text>
          </View>
          <View style={s.statCard}>
            <MaterialCommunityIcons name="percent" size={20} color={color} />
            <Text style={[s.statVal, { color }]}>{pct}%</Text>
            <Text style={s.statLbl}>Completado</Text>
          </View>
        </View>

        <View style={s.locationRow}>
          <MaterialCommunityIcons
            name={gymLabel === 'Fuera de Sucursales' ? 'map-marker-off' : 'map-marker-check'}
            size={16}
            color="#555"
          />
          <Text style={s.locationTxt}>{gymLabel}</Text>
        </View>

        {status === 'PARTIAL' && (
          <View style={s.warningBox}>
            <MaterialCommunityIcons name="information-outline" size={16} color="#facc15" />
            <Text style={s.warningTxt}>
              Tu entrenador puede ver el progreso de esta sesión.
            </Text>
          </View>
        )}

      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity style={s.homeBtn} activeOpacity={0.85} onPress={() => navigation.popToTop()}>
          <Text style={s.homeBtnTxt}>Volver al Inicio</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#000' },
  scroll: { paddingHorizontal: 24, paddingBottom: 24 },

  header: { alignItems: 'center', paddingTop: 48, paddingBottom: 32, gap: 12 },
  iconCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#0e0e0e', borderWidth: 2,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  statusLabel:  { fontSize: 28, fontWeight: '900' },
  exerciseName: { color: '#fff', fontSize: 18, fontWeight: '700', textAlign: 'center' },
  routineName:  { color: '#555', fontSize: 13, fontWeight: '500', textAlign: 'center' },

  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1, backgroundColor: '#0e0e0e', borderRadius: 16,
    borderWidth: 1, borderColor: '#1a1a1a',
    paddingVertical: 20, alignItems: 'center', gap: 6,
  },
  statVal: { color: '#fff', fontSize: 22, fontWeight: '900' },
  statLbl: { color: '#444', fontSize: 11 },

  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16, justifyContent: 'center' },
  locationTxt: { color: '#555', fontSize: 13 },

  warningBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#1a160a', borderRadius: 12,
    borderWidth: 1, borderColor: '#facc1540',
    padding: 14, marginBottom: 16,
  },
  warningTxt: { color: '#facc15', fontSize: 13, flex: 1, lineHeight: 20 },

  footer:  { paddingHorizontal: 24, paddingBottom: 32, paddingTop: 12 },
  homeBtn: {
    backgroundColor: '#f05b22', borderRadius: 18, height: 60,
    justifyContent: 'center', alignItems: 'center',
  },
  homeBtnTxt: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
