import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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

interface DisplayVisit {
  id: string;
  gymId: number;
  gymName: string;
  gymAddress?: string;
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

export const HistorialScreen = () => {
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

  if (loadingBackend) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#f05b22" />
      </View>
    );
  }

  if (isError && !allVisits.length) {
    return (
      <View style={s.center}>
        <MaterialCommunityIcons name="wifi-off" size={48} color="#555" />
        <Text style={s.centerText}>No se pudo cargar el historial.</Text>
        <TouchableOpacity style={s.retryBtn} onPress={() => refetch()}>
          <Text style={s.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!allVisits.length) {
    return (
      <View style={s.center}>
        <MaterialCommunityIcons name="map-marker-off-outline" size={56} color="#333" />
        <Text style={s.centerText}>Aún no has visitado ningún gimnasio.</Text>
        <Text style={s.centerSub}>La app detecta automáticamente cuando estás en una sede.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={s.root} edges={[]}>
      <FlatList
        data={allVisits}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={s.header}>
            <MaterialCommunityIcons name="history" size={22} color="#f05b22" />
            <Text style={s.headerText}>
              {allVisits.length} visita{allVisits.length !== 1 ? 's' : ''} registrada{allVisits.length !== 1 ? 's' : ''}
            </Text>
          </View>
        }
        renderItem={({ item }: { item: DisplayVisit }) => {
          const idx = stableIdx(item.gymId);
          return (
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
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: '#000' },
  list:       { padding: 16, paddingBottom: 120 },
  center:     { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', gap: 10, padding: 30 },
  centerText: { color: '#666', fontSize: 14, textAlign: 'center' },
  centerSub:  { color: '#444', fontSize: 12, textAlign: 'center' },
  retryBtn:   { backgroundColor: '#f05b22', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 24 },
  retryText:  { color: '#fff', fontWeight: '700' },

  header:     { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#111', borderRadius: 12, padding: 14, marginBottom: 14 },
  headerText: { color: '#aaa', fontSize: 13 },

  card:       { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#111', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'transparent' },
  cardActive: { borderColor: '#f05b22' },
  cardIcon:   { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12, flexShrink: 0 },
  cardBody:   { flex: 1, gap: 3 },
  nameRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  cardName:   { color: '#fff', fontSize: 15, fontWeight: '700', flex: 1 },
  cardAddress:{ color: '#555', fontSize: 11, marginBottom: 2 },
  activeBadge:{ backgroundColor: 'rgba(240,91,34,0.15)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: '#f05b22' },
  activeBadgeText: { color: '#f05b22', fontSize: 10, fontWeight: '700' },
  row:        { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta:       { color: '#666', fontSize: 11 },
});
