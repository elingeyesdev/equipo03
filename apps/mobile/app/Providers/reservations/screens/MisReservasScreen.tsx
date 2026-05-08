/**
 * MisReservasScreen — Pantalla de historial y gestión de reservas del usuario.
 *
 * Fase 4: La reserva más reciente aparece destacada con botón "Mostrar QR".
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { Colors } from '../../reservations/theme/colors';
import { useMyReservationsQuery } from '../../reservations/hooks/useMyReservationsQuery';
import { useCancelReservationMutation } from '../../reservations/hooks/useCancelReservationMutation';
import { UserReservation } from '../../reservations/api/reservation.types';

const STATUS_LABELS: Record<string, string> = {
  CONFIRMADA: 'Confirmada',
  CONFIRMED: 'Confirmada',
  CANCELADA: 'Cancelada',
  USADA: 'Usada',
  PENDING: 'Pendiente',
};

const STATUS_COLORS: Record<string, string> = {
  CONFIRMADA: Colors.accent,
  CONFIRMED: Colors.accent,
  CANCELADA: Colors.danger,
  USADA: Colors.textSoft,
  PENDING: '#FFB300',
};

const DAY_FULL: Record<string, string> = {
  LUN: 'Lunes', MAR: 'Martes', MIE: 'Miércoles',
  JUE: 'Jueves', VIE: 'Viernes', SAB: 'Sábado', DOM: 'Domingo',
};

export const MisReservasScreen = () => {
  const { data: reservations, isLoading, error, refetch } = useMyReservationsQuery();
  const cancelMutation = useCancelReservationMutation();
  const [qrReservation, setQrReservation] = useState<UserReservation | null>(null);

  const handleCancel = (id: number) => {
    Alert.alert(
      'Cancelar Reserva',
      '¿Estás seguro de que deseas cancelar esta reserva? Esta acción no se puede deshacer.',
      [
        { text: 'No, mantener', style: 'cancel' },
        { 
          text: 'Sí, cancelar', 
          style: 'destructive',
          onPress: () => cancelMutation.mutate(id) 
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Cargando tus reservas...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <MaterialCommunityIcons name="wifi-off" size={48} color={Colors.textSoft} />
        <Text style={styles.errorText}>No se pudieron cargar tus reservas.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryText}>Intentar de nuevo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!reservations?.length) {
    return (
      <View style={styles.center}>
        <MaterialCommunityIcons name="calendar-blank-outline" size={56} color={Colors.border} />
        <Text style={styles.emptyTitle}>Sin reservas activas</Text>
        <Text style={styles.emptySubtitle}>
          Ve al mapa, elige un gimnasio y reserva tu primer cupo.
        </Text>
      </View>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Próximas: fecha >= hoy y status CONFIRMED/CONFIRMADA
  const upcoming = reservations
    .filter((r) => {
      const d = new Date(r.reservationDate);
      d.setHours(0, 0, 0, 0);
      return d >= today && (r.status === 'CONFIRMED' || r.status === 'CONFIRMADA');
    })
    .sort((a, b) => new Date(a.reservationDate).getTime() - new Date(b.reservationDate).getTime());

  // Historial: pasadas o canceladas
  const history = reservations
    .filter((r) => {
      const d = new Date(r.reservationDate);
      d.setHours(0, 0, 0, 0);
      return d < today || r.status === 'CANCELADA' || r.status === 'USADA';
    })
    .sort((a, b) => new Date(b.reservationDate).getTime() - new Date(a.reservationDate).getTime());

  const nextReservation = upcoming[0];
  const restUpcoming = upcoming.slice(1);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
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

        {/* --- Próxima reserva destacada --- */}
        {nextReservation && (
          <>
            <Text style={styles.sectionLabel}>Próxima Reserva</Text>
            <ReservationCard
              reservation={nextReservation}
              isHighlighted
              onShowQR={() => setQrReservation(nextReservation)}
              onCancel={() => handleCancel(nextReservation.id)}
            />
          </>
        )}

        {/* --- Siguientes confirmadas --- */}
        {restUpcoming.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Próximamente</Text>
            {restUpcoming.map((r) => (
              <ReservationCard
                key={r.id}
                reservation={r}
                onShowQR={() => setQrReservation(r)}
                onCancel={() => handleCancel(r.id)}
              />
            ))}
          </>
        )}

        {/* --- Historial (pasadas / canceladas) --- */}
        {history.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Historial</Text>
            {history.map((r) => (
              <ReservationCard
                key={r.id}
                reservation={r}
                onShowQR={r.qrToken ? () => setQrReservation(r) : undefined}
              />
            ))}
          </>
        )}

        {upcoming.length === 0 && history.length === 0 && (
          <View style={styles.center}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={56} color={Colors.border} />
            <Text style={styles.emptyTitle}>Sin reservas activas</Text>
            <Text style={styles.emptySubtitle}>Ve al mapa, elige un gimnasio y reserva tu primer cupo.</Text>
          </View>
        )}
      </ScrollView>

      {/* --- Modal QR --- */}
      <Modal
        visible={!!qrReservation}
        transparent
        animationType="slide"
        onRequestClose={() => setQrReservation(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setQrReservation(null)}>
          <Pressable style={styles.qrModal} onPress={() => {}}>
            <View style={styles.qrHandle} />

            <Text style={styles.qrTitle}>Código QR de Acceso</Text>
            <Text style={styles.qrSubtitle}>
              {qrReservation?.activityName ?? 'Actividad'} · {qrReservation?.reservationDate}
            </Text>

            <View style={styles.qrWrapper}>
              <QRCode
                value={qrReservation?.qrToken || `GS-RES-${qrReservation?.id || '0'}`}
                size={220}
                color="#FFFFFF"
                backgroundColor={Colors.background}
              />
            </View>

            <View style={styles.qrNote}>
              <MaterialCommunityIcons name="information-outline" size={16} color={Colors.textSoft} />
              <Text style={styles.qrNoteText}>
                Muestra este código al personal del gimnasio para que lo escaneen en el check-in.
              </Text>
            </View>

            <TouchableOpacity style={styles.qrCloseButton} onPress={() => setQrReservation(null)}>
              <Text style={styles.qrCloseText}>Cerrar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

// --- Componente de tarjeta de reserva ---
interface CardProps {
  reservation: UserReservation;
  isHighlighted?: boolean;
  onShowQR?: () => void;
  onCancel?: () => void;
}

const ReservationCard = ({ reservation: r, isHighlighted, onShowQR, onCancel }: CardProps) => {
  const statusColor = STATUS_COLORS[r.status] ?? Colors.textSoft;

  return (
    <View style={[styles.card, isHighlighted && styles.cardHighlighted]}>
      {isHighlighted && (
        <View style={styles.highlightBadge}>
          <Text style={styles.highlightBadgeText}>📅 Próxima</Text>
        </View>
      )}

      <View style={styles.cardHeader}>
        <View style={styles.cardInfo}>
          <Text style={styles.cardActivityName} numberOfLines={1}>
            {r.activityName ?? '—'}
          </Text>
          <Text style={styles.cardGymName} numberOfLines={1}>
            {r.dayOfWeek
              ? `${DAY_FULL[r.dayOfWeek] ?? r.dayOfWeek} · ${r.startTime?.substring(0, 5) ?? ''} – ${r.endTime?.substring(0, 5) ?? ''}`
              : r.reservationDate}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '22', borderColor: statusColor }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {STATUS_LABELS[r.status] ?? r.status}
          </Text>
        </View>
      </View>

      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <MaterialCommunityIcons name="calendar" size={14} color={Colors.textSoft} />
          <Text style={styles.detailText}>{r.reservationDate}</Text>
        </View>
        {r.startTime && (
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="clock-outline" size={14} color={Colors.textSoft} />
            <Text style={styles.detailText}>
              {r.startTime.substring(0, 5)}{r.endTime ? ` – ${r.endTime.substring(0, 5)}` : ''}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.cardActions}>
        {onShowQR && (
          <TouchableOpacity style={styles.qrButton} onPress={onShowQR} activeOpacity={0.8}>
            <MaterialCommunityIcons name="qrcode" size={18} color={Colors.primary} />
            <Text style={styles.qrButtonText}>Mostrar QR</Text>
          </TouchableOpacity>
        )}

        {onCancel && (
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel} activeOpacity={0.8}>
            <MaterialCommunityIcons name="calendar-remove" size={18} color={Colors.danger} />
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 32,
    gap: 12,
  },
  scrollContent: { padding: 16, paddingBottom: 40 },

  loadingText: { color: Colors.textSoft, marginTop: 8 },
  errorText: { color: Colors.textSoft, textAlign: 'center', fontSize: 15 },
  emptyTitle: { color: Colors.text, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  emptySubtitle: { color: Colors.textSoft, textAlign: 'center', fontSize: 14, lineHeight: 20 },

  retryButton: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  retryText: { color: Colors.primary, fontWeight: '600' },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSoft,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },

  // --- Tarjeta ---
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHighlighted: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(255, 94, 0, 0.06)',
  },
  highlightBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 94, 0, 0.15)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 10,
  },
  highlightBadgeText: { color: Colors.primary, fontSize: 11, fontWeight: '700' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardInfo: { flex: 1, marginRight: 10 },
  cardActivityName: { color: Colors.text, fontSize: 16, fontWeight: '700', marginBottom: 2 },
  cardGymName: { color: Colors.textSoft, fontSize: 13 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  statusText: { fontSize: 11, fontWeight: '700' },
  cardDetails: { gap: 6, marginBottom: 14 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { color: Colors.textSoft, fontSize: 13 },

  cardActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  qrButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 94, 0, 0.05)',
  },
  qrButtonText: { color: Colors.primary, fontWeight: '700', fontSize: 13 },

  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingVertical: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  cancelButtonText: { color: Colors.danger, fontWeight: '600', fontSize: 13 },

  // --- Modal QR ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  qrModal: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
    alignItems: 'center',
  },
  qrHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginBottom: 20,
  },
  qrTitle: { color: Colors.text, fontSize: 20, fontWeight: '700', marginBottom: 4 },
  qrSubtitle: { color: Colors.textSoft, fontSize: 13, marginBottom: 24, textAlign: 'center' },
  qrWrapper: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: Colors.background,
    alignItems: 'center',
    marginBottom: 20,
  },
  noQrText: { color: Colors.textSoft, marginTop: 12, fontSize: 13 },
  qrNote: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 8,
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  qrNoteText: { color: Colors.textSoft, fontSize: 12, flex: 1, lineHeight: 18 },
  qrCloseButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  qrCloseText: { color: Colors.text, fontWeight: '600', fontSize: 15 },
});
