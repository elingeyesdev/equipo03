import { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import authAxios from '../../../app/Providers/auth/authAxios';

type MetricEntry = {
  id: string;
  recordedAt: string;
  weightKg: number | null;
  muscleMassKg: number | null;
  bodyFatPercentage: number | null;
};

type Filter = 'semana' | 'mes' | 'todo';

const SCREEN_W = Dimensions.get('window').width;

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

function applyFilter(entries: MetricEntry[], filter: Filter): MetricEntry[] {
  if (filter === 'todo') return entries;
  const cutoff = Date.now() - (filter === 'semana' ? 7 : 30) * 86_400_000;
  return entries.filter(e => new Date(e.recordedAt).getTime() >= cutoff);
}

export const HistorialMetricasScreen = () => {
  const [entries,  setEntries]  = useState<MetricEntry[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [filter,   setFilter]   = useState<Filter>('mes');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await authAxios.get('/api/users/me/metrics');
        if (cancelled) return;
        setEntries(res.data?.data ?? res.data ?? []);
      } catch (e: any) {
        if (!cancelled) setError(e?.response?.data?.message ?? 'No se pudo cargar el historial.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) return (
    <SafeAreaView style={[s.container, s.center]}>
      <ActivityIndicator size="large" color="#f05b22" />
    </SafeAreaView>
  );

  if (error) return (
    <SafeAreaView style={[s.container, s.center]}>
      <Text style={s.errorText}>{error}</Text>
    </SafeAreaView>
  );

  const filtered     = applyFilter(entries, filter);
  const weightPoints = filtered.filter(e => e.weightKg != null);
  const showChart    = weightPoints.length >= 2;

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'semana', label: 'Semana' },
    { key: 'mes',    label: 'Mes'    },
    { key: 'todo',   label: 'Todo'   },
  ];

  return (
    <SafeAreaView style={s.container}>
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={s.listContent}
        ListHeaderComponent={
          <>
            {/* ── Filtros ── */}
            <View style={s.filterRow}>
              {FILTERS.map(f => (
                <TouchableOpacity
                  key={f.key}
                  style={[s.filterBtn, filter === f.key && s.filterBtnActive]}
                  onPress={() => setFilter(f.key)}
                  activeOpacity={0.8}
                >
                  <Text style={[s.filterText, filter === f.key && s.filterTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ── Gráfico ── */}
            {showChart && (
              <View style={s.chartCard}>
                <Text style={s.chartTitle}>Evolución de Peso</Text>
                <LineChart
                  data={{
                    labels: weightPoints.map(h => h.recordedAt.substring(5, 10)),
                    datasets: [{ data: weightPoints.map(h => h.weightKg as number) }],
                  }}
                  width={SCREEN_W - 32}
                  height={220}
                  yAxisSuffix="kg"
                  chartConfig={{
                    backgroundColor: '#111',
                    backgroundGradientFrom: '#1e1e1e',
                    backgroundGradientTo: '#2c2c2e',
                    decimalPlaces: 1,
                    color: (opacity = 1) => `rgba(255, 85, 0, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                    style: { borderRadius: 16 },
                    propsForDots: { r: '4', strokeWidth: '2', stroke: '#ff5500' },
                  }}
                  bezier
                  style={{ marginVertical: 8, borderRadius: 16 }}
                />
              </View>
            )}

            {filtered.length === 0 && (
              <Text style={s.emptyText}>Sin registros en este período.</Text>
            )}
          </>
        }
        renderItem={({ item, index }) => (
          <View style={s.card}>
            <View style={s.cardHeader}>
              <Text style={s.cardDate}>{fmtDate(item.recordedAt)}</Text>
              <Text style={s.cardIndex}>#{filtered.length - index}</Text>
            </View>
            <View style={s.cardRow}>
              {item.weightKg != null && (
                <View style={s.stat}>
                  <Text style={s.statVal}>{item.weightKg}</Text>
                  <Text style={s.statLabel}>kg peso</Text>
                </View>
              )}
              {item.muscleMassKg != null && (
                <View style={s.stat}>
                  <Text style={[s.statVal, { color: '#00cc88' }]}>{item.muscleMassKg}</Text>
                  <Text style={s.statLabel}>kg músculo</Text>
                </View>
              )}
              {item.bodyFatPercentage != null && (
                <View style={s.stat}>
                  <Text style={[s.statVal, { color: '#f5a623' }]}>{item.bodyFatPercentage}%</Text>
                  <Text style={s.statLabel}>grasa</Text>
                </View>
              )}
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#000000' },
  center:           { justifyContent: 'center', alignItems: 'center' },
  listContent:      { padding: 16, paddingBottom: 60 },
  errorText:        { color: '#ff4444', fontSize: 15, textAlign: 'center', paddingHorizontal: 32 },
  emptyText:        { color: '#666', fontStyle: 'italic', textAlign: 'center', marginTop: 40 },

  // Filtros
  filterRow:        { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterBtn:        { flex: 1, paddingVertical: 9, borderRadius: 8, backgroundColor: '#1C1C1E', alignItems: 'center', borderWidth: 1, borderColor: '#3A3A3C' },
  filterBtnActive:  { backgroundColor: '#00c853', borderColor: '#00c853' },
  filterText:       { color: '#888', fontWeight: '700', fontSize: 13 },
  filterTextActive: { color: '#000' },

  // Gráfico
  chartCard:        { backgroundColor: '#111', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 4, marginBottom: 16, overflow: 'hidden' },
  chartTitle:       { color: '#fff', fontWeight: 'bold', fontSize: 15, marginBottom: 4, paddingHorizontal: 8 },

  // Cards historial
  card:             { backgroundColor: '#111', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#3A3A3C' },
  cardHeader:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  cardDate:         { color: '#fff', fontWeight: '700', fontSize: 14 },
  cardIndex:        { color: '#444', fontSize: 12 },
  cardRow:          { flexDirection: 'row', gap: 20 },
  stat:             { alignItems: 'center' },
  statVal:          { color: '#f05b22', fontSize: 22, fontWeight: '900' },
  statLabel:        { color: '#666', fontSize: 11, marginTop: 2 },
});
