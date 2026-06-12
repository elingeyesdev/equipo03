import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Switch, Alert, ActivityIndicator, TextInput, Modal,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  staffApi,
  ScheduleReservation,
  UserSearchResult,
} from '../../../app/Providers/staff/api/staff.api';

export const ClaseDetalleScreen = () => {
  const route      = useRoute<any>();
  const navigation = useNavigation();
  const { scheduleId, activityName, startTime } = route.params as {
    scheduleId:   number;
    activityName: string;
    startTime:    string;
  };

  const [checked,       setChecked]       = useState<Set<number>>(new Set());
  const [walkInVisible, setWalkInVisible] = useState(false);
  const [searchQ,       setSearchQ]       = useState('');
  const [results,       setResults]       = useState<UserSearchResult[]>([]);
  const [searching,     setSearching]     = useState(false);
  const initializedRef = useRef(false);

  const { data: reservations = [], isLoading, refetch } = useQuery({
    queryKey: ['schedule-reservations', scheduleId],
    queryFn:  () => staffApi.getScheduleReservations(scheduleId),
    staleTime: 30_000,
    retry: 1,
  });

  // Inicializa checkboxes solo la primera vez
  useEffect(() => {
    if (reservations.length > 0 && !initializedRef.current) {
      initializedRef.current = true;
      setChecked(new Set(
        reservations
          .filter(r => r.status !== 'FALTO')
          .map(r => r.id),
      ));
    }
  }, [reservations]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const completedIds = reservations.filter(r =>  checked.has(r.id)).map(r => r.id);
      const faltoIds     = reservations.filter(r => !checked.has(r.id)).map(r => r.id);
      await Promise.all([
        completedIds.length ? staffApi.bulkUpdateStatus(completedIds, 'COMPLETADA') : undefined,
        faltoIds.length     ? staffApi.bulkUpdateStatus(faltoIds,     'FALTO')      : undefined,
      ]);
    },
    onSuccess: () => {
      Alert.alert('Asistencia guardada');
      navigation.goBack();
    },
    onError: (e: any) => {
      Alert.alert('Error', e?.message ?? 'No se pudo guardar');
    },
  });

  const walkInMutation = useMutation({
    mutationFn: (userId: string) => staffApi.createWalkIn(userId, scheduleId),
    onSuccess: () => {
      setWalkInVisible(false);
      setSearchQ('');
      setResults([]);
      initializedRef.current = false;
      refetch();
    },
    onError: (e: any) => {
      Alert.alert('Error', e?.message ?? 'No se pudo añadir');
    },
  });

  const handleSearch = async (q: string) => {
    setSearchQ(q);
    if (q.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      setResults(await staffApi.searchUsers(q));
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const toggle = (id: number) =>
    setChecked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const userName = (r: ScheduleReservation) =>
    (r.user?.profile?.fullName
    ?? [r.user?.profile?.firstName, r.user?.profile?.lastName].filter(Boolean).join(' '))
    || r.user?.email
    || `#${r.id}`;

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>

      {/* Sub-header */}
      <View style={s.subHeader}>
        <Text style={s.title} numberOfLines={1}>{activityName}</Text>
        <Text style={s.sub}>{startTime?.substring(0, 5)} · {reservations.length} alumno(s)</Text>
      </View>

      {/* Botón añadir alumno */}
      <TouchableOpacity style={s.addBtn} onPress={() => setWalkInVisible(true)} activeOpacity={0.8}>
        <MaterialCommunityIcons name="account-plus-outline" size={18} color="#fff" />
        <Text style={s.addBtnTxt}>Añadir Alumno (Walk-in)</Text>
      </TouchableOpacity>

      {/* Lista */}
      {isLoading ? (
        <View style={s.center}>
          <ActivityIndicator color="#f05b22" size="large" />
        </View>
      ) : (
        <FlatList
          data={reservations}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={s.list}
          ListEmptyComponent={
            <View style={s.center}>
              <MaterialCommunityIcons name="account-group-outline" size={48} color="#222" />
              <Text style={s.empty}>Sin reservas registradas.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={s.row}>
              <View style={s.rowLeft}>
                <View style={[s.dot, { backgroundColor: checked.has(item.id) ? '#22C55E' : '#555' }]} />
                <Text style={s.rowName} numberOfLines={1}>{userName(item)}</Text>
              </View>
              <Switch
                value={checked.has(item.id)}
                onValueChange={() => toggle(item.id)}
                trackColor={{ false: '#333', true: '#22C55E' }}
                thumbColor="#fff"
              />
            </View>
          )}
        />
      )}

      {/* Botón guardar */}
      <View style={s.footer}>
        <TouchableOpacity
          style={[s.saveBtn, saveMutation.isPending && s.saveBtnOff]}
          onPress={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || reservations.length === 0}
          activeOpacity={0.85}
        >
          {saveMutation.isPending
            ? <ActivityIndicator color="#fff" size="small" />
            : <>
                <MaterialCommunityIcons name="content-save-check-outline" size={18} color="#fff" />
                <Text style={s.saveBtnTxt}>Guardar Asistencia</Text>
              </>
          }
        </TouchableOpacity>
      </View>

      {/* Walk-in modal */}
      <Modal visible={walkInVisible} transparent animationType="slide" onRequestClose={() => setWalkInVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <TouchableOpacity style={s.modalBg} activeOpacity={1} onPress={() => setWalkInVisible(false)}>
            <TouchableOpacity style={s.modalSheet} activeOpacity={1}>
              <View style={s.modalHandle} />
              <Text style={s.modalTitle}>Añadir Alumno</Text>
              <TextInput
                style={s.searchInput}
                value={searchQ}
                onChangeText={handleSearch}
                placeholder="Buscar por nombre o email..."
                placeholderTextColor="#555"
                autoFocus
              />
              {searching && <ActivityIndicator color="#f05b22" style={{ marginTop: 8 }} />}
              <FlatList
                data={results}
                keyExtractor={item => String(item.id)}
                style={{ maxHeight: 260 }}
                ListEmptyComponent={
                  !searching && searchQ.length >= 2
                    ? <Text style={s.noResults}>Sin resultados.</Text>
                    : null
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={s.resultRow}
                    onPress={() => walkInMutation.mutate(String(item.id))}
                    disabled={walkInMutation.isPending}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons name="account-outline" size={18} color="#f05b22" />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={s.resultName}>{item.fullName}</Text>
                      {!!item.email && <Text style={s.resultEmail}>{item.email}</Text>}
                    </View>
                    {walkInMutation.isPending
                      ? <ActivityIndicator color="#f05b22" size="small" />
                      : <MaterialCommunityIcons name="plus-circle-outline" size={20} color="#f05b22" />
                    }
                  </TouchableOpacity>
                )}
              />
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: '#000' },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 10 },

  subHeader: { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#3A3A3C' },
  title:     { color: '#fff', fontSize: 18, fontWeight: '900' },
  sub:       { color: '#555', fontSize: 13, marginTop: 2 },

  addBtn:    { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 16, backgroundColor: '#f05b22', borderRadius: 12, paddingVertical: 11, paddingHorizontal: 16, alignSelf: 'flex-start' },
  addBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },

  list: { paddingHorizontal: 16, paddingBottom: 100 },
  row:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0e0e0e', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 8, borderWidth: 1, borderColor: '#3A3A3C' },
  rowLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  dot:      { width: 8, height: 8, borderRadius: 4 },
  rowName:  { color: '#fff', fontSize: 14, fontWeight: '600', flex: 1 },
  empty:    { color: '#555', fontSize: 14, textAlign: 'center', marginTop: 8 },

  footer:    { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#000', borderTopWidth: 1, borderTopColor: '#3A3A3C' },
  saveBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#22C55E', borderRadius: 14, paddingVertical: 14 },
  saveBtnOff:{},
  saveBtnTxt:{ color: '#fff', fontWeight: '900', fontSize: 15 },

  modalBg:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHandle:{ width: 40, height: 4, backgroundColor: '#333', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '900', marginBottom: 16 },
  searchInput:{ backgroundColor: '#1C1C1E', borderRadius: 12, padding: 14, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#3A3A3C', marginBottom: 8 },
  noResults:  { color: '#555', textAlign: 'center', marginTop: 16 },
  resultRow:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#3A3A3C' },
  resultName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  resultEmail:{ color: '#555', fontSize: 11, marginTop: 2 },
});
