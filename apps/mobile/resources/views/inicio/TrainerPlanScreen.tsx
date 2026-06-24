import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { staffApi, TrainerPlanData, MealPlan, MealDay } from '../../../app/Providers/staff/api/staff.api';

type RouteParams = { clientId: number; clientName: string };

// ─── Constants ────────────────────────────────────────────────────────────────
const DAYS = ['LUNES','MARTES','MIERCOLES','JUEVES','VIERNES','SABADO','DOMINGO'] as const;
type DayKey = typeof DAYS[number];

const DAY_LABEL: Record<DayKey, string> = {
  LUNES: 'Lunes', MARTES: 'Martes', MIERCOLES: 'Miércoles',
  JUEVES: 'Jueves', VIERNES: 'Viernes', SABADO: 'Sábado', DOMINGO: 'Domingo',
};

const MEALS = ['desayuno','almuerzo','cena','merienda'] as const;
type MealKey = typeof MEALS[number];

const MEAL_LABEL: Record<MealKey, string> = {
  desayuno: 'Desayuno', almuerzo: 'Almuerzo', cena: 'Cena', merienda: 'Merienda',
};

const MEAL_ICON: Record<MealKey, string> = {
  desayuno: 'weather-sunny', almuerzo: 'weather-partly-cloudy',
  cena: 'weather-night', merienda: 'cookie-outline',
};

const MAX_MEAL  = 150;
const MAX_NOTES = 300;

type MacroForm = { dailyKcal: string; proteinG: string; carbsG: string; fatG: string; planNotes: string };
type MealForm  = Record<DayKey, MealDay>;

const EMPTY_MACRO: MacroForm = { dailyKcal: '', proteinG: '', carbsG: '', fatG: '', planNotes: '' };
const emptyMeals = (): MealForm => Object.fromEntries(
  DAYS.map(d => [d, { desayuno: '', almuerzo: '', cena: '', merienda: '' }])
) as MealForm;

const planToMacro = (p: TrainerPlanData | null): MacroForm => {
  try {
    return {
      dailyKcal: p?.dailyKcal != null ? String(p.dailyKcal) : '',
      proteinG:  p?.proteinG  != null ? String(p.proteinG)  : '',
      carbsG:    p?.carbsG    != null ? String(p.carbsG)    : '',
      fatG:      p?.fatG      != null ? String(p.fatG)      : '',
      planNotes: p?.planNotes ?? '',
    };
  } catch {
    return EMPTY_MACRO;
  }
};

const planToMeals = (p: TrainerPlanData | null): MealForm => {
  const base = emptyMeals();
  if (!p?.mealPlan) return base;
  try {
    for (const d of DAYS) {
      const src = (p.mealPlan as any)[d];
      if (src && typeof src === 'object') {
        base[d] = {
          desayuno: src.desayuno ?? '',
          almuerzo: src.almuerzo ?? '',
          cena:     src.cena     ?? '',
          merienda: src.merienda ?? '',
        };
      }
    }
  } catch {
    return emptyMeals();
  }
  return base;
};

// ─── Field ────────────────────────────────────────────────────────────────────
const MacroField = ({ label, value, unit, onChangeText }: {
  label: string; value: string; unit?: string; onChangeText: (v: string) => void;
}) => (
  <View style={s.fieldWrap}>
    <Text style={s.fieldLabel}>{label}</Text>
    <View style={s.inputRow}>
      <TextInput
        style={s.input}
        value={value}
        onChangeText={onChangeText}
        placeholder="—"
        placeholderTextColor="#333"
        keyboardType="decimal-pad"
        returnKeyType="done"
      />
      {unit ? <Text style={s.unitTxt}>{unit}</Text> : null}
    </View>
  </View>
);

// ─── Day Card ─────────────────────────────────────────────────────────────────
const DayCard = ({ day, meals, onChange, expanded, onToggle }: {
  day: DayKey;
  meals: MealDay;
  onChange: (meal: MealKey, value: string) => void;
  expanded: boolean;
  onToggle: () => void;
}) => {
  const filled = MEALS.filter(m => (meals as any)[m]?.trim()).length;
  return (
    <View style={s.dayCard}>
      <TouchableOpacity style={s.dayHeader} onPress={onToggle} activeOpacity={0.8}>
        <View style={s.dayHeaderLeft}>
          <Text style={s.dayName}>{DAY_LABEL[day]}</Text>
          {filled > 0 && (
            <View style={s.filledBadge}>
              <Text style={s.filledBadgeTxt}>{filled}/4 comidas</Text>
            </View>
          )}
        </View>
        <MaterialCommunityIcons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20} color="#555"
        />
      </TouchableOpacity>

      {expanded && (
        <View style={s.dayBody}>
          {MEALS.map(meal => {
            const val = (meals as any)[meal] ?? '';
            return (
              <View key={meal} style={s.mealRow}>
                <MaterialCommunityIcons name={MEAL_ICON[meal] as any} size={14} color="#f05b22" style={{ marginTop: 2 }} />
                <View style={s.mealInputWrap}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={[s.mealLabel, { marginBottom: 0 }]}>{MEAL_LABEL[meal]}</Text>
                    {val.length > 0 && (
                      <Text style={[s.charCount, val.length >= Math.floor(MAX_MEAL * 0.85) && s.charCountWarn]}>
                        {val.length}/{MAX_MEAL}
                      </Text>
                    )}
                  </View>
                  <TextInput
                    style={s.mealInput}
                    value={val}
                    onChangeText={v => onChange(meal, v)}
                    placeholder="Ej: Avena con frutas y leche"
                    placeholderTextColor="#2a2a2a"
                    returnKeyType="next"
                    multiline={false}
                    maxLength={MAX_MEAL}
                  />
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────
export const TrainerPlanScreen = () => {
  const navigation  = useNavigation<any>();
  const route       = useRoute<RouteProp<Record<string, RouteParams>, string>>();
  const queryClient = useQueryClient();
  const { clientId, clientName } = route.params;

  const [macro,   setMacro]   = useState<MacroForm>(EMPTY_MACRO);
  const [meals,   setMeals]   = useState<MealForm>(emptyMeals());
  const [saving,  setSaving]  = useState(false);
  const [openDay, setOpenDay] = useState<DayKey | null>('LUNES');

  const { data: plan, isLoading } = useQuery<TrainerPlanData | null>({
    queryKey: ['trainer-plan', clientId],
    queryFn:  () => staffApi.getTrainerPlan(clientId),
    staleTime: 2 * 60_000,
    retry: 1,
  });

  useEffect(() => {
    if (plan !== undefined) {
      setMacro(planToMacro(plan));
      setMeals(planToMeals(plan));
    }
  }, [plan]);

  const setMacroField = (k: keyof MacroForm) => (v: string) =>
    setMacro(p => ({ ...p, [k]: v }));

  const setMealField = (day: DayKey, meal: MealKey, v: string) =>
    setMeals(p => ({ ...p, [day]: { ...p[day], [meal]: v } }));

  const totalKcal = (parseFloat(macro.proteinG) || 0) * 4
    + (parseFloat(macro.carbsG) || 0) * 4
    + (parseFloat(macro.fatG)   || 0) * 9;

  const handleSave = async () => {
    const hasMacro = macro.dailyKcal || macro.proteinG || macro.carbsG || macro.fatG || macro.planNotes.trim();
    const hasMeals = DAYS.some(d => MEALS.some(m => (meals[d] as any)[m]?.trim()));
    if (!hasMacro && !hasMeals) {
      Alert.alert('Plan vacío', 'Completa al menos un campo antes de guardar.');
      return;
    }
    setSaving(true);
    try {
      const dto: any = {};
      if (macro.dailyKcal)       dto.dailyKcal = parseInt(macro.dailyKcal, 10);
      if (macro.proteinG)        dto.proteinG  = parseFloat(macro.proteinG);
      if (macro.carbsG)          dto.carbsG    = parseFloat(macro.carbsG);
      if (macro.fatG)            dto.fatG      = parseFloat(macro.fatG);
      if (macro.planNotes.trim()) dto.planNotes = macro.planNotes.trim();

      if (hasMeals) {
        const mp: MealPlan = {};
        for (const d of DAYS) {
          const day = meals[d];
          const filled: MealDay = {};
          for (const m of MEALS) {
            const v = (day as any)[m]?.trim();
            if (v) (filled as any)[m] = v;
          }
          if (Object.keys(filled).length) (mp as any)[d] = filled;
        }
        dto.mealPlan = mp;
      }

      await staffApi.upsertTrainerPlan(clientId, dto);
      await queryClient.invalidateQueries({ queryKey: ['trainer-plan', clientId] });
      await queryClient.invalidateQueries({ queryKey: ['my-plan'] });
      Alert.alert('¡Listo!', 'Plan guardado correctamente.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'No se pudo guardar el plan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        {/* Header */}
        <View style={s.topBar}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="chevron-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={s.topTitle} numberOfLines={1}>Plan Nutricional</Text>
          <View style={{ width: 40 }} />
        </View>

        {isLoading ? (
          <View style={s.center}>
            <ActivityIndicator size="large" color="#f05b22" />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={s.clientName}>{clientName}</Text>

            {/* ── Macronutrientes ── */}
            <View style={s.card}>
              <Text style={s.cardTitle}>Macronutrientes</Text>
              <MacroField label="Proteína"     value={macro.proteinG}  unit="g"    onChangeText={setMacroField('proteinG')} />
              <MacroField label="Carbohidrat." value={macro.carbsG}    unit="g"    onChangeText={setMacroField('carbsG')} />
              <MacroField label="Grasas"       value={macro.fatG}      unit="g"    onChangeText={setMacroField('fatG')} />
              {totalKcal > 0 && (
                <View style={s.calcRow}>
                  <MaterialCommunityIcons name="fire" size={14} color="#f05b22" />
                  <Text style={s.calcTxt}>
                    Calorías calculadas: <Text style={s.calcNum}>{Math.round(totalKcal)} kcal</Text>
                  </Text>
                </View>
              )}
            </View>

            {/* ── Objetivo calórico ── */}
            <View style={s.card}>
              <Text style={s.cardTitle}>Objetivo Calórico</Text>
              <MacroField label="Calorías diarias" value={macro.dailyKcal} unit="kcal" onChangeText={setMacroField('dailyKcal')} />
            </View>

            {/* ── Notas ── */}
            <View style={s.card}>
              <Text style={s.cardTitle}>Indicaciones Generales</Text>
              <TextInput
                style={[s.input, s.textArea]}
                value={macro.planNotes}
                onChangeText={setMacroField('planNotes')}
                placeholder="Instrucciones, restricciones, timing de comidas..."
                placeholderTextColor="#333"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={MAX_NOTES}
              />
              <Text style={[s.charCount, macro.planNotes.length >= Math.floor(MAX_NOTES * 0.85) && s.charCountWarn, { textAlign: 'right', marginTop: 4 }]}>
                {macro.planNotes.length}/{MAX_NOTES}
              </Text>
            </View>

            {/* ── Planificador Semanal ── */}
            <View style={s.sectionHeader}>
              <MaterialCommunityIcons name="calendar-month-outline" size={16} color="#f05b22" />
              <Text style={s.sectionTitle}>Planificador Semanal</Text>
            </View>

            {DAYS.map(day => (
              <DayCard
                key={day}
                day={day}
                meals={meals[day]}
                expanded={openDay === day}
                onToggle={() => setOpenDay(openDay === day ? null : day)}
                onChange={(meal, v) => setMealField(day, meal, v)}
              />
            ))}

            {/* ── Guardar ── */}
            <TouchableOpacity
              style={[s.saveBtn, saving && { opacity: 0.6 }]}
              activeOpacity={0.8}
              onPress={handleSave}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator size="small" color="#fff" />
                : <>
                    <MaterialCommunityIcons name="content-save-outline" size={18} color="#fff" />
                    <Text style={s.saveTxt}>Guardar Plan</Text>
                  </>
              }
            </TouchableOpacity>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#000' },
  scroll: { padding: 16, paddingBottom: 120 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  topBar:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#111' },
  backBtn:  { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  topTitle: { flex: 1, color: '#fff', fontSize: 18, fontWeight: '800', textAlign: 'center' },

  clientName: { color: '#888', fontSize: 15, marginBottom: 16, textAlign: 'center' },

  card:      { backgroundColor: '#0e0e0e', borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#1a1a1a' },
  cardTitle: { color: '#888', fontSize: 12, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 14 },

  fieldWrap:  { marginBottom: 12 },
  fieldLabel: { color: '#555', fontSize: 13, marginBottom: 6 },
  inputRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input:      { flex: 1, backgroundColor: '#1a1a1a', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#2a2a2a' },
  textArea:   { height: 90, paddingTop: 10 },
  unitTxt:    { color: '#555', fontSize: 13, minWidth: 36 },

  calcRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#1a1a1a' },
  calcTxt: { color: '#555', fontSize: 13 },
  calcNum: { color: '#f05b22', fontWeight: '700' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, marginTop: 4 },
  sectionTitle:  { color: '#888', fontSize: 12, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },

  dayCard:       { backgroundColor: '#0e0e0e', borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: '#1a1a1a', overflow: 'hidden' },
  dayHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  dayHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dayName:       { color: '#fff', fontSize: 15, fontWeight: '700' },
  filledBadge:   { backgroundColor: '#1a3320', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: '#22c55e44' },
  filledBadgeTxt:{ color: '#22c55e', fontSize: 11, fontWeight: '600' },

  dayBody:      { borderTopWidth: 1, borderTopColor: '#1a1a1a', padding: 14, gap: 12 },
  mealRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  mealInputWrap:{ flex: 1 },
  mealLabel:    { color: '#555', fontSize: 13, fontWeight: '600', marginBottom: 4 },
  mealInput:    { backgroundColor: '#141414', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9, color: '#ddd', fontSize: 14, borderWidth: 1, borderColor: '#2a2a2a' },

  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#f05b22', borderRadius: 12, paddingVertical: 14, marginTop: 8 },
  saveTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },

  charCount:     { color: '#444', fontSize: 11 },
  charCountWarn: { color: '#f05b22' },
});
