import React, { useState, useMemo } from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { staffApi, TrainerPlanData } from '../../../app/Providers/staff/api/staff.api';
import { MacroBar } from '../../components/MacroBar';
import { DumbbellSpinner } from '../../../app/Shared/components/ui/DumbbellSpinner';

// ─── Constants ────────────────────────────────────────────────────────────────
const DAYS = ['LUNES','MARTES','MIERCOLES','JUEVES','VIERNES','SABADO','DOMINGO'] as const;
type DayKey = typeof DAYS[number];

const DAY_LABEL: Record<DayKey, string> = {
  LUNES: 'Lunes', MARTES: 'Martes', MIERCOLES: 'Miércoles',
  JUEVES: 'Jueves', VIERNES: 'Viernes', SABADO: 'Sábado', DOMINGO: 'Domingo',
};
const DAY_SHORT: Record<DayKey, string> = {
  LUNES: 'LUN', MARTES: 'MAR', MIERCOLES: 'MIÉ',
  JUEVES: 'JUE', VIERNES: 'VIE', SABADO: 'SÁB', DOMINGO: 'DOM',
};

const MEALS = ['desayuno','almuerzo','merienda','cena'] as const;
type MealKey = typeof MEALS[number];

const MEAL_META: Record<MealKey, { label: string; icon: string; color: string }> = {
  desayuno:  { label: 'Desayuno',  icon: 'weather-sunny',   color: '#FACC15' },
  almuerzo:  { label: 'Almuerzo',  icon: 'silverware-fork-knife', color: '#00E5A3' },
  merienda:  { label: 'Merienda',  icon: 'cookie-outline',  color: '#FF5E00' },
  cena:      { label: 'Cena',      icon: 'weather-night',   color: '#818cf8' },
};

const getTodayKey = (): DayKey => {
  const idx = new Date().getDay();
  return DAYS[idx === 0 ? 6 : idx - 1];
};

// ─── Day Strip ────────────────────────────────────────────────────────────────
const DayStrip = ({ selected, onSelect, mealPlan }: {
  selected: DayKey;
  onSelect: (d: DayKey) => void;
  mealPlan: Record<string, any> | null;
}) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.stripRow}>
    {DAYS.map(d => {
      const active = d === selected;
      const hasMeals = mealPlan && MEALS.some(m => mealPlan[d]?.[m]);
      return (
        <TouchableOpacity
          key={d}
          style={[s.stripPill, active && s.stripPillActive]}
          onPress={() => onSelect(d)}
          activeOpacity={0.8}
        >
          <Text style={[s.stripTxt, active && s.stripTxtActive]}>{DAY_SHORT[d]}</Text>
          {hasMeals && <View style={[s.stripDot, active && s.stripDotActive]} />}
        </TouchableOpacity>
      );
    })}
  </ScrollView>
);

// ─── Meal Card ────────────────────────────────────────────────────────────────
const MealCard = ({ meal, content }: { meal: MealKey; content: string }) => {
  const meta = MEAL_META[meal];
  return (
    <View style={s.mealCard}>
      <View style={s.mealHeader}>
        <View style={[s.mealIconBox, { backgroundColor: `${meta.color}18` }]}>
          <MaterialCommunityIcons name={meta.icon as any} size={18} color={meta.color} />
        </View>
        <Text style={s.mealTitle}>{meta.label}</Text>
      </View>
      <Text style={s.mealContent}>{content}</Text>
    </View>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────
export const MiPlanScreen = () => {
  const navigation = useNavigation<any>();
  const [selectedDay, setSelectedDay] = useState<DayKey>(getTodayKey);

  const { data: plan, isLoading, isError, refetch } = useQuery<TrainerPlanData | null>({
    queryKey: ['my-plan'],
    queryFn: staffApi.getMyPlan,
    staleTime: 2 * 60_000,
    retry: 1,
  });

  const hasMacros = plan &&
    (plan.dailyKcal != null || plan.proteinG != null || plan.carbsG != null || plan.fatG != null);

  const maxMacro = useMemo(() => {
    if (!plan) return 1;
    return Math.max(plan.proteinG ?? 0, plan.carbsG ?? 0, plan.fatG ?? 0, 1);
  }, [plan]);

  const mealPlan = plan?.mealPlan as Record<string, any> | null;
  const dayMeals = useMemo(() => {
    if (!mealPlan) return [];
    return MEALS.filter(m => mealPlan[selectedDay]?.[m]).map(m => ({
      meal: m,
      content: mealPlan[selectedDay][m] as string,
    }));
  }, [mealPlan, selectedDay]);

  const hasMeals = !!mealPlan && DAYS.some(d => MEALS.some(m => mealPlan[d]?.[m]));

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Top bar */}
      <View style={s.topBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={s.topTitle}>Mi Plan Nutricional</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={s.center}>
          <DumbbellSpinner size="large" color="#FF5E00" />
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
          <Text style={s.emptySubTxt}>Tu entrenador aún no ha creado un plan nutricional para ti.</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

          {/* ── Fase 1: Dashboard Calórico ── */}
          {hasMacros && (
            <View style={s.kcalCard}>
              <Text style={s.kcalTitle}>Objetivo Diario</Text>
              <Text style={s.kcalNumber}>
                {plan.dailyKcal != null
                  ? `${plan.dailyKcal.toLocaleString()}`
                  : '—'}
              </Text>
              <Text style={s.kcalUnit}>kcal</Text>

              <View style={s.macroGrid}>
                <View style={s.macroCol}>
                  <MacroBar
                    label="Proteína"
                    value={plan.proteinG != null ? `${plan.proteinG}g` : '—'}
                    color="#FF5E00"
                    progress={(plan.proteinG ?? 0) / maxMacro}
                  />
                </View>
                <View style={s.macroCol}>
                  <MacroBar
                    label="Carbos"
                    value={plan.carbsG != null ? `${plan.carbsG}g` : '—'}
                    color="#00E5A3"
                    progress={(plan.carbsG ?? 0) / maxMacro}
                  />
                </View>
                <View style={s.macroCol}>
                  <MacroBar
                    label="Grasas"
                    value={plan.fatG != null ? `${plan.fatG}g` : '—'}
                    color="#FACC15"
                    progress={(plan.fatG ?? 0) / maxMacro}
                  />
                </View>
              </View>
            </View>
          )}

          {/* ── Fase 2: Indicaciones del Coach ── */}
          {plan.planNotes ? (
            <View style={s.coachCard}>
              <View style={s.coachHeader}>
                <MaterialCommunityIcons name="lightbulb-on-outline" size={18} color="#FF5E00" />
                <Text style={s.coachLabel}>Coach dice:</Text>
              </View>
              <Text style={s.coachText}>{plan.planNotes}</Text>
            </View>
          ) : null}

          {/* ── Fase 3: Comidas por día ── */}
          {hasMeals && (
            <>
              <DayStrip selected={selectedDay} onSelect={setSelectedDay} mealPlan={mealPlan} />

              <View style={s.dayHeaderRow}>
                <Text style={s.dayHeaderTitle}>{DAY_LABEL[selectedDay]}</Text>
                <Text style={s.dayHeaderSub}>
                  {dayMeals.length > 0
                    ? `${dayMeals.length} comida${dayMeals.length > 1 ? 's' : ''}`
                    : 'Sin comidas'}
                </Text>
              </View>

              {dayMeals.length === 0 ? (
                <View style={s.noMealsDay}>
                  <MaterialCommunityIcons name="food-off-outline" size={36} color="#222" />
                  <Text style={s.noMealsDayTxt}>Sin comidas programadas para este día.</Text>
                </View>
              ) : (
                dayMeals.map(({ meal, content }) => (
                  <MealCard key={meal} meal={meal} content={content} />
                ))
              )}
            </>
          )}

          {!hasMeals && !hasMacros && !plan.planNotes && (
            <View style={s.noMealsDay}>
              <MaterialCommunityIcons name="calendar-blank-outline" size={36} color="#222" />
              <Text style={s.noMealsDayTxt}>Tu entrenador aún no ha completado tu plan.</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#000' },
  scroll: { padding: 16, paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 },

  topBar:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#111' },
  backBtn:  { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  topTitle: { flex: 1, color: '#fff', fontSize: 16, fontWeight: '700', textAlign: 'center' },

  // ── Dashboard calórico ──
  kcalCard: {
    backgroundColor: '#242424',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  kcalTitle: {
    color: '#888',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  kcalNumber: {
    color: '#FF5E00',
    fontSize: 48,
    fontWeight: '900',
    lineHeight: 52,
  },
  kcalUnit: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 20,
  },
  macroGrid: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  macroCol: { flex: 1 },

  // ── Coach card ──
  coachCard: {
    backgroundColor: '#242424',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF5E00',
  },
  coachHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  coachLabel: {
    color: '#FF5E00',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  coachText: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 22,
  },

  // ── Day Strip ──
  stripRow: { paddingVertical: 12, gap: 8 },
  stripPill: {
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#1a1a1a',
    gap: 4,
    minWidth: 48,
  },
  stripPillActive: { backgroundColor: '#FF5E00' },
  stripTxt: { color: '#555', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  stripTxtActive: { color: '#fff' },
  stripDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#333' },
  stripDotActive: { backgroundColor: 'rgba(255,255,255,0.5)' },

  // ── Day header ──
  dayHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
    marginTop: 4,
  },
  dayHeaderTitle: { color: '#fff', fontSize: 18, fontWeight: '900' },
  dayHeaderSub: { color: '#555', fontSize: 12 },

  // ── Meal cards ──
  mealCard: {
    backgroundColor: '#242424',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  mealIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  mealContent: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 22,
  },

  // ── No meals ──
  noMealsDay: { alignItems: 'center', gap: 10, paddingVertical: 40 },
  noMealsDayTxt: { color: '#333', fontSize: 13, textAlign: 'center' },

  // ── Empty/error ──
  emptyTitle: { color: '#555', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  emptySubTxt: { color: '#333', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  errTxt: { color: '#555', fontSize: 14 },
  retryBtn: { backgroundColor: '#1C1C1E', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  retryTxt: { color: '#FF5E00', fontWeight: '700' },
});
