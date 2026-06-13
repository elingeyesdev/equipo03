import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { staffApi, TrainerPlanData } from '../../../app/Providers/staff/api/staff.api';

// ─── Macro Row ────────────────────────────────────────────────────────────────
const MacroRow = ({ icon, label, value, unit, color }: {
  icon: string; label: string; value: number | undefined; unit: string; color: string;
}) => (
  <View style={s.macroRow}>
    <MaterialCommunityIcons name={icon as any} size={18} color={color} />
    <Text style={s.macroLabel}>{label}</Text>
    <Text style={[s.macroValue, { color }]}>
      {value != null ? `${value} ${unit}` : '—'}
    </Text>
  </View>
);

export const MiPlanScreen = () => {
  const navigation = useNavigation<any>();

  const { data: plan, isLoading, isError, refetch } = useQuery<TrainerPlanData | null>({
    queryKey: ['my-plan'],
    queryFn:  staffApi.getMyPlan,
    staleTime: 2 * 60_000,
    retry: 1,
  });

  const totalKcal = (() => {
    if (!plan) return 0;
    return (plan.proteinG ?? 0) * 4 + (plan.carbsG ?? 0) * 4 + (plan.fatG ?? 0) * 9;
  })();

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.topBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={s.topTitle}>Mi Plan Nutricional</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#f05b22" />
        </View>
      ) : isError ? (
        <View style={s.center}>
          <MaterialCommunityIcons name="wifi-off" size={40} color="#444" />
          <Text style={s.errTxt}>No se pudo cargar el plan.</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => refetch()}>
            <Text style={s.retryTxt}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : !plan ? (
        <View style={s.center}>
          <MaterialCommunityIcons name="food-apple-outline" size={52} color="#222" />
          <Text style={s.emptyTitle}>Sin plan asignado</Text>
          <Text style={s.emptyTxt}>Tu entrenador aún no ha creado un plan nutricional para ti.</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
        >
          {/* Calorías destacadas */}
          <View style={s.kcalCard}>
            <MaterialCommunityIcons name="fire" size={28} color="#f05b22" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.kcalLabel}>Objetivo calórico diario</Text>
              <Text style={s.kcalValue}>
                {plan.dailyKcal != null ? `${plan.dailyKcal} kcal` : '—'}
              </Text>
            </View>
            {totalKcal > 0 && (
              <View style={s.calcBadge}>
                <Text style={s.calcBadgeTxt}>{Math.round(totalKcal)} kcal macros</Text>
              </View>
            )}
          </View>

          {/* Macros */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Macronutrientes</Text>
            <MacroRow icon="food-steak"      label="Proteínas"     value={plan.proteinG} unit="g"   color="#f05b22" />
            <MacroRow icon="grain"           label="Carbohidratos" value={plan.carbsG}   unit="g"   color="#38BDF8" />
            <MacroRow icon="oil"             label="Grasas"        value={plan.fatG}     unit="g"   color="#facc15" />
          </View>

          {/* Notas */}
          {plan.planNotes ? (
            <View style={s.card}>
              <Text style={s.cardTitle}>Indicaciones del Entrenador</Text>
              <Text style={s.notesTxt}>{plan.planNotes}</Text>
            </View>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#000' },
  scroll: { padding: 20, paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 },

  topBar:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#111' },
  backBtn:  { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  topTitle: { flex: 1, color: '#fff', fontSize: 16, fontWeight: '700', textAlign: 'center' },

  kcalCard:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0e0e0e', borderRadius: 14, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: '#FF5E0044' },
  kcalLabel:   { color: '#888', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  kcalValue:   { color: '#fff', fontSize: 28, fontWeight: '900', marginTop: 2 },
  calcBadge:   { backgroundColor: '#1a1a1a', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 8, borderWidth: 1, borderColor: '#2a2a2a' },
  calcBadgeTxt:{ color: '#555', fontSize: 10 },

  card:      { backgroundColor: '#0e0e0e', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#1a1a1a' },
  cardTitle: { color: '#888', fontSize: 10, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 14 },

  macroRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#111' },
  macroLabel: { color: '#ccc', fontSize: 14, flex: 1 },
  macroValue: { fontSize: 16, fontWeight: '700' },

  notesTxt: { color: '#ccc', fontSize: 14, lineHeight: 22 },

  emptyTitle: { color: '#555', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  emptyTxt:   { color: '#333', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  errTxt:     { color: '#555', fontSize: 14 },
  retryBtn:   { backgroundColor: '#1C1C1E', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  retryTxt:   { color: '#f05b22', fontWeight: '700' },
});
