import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { WorkoutSession } from '../../../app/Providers/training/api/training.api';
import { ClientRoutineExercise } from '../../../app/Providers/staff/api/staff.api';

// ─── Types ────────────────────────────────────────────────────────────────────

type RouteParams = {
  exercise:   ClientRoutineExercise;
  sessions:   WorkoutSession[];
  clientName: string;
};

type TimeFilter = 'HOY' | 'SEMANA' | 'MES' | 'TODO';

// ─── Constants ────────────────────────────────────────────────────────────────

const { width: SW } = Dimensions.get('window');
const MAX_POINTS = 10;
const CHART_H    = 130;
const CHART_W    = SW - 64;
const DOT_R      = 5;

const TIME_FILTERS: { key: TimeFilter; label: string }[] = [
  { key: 'HOY',    label: 'Hoy' },
  { key: 'SEMANA', label: 'Semana' },
  { key: 'MES',    label: 'Mes' },
  { key: 'TODO',   label: 'Todo' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtShortDate = (iso: string) => {
  try {
    const d = new Date(iso);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  } catch { return '—'; }
};

const fmtTime = (iso: string | null | undefined) => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  } catch { return ''; }
};

const fmtDateTime = (iso: string | null | undefined) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('es-BO', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
};

const fmtDur = (secs: number | null) => {
  if (!secs) return '—';
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const STATUS_META: Record<string, { label: string; color: string; icon: string }> = {
  IN_PROGRESS: { label: 'En progreso', color: '#60a5fa', icon: 'play-circle-outline' },
  COMPLETED:   { label: 'Completada',  color: '#22c55e', icon: 'check-circle-outline' },
  PARTIAL:     { label: 'Parcial',     color: '#facc15', icon: 'flag-checkered' },
  FINISHED:    { label: 'Finalizada',  color: '#22c55e', icon: 'check-circle-outline' },
  CANCELLED:   { label: 'Cancelada',   color: '#ef4444', icon: 'close-circle-outline' },
};

const applyTimeFilter = (sessions: WorkoutSession[], filter: TimeFilter): WorkoutSession[] => {
  if (filter === 'TODO') return sessions;
  const now  = Date.now();
  const MS   = { HOY: 86_400_000, SEMANA: 7 * 86_400_000, MES: 30 * 86_400_000 };
  const from = now - (MS[filter] ?? 0);
  return sessions.filter(s => {
    const ts = new Date((s as any).finishedAt ?? s.startedAt).getTime();
    return !isNaN(ts) && ts >= from;
  });
};

// ─── Metric Building ──────────────────────────────────────────────────────────

type SessionMetric = {
  value:    number;
  label:    string;
  shortDate: string;
  time:     string;
  dateTime: string;
  status:   string;
};

const buildMetrics = (sessions: WorkoutSession[]): SessionMetric[] =>
  sessions.slice(0, MAX_POINTS).map(s => {
    const sets = s.sets ?? [];
    const totalDist = sets.reduce((a, b) => a + (b.distanceMeters ?? 0), 0);
    const totalDur  = sets.reduce((a, b) => a + (b.durationSeconds ?? 0), 0);
    const maxWeight = Math.max(0, ...sets.map(b => b.weightUsedKg ?? 0));
    const totalReps = sets.reduce((a, b) => a + (b.repsCompleted ?? 0), 0);

    let value = 0;
    let label = '';
    if (totalDist > 0)      { value = totalDist; label = `${totalDist}m`; }
    else if (totalDur > 0)  { value = totalDur;  label = `${Math.round(totalDur / 60)}min`; }
    else if (maxWeight > 0) { value = maxWeight;  label = `${maxWeight}kg`; }
    else if (totalReps > 0) { value = totalReps;  label = `${totalReps}r`; }

    const finishedIso = (s as any).finishedAt ?? null;
    return {
      value,
      label,
      shortDate: fmtShortDate(s.startedAt),
      time:      fmtTime(finishedIso ?? s.startedAt),
      dateTime:  fmtDateTime(finishedIso ?? s.startedAt),
      status:    s.status,
    };
  }).reverse(); // oldest → left to right

// ─── Line Chart ───────────────────────────────────────────────────────────────

const LineChart = ({ metrics }: { metrics: SessionMetric[] }) => {
  const maxVal = Math.max(1, ...metrics.map(m => m.value));

  if (metrics.length === 0 || metrics.every(m => m.value === 0)) {
    return (
      <View style={cs.emptyChart}>
        <MaterialCommunityIcons name="chart-line" size={28} color="#1a1a1a" />
        <Text style={cs.emptyChartTxt}>Sin datos para este período</Text>
      </View>
    );
  }

  const n    = metrics.length;
  const getX = (i: number) => n === 1 ? CHART_W / 2 : (i / (n - 1)) * CHART_W;
  const getY = (v: number) => (CHART_H - 16) - (v / maxVal) * (CHART_H - 24);

  const points = metrics.map((m, i) => ({ ...m, x: getX(i), y: getY(m.value) }));

  // Show x-axis labels: always show for ≤5, every 2nd for 6-8, every 3rd for 9+
  const showLabel = (i: number) => {
    if (n <= 5) return true;
    if (n <= 8) return i % 2 === 0 || i === n - 1;
    return i % 3 === 0 || i === n - 1;
  };

  return (
    <View style={cs.chartOuter}>
      <View style={{ width: CHART_W, height: CHART_H + 44, position: 'relative' }}>

        {/* Horizontal grid lines */}
        {[0, 0.5, 1].map(t => (
          <View key={`grid-${t}`} style={{
            position: 'absolute',
            left: 0, right: 0,
            top: getY(maxVal * t),
            height: 1,
            backgroundColor: '#181818',
          }} />
        ))}

        {/* Connecting lines between dots */}
        {points.slice(0, -1).map((pt, i) => {
          const next = points[i + 1];
          const dx   = next.x - pt.x;
          const dy   = next.y - pt.y;
          const len  = Math.sqrt(dx * dx + dy * dy);
          const ang  = Math.atan2(dy, dx) * (180 / Math.PI);
          const midX = (pt.x + next.x) / 2;
          const midY = (pt.y + next.y) / 2;
          return (
            <View key={`line-${i}`} style={{
              position: 'absolute',
              width: len,
              height: 2,
              left: midX - len / 2,
              top: midY - 1,
              backgroundColor: '#f05b22',
              opacity: 0.8,
              transform: [{ rotate: `${ang}deg` }],
            }} />
          );
        })}

        {/* Dots + value labels */}
        {points.map((pt, i) => {
          const meta     = STATUS_META[pt.status];
          const dotColor = meta?.color ?? '#f05b22';
          return (
            <View key={`pt-${i}`}>
              {/* Value above dot */}
              {pt.label ? (
                <Text style={{
                  position: 'absolute',
                  left: pt.x - 22,
                  top: pt.y - 18,
                  width: 44,
                  textAlign: 'center',
                  color: '#888',
                  fontSize: 8,
                  fontWeight: '700',
                }}>
                  {pt.label}
                </Text>
              ) : null}

              {/* Dot */}
              <View style={{
                position: 'absolute',
                left: pt.x - DOT_R,
                top: pt.y - DOT_R,
                width: DOT_R * 2,
                height: DOT_R * 2,
                borderRadius: DOT_R,
                backgroundColor: dotColor,
                borderWidth: 2,
                borderColor: '#000',
              }} />

              {/* Date + time below chart */}
              {showLabel(i) ? (
                <View style={{
                  position: 'absolute',
                  left: pt.x - 22,
                  top: CHART_H + 8,
                  width: 44,
                  alignItems: 'center',
                }}>
                  <Text style={{ color: '#555', fontSize: 8, lineHeight: 11 }}>
                    {pt.shortDate}
                  </Text>
                  {pt.time ? (
                    <Text style={{ color: '#333', fontSize: 7, lineHeight: 10 }}>
                      {pt.time}
                    </Text>
                  ) : null}
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
};

// ─── Session Card ─────────────────────────────────────────────────────────────

const SessionCard = ({ session }: { session: WorkoutSession }) => {
  const meta  = STATUS_META[session.status] ?? { label: session.status, color: '#555', icon: 'circle-outline' };
  const sets  = session.sets ?? [];
  const loc   = session.gym?.name ?? (session as any).locationText ?? 'Fuera de Sucursales';

  const setsWithWeight = sets.filter(s => (s.weightUsedKg ?? 0) > 0);
  const maxWeight      = setsWithWeight.length > 0 ? Math.max(...setsWithWeight.map(s => s.weightUsedKg ?? 0)) : null;
  const totalReps      = sets.reduce((a, b) => a + (b.repsCompleted ?? 0), 0);
  const totalDist      = sets.reduce((a, b) => a + (b.distanceMeters ?? 0), 0);
  const totalDurSecs   = sets.reduce((a, b) => a + (b.durationSeconds ?? 0), 0);

  const isCardio = totalDist > 0 || (totalDurSecs > 0 && totalReps === 0);
  const finishedIso = (session as any).finishedAt ?? null;

  return (
    <View style={cs.card}>
      {/* Header */}
      <View style={cs.cardHeader}>
        <View style={[cs.statusBadge, { backgroundColor: meta.color + '22', borderColor: meta.color + '44' }]}>
          <MaterialCommunityIcons name={meta.icon as any} size={12} color={meta.color} />
          <Text style={[cs.statusTxt, { color: meta.color }]}>{meta.label}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={cs.dateTxt}>{fmtDateTime(session.startedAt)}</Text>
          {finishedIso && (
            <Text style={cs.finishedTxt}>
              Fin: {fmtDateTime(finishedIso)}
            </Text>
          )}
        </View>
      </View>

      {/* Stats */}
      <View style={cs.statsGrid}>
        <View style={cs.statItem}>
          <MaterialCommunityIcons name="timer-outline" size={16} color="#555" />
          <Text style={cs.statVal}>{fmtDur(session.durationSeconds)}</Text>
          <Text style={cs.statLbl}>Duración</Text>
        </View>
        <View style={cs.statItem}>
          <MaterialCommunityIcons name="repeat" size={16} color="#555" />
          <Text style={cs.statVal}>{sets.length}</Text>
          <Text style={cs.statLbl}>Series</Text>
        </View>
        {isCardio ? (
          <>
            {totalDist > 0 && (
              <View style={cs.statItem}>
                <MaterialCommunityIcons name="map-marker-distance" size={16} color="#60a5fa" />
                <Text style={[cs.statVal, { color: '#60a5fa' }]}>{totalDist}m</Text>
                <Text style={cs.statLbl}>Distancia</Text>
              </View>
            )}
            {totalDurSecs > 0 && (
              <View style={cs.statItem}>
                <MaterialCommunityIcons name="clock-outline" size={16} color="#60a5fa" />
                <Text style={[cs.statVal, { color: '#60a5fa' }]}>{Math.round(totalDurSecs / 60)} min</Text>
                <Text style={cs.statLbl}>Tiempo ej.</Text>
              </View>
            )}
          </>
        ) : (
          <>
            {maxWeight != null && (
              <View style={cs.statItem}>
                <MaterialCommunityIcons name="weight" size={16} color="#f05b22" />
                <Text style={[cs.statVal, { color: '#f05b22' }]}>{maxWeight} kg</Text>
                <Text style={cs.statLbl}>Max peso</Text>
              </View>
            )}
            {totalReps > 0 && (
              <View style={cs.statItem}>
                <MaterialCommunityIcons name="dumbbell" size={16} color="#818cf8" />
                <Text style={[cs.statVal, { color: '#818cf8' }]}>{totalReps}</Text>
                <Text style={cs.statLbl}>Total reps</Text>
              </View>
            )}
          </>
        )}
      </View>

      {/* Location */}
      <View style={cs.locRow}>
        <MaterialCommunityIcons name="map-marker-outline" size={13} color="#333" />
        <Text style={cs.locTxt}>{loc}</Text>
      </View>

      {/* Sets detail */}
      {sets.length > 0 && (
        <View style={cs.setsSection}>
          <Text style={cs.setsSectionTitle}>Series registradas</Text>
          {sets.map((set, i) => (
            <View key={i} style={cs.setRow}>
              <View style={cs.setBadge}>
                <Text style={cs.setBadgeTxt}>{set.setNumber}</Text>
              </View>
              {isCardio ? (
                <Text style={cs.setDetail}>
                  {set.distanceMeters != null ? `${set.distanceMeters} m` : '—'}
                  {set.durationSeconds != null ? ` · ${Math.round(set.durationSeconds / 60)} min` : ''}
                </Text>
              ) : (
                <Text style={cs.setDetail}>
                  {set.repsCompleted ?? '—'} reps
                  {(set.weightUsedKg ?? 0) > 0 ? ` · ${set.weightUsedKg} kg` : ''}
                  {set.weightUsedKg && set.repsCompleted
                    ? <Text style={cs.setVol}>{`  (${(set.weightUsedKg * set.repsCompleted).toFixed(0)} kg vol.)`}</Text>
                    : null}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const RegistroEjercicioScreen = () => {
  const navigation = useNavigation<any>();
  const route      = useRoute<RouteProp<Record<string, RouteParams>, string>>();
  const { exercise, sessions, clientName } = route.params;

  const [timeFilter, setTimeFilter] = useState<TimeFilter>('TODO');

  const filteredSessions = useMemo(
    () => applyTimeFilter(sessions, timeFilter),
    [sessions, timeFilter],
  );

  const metrics = useMemo(() => buildMetrics(filteredSessions), [filteredSessions]);

  const avgWeight = useMemo(() => {
    const vals = filteredSessions
      .flatMap(s => (s.sets ?? []).map(set => set.weightUsedKg ?? 0))
      .filter(v => v > 0);
    return vals.length > 0 ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : null;
  }, [filteredSessions]);

  const totalSessions = filteredSessions.length;
  const completed     = filteredSessions.filter(s => s.status === 'COMPLETED' || s.status === 'FINISHED').length;

  return (
    <SafeAreaView style={cs.safe} edges={['top']}>
      {/* Header */}
      <View style={cs.topBar}>
        <TouchableOpacity style={cs.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={cs.topTitle} numberOfLines={1}>{exercise.exercise?.name ?? 'Ejercicio'}</Text>
          <Text style={cs.topSub}>{clientName}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={cs.scroll}>

        {/* Summary stats */}
        <View style={cs.summaryRow}>
          <View style={cs.summaryCard}>
            <Text style={cs.summaryVal}>{totalSessions}</Text>
            <Text style={cs.summaryLbl}>Sesiones</Text>
          </View>
          <View style={cs.summaryCard}>
            <Text style={[cs.summaryVal, { color: '#22c55e' }]}>{completed}</Text>
            <Text style={cs.summaryLbl}>Completadas</Text>
          </View>
          {avgWeight && (
            <View style={cs.summaryCard}>
              <Text style={[cs.summaryVal, { color: '#f05b22' }]}>{avgWeight} kg</Text>
              <Text style={cs.summaryLbl}>Peso prom.</Text>
            </View>
          )}
        </View>

        {/* Time filter chips */}
        <View style={cs.filterRow}>
          {TIME_FILTERS.map(f => (
            <TouchableOpacity
              key={f.key}
              style={[cs.filterChip, timeFilter === f.key && cs.filterChipActive]}
              onPress={() => setTimeFilter(f.key)}
              activeOpacity={0.75}
            >
              <Text style={[cs.filterChipTxt, timeFilter === f.key && cs.filterChipTxtActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Line Chart */}
        <View style={cs.chartSection}>
          <Text style={cs.sectionTitle}>Progresión</Text>
          <View style={cs.chartContainer}>
            <LineChart metrics={metrics} />
          </View>
        </View>

        {/* Session list */}
        <Text style={cs.sectionTitle}>
          Historial de sesiones
          {timeFilter !== 'TODO' ? (
            <Text style={cs.filterLabel}>
              {' '}· {TIME_FILTERS.find(f => f.key === timeFilter)?.label}
            </Text>
          ) : null}
        </Text>

        {filteredSessions.length === 0 ? (
          <View style={cs.emptyBox}>
            <MaterialCommunityIcons name="history" size={40} color="#1a1a1a" />
            <Text style={cs.emptyTxt}>
              {sessions.length === 0
                ? 'Sin sesiones registradas para este ejercicio.'
                : 'Sin sesiones en este período.'}
            </Text>
          </View>
        ) : (
          filteredSessions.map(s => <SessionCard key={s.id} session={s} />)
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const cs = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#000' },
  scroll: { padding: 16, paddingBottom: 120 },

  topBar:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#111' },
  backBtn:  { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  topTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  topSub:   { color: '#555', fontSize: 13, marginTop: 2 },

  summaryRow:  { flexDirection: 'row', gap: 10, marginBottom: 16 },
  summaryCard: { flex: 1, backgroundColor: '#0e0e0e', borderRadius: 14, borderWidth: 1, borderColor: '#1a1a1a', padding: 14, alignItems: 'center' },
  summaryVal:  { color: '#fff', fontSize: 20, fontWeight: '900' },
  summaryLbl:  { color: '#444', fontSize: 12, marginTop: 4 },

  filterRow: {
    flexDirection: 'row', gap: 8, marginBottom: 20,
  },
  filterChip: {
    flex: 1, paddingVertical: 9, borderRadius: 10,
    backgroundColor: '#0e0e0e', borderWidth: 1, borderColor: '#1a1a1a',
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: '#f05b22', borderColor: '#f05b22',
  },
  filterChipTxt:    { color: '#555', fontSize: 13, fontWeight: '700' },
  filterChipTxtActive: { color: '#fff' },

  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 12 },
  filterLabel:  { color: '#555', fontSize: 13, fontWeight: '400' },

  chartSection:   { marginBottom: 24 },
  chartContainer: {
    backgroundColor: '#0e0e0e', borderRadius: 14,
    borderWidth: 1, borderColor: '#1a1a1a',
    padding: 16, paddingBottom: 8,
  },
  chartOuter: { alignItems: 'center' },

  emptyChart:    { alignItems: 'center', paddingVertical: 32, gap: 10 },
  emptyChartTxt: { color: '#333', fontSize: 13, textAlign: 'center' },

  // Session card
  card: {
    backgroundColor: '#0e0e0e', borderRadius: 14,
    borderWidth: 1, borderColor: '#1a1a1a',
    padding: 14, marginBottom: 12,
  },
  cardHeader:  { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  statusTxt:   { fontSize: 12, fontWeight: '700' },
  dateTxt:     { color: '#555', fontSize: 12 },
  finishedTxt: { color: '#333', fontSize: 11, marginTop: 2 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  statItem:  { backgroundColor: '#111', borderRadius: 10, padding: 10, alignItems: 'center', minWidth: (SW - 80) / 4, flex: 1 },
  statVal:   { color: '#fff', fontSize: 16, fontWeight: '800', marginVertical: 2 },
  statLbl:   { color: '#444', fontSize: 11 },

  locRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
  locTxt: { color: '#444', fontSize: 12 },

  setsSection:      { borderTopWidth: 1, borderTopColor: '#111', paddingTop: 10, gap: 6 },
  setsSectionTitle: { color: '#555', fontSize: 12, fontWeight: '600', marginBottom: 6 },
  setRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  setBadge:  { width: 22, height: 22, borderRadius: 6, backgroundColor: '#151515', justifyContent: 'center', alignItems: 'center' },
  setBadgeTxt: { color: '#f05b22', fontSize: 11, fontWeight: '800' },
  setDetail: { color: '#666', fontSize: 13 },
  setVol:    { color: '#444', fontSize: 12 },

  emptyBox: { alignItems: 'center', gap: 10, paddingVertical: 32 },
  emptyTxt: { color: '#333', fontSize: 14, textAlign: 'center' },
});
