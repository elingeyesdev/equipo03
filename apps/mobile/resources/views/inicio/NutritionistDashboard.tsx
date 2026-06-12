import React from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../app/Shared/hooks/useAuth';
import { staffApi, MyAppointment } from '../../../app/Providers/staff/api/staff.api';

const fmt5 = (t?: string) => t?.substring(0, 5) ?? '—';

const DONE  = new Set(['COMPLETADA', 'COMPLETED', 'CANCELADA', 'CANCELLED']);
const DONE_SET = new Set(['COMPLETADA', 'COMPLETED']);

const statusMeta = (s: string): { label: string; color: string } => {
  const u = s.toUpperCase();
  if (u.includes('COMPLET')) return { label: 'Completada', color: '#22C55E' };
  if (u.includes('CANCEL'))  return { label: 'Cancelada',  color: '#6B7280' };
  return                             { label: 'Pendiente',  color: '#F97316' };
};

const typeLabel = (t?: string) => {
  if (!t) return null;
  const map: Record<string, string> = {
    PLAN_DIETA:   'Plan de Dieta',
    SEGUIMIENTO:  'Seguimiento',
    EVALUACION:   'Evaluación',
    CONSULTA:     'Consulta',
  };
  return map[t.toUpperCase()] ?? t;
};

export const NutritionistDashboard = () => {
  const { user }      = useAuth();
  const queryClient   = useQueryClient();
  const firstName     = (user as any)?.profile?.firstName ?? (user as any)?.firstName ?? 'Nutricionista';
  const hora          = new Date().getHours();
  const saludo        = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';
  const hoy           = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  const { data: citas = [], isLoading, isError, refetch } = useQuery({
    queryKey:  ['nutritionist-appointments'],
    queryFn:   staffApi.getMyAppointments,
    staleTime: 60_000,
    retry: 1,
  });

  const completarMutation = useMutation({
    mutationFn: (id: number) => staffApi.updateAppointmentStatus(id, 'COMPLETADA'),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['nutritionist-appointments'] }),
  });

  const confirmadas = citas.filter(c => DONE_SET.has(c.status?.toUpperCase() ?? '')).length;
  const pendientes  = citas.filter(c => !DONE.has(c.status?.toUpperCase() ?? '')).length;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Text style={s.saludo}>{saludo},</Text>
          <Text style={s.nombre}>{firstName}</Text>
          <Text style={s.sub}>Tu agenda de hoy</Text>
        </View>
        <View style={s.avatar}>
          <MaterialCommunityIcons name="food-apple-outline" size={28} color="#06d6a0" />
        </View>
      </View>

      {/* Loading */}
      {isLoading && (
        <View style={s.center}>
          <ActivityIndicator color="#06d6a0" size="large" />
          <Text style={s.soft}>Cargando citas…</Text>
        </View>
      )}

      {/* Error */}
      {isError && !isLoading && (
        <View style={s.center}>
          <MaterialCommunityIcons name="wifi-off" size={40} color="#333" />
          <Text style={s.soft}>No se pudo cargar la agenda.</Text>
          <TouchableOpacity style={[s.retryBtn, { borderColor: '#06d6a0' }]} onPress={() => refetch()}>
            <Text style={[s.retryTxt, { color: '#06d6a0' }]}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Lista */}
      {!isLoading && !isError && (
        <FlatList
          data={citas}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            citas.length > 0 ? (
              <>
                <View style={s.fechaRow}>
                  <MaterialCommunityIcons name="calendar-today" size={13} color="#555" />
                  <Text style={s.fechaTxt}>{hoy.charAt(0).toUpperCase() + hoy.slice(1)}</Text>
                </View>
                <View style={s.summaryRow}>
                  <View style={s.summaryCard}>
                    <Text style={s.summaryNum}>{citas.length}</Text>
                    <Text style={s.summaryLabel}>Citas hoy</Text>
                  </View>
                  <View style={s.summaryCard}>
                    <Text style={[s.summaryNum, { color: '#22C55E' }]}>{confirmadas}</Text>
                    <Text style={s.summaryLabel}>Completadas</Text>
                  </View>
                  <View style={s.summaryCard}>
                    <Text style={[s.summaryNum, { color: '#F97316' }]}>{pendientes}</Text>
                    <Text style={s.summaryLabel}>Pendientes</Text>
                  </View>
                </View>
              </>
            ) : null
          }
          ListEmptyComponent={
            <View style={s.center}>
              <MaterialCommunityIcons name="calendar-blank-outline" size={52} color="#222" />
              <Text style={s.emptyTitle}>Sin citas asignadas para hoy.</Text>
            </View>
          }
          renderItem={({ item }: { item: MyAppointment }) => {
            const { label: statusLabel, color: statusColor } = statusMeta(item.status ?? '');
            const isDone      = DONE.has(item.status?.toUpperCase() ?? '');
            const isCompleting = completarMutation.isPending &&
              (completarMutation.variables as number) === item.id;

            return (
              <View style={s.card}>
                {/* Hora */}
                <View style={s.timeCol}>
                  <Text style={s.timeStart}>{fmt5(item.startTime)}</Text>
                  <View style={s.timeLine} />
                  <Text style={s.timeEnd}>{fmt5(item.endTime)}</Text>
                </View>

                {/* Info */}
                <View style={s.infoCol}>
                  <View style={s.infoTop}>
                    <MaterialCommunityIcons name="account-outline" size={14} color="#06d6a0" />
                    <Text style={s.patientName} numberOfLines={1}>{item.patientName}</Text>
                  </View>

                  {!!typeLabel(item.appointmentType) && (
                    <View style={s.typeBadge}>
                      <Text style={s.typeTxt}>{typeLabel(item.appointmentType)}</Text>
                    </View>
                  )}

                  {!!item.notes && (
                    <Text style={s.notes} numberOfLines={2}>{item.notes}</Text>
                  )}

                  {/* Botón marcar completada */}
                  {!isDone && (
                    <TouchableOpacity
                      style={[s.completeBtn, isCompleting && s.completeBtnOff]}
                      onPress={() => completarMutation.mutate(item.id)}
                      disabled={isCompleting || completarMutation.isPending}
                      activeOpacity={0.8}
                    >
                      {isCompleting
                        ? <ActivityIndicator color="#06d6a0" size="small" />
                        : <>
                            <MaterialCommunityIcons name="check-circle-outline" size={14} color="#06d6a0" />
                            <Text style={s.completeBtnTxt}>Marcar Completada</Text>
                          </>
                      }
                    </TouchableOpacity>
                  )}
                </View>

                {/* Badge estado */}
                <View style={[s.statusBadge, { borderColor: statusColor, backgroundColor: '#1C1C1E' }]}>
                  <Text style={[s.statusTxt, { color: statusColor }]}>{statusLabel}</Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12 },
  list:   { paddingHorizontal: 16, paddingBottom: 100 },

  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 20, paddingBottom: 4 },
  headerLeft: { flex: 1 },
  saludo:     { color: '#555', fontSize: 14 },
  nombre:     { color: '#fff', fontSize: 26, fontWeight: '900', marginTop: 2 },
  sub:        { color: '#444', fontSize: 13, marginTop: 4 },
  avatar:     { width: 50, height: 50, borderRadius: 25, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#00E5A3' },

  fechaRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  fechaTxt:  { color: '#444', fontSize: 13 },

  summaryRow:   { flexDirection: 'row', gap: 10, marginBottom: 16 },
  summaryCard:  { flex: 1, backgroundColor: '#0e0e0e', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#1a1a1a' },
  summaryNum:   { color: '#fff', fontSize: 24, fontWeight: '900' },
  summaryLabel: { color: '#444', fontSize: 10, marginTop: 2, textAlign: 'center' },

  card:     { flexDirection: 'row', backgroundColor: '#0e0e0e', borderRadius: 14, borderWidth: 1, borderColor: '#1a1a1a', borderLeftWidth: 3, borderLeftColor: '#06d6a0', padding: 14, marginBottom: 10, alignItems: 'flex-start', gap: 12 },
  timeCol:  { alignItems: 'center', width: 44, paddingTop: 2 },
  timeStart:{ color: '#06d6a0', fontSize: 13, fontWeight: '800' },
  timeLine: { width: 1.5, height: 14, backgroundColor: '#3A3A3C', marginVertical: 4 },
  timeEnd:  { color: '#444', fontSize: 11 },

  infoCol:     { flex: 1, gap: 6 },
  infoTop:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  patientName: { color: '#fff', fontSize: 14, fontWeight: '700', flex: 1 },

  typeBadge: { alignSelf: 'flex-start', backgroundColor: '#1C1C1E', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#00E5A3' },
  typeTxt:   { color: '#06d6a0', fontSize: 10, fontWeight: '700' },

  notes: { color: '#555', fontSize: 11, lineHeight: 16 },

  completeBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', backgroundColor: '#1C1C1E', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: '#00E5A3', marginTop: 2 },
  completeBtnOff: {},
  completeBtnTxt: { color: '#06d6a0', fontSize: 11, fontWeight: '700' },

  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, alignSelf: 'flex-start', marginTop: 2 },
  statusTxt:   { fontSize: 10, fontWeight: '700' },

  emptyTitle: { color: '#555', fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 8 },
  soft:       { color: '#444', fontSize: 13, textAlign: 'center', marginTop: 6 },
  retryBtn:   { marginTop: 8, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  retryTxt:   { fontWeight: '600' },
});
