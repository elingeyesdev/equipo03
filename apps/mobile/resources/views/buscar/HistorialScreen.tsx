import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { visitsApi, VisitRecord } from '../../../app/Providers/geolocation/services/visits.api';
import { VisitStorageService, GymVisitRecord } from '../../../app/Providers/geolocation/services/VisitStorageService';

const ICON_COLORS = ['#1a1a2e', '#162447', '#1b1b2f', '#0f3460', '#533483', '#0d1b2a', '#1c2541'];
const ICONS      = ['dumbbell', 'weight-lifter', 'lightning-bolt', 'arm-flex', 'trophy', 'run-fast', 'bike'];
const stableIdx  = (id: number) => id % ICONS.length;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

const fmtDuration = (min?: number): string | null => {
  if (!min || min <= 0) return null;
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
};

// ─── Filtros de período ───────────────────────────────────────────────────────
type FilterPeriod = 'all' | 'today' | 'week' | 'month';

const FILTER_OPTIONS: { key: FilterPeriod; label: string }[] = [
  { key: 'all',   label: 'Todas' },
  { key: 'today', label: 'Hoy' },
  { key: 'week',  label: 'Esta semana' },
  { key: 'month', label: 'Este mes' },
];

const isInPeriod = (dateStr: string, period: FilterPeriod): boolean => {
  const date = new Date(dateStr);
  const now  = new Date();
  if (period === 'all')   return true;
  if (period === 'today') return date.toDateString() === now.toDateString();
  if (period === 'week') {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return date >= weekAgo;
  }
  if (period === 'month') {
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return date >= monthAgo;
  }
  return true;
};

// ─── Tipos internos ───────────────────────────────────────────────────────────
interface DisplayVisit {
  id: string;
  gymId: number;
  gymName: string;
  gymAddress?: string;
  latitude?: number;
  longitude?: number;
  enteredAt: string;
  exitedAt?: string;
  durationMin?: number;
  isActive: boolean;
}

const toDisplay = (v: VisitRecord): DisplayVisit => ({
  id:          String(v.id),
  gymId:       v.gymId,
  gymName:     v.gym?.name ?? `Gimnasio #${v.gymId}`,
  gymAddress:  v.gym?.location?.address,
  latitude:    v.gym?.location?.latitude,
  longitude:   v.gym?.location?.longitude,
  enteredAt:   v.enteredAt,
  exitedAt:    v.exitedAt,
  durationMin: v.durationMin,
  isActive:    false,
});

const localToDisplay = (v: GymVisitRecord): DisplayVisit => ({
  id:          v.id,
  gymId:       v.gymId,
  gymName:     v.gymName,
  gymAddress:  v.gymAddress,
  enteredAt:   v.enteredAt,
  exitedAt:    v.exitedAt,
  durationMin: v.durationMin,
  isActive:    !v.exitedAt,
});

// ─── Componente ───────────────────────────────────────────────────────────────
export const HistorialScreen = () => {
  const navigation = useNavigation<any>();
  const [activeFilter, setActiveFilter] = useState<FilterPeriod>('all');

  const {
    data: backendVisits = [],
    isLoading: loadingBackend,
    isError,
    refetch,
  } = useQuery<VisitRecord[]>({
    queryKey:  ['visits-backend'],
    queryFn:   visitsApi.getMyVisits,
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });

  const { data: activeLocalVisit } = useQuery<GymVisitRecord | null>({
    queryKey:  ['active-local-visit'],
    queryFn:   VisitStorageService.getActiveVisit,
    staleTime: 0,
    refetchInterval: 15000,
  });

  const allVisits: DisplayVisit[] = [
    ...(activeLocalVisit ? [localToDisplay(activeLocalVisit)] : []),
    ...backendVisits.map(toDisplay),
  ].sort((a, b) => b.enteredAt.localeCompare(a.enteredAt));

  // Visita activa siempre visible independientemente del filtro
  const filteredVisits = allVisits.filter(
    v => v.isActive || isInPeriod(v.enteredAt, activeFilter)
  );

  const header = (
    <View style={s.topBar}>
      <TouchableOpacity style={s.topBackBtn} onPress={() => navigation.goBack()}>
        <MaterialCommunityIcons name="chevron-left" size={22} color="#fff" />
      </TouchableOpacity>
      <Text style={s.topTitle}>Historial de Gimnasios</Text>
      <View style={s.topRight} />
    </View>
  );

  if (loadingBackend) {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        {header}
        <View style={s.center}>
          <ActivityIndicator size="large" color="#f05b22" />
        </View>
      </SafeAreaView>
    );
  }

  if (isError && !allVisits.length) {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        {header}
        <View style={s.center}>
          <MaterialCommunityIcons name="wifi-off" size={48} color="#555" />
          <Text style={s.centerText}>No se pudo cargar el historial.</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => refetch()}>
            <Text style={s.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!allVisits.length) {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        {header}
        <View style={s.center}>
          <MaterialCommunityIcons name="map-marker-off-outline" size={56} color="#333" />
          <Text style={s.centerText}>Aún no has visitado ningún gimnasio.</Text>
          <Text style={s.centerSub}>La app detecta automáticamente cuando estás en una marca.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      {header}
      <FlatList
        data={filteredVisits}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* ── Resumen ── */}
            <View style={s.header}>
              <MaterialCommunityIcons name="history" size={22} color="#f05b22" />
              <Text style={s.headerText}>
                {allVisits.length} visita{allVisits.length !== 1 ? 's' : ''} registrada{allVisits.length !== 1 ? 's' : ''}
              </Text>
            </View>

            {/* ── Filtros de período ── */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.filtersRow}
            >
              {FILTER_OPTIONS.map(f => (
                <TouchableOpacity
                  key={f.key}
                  style={[s.filterChip, activeFilter === f.key && s.filterChipActive]}
                  onPress={() => setActiveFilter(f.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.filterChipText, activeFilter === f.key && s.filterChipTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* ── Contador del filtro activo ── */}
            {activeFilter !== 'all' && (
              <Text style={s.filterCount}>
                {filteredVisits.length} resultado{filteredVisits.length !== 1 ? 's' : ''}
              </Text>
            )}
          </>
        }
        ListEmptyComponent={
          <View style={s.emptyFilter}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={44} color="#333" />
            <Text style={s.centerText}>Sin visitas en este período.</Text>
            <TouchableOpacity onPress={() => setActiveFilter('all')}>
              <Text style={s.linkText}>Ver todas las visitas</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }: { item: DisplayVisit }) => {
          const idx = stableIdx(item.gymId);
          const hasCoords = !!(item.latitude && item.longitude);
          const handlePress = () => {
            navigation.navigate('VisitedGymMap', {
              gymId:     item.gymId,
              name:      item.gymName,
              latitude:  item.latitude,
              longitude: item.longitude,
            });
          };
          return (
            <TouchableOpacity activeOpacity={0.75} onPress={handlePress}>
            <View style={[s.card, item.isActive && s.cardActive]}>
              <View style={[s.cardIcon, { backgroundColor: ICON_COLORS[idx] }]}>
                <MaterialCommunityIcons name={ICONS[idx] as any} size={24} color="#fff" />
              </View>

              <View style={s.cardBody}>
                <View style={s.nameRow}>
                  <Text style={s.cardName} numberOfLines={1}>{item.gymName}</Text>
                  {item.isActive && (
                    <View style={s.activeBadge}>
                      <Text style={s.activeBadgeText}>En vivo</Text>
                    </View>
                  )}
                </View>

                {!!item.gymAddress && (
                  <Text style={s.cardAddress} numberOfLines={1}>{item.gymAddress}</Text>
                )}

                <View style={s.row}>
                  <MaterialCommunityIcons name="calendar" size={11} color="#555" />
                  <Text style={s.meta}>{formatDate(item.enteredAt)}</Text>
                </View>

                <View style={s.row}>
                  <MaterialCommunityIcons name="login" size={11} color="#555" />
                  <Text style={s.meta}>Entrada: {formatTime(item.enteredAt)}</Text>
                  {!!item.exitedAt && (
                    <Text style={s.meta}>  ·  Salida: {formatTime(item.exitedAt)}</Text>
                  )}
                </View>

                {!!fmtDuration(item.durationMin) && (
                  <View style={s.row}>
                    <MaterialCommunityIcons name="timer-outline" size={11} color="#f05b22" />
                    <Text style={[s.meta, { color: '#f05b22' }]}>{fmtDuration(item.durationMin)}</Text>
                  </View>
                )}

                <View style={s.mapHint}>
                  <MaterialCommunityIcons name="map-marker-outline" size={11} color="#f05b22" />
                  <Text style={s.mapHintTxt}>
                    {hasCoords ? 'Ver ubicación en mapa' : 'Ver mapa'}
                  </Text>
                  <MaterialCommunityIcons name="chevron-right" size={13} color="#333" style={{ marginLeft: 'auto' }} />
                </View>
              </View>
            </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#3A3A3C',
  },
  topBackBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#1C1C1E', borderWidth: 1, borderColor: '#3A3A3C',
    justifyContent: 'center', alignItems: 'center',
  },
  topTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  topRight: { width: 40 },

  list: { padding: 16, paddingBottom: 120 },
  center:     { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', gap: 10, padding: 30 },
  centerText: { color: '#666', fontSize: 14, textAlign: 'center' },
  centerSub:  { color: '#444', fontSize: 12, textAlign: 'center' },
  retryBtn:   { backgroundColor: '#f05b22', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 24 },
  retryText:  { color: '#fff', fontWeight: '700' },

  header:     { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#111', borderRadius: 12, padding: 14, marginBottom: 12 },
  headerText: { color: '#aaa', fontSize: 13 },

  // Filtros
  filtersRow:       { gap: 8, paddingBottom: 12 },
  filterChip:       { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1C1C1E', borderWidth: 1, borderColor: '#3A3A3C' },
  filterChipActive: { backgroundColor: '#1C1C1E', borderColor: '#FF5E00' },
  filterChipText:   { color: '#666', fontSize: 13, fontWeight: '600' },
  filterChipTextActive: { color: '#f05b22' },
  filterCount:      { color: '#444', fontSize: 12, marginBottom: 10 },

  emptyFilter: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  linkText:    { color: '#f05b22', fontSize: 13, fontWeight: '600', marginTop: 4 },

  card:       { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#111', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'transparent' },
  cardActive: { borderColor: '#f05b22' },
  cardIcon:   { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12, flexShrink: 0 },
  cardBody:   { flex: 1, gap: 3 },
  nameRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  cardName:   { color: '#fff', fontSize: 15, fontWeight: '700', flex: 1 },
  cardAddress:{ color: '#555', fontSize: 11, marginBottom: 2 },
  activeBadge:{ backgroundColor: '#1C1C1E', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: '#FF5E00' },
  activeBadgeText: { color: '#f05b22', fontSize: 10, fontWeight: '700' },
  row:        { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta:       { color: '#666', fontSize: 11 },
  mapHint:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#3A3A3C' },
  mapHintTxt: { color: '#f05b22', fontSize: 11, fontWeight: '600' },
});
