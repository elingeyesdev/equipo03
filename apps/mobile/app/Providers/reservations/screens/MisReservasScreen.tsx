import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import QRCode from 'react-native-qrcode-svg';
import { Colors } from '../theme/colors';
import { useMyReservationsQuery } from '../hooks/useMyReservationsQuery';
import { useCancelReservationMutation } from '../hooks/useCancelReservationMutation';
import { reservationApi } from '../api/reservation.api';
import { UserReservation } from '../api/reservation.types';
import { authEvents } from '../../auth/authEvents';

const STATUS_LABEL: Record<string, string> = {
  CONFIRMADA: 'Confirmada',
  CONFIRMED:  'Confirmada',
  CANCELADA:  'Cancelada',
  CANCELLED:  'Cancelada',
  USADA:      'Usada',
  USED:       'Usada',
  PENDING:    'Pendiente',
  PENDIENTE:  'Pendiente',
};

const STATUS_COLOR: Record<string, string> = {
  CONFIRMADA: Colors.accent,
  CONFIRMED:  Colors.accent,
  CANCELADA:  '#6B7280',
  CANCELLED:  '#6B7280',
  USADA:      Colors.textSoft,
  USED:       Colors.textSoft,
  PENDING:    '#FFB300',
  PENDIENTE:  '#FFB300',
};

const HIDDEN      = new Set(['CANCELADA', 'CANCELLED', 'USADA', 'USED']);
const UNCANCELABLE = HIDDEN;
const isCancelable = (r?: UserReservation | null) =>
  !!r?.canCancel && !UNCANCELABLE.has(r?.status ?? '');

const isPaid = (r?: UserReservation | null): boolean =>
  (r as any)?.paymentStatus === 'PAID' || (r as any)?.isPaid === true;

const payLabel = (r?: UserReservation | null) => isPaid(r) ? 'Pagado' : 'Por pagar';
const payColor = (r?: UserReservation | null) => isPaid(r) ? Colors.accent : '#A0AEC0';

const fmt5 = (t?: string | null) => t?.substring(0, 5) ?? '—';

const CONFIRMED = new Set(['CONFIRMADA', 'CONFIRMED']);
const QR_SIZE   = Dimensions.get('window').width * 0.62;

// ─── QR dinámico con auto-refresh ────────────────────────────────────────────
const DynamicQRCode = ({
  reservationId,
  fallbackToken,
}: {
  reservationId: number;
  fallbackToken?: string;
}) => {
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['qr-token', reservationId],
    queryFn:  () => reservationApi.getDynamicQRToken(reservationId),
    refetchInterval: 150_000,          // refresca a los 2.5 min (token vive 3 min)
    refetchIntervalInBackground: false, // ahorra batería en segundo plano
    staleTime: 120_000,
    retry: 2,
  });

  const token = data?.token ?? fallbackToken ?? 'TOKEN_PENDIENTE';

  return (
    <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
      <QRCode
        value={token}
        size={QR_SIZE}
        backgroundColor="#FFFFFF"
        color={isFetching ? '#AAAAAA' : '#0A0A0A'}
      />
      {(isLoading || isFetching) && (
        <View style={{
          position: 'absolute',
          backgroundColor: 'rgba(255,255,255,0.55)',
          width: QR_SIZE,
          height: QR_SIZE,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <ActivityIndicator color="#f05b22" size="large" />
        </View>
      )}
    </View>
  );
};

export const MisReservasScreen = () => {
  const { data: reservations = [], isLoading, error, refetch } = useMyReservationsQuery();
  const cancelMutation = useCancelReservationMutation();
  const queryClient    = useQueryClient();
  const [cancelingAll, setCancelingAll] = useState(false);
  const [qrReservation, setQrReservation] = useState<UserReservation | null>(null);

  const handleCancelOne = (id?: number) => {
    if (!id) return;
    Alert.alert('Cancelar reserva', '¿Confirmas la cancelación?', [
      { text: 'No', style: 'cancel' },
      { text: 'Sí, cancelar', style: 'destructive', onPress: () => cancelMutation.mutate(id) },
    ]);
  };

  const handleCancelAll = () => {
    const targets = reservations.filter(isCancelable);
    if (targets.length === 0) {
      Alert.alert('Sin reservas activas', 'No hay nada que cancelar.');
      return;
    }
    Alert.alert('Cancelar todo', `Se cancelarán ${targets.length} reserva(s). ¿Continuar?`, [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí, cancelar todo',
        style: 'destructive',
        onPress: async () => {
          setCancelingAll(true);
          await Promise.allSettled(
            targets.map((r) => r?.id ? reservationApi.cancelReservation(r.id) : Promise.resolve())
          );
          await queryClient.invalidateQueries({ queryKey: ['my-reservations'] });
          setCancelingAll(false);
          Alert.alert('Listo', 'Reservas canceladas.');
        },
      },
    ]);
  };

  if (isLoading) return (
    <SafeAreaView style={s.safe}>
      <View style={s.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={s.soft}>Cargando reservas…</Text>
      </View>
    </SafeAreaView>
  );

  if (error) {
    const isForbidden = (error as any)?.isForbidden === true;
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <MaterialCommunityIcons name={isForbidden ? 'lock-outline' : 'wifi-off'} size={48} color={Colors.textSoft} />
          <Text style={s.soft}>
            {isForbidden
              ? 'Tu cuenta no tiene permisos para ver reservas.'
              : 'No se pudieron cargar las reservas.'}
          </Text>
          {isForbidden ? (
            <TouchableOpacity style={[s.retryBtn, { borderColor: Colors.danger }]} onPress={() => authEvents.emitForceLogout()}>
              <Text style={[s.retryTxt, { color: Colors.danger }]}>Cerrar sesión</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.retryBtn} onPress={() => refetch()}>
              <Text style={s.retryTxt}>Reintentar</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  const visible   = reservations.filter(r => !HIDDEN.has(r?.status ?? ''));
  const hasActive = visible.some(isCancelable);

  if (visible.length === 0) return (
    <SafeAreaView style={s.safe}>
      <View style={s.center}>
        <MaterialCommunityIcons name="calendar-blank-outline" size={56} color={Colors.border} />
        <Text style={s.emptyTitle}>Aún no tienes reservas activas</Text>
        <Text style={s.soft}>Ve al mapa y reserva tu primer cupo.</Text>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.safe}>

      {/* ── Modal QR ── */}
      <Modal
        visible={!!qrReservation}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setQrReservation(null)}
      >
        <View style={s.qrBackdrop}>
          <View style={s.qrSheet}>
            {/* Cabecera */}
            <View style={s.qrHeader}>
              <MaterialCommunityIcons name="ticket-confirmation-outline" size={22} color={Colors.primary} />
              <Text style={s.qrTitle}>Pase de Acceso</Text>
              <TouchableOpacity onPress={() => setQrReservation(null)} hitSlop={12}>
                <MaterialCommunityIcons name="close" size={22} color={Colors.textSoft} />
              </TouchableOpacity>
            </View>

            {/* Nombre actividad */}
            <Text style={s.qrActName} numberOfLines={1}>
              {qrReservation?.activityName ?? '—'}
            </Text>
            <Text style={s.qrDate}>
              {qrReservation?.reservationDate ?? '—'}
              {'  ·  '}
              {fmt5(qrReservation?.startTime)} – {fmt5(qrReservation?.endTime)}
            </Text>

            {/* QR dinámico — se renueva cada 2.5 min */}
            <View style={s.qrBox}>
              {qrReservation?.id != null && (
                <DynamicQRCode
                  reservationId={qrReservation.id}
                  fallbackToken={qrReservation.qrToken}
                />
              )}
            </View>

            <Text style={s.qrHint}>Muestra este código al ingreso de la sede.</Text>

            <TouchableOpacity style={s.qrCloseBtn} onPress={() => setQrReservation(null)} activeOpacity={0.8}>
              <Text style={s.qrCloseTxt}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {hasActive && (
        <View style={s.topBar}>
          <TouchableOpacity
            style={[s.cancelAllBtn, cancelingAll && s.disabledOpacity]}
            onPress={handleCancelAll}
            disabled={cancelingAll}
            activeOpacity={0.8}
          >
            {cancelingAll ? (
              <ActivityIndicator size="small" color={Colors.danger} />
            ) : (
              <>
                <MaterialCommunityIcons name="calendar-remove" size={16} color={Colors.danger} />
                <Text style={s.cancelAllTxt}>Cancelar todo</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {visible.map((r, idx) => (
          <ReservationCard
            key={r?.id ?? idx}
            r={r}
            onCancel={isCancelable(r) ? () => handleCancelOne(r?.id) : undefined}
            onShowQr={CONFIRMED.has(r?.status ?? '') ? () => setQrReservation(r) : undefined}
          />
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const ReservationCard = ({
  r,
  onCancel,
  onShowQr,
}: {
  r?: UserReservation | null;
  onCancel?: () => void;
  onShowQr?: () => void;
}) => {
  const status      = r?.status ?? '';
  const statusColor = STATUS_COLOR[status] ?? Colors.textSoft;
  const pColor      = payColor(r);
  const isFree      = r?.isFreeAccess === true;

  // Formatear createdAt amigable
  const createdLabel = r?.createdAt
    ? (() => {
        try {
          const d = new Date(r.createdAt);
          return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
        } catch { return r.createdAt; }
      })()
    : null;

  return (
    <View style={s.card}>

      {/* ── Cabecera: nombre + badges ── */}
      <View style={s.cardTop}>
        <View style={s.cardMain}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <Text style={s.actName} numberOfLines={1}>{r?.activityName ?? '—'}</Text>
            <View style={isFree ? s.tagFree : s.tagSched}>
              <Text style={isFree ? s.tagFreeTxt : s.tagSchedTxt}>
                {isFree ? '🔓 Libre' : '📅 Clase'}
              </Text>
            </View>
          </View>
          {!!r?.activityDescription && (
            <Text style={s.actDesc} numberOfLines={2}>{r.activityDescription}</Text>
          )}
        </View>
        <View style={s.badges}>
          <View style={[s.badge, { borderColor: pColor, backgroundColor: pColor + '22' }]}>
            <Text style={[s.badgeTxt, { color: pColor }]}>{payLabel(r)}</Text>
          </View>
          <View style={[s.badge, { borderColor: statusColor, backgroundColor: statusColor + '18' }]}>
            <Text style={[s.badgeTxt, { color: statusColor }]}>
              {STATUS_LABEL[status] ?? status ?? '—'}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Meta: fecha ── */}
      <View style={s.metaRow}>
        <View style={s.metaItem}>
          <MaterialCommunityIcons name="calendar" size={13} color={Colors.textSoft} />
          <Text style={s.metaTxt}>{r?.reservationDate ?? '—'}</Text>
        </View>
      </View>

      {/* ── Detalle condicional ── */}
      <View style={s.detailBox}>
        {isFree ? (
          /* LIBRE: hora de referencia elegida por el usuario */
          <View style={s.detailRow}>
            <MaterialCommunityIcons name="clock-time-four-outline" size={14} color={Colors.secondary} />
            <Text style={s.detailTxt}>
              <Text style={s.detailLabel}>Horario de referencia: </Text>
              {fmt5(r?.startTime)} – {fmt5(r?.endTime)}
            </Text>
          </View>
        ) : (
          /* PROGRAMADA: horario del schedule + instructor */
          <>
            <View style={s.detailRow}>
              <MaterialCommunityIcons name="clock-outline" size={14} color={Colors.secondary} />
              <Text style={s.detailTxt}>
                <Text style={s.detailLabel}>Horario: </Text>
                {fmt5(r?.startTime)} – {fmt5(r?.endTime)}
                {!!r?.dayOfWeek && <Text style={{ color: Colors.textSoft }}> · {r.dayOfWeek}</Text>}
              </Text>
            </View>
            {!!r?.instructorName && (
              <View style={s.detailRow}>
                <MaterialCommunityIcons name="account-tie-outline" size={14} color={Colors.secondary} />
                <Text style={s.detailTxt}>
                  <Text style={s.detailLabel}>Instructor: </Text>
                  {r.instructorName}
                </Text>
              </View>
            )}
          </>
        )}

        {/* AMBOS: sucursal */}
        <View style={s.detailRow}>
          <MaterialCommunityIcons name="map-marker-outline" size={14} color={Colors.secondary} />
          <Text style={s.detailTxt}>
            <Text style={s.detailLabel}>Sucursal: </Text>
            {r?.gymName || 'No especificada'}
          </Text>
        </View>

        {/* AMBOS: fecha de creación */}
        {!!createdLabel && (
          <View style={s.detailRow}>
            <MaterialCommunityIcons name="clock-check-outline" size={14} color={Colors.textSoft} />
            <Text style={[s.detailTxt, { color: Colors.textSoft }]}>
              <Text style={s.detailLabel}>Creada el: </Text>
              {createdLabel}
            </Text>
          </View>
        )}
      </View>

      {/* Botón Pase de Acceso — solo CONFIRMADA */}
      {onShowQr && (
        <TouchableOpacity style={s.qrBtn} onPress={onShowQr} activeOpacity={0.8}>
          <MaterialCommunityIcons name="qrcode" size={18} color="#0A0A0A" />
          <Text style={s.qrBtnTxt}>Pase de Acceso</Text>
        </TouchableOpacity>
      )}

      {onCancel && (
        <TouchableOpacity style={[s.cancelBtn, onShowQr && { marginTop: 8 }]} onPress={onCancel} activeOpacity={0.8}>
          <MaterialCommunityIcons name="close-circle-outline" size={16} color={Colors.danger} />
          <Text style={s.cancelTxt}>Cancelar reserva</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12 },
  scroll: { padding: 16 },
  soft:   { color: Colors.textSoft, fontSize: 14, textAlign: 'center' },

  emptyTitle:   { color: Colors.text, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  retryBtn:     { marginTop: 4, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: Colors.primary },
  retryTxt:     { color: Colors.primary, fontWeight: '600' },

  topBar:          { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  cancelAllBtn:    { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-end', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: Colors.danger, backgroundColor: 'rgba(239,68,68,0.07)' },
  disabledOpacity: { opacity: 0.5 },
  cancelAllTxt:    { color: Colors.danger, fontWeight: '700', fontSize: 13 },

  card:    { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 10 },
  cardMain:{ flex: 1 },
  actName: { color: Colors.text, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  actDesc: { color: Colors.textSoft, fontSize: 12, lineHeight: 17 },

  badges:   { gap: 6, alignItems: 'flex-end' },
  badge:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  badgeTxt: { fontSize: 10, fontWeight: '700' },

  metaRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaTxt:  { color: Colors.textSoft, fontSize: 12 },

  // ── Tags tipo actividad ──────────────────────────────────────────────────────
  tagFree:     { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, backgroundColor: 'rgba(255,94,0,0.15)', borderWidth: 1, borderColor: 'rgba(255,94,0,0.3)' },
  tagFreeTxt:  { fontSize: 10, fontWeight: '700', color: '#FF5E00' },
  tagSched:    { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, backgroundColor: 'rgba(0,217,255,0.1)', borderWidth: 1, borderColor: 'rgba(0,217,255,0.25)' },
  tagSchedTxt: { fontSize: 10, fontWeight: '700', color: '#00D9FF' },

  // ── Bloque de detalle condicional ────────────────────────────────────────────
  detailBox:   { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 10, gap: 6, marginBottom: 12 },
  detailRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  detailTxt:   { fontSize: 12, color: Colors.text, flex: 1, lineHeight: 18 },
  detailLabel: { fontWeight: '700', color: Colors.textSoft },

  cancelBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.05)' },
  cancelTxt: { color: Colors.danger, fontWeight: '600', fontSize: 13 },

  // ── Botón Pase de Acceso (en la card) ───────────────────────────────────────
  qrBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 11, borderRadius: 10, backgroundColor: Colors.primary },
  qrBtnTxt: { color: '#0A0A0A', fontWeight: '700', fontSize: 14 },

  // ── Modal QR ────────────────────────────────────────────────────────────────
  qrBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  qrSheet:    { width: '100%', maxWidth: 360, backgroundColor: '#1A1A1C', borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  qrHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 14 },
  qrTitle:    { color: Colors.text, fontSize: 17, fontWeight: '700', flex: 1, textAlign: 'center' },
  qrActName:  { color: Colors.text, fontSize: 15, fontWeight: '600', marginBottom: 4, textAlign: 'center' },
  qrDate:     { color: Colors.textSoft, fontSize: 12, marginBottom: 20, textAlign: 'center' },
  qrBox:      { padding: 14, backgroundColor: '#FFFFFF', borderRadius: 14, marginBottom: 18 },
  qrHint:     { color: Colors.textSoft, fontSize: 12, textAlign: 'center', marginBottom: 20, lineHeight: 17 },
  qrCloseBtn: { width: '100%', paddingVertical: 13, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center' },
  qrCloseTxt: { color: Colors.text, fontWeight: '600', fontSize: 14 },
});
