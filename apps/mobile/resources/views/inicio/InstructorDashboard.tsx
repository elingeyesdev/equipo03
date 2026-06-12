import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';
import { BarChart } from 'react-native-chart-kit';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../app/Shared/hooks/useAuth';
import { staffApi, StaffClass } from '../../../app/Providers/staff/api/staff.api';
import authAxios from '../../../app/Providers/auth/authAxios';

const SCREEN_W = Dimensions.get('window').width;

const fmt5 = (t?: string) => t?.substring(0, 5) ?? '—';

const enrolledCount = (c: StaffClass) => c.reservations?.length ?? c.enrolledCount ?? 0;

type Attendee = {
  id:       number | string;
  fullName: string;
};

type Schedule = {
  startTime:     string;
  endTime?:      string;
  enrolledCount: number;
  className?:    string;
  activityName?: string;
  gymName?:      string;
  location?:     string;
  maxCapacity:   number;
  attendees?:    Attendee[];
};

type ChartPoint = {
  label: string;
  value: number;
};

const scheduleEnrolled = (sch: Schedule) => Number(sch.enrolledCount) || 0;
const scheduleMax      = (sch: Schedule) => Number(sch.maxCapacity)   || 0;
const enrollColor      = (sch: Schedule): string => {
  const enrolled = scheduleEnrolled(sch);
  const max      = scheduleMax(sch);
  if (!max) return '#888';
  if (enrolled >= max)       return '#00E5A3';
  if (enrolled >= max * 0.8) return '#FF5E00';
  return '#888';
};

// ── ScheduleCard — estado de expansión individual por tarjeta ────────────────
const ScheduleCard = ({ schedule }: { schedule: StaffClass }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const enrolled = schedule.enrolledCount ?? 0;
  const max      = schedule.maxCapacity ?? schedule.maxAttendees ?? null;
  const aforo    = max !== null ? `${enrolled} / ${max}` : `${enrolled}`;
  const afoColor = max === null
    ? '#555'
    : enrolled >= max         ? '#00E5A3'
    : enrolled >= max * 0.8   ? '#FF5E00'
    : '#22C55E';

  return (
    <TouchableOpacity
      style={s.card}
      activeOpacity={0.85}
      onPress={() => setIsExpanded(prev => !prev)}
    >
      {/* Cabecera siempre visible */}
      <View style={s.cardHeader}>
        <View style={s.timeCol}>
          <Text style={s.timeStart}>{fmt5(schedule.startTime)}</Text>
          <View style={s.timeLine} />
          <Text style={s.timeEnd}>{fmt5(schedule.endTime)}</Text>
        </View>
        <View style={s.infoCol}>
          <Text style={s.actName} numberOfLines={1}>{schedule.activityName}</Text>
          {!!schedule.location && (
            <View style={s.metaRow}>
              <MaterialCommunityIcons name="map-marker-outline" size={12} color="#555" />
              <Text style={s.metaTxt}>{schedule.location}</Text>
            </View>
          )}
          {!!schedule.status && (
            <View style={s.statusBadge}>
              <Text style={s.statusTxt}>{schedule.status}</Text>
            </View>
          )}
        </View>
        <View style={s.enrollCol}>
          <MaterialCommunityIcons name="account-group-outline" size={16} color={afoColor} />
          <Text style={[s.enrollNum, { color: afoColor }]}>{enrolled}</Text>
          {max !== null && <Text style={s.enrollMax}>/ {max}</Text>}
          <Text style={s.enrollLabel}>alumnos</Text>
        </View>
        <Feather
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color="#555"
        />
      </View>

      {/* Contenido expandido */}
      {isExpanded && (
        <View style={s.expandedBlock}>
          {/* Aforo explícito */}
          <View style={s.afoRow}>
            <Text style={s.afoLabel}>Aforo (Capacidad):</Text>
            <Text style={[s.afoValue, { color: afoColor }]}>{aforo}</Text>
          </View>

          {/* Lista de alumnos */}
          {!schedule.attendees || schedule.attendees.length === 0 ? (
            <Text style={s.attendeesEmpty}>Sin lista de alumnos disponible.</Text>
          ) : (
            schedule.attendees.map(a => (
              <View key={a.id} style={s.attendeeRow}>
                <Feather name="user" size={13} color="#FF5E00" />
                <Text style={s.attendeeName}>{a.fullName}</Text>
              </View>
            ))
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const ItinCard = ({ sch }: { sch: Schedule }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const clrEnroll = enrollColor(sch);
  const name      = sch.className ?? sch.activityName ?? 'Clase';
  const place     = sch.gymName   ?? sch.location     ?? '—';

  return (
    <TouchableOpacity
      style={s.itinCard}
      onPress={() => setIsExpanded(prev => !prev)}
      activeOpacity={0.85}
    >
      {/* Fila 1: Horario */}
      <View style={s.itinRow}>
        <Feather name="clock" size={13} color="#38BDF8" />
        <Text style={s.itinTime}>
          {(sch.startTime ?? '').substring(0, 5)}
          {sch.endTime ? ` - ${sch.endTime.substring(0, 5)}` : ''}
        </Text>
        <Feather
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={14}
          color="#555"
          style={{ marginLeft: 'auto' }}
        />
      </View>
      {/* Fila 2: Nombre */}
      <View style={s.itinRow}>
        <Feather name="activity" size={13} color="#fff" />
        <Text style={s.itinName} numberOfLines={1}>{name}</Text>
      </View>
      {/* Fila 3: Sede */}
      <View style={s.itinRow}>
        <Feather name="map-pin" size={13} color="#555" />
        <Text style={s.itinPlace} numberOfLines={1}>{place}</Text>
      </View>
      {/* Fila 4: Alumnos */}
      <View style={s.itinRow}>
        <Feather name="users" size={13} color={clrEnroll} />
        <Text style={[s.itinEnroll, { color: clrEnroll }]}>
          {sch.enrolledCount} / {sch.maxCapacity} Alumnos
          {sch.enrolledCount >= sch.maxCapacity && sch.maxCapacity > 0 ? '  •  Lleno' : ''}
        </Text>
      </View>

      {/* Lista expandida de alumnos */}
      {isExpanded && (
        <View style={s.attendeesBlock}>
          <Text style={s.attendeesLabel}>Alumnos Inscritos:</Text>
          {!sch.attendees || sch.attendees.length === 0 ? (
            <Text style={s.attendeesEmpty}>Nadie ha reservado aún.</Text>
          ) : (
            sch.attendees.map(attendee => (
              <View key={attendee.id} style={s.attendeeRow}>
                <Feather name="user" size={14} color="#FF5E00" />
                <Text style={s.attendeeName}>{attendee.fullName}</Text>
              </View>
            ))
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

export const InstructorDashboard = () => {
  const { user }    = useAuth();
  const navigation  = useNavigation<any>();
  const firstName   = (user as any)?.profile?.firstName ?? (user as any)?.firstName ?? 'Instructor';
  const hora        = new Date().getHours();
  const saludo      = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';
  const hoy         = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  const [schedules,  setSchedules]  = useState<Schedule[]>([]);
  const [statsChart, setStatsChart] = useState<ChartPoint[]>([]);

  // Fetch 1 — itinerario del día
  useEffect(() => {
    authAxios.get('/api/staff/me/schedules')
      .then(res => {
        const data = res.data?.data ?? res.data ?? [];
        setSchedules(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        console.log('ERROR /api/staff/me/schedules:', err?.response?.status, err?.message);
      });
  }, []);

  // Fetch 2 — estadísticas para el gráfico
  useEffect(() => {
    authAxios.get('/api/staff/me/stats/attendance')
      .then(res => {
        const raw = res.data?.data ?? res.data ?? [];
        // Normaliza distintos formatos que puede devolver el backend
        let points: ChartPoint[] = [];
        if (Array.isArray(raw)) {
          points = raw.map((item: any) => ({
            label: item.label ?? item.startTime ?? item.hour ?? '—',
            value: Number(item.value ?? item.enrolledCount ?? item.count ?? 0),
          }));
        } else if (raw.labels && raw.data) {
          points = (raw.labels as string[]).map((lbl: string, i: number) => ({
            label: lbl,
            value: Number((raw.data as number[])[i] ?? 0),
          }));
        }
        setStatsChart(points);
      })
      .catch(err => {
        console.log('ERROR /api/staff/me/stats/attendance:', err?.response?.status, err?.message);
      });
  }, []);

  const chartLabels = statsChart.map(p => p.label.substring(0, 5));
  const chartData   = statsChart.map(p => Math.max(0, p.value));
  const hasChart    = statsChart.length > 0;

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

        {/* ── Gráfico — solo datos de /stats/attendance ── */}
        <Text style={s.sectionTitle}>Ocupación por Horario</Text>
        {hasChart ? (
          <View style={s.chartCard}>
            <BarChart
              data={{ labels: chartLabels, datasets: [{ data: chartData }] }}
              width={SCREEN_W - 32}
              height={220}
              yAxisLabel=""
              yAxisSuffix=""
              fromZero
              showValuesOnTopOfBars
              chartConfig={{
                backgroundColor:       'transparent',
                backgroundGradientFrom: '#0e0e0e',
                backgroundGradientTo:   '#0e0e0e',
                decimalPlaces: 0,
                color:       (opacity = 1) => `rgba(255, 94, 0, ${opacity})`,
                labelColor:  (opacity = 1) => `rgba(176, 176, 176, ${opacity})`,
                barPercentage: 0.55,
                propsForBackgroundLines: { stroke: '#1a1a1a' },
              }}
              style={s.chart}
            />
          </View>
        ) : (
          <View style={s.emptyBlock}>
            <Feather name="bar-chart-2" size={36} color="#2a2a2a" />
            <Text style={s.emptySub}>Sin estadísticas de asistencia disponibles.</Text>
          </View>
        )}

        {/* ── Itinerario — solo datos de /schedules ── */}
        <Text style={[s.sectionTitle, { marginTop: 16 }]}>Mi Itinerario</Text>
        {schedules.length === 0 ? (
          <View style={s.emptyBlock}>
            <Feather name="calendar" size={44} color="#2a2a2a" />
            <Text style={s.emptyTitle}>No tienes clases programadas hoy.</Text>
            <Text style={s.emptySub}>Cuando el backend asigne horarios aparecerán aquí.</Text>
          </View>
        ) : (
          schedules.map((sch, idx) => (
            <ItinCard key={idx} sch={sch} />
          ))
        )}

        {/* Lista clases */}
        <Text style={[s.sectionTitle, { marginTop: 16 }]}>Próximas Clases</Text>

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

        {!isLoading && clases.map(item => (
          <ScheduleCard key={item.id} schedule={item} />
        ))}

        {/* Acceso Rápido */}
        <Text style={[s.sectionTitle, { marginTop: 24 }]}>Accesos Rápidos</Text>
        <TouchableOpacity
          style={[s.actionBtn, { borderColor: clases.length > 0 ? '#FF5E00' : '#2a2a2a' }]}
          activeOpacity={0.8}
          disabled={clases.length === 0}
          onPress={() => {
            const c = clases[0];
            navigation.navigate('ClaseDetalle' as never, {
              scheduleId:   c.id,
              activityName: c.activityName,
              startTime:    c.startTime,
              endTime:      c.endTime,
            } as never);
          }}
        >
          <MaterialCommunityIcons
            name="account-group-outline"
            size={26}
            color={clases.length > 0 ? '#FF5E00' : '#333'}
          />
          <Text style={[s.actionTxt, { color: clases.length > 0 ? '#FF5E00' : '#333' }]}>
            Ver Alumnos de mi primera clase
          </Text>
        </TouchableOpacity>

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

  summaryRow:   { flexDirection: 'row', gap: 10, marginBottom: 24 },
  summaryCard:  { flex: 1, backgroundColor: '#0e0e0e', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#1a1a1a' },
  summaryNum:   { color: '#fff', fontSize: 26, fontWeight: '900' },
  summaryLabel: { color: '#444', fontSize: 11, marginTop: 2 },

  sectionTitle: { color: '#555', fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12 },

  emptyBlock: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 12 },
  emptyTitle: { color: '#555', fontSize: 15, fontWeight: '700', textAlign: 'center' },
  emptySub:   { color: '#333', fontSize: 12, textAlign: 'center', lineHeight: 18 },

  chartCard: { backgroundColor: '#0e0e0e', borderRadius: 14, borderWidth: 1, borderColor: '#1a1a1a', overflow: 'hidden', marginBottom: 20 },
  chart:     { borderRadius: 14 },

  itinCard:   { backgroundColor: '#1C1C1E', borderRadius: 12, padding: 14, marginBottom: 10, gap: 8 },
  itinRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itinTime:   { color: '#38BDF8', fontSize: 13, fontWeight: '700' },
  itinName:   { color: '#fff',    fontSize: 14, fontWeight: '700', flex: 1 },
  itinPlace:  { color: '#555',    fontSize: 12, flex: 1 },
  itinEnroll: { fontSize: 13, fontWeight: '600' },

  attendeesBlock: { marginTop: 10, borderTopWidth: 1, borderColor: '#2A2A2D', paddingTop: 10, gap: 2 },
  attendeesLabel: { color: '#555', fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 },
  attendeesEmpty: { color: '#444', fontSize: 13, fontStyle: 'italic' },
  attendeeRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, gap: 8, backgroundColor: '#2A2A2D', borderRadius: 8, paddingHorizontal: 10, marginBottom: 4 },
  attendeeName:   { color: '#fff', fontSize: 13, fontWeight: '500', flex: 1 },

  card:         { backgroundColor: '#0e0e0e', borderRadius: 14, borderWidth: 1, borderColor: '#1a1a1a', borderLeftWidth: 3, borderLeftColor: '#f05b22', padding: 14, marginBottom: 10 },
  cardHeader:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  expandedBlock:{ marginTop: 12, borderTopWidth: 1, borderColor: '#333', paddingTop: 12, gap: 8 },
  afoRow:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  afoLabel:     { color: '#888', fontSize: 12 },
  afoValue:     { fontWeight: '700', fontSize: 13 },
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

  actionsRow: { flexDirection: 'row', gap: 8 },
  actionBtn:  { flex: 1, backgroundColor: '#0e0e0e', borderRadius: 14, borderWidth: 1, paddingVertical: 18, alignItems: 'center', gap: 7 },
  actionTxt:  { fontSize: 11, fontWeight: '700', textAlign: 'center' },
});
