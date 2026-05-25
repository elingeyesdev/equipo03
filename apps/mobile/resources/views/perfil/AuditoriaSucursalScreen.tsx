import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addDays, subDays } from 'date-fns';
import { reservationApi } from '../../../app/Providers/reservations/api/reservation.api';

const QUERY_BASE = 'gym-audit-reservations';

type AuditReservation = {
  id: number;
  status: string;
  reservationDate: string;
  startTime?: string;
  endTime?: string;
  paymentStatus?: string;
  user?: {
    email?: string;
    phone?: string;
    profile?: { firstName?: string; lastName?: string };
  };
  gymActivitySchedule?: {
    startTime?: string;
    endTime?: string;
    dayOfWeek?: string;
    gymActivity?: { name?: string };
  };
};

const fmt5 = (t?: string | null) => t?.substring(0, 5) ?? '—';

const PENDING   = new Set(['PENDING', 'PENDIENTE']);
const CONFIRMED = new Set(['CONFIRMED', 'CONFIRMADA']);
const CANCELLED = new Set(['CANCELLED', 'CANCELADA']);

const statusLabel = (s: string) => {
  if (PENDING.has(s))   return 'Pendiente';
  if (CONFIRMED.has(s)) return 'Confirmada';
  if (CANCELLED.has(s)) return 'Cancelada';
  return s;
};

const statusColor = (s: string) => {
  if (PENDING.has(s))   return '#F59E0B';
  if (CONFIRMED.has(s)) return '#22C55E';
  if (CANCELLED.has(s)) return '#6B7280';
  return '#6B7280';
};

const buildDateStrip = (): string[] => {
  const today = new Date();
  const days: string[] = [];
  for (let i = -3; i <= 6; i++) {
    days.push(format(addDays(today, i), 'yyyy-MM-dd'));
  }
  return days;
};

const DAY_LABELS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

const DetailModal = ({ item, onClose }: { item: AuditReservation | null; onClose: () => void }) => {
  if (!item) return null;
  const schedule   = item.gymActivitySchedule;
  const firstName  = item.user?.profile?.firstName ?? '';
  const lastName   = item.user?.profile?.lastName  ?? '';
  const clientName = [firstName, lastName].filter(Boolean).join(' ') || '—';
  const start      = fmt5(schedule?.startTime ?? item.startTime);
  const end        = fmt5(schedule?.endTime   ?? item.endTime);
  const actName    = schedule?.gymActivity?.name ?? '—';
  const dow        = schedule?.dayOfWeek ?? '—';
  const sColor     = statusColor(item.status ?? '');
  const isPaid     = item.paymentStatus === 'PAID' || (item as any).isPaid === true;

  const Row = ({ label, value }: { label: string; value: string }) => (
    <View style={dm.row}>
      <Text style={dm.label}>{label}</Text>
      <Text style={dm.value}>{value}</Text>
    </View>
  );

  return (
    <Modal visible={!!item} transparent animationType="fade">
      <Pressable style={dm.overlay} onPress={onClose}>
        <Pressable style={dm.card} onPress={() => {}}>
          <View style={dm.header}>
            <MaterialCommunityIcons name="clipboard-list-outline" size={20} color="#f05b22" />
            <Text style={dm.title}>Detalle de Reserva</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialCommunityIcons name="close" size={20} color="#555" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={dm.section}>CLIENTE</Text>
            <Row label="Nombre"    value={clientName} />
            <Row label="Email"     value={item.user?.email ?? '—'} />
            <Row label="Teléfono"  value={item.user?.phone ?? '—'} />

            <Text style={dm.section}>RESERVA</Text>
            <Row label="Actividad" value={actName} />
            <Row label="Fecha"     value={item.reservationDate ?? '—'} />
            <Row label="Horario"   value={`${start} – ${end}`} />
            <Row label="Día"       value={dow} />

            <Text style={dm.section}>ESTADO</Text>
            <View style={dm.row}>
              <Text style={dm.label}>Reserva</Text>
              <View style={[dm.badge, { borderColor: sColor, backgroundColor: sColor + '22' }]}>
                <Text style={[dm.badgeTxt, { color: sColor }]}>{statusLabel(item.status ?? '')}</Text>
              </View>
            </View>
            <View style={dm.row}>
              <Text style={dm.label}>Pago</Text>
              <View style={[dm.badge, { borderColor: isPaid ? '#22C55E' : '#6B7280', backgroundColor: isPaid ? '#22C55E22' : '#6B728022' }]}>
                <Text style={[dm.badgeTxt, { color: isPaid ? '#22C55E' : '#6B7280' }]}>{isPaid ? 'Pagado' : 'Por pagar'}</Text>
              </View>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const dm = StyleSheet.create({
  overlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card:     { backgroundColor: '#111', borderRadius: 20, padding: 20, width: '100%', maxHeight: '80%', borderWidth: 1, borderColor: '#222' },
  header:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  title:    { flex: 1, color: '#fff', fontSize: 16, fontWeight: '800' },
  section:  { color: '#f05b22', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginTop: 14, marginBottom: 8 },
  row:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  label:    { color: '#666', fontSize: 13 },
  value:    { color: '#fff', fontSize: 13, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  badge:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  badgeTxt: { fontSize: 11, fontWeight: '700' },
});

export const AuditoriaSucursalScreen = () => {
  const queryClient = useQueryClient();
  const today       = format(new Date(), 'yyyy-MM-dd');
  const dateStrip   = useMemo(() => buildDateStrip(), []);

  const [filterDate, setFilterDate] = useState<string>(today);
  const [detailItem, setDetailItem] = useState<AuditReservation | null>(null);

  const { data: filtered = [], isLoading, isRefetching, refetch, error } = useQuery({
    queryKey: [QUERY_BASE, filterDate],
    queryFn:  () => reservationApi.getGymReservations(filterDate),
    staleTime: 30_000,
  });

  const confirmMutation = useMutation({
    mutationFn: (id: number) => reservationApi.confirmReservation(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_BASE] });
      const prev = queryClient.getQueryData<AuditReservation[]>(QUERY_KEY);
      queryClient.setQueryData<AuditReservation[]>(QUERY_KEY, (old = []) =>
        old.map(r => r.id === id ? { ...r, status: 'CONFIRMED' } : r)
      );
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(QUERY_KEY, ctx.prev);
      Alert.alert('Error', 'No se pudo confirmar la reserva.');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_BASE] }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => reservationApi.cancelReservation(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_BASE] });
      const prev = queryClient.getQueryData<AuditReservation[]>(QUERY_KEY);
      queryClient.setQueryData<AuditReservation[]>(QUERY_KEY, (old = []) =>
        old.map(r => r.id === id ? { ...r, status: 'CANCELLED' } : r)
      );
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(QUERY_KEY, ctx.prev);
      Alert.alert('Error', 'No se pudo rechazar la reserva.');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_BASE] }),
  });

  const handleConfirm = (id: number) =>
    Alert.alert('Confirmar', '¿Aprobar esta reserva?', [
      { text: 'No', style: 'cancel' },
      { text: 'Sí', onPress: () => confirmMutation.mutate(id) },
    ]);

  const handleReject = (id: number) =>
    Alert.alert('Rechazar', '¿Rechazar esta reserva?', [
      { text: 'No', style: 'cancel' },
      { text: 'Sí', style: 'destructive', onPress: () => cancelMutation.mutate(id) },
    ]);

  if (isLoading) return (
    <SafeAreaView style={s.safe}>
      <View style={s.center}>
        <ActivityIndicator size="large" color="#f05b22" />
        <Text style={s.soft}>Cargando reservas…</Text>
      </View>
    </SafeAreaView>
  );

  if (error) return (
    <SafeAreaView style={s.safe}>
      <View style={s.center}>
        <MaterialCommunityIcons name="wifi-off" size={48} color="#333" />
        <Text style={s.soft}>No se pudieron cargar las reservas.</Text>
        <TouchableOpacity style={s.retryBtn} onPress={() => refetch()}>
          <Text style={s.retryTxt}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.safe}>
      <DetailModal item={detailItem} onClose={() => setDetailItem(null)} />

      <View style={s.topBar}>
        <MaterialCommunityIcons name="shield-check-outline" size={20} color="#f05b22" />
        <Text style={s.topTitle}>Auditoría de Sucursal</Text>
        <View style={s.countBadge}>
          <Text style={s.countTxt}>{filtered.length}</Text>
        </View>
      </View>

      {/* Date Strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.strip}
        style={s.stripWrap}
      >
        {dateStrip.map(d => {
          const isSel   = d === filterDate;
          const isToday = d === today;
          const jsDate  = new Date(d + 'T12:00:00');
          const dayNum  = jsDate.getDate();
          const dayName = DAY_LABELS[jsDate.getDay()];
          return (
            <TouchableOpacity
              key={d}
              style={[s.dateChip, isSel && s.dateChipSel]}
              onPress={() => setFilterDate(d)}
              activeOpacity={0.75}
            >
              <Text style={[s.dateDayName, isSel && s.dateDayNameSel]}>{isToday ? 'Hoy' : dayName}</Text>
              <Text style={[s.dateDayNum,  isSel && s.dateDayNumSel]}>{dayNum}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(item, i) => String(item?.id ?? i)}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#f05b22" colors={['#f05b22']} />
        }
        ListEmptyComponent={
          <View style={[s.center, { marginTop: 40 }]}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={48} color="#222" />
            <Text style={s.soft}>Sin reservas para esta fecha.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const schedule   = item.gymActivitySchedule;
          const actName    = schedule?.gymActivity?.name ?? '—';
          const start      = fmt5(schedule?.startTime ?? item.startTime);
          const end        = fmt5(schedule?.endTime   ?? item.endTime);
          const dow        = schedule?.dayOfWeek ?? '';
          const firstName  = item.user?.profile?.firstName ?? '';
          const lastName   = item.user?.profile?.lastName  ?? '';
          const clientName = [firstName, lastName].filter(Boolean).join(' ') || 'Cliente';
          const sColor     = statusColor(item.status ?? '');
          const isPending  = PENDING.has(item.status ?? '');
          const isBusy     = confirmMutation.isPending || cancelMutation.isPending;

          return (
            <View style={s.card}>
              <View style={s.cardTop}>
                <View style={s.cardMain}>
                  <Text style={s.clientName}>{clientName}</Text>
                  <Text style={s.actName} numberOfLines={1}>{actName}</Text>
                </View>
                <View style={s.cardRight}>
                  <View style={[s.badge, { borderColor: sColor, backgroundColor: sColor + '22' }]}>
                    <Text style={[s.badgeTxt, { color: sColor }]}>{statusLabel(item.status ?? '')}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setDetailItem(item)}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    style={s.infoBtn}
                  >
                    <MaterialCommunityIcons name="information-outline" size={20} color="#555" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={s.metaRow}>
                <View style={s.metaItem}>
                  <MaterialCommunityIcons name="calendar" size={13} color="#555" />
                  <Text style={s.metaTxt}>{item.reservationDate ?? '—'}</Text>
                </View>
                <View style={s.metaItem}>
                  <MaterialCommunityIcons name="clock-outline" size={13} color="#555" />
                  <Text style={s.metaTxt}>{start} – {end}</Text>
                </View>
                {!!dow && (
                  <View style={s.metaItem}>
                    <MaterialCommunityIcons name="calendar-week" size={13} color="#555" />
                    <Text style={s.metaTxt}>{dow}</Text>
                  </View>
                )}
              </View>

              {isPending && (
                <View style={s.actionRow}>
                  <TouchableOpacity
                    style={[s.actionBtn, s.confirmBtn, isBusy && s.disabledBtn]}
                    onPress={() => handleConfirm(item.id)}
                    disabled={isBusy}
                    activeOpacity={0.8}
                  >
                    {confirmMutation.isPending && confirmMutation.variables === item.id
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <>
                          <MaterialCommunityIcons name="check-circle-outline" size={15} color="#fff" />
                          <Text style={s.actionTxt}>Confirmar</Text>
                        </>
                    }
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.actionBtn, s.rejectBtn, isBusy && s.disabledBtn]}
                    onPress={() => handleReject(item.id)}
                    disabled={isBusy}
                    activeOpacity={0.8}
                  >
                    {cancelMutation.isPending && cancelMutation.variables === item.id
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <>
                          <MaterialCommunityIcons name="close-circle-outline" size={15} color="#fff" />
                          <Text style={s.actionTxt}>Rechazar</Text>
                        </>
                    }
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: '#000' },
  center:   { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 },
  soft:     { color: '#444', fontSize: 14, textAlign: 'center' },
  retryBtn: { marginTop: 4, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#f05b22' },
  retryTxt: { color: '#f05b22', fontWeight: '600' },

  topBar:    { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#111' },
  topTitle:  { flex: 1, color: '#fff', fontSize: 16, fontWeight: '800' },
  countBadge:{ backgroundColor: 'rgba(240,91,34,0.15)', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(240,91,34,0.3)' },
  countTxt:  { color: '#f05b22', fontSize: 12, fontWeight: '700' },

  stripWrap:  { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: '#111' },
  strip:      { paddingHorizontal: 12, paddingVertical: 10, gap: 8, flexDirection: 'row' },
  dateChip:   { alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: '#111', borderWidth: 1, borderColor: '#1e1e1e', minWidth: 52 },
  dateChipSel:{ backgroundColor: '#f05b22', borderColor: '#f05b22' },
  dateDayName:{ color: '#555', fontSize: 10, fontWeight: '600', marginBottom: 2 },
  dateDayNameSel: { color: '#fff' },
  dateDayNum: { color: '#aaa', fontSize: 16, fontWeight: '800' },
  dateDayNumSel:  { color: '#fff' },

  list:      { padding: 14, paddingBottom: 40 },
  card:      { backgroundColor: '#0e0e0e', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#1a1a1a' },
  cardTop:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 8 },
  cardMain:  { flex: 1 },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  clientName:{ color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 2 },
  actName:   { color: '#666', fontSize: 12 },
  badge:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  badgeTxt:  { fontSize: 10, fontWeight: '700' },
  infoBtn:   { padding: 2 },

  metaRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 2 },
  metaItem:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaTxt:   { color: '#555', fontSize: 11 },

  actionRow:  { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10, borderRadius: 10 },
  confirmBtn: { backgroundColor: '#16A34A' },
  rejectBtn:  { backgroundColor: '#DC2626' },
  disabledBtn:{ opacity: 0.4 },
  actionTxt:  { color: '#fff', fontWeight: '700', fontSize: 12 },
});
