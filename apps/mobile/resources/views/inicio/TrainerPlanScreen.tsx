import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { staffApi, TrainerPlanData } from '../../../app/Providers/staff/api/staff.api';

type RouteParams = { clientId: number; clientName: string };

type PlanForm = {
  dailyKcal: string;
  proteinG:  string;
  carbsG:    string;
  fatG:      string;
  planNotes: string;
};

const EMPTY_FORM: PlanForm = {
  dailyKcal: '', proteinG: '', carbsG: '', fatG: '', planNotes: '',
};

const planToForm = (plan: TrainerPlanData | null): PlanForm => ({
  dailyKcal: plan?.dailyKcal != null ? String(plan.dailyKcal) : '',
  proteinG:  plan?.proteinG  != null ? String(plan.proteinG)  : '',
  carbsG:    plan?.carbsG    != null ? String(plan.carbsG)    : '',
  fatG:      plan?.fatG      != null ? String(plan.fatG)      : '',
  planNotes: plan?.planNotes ?? '',
});

// ─── Field 
const Field = ({ label, value, unit, onChangeText, numeric }: {
  label: string; value: string; unit?: string; onChangeText: (v: string) => void; numeric?: boolean;
}) => (
  <View style={s.fieldWrap}>
    <Text style={s.fieldLabel}>{label}</Text>
    <View style={s.inputRow}>
      <TextInput
        style={s.input}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor="#333"
        placeholder="—"
        keyboardType={numeric ? 'decimal-pad' : 'default'}
        returnKeyType="done"
      />
      {unit ? <Text style={s.unitTxt}>{unit}</Text> : null}
    </View>
  </View>
);

export const TrainerPlanScreen = () => {
  const navigation   = useNavigation<any>();
  const route        = useRoute<RouteProp<Record<string, RouteParams>, string>>();
  const queryClient  = useQueryClient();
  const { clientId, clientName } = route.params;

  const [form, setForm]     = useState<PlanForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const { data: plan, isLoading } = useQuery<TrainerPlanData | null>({
    queryKey: ['trainer-plan', clientId],
    queryFn:  () => staffApi.getTrainerPlan(clientId),
    staleTime: 2 * 60_000,
    retry: 1,
  });

  useEffect(() => {
    if (plan !== undefined) setForm(planToForm(plan));
  }, [plan]);

  const setField = (key: keyof PlanForm) => (v: string) =>
    setForm((prev) => ({ ...prev, [key]: v }));

  const totalKcal = (() => {
    const p = parseFloat(form.proteinG)  || 0;
    const c = parseFloat(form.carbsG)    || 0;
    const f = parseFloat(form.fatG)      || 0;
    return p * 4 + c * 4 + f * 9;
  })();

  const handleSave = async () => {
    const hasValue = form.proteinG || form.carbsG || form.fatG || form.dailyKcal || form.planNotes.trim();
    if (!hasValue) {
      Alert.alert('Plan vacío', 'Completa al menos un campo antes de guardar el plan.');
      return;
    }
    setSaving(true);
    try {
      const dto: Parameters<typeof staffApi.upsertTrainerPlan>[1] = {};
      if (form.dailyKcal) dto.dailyKcal = parseInt(form.dailyKcal, 10);
      if (form.proteinG)  dto.proteinG  = parseFloat(form.proteinG);
      if (form.carbsG)    dto.carbsG    = parseFloat(form.carbsG);
      if (form.fatG)      dto.fatG      = parseFloat(form.fatG);
      if (form.planNotes.trim()) dto.planNotes = form.planNotes.trim();

      await staffApi.upsertTrainerPlan(clientId, dto);
      await queryClient.invalidateQueries({ queryKey: ['trainer-plan', clientId] });
      Alert.alert('¡Listo!', 'Plan guardado correctamente.');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'No se pudo guardar el plan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
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

            {/* Macros */}
            <View style={s.card}>
              <Text style={s.cardTitle}>Macronutrientes</Text>
              <Field label="Proteína"    value={form.proteinG}  unit="g"  onChangeText={setField('proteinG')}  numeric />
              <Field label="Carbohidrat." value={form.carbsG}    unit="g"  onChangeText={setField('carbsG')}    numeric />
              <Field label="Grasas"       value={form.fatG}      unit="g"  onChangeText={setField('fatG')}      numeric />

              {totalKcal > 0 && (
                <View style={s.calcRow}>
                  <MaterialCommunityIcons name="fire" size={14} color="#f05b22" />
                  <Text style={s.calcTxt}>
                    Calorías calculadas: <Text style={s.calcNum}>{Math.round(totalKcal)} kcal</Text>
                  </Text>
                </View>
              )}
            </View>

            {/* Kcal objetivo */}
            <View style={s.card}>
              <Text style={s.cardTitle}>Objetivo Calórico</Text>
              <Field label="Calorías diarias" value={form.dailyKcal} unit="kcal" onChangeText={setField('dailyKcal')} numeric />
            </View>

            {/* Notas */}
            <View style={s.card}>
              <Text style={s.cardTitle}>Indicaciones del Plan</Text>
              <TextInput
                style={[s.input, s.textArea]}
                value={form.planNotes}
                onChangeText={setField('planNotes')}
                placeholder="Instrucciones, restricciones, timing de comidas..."
                placeholderTextColor="#333"
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
            </View>

            {/* Guardar */}
            <TouchableOpacity
              style={[s.saveBtn, saving && { opacity: 0.6 }]}
              activeOpacity={0.8}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="content-save-outline" size={18} color="#fff" />
                  <Text style={s.saveTxt}>Guardar Plan</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#000' },
  scroll: { padding: 20, paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  topBar:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#111' },
  backBtn:  { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  topTitle: { flex: 1, color: '#fff', fontSize: 16, fontWeight: '700', textAlign: 'center' },

  clientName: { color: '#888', fontSize: 13, marginBottom: 20, textAlign: 'center' },

  card:      { backgroundColor: '#0e0e0e', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#1a1a1a' },
  cardTitle: { color: '#888', fontSize: 10, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 14 },

  fieldWrap:  { marginBottom: 12 },
  fieldLabel: { color: '#555', fontSize: 12, marginBottom: 6 },
  inputRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input:      { flex: 1, backgroundColor: '#1a1a1a', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#2a2a2a' },
  textArea:   { height: 110, paddingTop: 10 },
  unitTxt:    { color: '#555', fontSize: 13, minWidth: 32 },

  calcRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#1a1a1a' },
  calcTxt: { color: '#555', fontSize: 12 },
  calcNum: { color: '#f05b22', fontWeight: '700' },

  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#f05b22', borderRadius: 12, paddingVertical: 14, marginTop: 8 },
  saveTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
