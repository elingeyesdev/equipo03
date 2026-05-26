import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../app/Shared/hooks/useAuth';
import { staffApi, StaffAppointment } from '../../../app/Providers/staff/api/staff.api';

const fmt5 = (t?: string) => t?.substring(0, 5) ?? '—';

const statusColor = (s?: string) => {
  if (!s) return '#555';
  const u = s.toUpperCase();
  if (u.includes('CONFIRM')) return '#22C55E';
  if (u.includes('PEND'))    return '#F97316';
  if (u.includes('CANCEL'))  return '#6B7280';
  return '#555';
};

export const NutritionistDashboard = () => {
  const { user } = useAuth();
  const firstName = (user as any)?.profile?.firstName ?? (user as any)?.firstName ?? 'Nutricionista';
  const hora      = new Date().getHours();
  const saludo    = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';
  const hoy       = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  const { data: citas = [], isLoading, isRefetching, refetch, isError } = useQuery({
    queryKey:  ['staff-appointments-today'],
    queryFn:   staffApi.getTodayAppointments,
    staleTime: 60_000,
    retry: 1,
  });

  const confirmadas = citas.filter(c => c.status?.toUpperCase().includes('CONFIRM')).length;
  const pendientes  = citas.filter(c => c.status?.toUpperCase().includes('PEND')).length;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#06d6a0" colors={['#06d6a0']} />
        }
      >
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

        <View style={s.fechaRow}>
          <MaterialCommunityIcons name="calendar-today" size={13} color="#555" />
          <Text style={s.fechaTxt}>{hoy.charAt(0).toUpperCase() + hoy.slice(1)}</Text>
        </View>

        {/* Resumen */}
        <View style={s.summaryRow}>
          <View style={s.summaryCard}>
            <Text style={s.summaryNum}>{isLoading ? '—' : citas.length}</Text>
            <Text style={s.summaryLabel}>Citas hoy</Text>
          </View>
          <View style={s.summaryCard}>
            <Text style={[s.summaryNum, { color: '#22C55E' }]}>{isLoading ? '—' : confirmadas}</Text>
            <Text style={s.summaryLabel}>Confirmadas</Text>
          </View>
          <View style={s.summaryCard}>
            <Text style={[s.summaryNum, { color: '#F97316' }]}>{isLoading ? '—' : pendientes}</Text>
            <Text style={s.summaryLabel}>Pendientes</Text>
          </View>
        </View>

        {/* Lista citas */}
        <Text style={s.sectionTitle}>Pacientes de Hoy</Text>

        {isLoading && (
          <View style={s.center}>
            <ActivityIndicator color="#06d6a0" />
            <Text style={s.soft}>Cargando citas…</Text>
          </View>
        )}

        {isError && (
          <View style={s.center}>
            <MaterialCommunityIcons name="wifi-off" size={36} color="#333" />
            <Text style={s.soft}>No se pudo cargar la agenda.</Text>
            <TouchableOpacity onPress={() => refetch()} style={s.retryBtn}>
              <Text style={s.retryTxt}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isLoading && !isError && citas.length === 0 && (
          <View style={s.center}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={48} color="#222" />
            <Text style={s.soft}>Sin citas asignadas para hoy.</Text>
          </View>
        )}

        {!isLoading && citas.map((c: StaffAppointment) => {
          const sc = statusColor(c.status);
          return (
            <View key={c.id} style={[s.card, { borderLeftColor: '#06d6a0' }]}>
              {/* Hora */}
              <View style={s.timeCol}>
                <Text style={s.timeStart}>{fmt5(c.startTime)}</Text>
                <View style={s.timeLine} />
                <Text style={s.timeEnd}>{fmt5(c.endTime)}</Text>
              </View>

              {/* Info paciente */}
              <View style={s.infoCol}>
                <View style={s.infoTop}>
                  <MaterialCommunityIcons name="account-outline" size={14} color="#06d6a0" />
                  <Text style={s.patientName} numberOfLines={1}>{c.patientName}</Text>
                </View>
                {!!c.notes && (
                  <Text style={s.notes} numberOfLines={2}>{c.notes}</Text>
                )}
              </View>

              {/* Status */}
              {!!c.status && (
                <View style={[s.statusBadge, { borderColor: sc + '55', backgroundColor: sc + '18' }]}>
                  <Text style={[s.statusTxt, { color: sc }]}>{c.status}</Text>
                </View>
              )}
            </View>
          );
        })}

        {/* Acciones */}
        <Text style={[s.sectionTitle, { marginTop: 24 }]}>Accesos Rápidos</Text>
        <View style={s.actionsRow}>
          <TouchableOpacity style={s.actionBtn} activeOpacity={0.8}>
            <MaterialCommunityIcons name="account-group-outline" size={26} color="#06d6a0" />
            <Text style={s.actionTxt}>Ver Pacientes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionBtn} activeOpacity={0.8}>
            <MaterialCommunityIcons name="calendar-month-outline" size={26} color="#9b5de5" />
            <Text style={s.actionTxt}>Mi Calendario</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#000' },
  scroll: { padding: 20, paddingBottom: 100 },
  center: { alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10 },

  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  headerLeft: { flex: 1 },
  saludo:     { color: '#555', fontSize: 14 },
  nombre:     { color: '#fff', fontSize: 28, fontWeight: '900', marginTop: 2 },
  sub:        { color: '#444', fontSize: 13, marginTop: 4 },
  avatar:     { width: 52, height: 52, borderRadius: 26, backgroundColor: '#071a15', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(6,214,160,0.25)' },

  fechaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  fechaTxt: { color: '#444', fontSize: 13 },

  summaryRow:   { flexDirection: 'row', gap: 10, marginBottom: 24 },
  summaryCard:  { flex: 1, backgroundColor: '#0e0e0e', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#1a1a1a' },
  summaryNum:   { color: '#fff', fontSize: 24, fontWeight: '900' },
  summaryLabel: { color: '#444', fontSize: 10, marginTop: 2, textAlign: 'center' },

  sectionTitle: { color: '#555', fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12 },

  card:     { flexDirection: 'row', backgroundColor: '#0e0e0e', borderRadius: 14, borderWidth: 1, borderColor: '#1a1a1a', borderLeftWidth: 3, padding: 14, marginBottom: 10, alignItems: 'center', gap: 12 },
  timeCol:  { alignItems: 'center', width: 44 },
  timeStart:{ color: '#06d6a0', fontSize: 13, fontWeight: '800' },
  timeLine: { width: 1.5, height: 14, backgroundColor: '#06d6a044', marginVertical: 4 },
  timeEnd:  { color: '#444', fontSize: 11 },

  infoCol:     { flex: 1 },
  infoTop:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  patientName: { color: '#fff', fontSize: 14, fontWeight: '700', flex: 1 },
  notes:       { color: '#555', fontSize: 11, lineHeight: 16 },

  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  statusTxt:   { fontSize: 10, fontWeight: '700' },

  soft:     { color: '#444', fontSize: 13, textAlign: 'center', marginTop: 6 },
  retryBtn: { marginTop: 8, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#06d6a0' },
  retryTxt: { color: '#06d6a0', fontWeight: '600' },

  actionsRow: { flexDirection: 'row', gap: 12 },
  actionBtn:  { flex: 1, backgroundColor: '#0e0e0e', borderRadius: 14, borderWidth: 1, borderColor: '#1a1a1a', paddingVertical: 20, alignItems: 'center', gap: 8 },
  actionTxt:  { color: '#fff', fontSize: 12, fontWeight: '700', textAlign: 'center' },
});
