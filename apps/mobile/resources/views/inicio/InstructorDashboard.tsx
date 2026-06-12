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
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../app/Shared/hooks/useAuth';
import { staffApi, StaffClass } from '../../../app/Providers/staff/api/staff.api';

const fmt5 = (t?: string) => t?.substring(0, 5) ?? '—';

const enrolledCount = (c: StaffClass) => c.reservations?.length ?? c.enrolledCount;
const ocupPct       = (c: StaffClass) =>
  c.maxAttendees ? Math.round((enrolledCount(c) / c.maxAttendees) * 100) : null;
const ocupColor = (pct: number | null) =>
  pct === null ? '#555' : pct > 85 ? '#EF4444' : pct > 60 ? '#F97316' : '#22C55E';

export const InstructorDashboard = () => {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const firstName = (user as any)?.profile?.firstName ?? (user as any)?.firstName ?? 'Instructor';
  const hora      = new Date().getHours();
  const saludo    = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';
  const hoy       = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  const { data: clases = [], isLoading, isRefetching, refetch, isError } = useQuery({
    queryKey:  ['staff-classes-today'],
    queryFn:   staffApi.getTodayClasses,
    staleTime: 60_000,
    retry: 1,
  });

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#f05b22" colors={['#f05b22']} />
        }
      >
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Text style={s.saludo}>{saludo},</Text>
            <Text style={s.nombre}>{firstName}</Text>
            <Text style={s.sub}>Mis Clases de Hoy</Text>
          </View>
          <View style={s.avatar}>
            <MaterialCommunityIcons name="whistle-outline" size={28} color="#f05b22" />
          </View>
        </View>

        <View style={s.fechaRow}>
          <MaterialCommunityIcons name="calendar-today" size={13} color="#555" />
          <Text style={s.fechaTxt}>{hoy.charAt(0).toUpperCase() + hoy.slice(1)}</Text>
        </View>

        {/* Resumen */}
        <View style={s.summaryRow}>
          <View style={s.summaryCard}>
            <Text style={s.summaryNum}>{isLoading ? '—' : clases.length}</Text>
            <Text style={s.summaryLabel}>Clases hoy</Text>
          </View>
          <View style={s.summaryCard}>
            <Text style={s.summaryNum}>
              {isLoading ? '—' : clases.reduce((acc, c) => acc + enrolledCount(c), 0)}
            </Text>
            <Text style={s.summaryLabel}>Alumnos total</Text>
          </View>
        </View>

        {/* Lista clases */}
        <Text style={s.sectionTitle}>Próximas Clases</Text>

        {isLoading && (
          <View style={s.center}>
            <ActivityIndicator color="#f05b22" />
            <Text style={s.soft}>Cargando agenda…</Text>
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

        {!isLoading && !isError && clases.length === 0 && (
          <View style={s.center}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={48} color="#222" />
            <Text style={s.soft}>Sin clases asignadas para hoy.</Text>
          </View>
        )}

        {!isLoading && clases.map((c) => {
          const pct   = ocupPct(c);
          const color = ocupColor(pct);
          return (
            <TouchableOpacity
              key={c.id}
              style={s.card}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('ClaseDetalle', {
                scheduleId:   c.id,
                activityName: c.activityName,
                startTime:    c.startTime,
              })}
            >
              <View style={s.timeCol}>
                <Text style={s.timeStart}>{fmt5(c.startTime)}</Text>
                <View style={s.timeLine} />
                <Text style={s.timeEnd}>{fmt5(c.endTime)}</Text>
              </View>
              <View style={s.infoCol}>
                <Text style={s.actName} numberOfLines={1}>{c.activityName}</Text>
                {!!c.location && (
                  <View style={s.metaRow}>
                    <MaterialCommunityIcons name="map-marker-outline" size={12} color="#555" />
                    <Text style={s.metaTxt}>{c.location}</Text>
                  </View>
                )}
                {!!c.status && (
                  <View style={s.statusBadge}>
                    <Text style={s.statusTxt}>{c.status}</Text>
                  </View>
                )}
              </View>
              <View style={s.enrollCol}>
                <MaterialCommunityIcons name="account-group-outline" size={16} color={color} />
                <Text style={[s.enrollNum, { color }]}>{enrolledCount(c)}</Text>
                {c.maxAttendees != null && (
                  <Text style={s.enrollMax}>/ {c.maxAttendees}</Text>
                )}
                <Text style={s.enrollLabel}>alumnos</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Acciones */}
        <Text style={[s.sectionTitle, { marginTop: 24 }]}>Accesos Rápidos</Text>
        <View style={s.actionsRow}>
          <TouchableOpacity style={s.actionBtn} activeOpacity={0.8}>
            <MaterialCommunityIcons name="account-group-outline" size={26} color="#f05b22" />
            <Text style={s.actionTxt}>Ver Alumnos</Text>
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
  avatar:     { width: 52, height: 52, borderRadius: 26, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FF5E00' },

  fechaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  fechaTxt: { color: '#444', fontSize: 13 },

  summaryRow:  { flexDirection: 'row', gap: 10, marginBottom: 24 },
  summaryCard: { flex: 1, backgroundColor: '#0e0e0e', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#1a1a1a' },
  summaryNum:  { color: '#fff', fontSize: 26, fontWeight: '900' },
  summaryLabel:{ color: '#444', fontSize: 11, marginTop: 2 },

  sectionTitle: { color: '#555', fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12 },

  card:     { flexDirection: 'row', backgroundColor: '#0e0e0e', borderRadius: 14, borderWidth: 1, borderColor: '#1a1a1a', borderLeftWidth: 3, borderLeftColor: '#f05b22', padding: 14, marginBottom: 10, alignItems: 'center', gap: 12 },
  timeCol:  { alignItems: 'center', width: 44 },
  timeStart:{ color: '#f05b22', fontSize: 13, fontWeight: '800' },
  timeLine: { width: 1.5, height: 14, backgroundColor: '#3A3A3C', marginVertical: 4 },
  timeEnd:  { color: '#444', fontSize: 11 },

  infoCol:     { flex: 1 },
  actName:     { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 4 },
  metaRow:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaTxt:     { color: '#555', fontSize: 11 },
  statusBadge: { marginTop: 5, backgroundColor: '#1a1a1a', borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2, alignSelf: 'flex-start' },
  statusTxt:   { color: '#888', fontSize: 10, fontWeight: '600' },

  enrollCol:   { alignItems: 'center', gap: 2 },
  enrollNum:   { fontSize: 18, fontWeight: '900' },
  enrollMax:   { color: '#444', fontSize: 11 },
  enrollLabel: { color: '#444', fontSize: 9 },

  soft:     { color: '#444', fontSize: 13, textAlign: 'center', marginTop: 6 },
  retryBtn: { marginTop: 8, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#f05b22' },
  retryTxt: { color: '#f05b22', fontWeight: '600' },

  actionsRow: { flexDirection: 'row', gap: 12 },
  actionBtn:  { flex: 1, backgroundColor: '#0e0e0e', borderRadius: 14, borderWidth: 1, borderColor: '#1a1a1a', paddingVertical: 20, alignItems: 'center', gap: 8 },
  actionTxt:  { color: '#fff', fontSize: 12, fontWeight: '700', textAlign: 'center' },
});
