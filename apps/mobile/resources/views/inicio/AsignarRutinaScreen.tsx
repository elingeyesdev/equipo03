import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, Alert, ActivityIndicator, TextInput,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { NumericInput } from '../../../app/Shared/components/ui/NumericInput';
import { useAuth } from '../../../app/Shared/hooks/useAuth';
import {
  staffApi,
  Exercise,
  SelectedExercise,
} from '../../../app/Providers/staff/api/staff.api';

type ExerciseConfig = { sets: string; reps: string; weight: string };

export const AsignarRutinaScreen = () => {
  const route      = useRoute<any>();
  const navigation = useNavigation();
  const { user }   = useAuth();
  const { studentId, studentName } = route.params as {
    studentId:   number;
    studentName?: string;
  };

  const [selected,    setSelected]    = useState<Record<number, SelectedExercise>>({});
  const [configModal, setConfigModal] = useState<Exercise | null>(null);
  const [cfg,         setCfg]         = useState<ExerciseConfig>({ sets: '3', reps: '10', weight: '' });

  const { data: exercises = [], isLoading, isError, refetch } = useQuery({
    queryKey:  ['exercises-catalog'],
    queryFn:   staffApi.getExercises,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const trainerId = String((user as any)?.userId ?? (user as any)?.id ?? '');
      return staffApi.createRoutine({
        trainerId,
        assignedUserId: studentId,
        exercises:      Object.values(selected),
      });
    },
    onSuccess: () => {
      Alert.alert('Rutina guardada', `Asignada a ${studentName ?? 'alumno'}`);
      navigation.goBack();
    },
    onError: (e: any) => {
      Alert.alert('Error', e?.message ?? 'No se pudo guardar la rutina');
    },
  });

  const openConfig = (ex: Exercise) => {
    const existing = selected[ex.id];
    setCfg({
      sets:   String(existing?.sets   ?? 3),
      reps:   String(existing?.reps   ?? 10),
      weight: String(existing?.weightRecommendedKg ?? ''),
    });
    setConfigModal(ex);
  };

  const confirmAdd = () => {
    if (!configModal) return;
    const sets = parseInt(cfg.sets)  || 3;
    const reps = parseInt(cfg.reps)  || 10;
    const wkg  = parseFloat(cfg.weight) || 0;
    setSelected(prev => ({
      ...prev,
      [configModal.id]: {
        exerciseId:          configModal.id,
        sets,
        reps,
        weightRecommendedKg: wkg,
      },
    }));
    setConfigModal(null);
  };

  const removeExercise = (id: number) =>
    setSelected(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

  const selectedCount = Object.keys(selected).length;

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>

      {/* Sub-header */}
      <View style={s.subHeader}>
        <MaterialCommunityIcons name="account-outline" size={16} color="#f05b22" />
        <Text style={s.subHeaderTxt} numberOfLines={1}>
          {studentName ?? `Alumno #${studentId}`}
        </Text>
        {selectedCount > 0 && (
          <View style={s.badge}>
            <Text style={s.badgeTxt}>{selectedCount} seleccionado(s)</Text>
          </View>
        )}
      </View>

      {isLoading && (
        <View style={s.center}>
          <ActivityIndicator color="#f05b22" size="large" />
          <Text style={s.soft}>Cargando ejercicios…</Text>
        </View>
      )}

      {isError && !isLoading && (
        <View style={s.center}>
          <MaterialCommunityIcons name="wifi-off" size={40} color="#333" />
          <Text style={s.soft}>No se pudo cargar el catálogo.</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => refetch()}>
            <Text style={s.retryTxt}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isLoading && !isError && (
        <FlatList
          data={exercises}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.center}>
              <Text style={s.soft}>Sin ejercicios disponibles.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isAdded = !!selected[item.id];
            const conf    = selected[item.id];
            return (
              <TouchableOpacity
                style={[s.card, isAdded && s.cardAdded]}
                onPress={() => openConfig(item)}
                activeOpacity={0.85}
              >
                <View style={s.cardLeft}>
                  <View style={[s.iconWrap, isAdded && { backgroundColor: 'rgba(34,197,94,0.15)', borderColor: 'rgba(34,197,94,0.4)' }]}>
                    <MaterialCommunityIcons
                      name={isAdded ? 'check' : 'dumbbell'}
                      size={20}
                      color={isAdded ? '#22C55E' : '#f05b22'}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.exName}>{item.name}</Text>
                    {!!item.muscleGroup && (
                      <Text style={s.exMuscle}>{item.muscleGroup}</Text>
                    )}
                    {isAdded && (
                      <Text style={s.exConf}>
                        {conf.sets} series · {conf.reps} reps
                        {conf.weightRecommendedKg ? ` · ${conf.weightRecommendedKg} kg` : ''}
                      </Text>
                    )}
                  </View>
                </View>
                {isAdded ? (
                  <TouchableOpacity
                    style={s.removeBtn}
                    onPress={() => removeExercise(item.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MaterialCommunityIcons name="close-circle" size={20} color="#EF4444" />
                  </TouchableOpacity>
                ) : (
                  <MaterialCommunityIcons name="plus-circle-outline" size={20} color="#f05b22" />
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Footer */}
      <View style={s.footer}>
        <TouchableOpacity
          style={[s.saveBtn, (saveMutation.isPending || selectedCount === 0) && s.saveBtnOff]}
          onPress={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || selectedCount === 0}
          activeOpacity={0.85}
        >
          {saveMutation.isPending
            ? <ActivityIndicator color="#fff" size="small" />
            : <>
                <MaterialCommunityIcons name="content-save-check-outline" size={18} color="#fff" />
                <Text style={s.saveBtnTxt}>Guardar Rutina ({selectedCount})</Text>
              </>
          }
        </TouchableOpacity>
      </View>

      {/* Modal configuración */}
      <Modal
        visible={!!configModal}
        transparent
        animationType="slide"
        onRequestClose={() => setConfigModal(null)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <TouchableOpacity style={s.modalBg} activeOpacity={1} onPress={() => setConfigModal(null)}>
            <TouchableOpacity style={s.modalSheet} activeOpacity={1}>
              <View style={s.modalHandle} />
              <Text style={s.modalTitle} numberOfLines={2}>{configModal?.name}</Text>
              {!!configModal?.muscleGroup && (
                <Text style={s.modalSub}>{configModal.muscleGroup}</Text>
              )}

              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <View style={s.cfgRow}>
                  <View style={s.cfgField}>
                    <Text style={s.cfgLabel}>Series</Text>
                    <NumericInput
                      style={s.cfgInput}
                      value={cfg.sets}
                      onChangeText={v => setCfg(p => ({ ...p, sets: v }))}
                      placeholder="3"
                      placeholderTextColor="#555"
                    />
                  </View>
                  <View style={s.cfgField}>
                    <Text style={s.cfgLabel}>Repeticiones</Text>
                    <NumericInput
                      style={s.cfgInput}
                      value={cfg.reps}
                      onChangeText={v => setCfg(p => ({ ...p, reps: v }))}
                      placeholder="10"
                      placeholderTextColor="#555"
                    />
                  </View>
                </View>

                <View style={s.cfgField}>
                  <Text style={s.cfgLabel}>Peso recomendado (kg) — opcional</Text>
                  <NumericInput
                    style={s.cfgInput}
                    value={cfg.weight}
                    onChangeText={v => setCfg(p => ({ ...p, weight: v }))}
                    placeholder="0.0"
                    placeholderTextColor="#555"
                  />
                </View>

                <TouchableOpacity style={s.confirmBtn} onPress={confirmAdd} activeOpacity={0.85}>
                  <MaterialCommunityIcons name="plus-circle-outline" size={18} color="#fff" />
                  <Text style={s.confirmBtnTxt}>
                    {selected[configModal?.id ?? -1] ? 'Actualizar' : 'Añadir a la Rutina'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 10 },

  subHeader:    { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  subHeaderTxt: { color: '#ccc', fontSize: 13, fontWeight: '600', flex: 1 },
  badge:        { backgroundColor: 'rgba(240,91,34,0.15)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(240,91,34,0.4)' },
  badgeTxt:     { color: '#f05b22', fontSize: 11, fontWeight: '700' },

  list: { paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 100 },

  card:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0e0e0e', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#1a1a1a', gap: 12 },
  cardAdded:{ borderColor: 'rgba(34,197,94,0.35)', backgroundColor: '#071a0e' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(240,91,34,0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(240,91,34,0.25)' },
  exName:   { color: '#fff', fontSize: 14, fontWeight: '700' },
  exMuscle: { color: '#555', fontSize: 11, marginTop: 2 },
  exConf:   { color: '#22C55E', fontSize: 11, marginTop: 3, fontWeight: '600' },
  removeBtn:{ padding: 2 },

  footer:     { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#000', borderTopWidth: 1, borderTopColor: '#1a1a1a' },
  saveBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#f05b22', borderRadius: 14, paddingVertical: 14 },
  saveBtnOff: { opacity: 0.4 },
  saveBtnTxt: { color: '#fff', fontWeight: '900', fontSize: 15 },

  soft:     { color: '#444', fontSize: 13, textAlign: 'center' },
  retryBtn: { marginTop: 8, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#f05b22' },
  retryTxt: { color: '#f05b22', fontWeight: '600' },

  modalBg:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHandle:{ width: 40, height: 4, backgroundColor: '#333', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '900', marginBottom: 4 },
  modalSub:   { color: '#555', fontSize: 12, marginBottom: 20 },

  cfgRow:   { flexDirection: 'row', gap: 12, marginBottom: 16 },
  cfgField: { flex: 1, marginBottom: 16 },
  cfgLabel: { color: '#888', fontSize: 12, fontWeight: '600', marginBottom: 8 },
  cfgInput: { backgroundColor: '#1c1c1e', borderRadius: 12, padding: 14, color: '#fff', fontSize: 16, borderWidth: 1, borderColor: '#2a2a2a' },

  confirmBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#f05b22', borderRadius: 14, paddingVertical: 14, marginTop: 8 },
  confirmBtnTxt: { color: '#fff', fontWeight: '900', fontSize: 15 },
});
