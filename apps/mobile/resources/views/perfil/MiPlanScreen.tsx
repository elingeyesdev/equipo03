import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { staffApi, TrainerPlanData } from '../../../app/Providers/staff/api/staff.api';

// ─── Constants ────────────────────────────────────────────────────────────────
const DAYS = ['LUNES','MARTES','MIERCOLES','JUEVES','VIERNES','SABADO','DOMINGO'] as const;
const DAY_SHORT: Record<string, string> = {
  LUNES: 'Lun', MARTES: 'Mar', MIERCOLES: 'Mié',
  JUEVES: 'Jue', VIERNES: 'Vie', SABADO: 'Sáb', DOMINGO: 'Dom',
};
const DAY_FULL: Record<string, string> = {
  LUNES: 'Lunes', MARTES: 'Martes', MIERCOLES: 'Miércoles',
  JUEVES: 'Jueves', VIERNES: 'Viernes', SABADO: 'Sábado', DOMINGO: 'Domingo',
};
const MEALS = ['desayuno','almuerzo','cena','merienda'] as const;
const MEAL_LABEL: Record<string, string> = {
  desayuno: 'Desayuno', almuerzo: 'Almuerzo', cena: 'Cena', merienda: 'Merienda',
};
const MEAL_ICON: Record<string, string> = {
  desayuno: 'weather-sunny', almuerzo: 'weather-partly-cloudy',
  cena: 'weather-night', merienda: 'cookie-outline',
};

const COL_W   = 110;
const LABEL_W = 90;

// ─── Macro Row ────────────────────────────────────────────────────────────────
const MacroRow = ({ icon, label, value, unit, color }: {
  icon: string; label: string; value?: number; unit: string; color: string;
}) => (
  <View style={s.macroRow}>
    <MaterialCommunityIcons name={icon as any} size={16} color={color} />
    <Text style={s.macroLabel}>{label}</Text>
    <Text style={[s.macroValue, { color }]}>
      {value != null ? `${value} ${unit}` : '—'}
    </Text>
  </View>
);

// ─── Preview Matrix (compact, horizontal scroll) ─────────────────────────────
const WeeklyMatrix = ({ mealPlan }: { mealPlan: Record<string, any> }) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
    <View>
      {/* Header row */}
      <View style={s.matrixRow}>
        <View style={[s.labelCell, s.headerCell]} />
        {DAYS.map(d => (
          <View key={d} style={[s.dataCell, s.headerCell, { width: COL_W }]}>
            <Text style={s.headerTxt}>{DAY_SHORT[d]}</Text>
          </View>
        ))}
      </View>

      {/* Meal rows */}
      {MEALS.map((meal, rowIdx) => (
        <View key={meal} style={[s.matrixRow, rowIdx % 2 === 1 && s.rowAlt]}>
          <View style={[s.labelCell, rowIdx % 2 === 1 && s.rowAlt]}>
            <MaterialCommunityIcons name={MEAL_ICON[meal] as any} size={12} color="#f05b22" />
            <Text style={s.mealLabelTxt}>{MEAL_LABEL[meal]}</Text>
          </View>
          {DAYS.map(day => {
            const text = mealPlan?.[day]?.[meal];
            return (
              <View key={day} style={[s.dataCell, { width: COL_W }, rowIdx % 2 === 1 && s.rowAlt]}>
                <Text style={text ? s.cellTxt : s.cellEmpty} numberOfLines={2}>
                  {text || '—'}
                </Text>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  </ScrollView>
);

// ─── Full Screen Weekly Planner Modal ─────────────────────────────────────────
const WeeklyPlanModal = ({ mealPlan, visible, onClose }: {
  mealPlan: Record<string, any>; visible: boolean; onClose: () => void;
}) => {
  const insets = useSafeAreaInsets();
  const daysWithMeals = DAYS.filter(d => MEALS.some(m => mealPlan?.[d]?.[m]));
  return (
    <Modal visible={visible} animationType="slide">
      <View style={[s.modalSafe, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>

        {/* Header */}
        <View style={s.modalHeader}>
          <MaterialCommunityIcons name="calendar-month-outline" size={16} color="#f05b22" />
          <Text style={s.modalTitle}>Planificador Semanal</Text>
          <TouchableOpacity style={s.modalCloseBtn} onPress={onClose} activeOpacity={0.7}>
            <MaterialCommunityIcons name="close" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          contentContainerStyle={s.modalScroll}
          showsVerticalScrollIndicator={false}
        >
          {daysWithMeals.length === 0 ? (
            <View style={s.noMeals}>
              <MaterialCommunityIcons name="calendar-blank-outline" size={32} color="#222" />
              <Text style={s.noMealsTxt}>Sin comidas planificadas aún.</Text>
            </View>
          ) : (
            daysWithMeals.map(day => (
              <View key={day} style={s.modalDayBlock}>
                <Text style={s.modalDayTitle}>{DAY_FULL[day]}</Text>
                {MEALS.map(meal => {
                  const txt = mealPlan?.[day]?.[meal];
                  if (!txt) return null;
                  return (
                    <View key={meal} style={s.modalMealItem}>
                      <View style={s.modalMealIcon}>
                        <MaterialCommunityIcons name={MEAL_ICON[meal] as any} size={15} color="#f05b22" />
                      </View>
                      <View style={s.modalMealContent}>
                        <Text style={s.modalMealLabel}>{MEAL_LABEL[meal]}</Text>
                        <Text style={s.modalMealTxt}>{txt}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────
export const MiPlanScreen = () => {
  const navigation = useNavigation<any>();
  const [showPlanModal, setShowPlanModal] = useState(false);

  const { data: plan, isLoading, isError, refetch } = useQuery<TrainerPlanData | null>({
    queryKey: ['my-plan'],
    queryFn:  staffApi.getMyPlan,
    staleTime: 2 * 60_000,
    retry: 1,
  });

  const totalKcal = plan
    ? (plan.proteinG ?? 0) * 4 + (plan.carbsG ?? 0) * 4 + (plan.fatG ?? 0) * 9
    : 0;

  const hasMeals = !!plan?.mealPlan &&
    DAYS.some(d => MEALS.some(m => (plan.mealPlan as any)?.[d]?.[m]));

  const hasMacros = plan &&
    (plan.dailyKcal != null || plan.proteinG != null || plan.carbsG != null || plan.fatG != null);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.topBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={s.topTitle}>Mi Plan Nutricional</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Modal full-screen del planificador */}
      {hasMeals && (
        <WeeklyPlanModal
          mealPlan={plan!.mealPlan as any}
          visible={showPlanModal}
          onClose={() => setShowPlanModal(false)}
        />
      )}

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
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

          {/* ── Objetivo Calórico ── */}
          {hasMacros && (
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
          )}

          {/* ── Macros ── */}
          {hasMacros && (
            <View style={s.card}>
              <Text style={s.cardTitle}>Macronutrientes</Text>
              <MacroRow icon="food-steak"   label="Proteínas"     value={plan.proteinG} unit="g" color="#f05b22" />
              <MacroRow icon="grain"        label="Carbohidratos" value={plan.carbsG}   unit="g" color="#38BDF8" />
              <MacroRow icon="oil"          label="Grasas"        value={plan.fatG}     unit="g" color="#facc15" />
            </View>
          )}

          {/* ── Tabla Semanal (preview tappable) ── */}
          {hasMeals ? (
            <TouchableOpacity
              style={[s.card, s.cardTappable]}
              activeOpacity={0.82}
              onPress={() => setShowPlanModal(true)}
            >
              <View style={s.cardHeaderRow}>
                <MaterialCommunityIcons name="calendar-month-outline" size={14} color="#f05b22" />
                <Text style={[s.cardTitle, { flex: 1, marginBottom: 0 }]}>Planificador Semanal</Text>
                <View style={s.expandBadge}>
                  <MaterialCommunityIcons name="arrow-expand" size={11} color="#f05b22" />
                  <Text style={s.expandBadgeTxt}>Ver todo</Text>
                </View>
              </View>
              <WeeklyMatrix mealPlan={plan.mealPlan as any} />
              <Text style={s.tapHint}>Toca para ver la semana completa</Text>
            </TouchableOpacity>
          ) : (
            <View style={s.card}>
              <Text style={s.cardTitle}>Planificador Semanal</Text>
              <View style={s.noMeals}>
                <MaterialCommunityIcons name="calendar-blank-outline" size={28} color="#222" />
                <Text style={s.noMealsTxt}>Tu entrenador aún no ha completado el horario de comidas.</Text>
              </View>
            </View>
          )}

          {/* ── Notas ── */}
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
  scroll: { padding: 16, paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 },

  topBar:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#111' },
  backBtn:  { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  topTitle: { flex: 1, color: '#fff', fontSize: 16, fontWeight: '700', textAlign: 'center' },

  kcalCard:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0e0e0e', borderRadius: 14, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: '#FF5E0044' },
  kcalLabel:    { color: '#888', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  kcalValue:    { color: '#fff', fontSize: 28, fontWeight: '900', marginTop: 2 },
  calcBadge:    { backgroundColor: '#1a1a1a', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 8, borderWidth: 1, borderColor: '#2a2a2a' },
  calcBadgeTxt: { color: '#555', fontSize: 10 },

  card:          { backgroundColor: '#0e0e0e', borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#1a1a1a' },
  cardTappable:  { borderColor: '#2a2a2a' },
  cardTitle:     { color: '#888', fontSize: 10, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },

  expandBadge:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#1a1a1a', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#2a2a2a' },
  expandBadgeTxt: { color: '#f05b22', fontSize: 9, fontWeight: '700' },
  tapHint:        { color: '#2e2e2e', fontSize: 10, textAlign: 'center', marginTop: 10 },

  macroRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#111' },
  macroLabel: { color: '#ccc', fontSize: 14, flex: 1 },
  macroValue: { fontSize: 15, fontWeight: '700' },

  // Matrix
  matrixRow:    { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  rowAlt:       { backgroundColor: '#0a0a0a' },
  headerCell:   { backgroundColor: '#141414', borderBottomWidth: 2, borderBottomColor: '#f05b22' },
  labelCell:    { width: LABEL_W, paddingVertical: 10, paddingHorizontal: 8, justifyContent: 'center', flexDirection: 'row', alignItems: 'center', gap: 4, borderRightWidth: 1, borderRightColor: '#1a1a1a' },
  dataCell:     { paddingVertical: 10, paddingHorizontal: 8, justifyContent: 'center', borderRightWidth: 1, borderRightColor: '#1a1a1a' },
  headerTxt:    { color: '#f05b22', fontSize: 12, fontWeight: '800', textAlign: 'center' },
  mealLabelTxt: { color: '#888', fontSize: 10, fontWeight: '600' },
  cellTxt:      { color: '#ddd', fontSize: 11, lineHeight: 16 },
  cellEmpty:    { color: '#2a2a2a', fontSize: 11, textAlign: 'center' },

  noMeals:    { alignItems: 'center', gap: 8, paddingVertical: 12 },
  noMealsTxt: { color: '#333', fontSize: 12, textAlign: 'center' },

  notesTxt: { color: '#ccc', fontSize: 14, lineHeight: 22 },

  emptyTitle: { color: '#555', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  emptyTxt:   { color: '#333', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  errTxt:     { color: '#555', fontSize: 14 },
  retryBtn:   { backgroundColor: '#1C1C1E', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  retryTxt:   { color: '#f05b22', fontWeight: '700' },

  // ── Modal ──────────────────────────────────────────────────────────────────
  modalSafe:     { flex: 1, backgroundColor: '#000' },
  modalHeader:   { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  modalTitle:    { flex: 1, color: '#fff', fontSize: 15, fontWeight: '700' },
  modalCloseBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' },
  modalScroll:   { padding: 16, paddingBottom: 48 },

  modalDayBlock:    { backgroundColor: '#0e0e0e', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#1a1a1a' },
  modalDayTitle:    { color: '#f05b22', fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  modalMealItem:    { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#111' },
  modalMealIcon:    { width: 28, height: 28, borderRadius: 8, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center', marginTop: 1, flexShrink: 0 },
  modalMealContent: { flex: 1 },
  modalMealLabel:   { color: '#555', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  modalMealTxt:     { color: '#ddd', fontSize: 13, lineHeight: 20 },
});
