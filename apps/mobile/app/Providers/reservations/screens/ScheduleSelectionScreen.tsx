/**
 * ScheduleSelectionScreen — Pantalla de selección de actividades y horarios.
 *
 * Flujo:
 * 1. Muestra las actividades disponibles del gimnasio seleccionado.
 * 2. Cada actividad muestra su único día disponible iluminado (el resto gris).
 * 3. Al seleccionar una actividad, aparece el resumen + botón de confirmar.
 * 4. Al confirmar, navega directamente a "Mis Reservas".
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useGymActivitiesQuery, GymActivityUI, DAY_LABELS } from '../hooks/useGymActivitiesQuery';
import { useCreateReservationMutation } from '../hooks/useCreateReservationMutation';
import { ERROR_MAP, DayOfWeek } from '../api/reservation.types';
import { AuthService } from '../../auth/AuthService';
import { format, nextDay, setDay, startOfWeek } from 'date-fns';

type RootStackParamList = {
  ScheduleSelection: { gymId: number; gymName: string };
  MisReservas: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'ScheduleSelection'>;

// Mapa de abreviatura del backend a índice JS (0=Dom, 1=Lun, ...)
const DAY_INDEX: Record<DayOfWeek, number> = {
  DOM: 0, LUN: 1, MAR: 2, MIE: 3, JUE: 4, VIE: 5, SAB: 6,
};

// Calcula la próxima fecha para un dayOfWeek dado (incluye hoy si corresponde)
const getNextDateForDay = (day: DayOfWeek): string => {
  const today = new Date();
  const targetDayIndex = DAY_INDEX[day];
  const todayIndex = today.getDay();
  let daysAhead = targetDayIndex - todayIndex;
  if (daysAhead < 0) daysAhead += 7;
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + daysAhead);
  return format(targetDate, 'yyyy-MM-dd');
};

const ALL_DAYS: DayOfWeek[] = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'];

export const ScheduleSelectionScreen = ({ route, navigation }: Props) => {
  const { gymId, gymName } = route.params;

  const [selectedActivity, setSelectedActivity] = useState<GymActivityUI | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const { data: activities, isLoading, error } = useGymActivitiesQuery(gymId);
  const createMutation = useCreateReservationMutation();

  // Animar el checkmark cuando showSuccess cambia a true
  useEffect(() => {
    if (showSuccess) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          bounciness: 18,
          speed: 6,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Navegar al tab Reservas después de 1.8s
      const timer = setTimeout(() => {
        setShowSuccess(false);
        scaleAnim.setValue(0);
        opacityAnim.setValue(0);
        // El nombre del Tab cambió de 'Reservas' a 'Mis Reservas'
        (navigation as any).getParent()?.navigate('Mis Reservas');
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  const handleConfirm = async () => {
    if (!selectedActivity?.availableSchedule) return;

    const schedule = selectedActivity.availableSchedule;
    const reservationDate = getNextDateForDay(schedule.dayOfWeek);

    try {
      // Obtener el userId del usuario logueado — requerido por el backend
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser?.userId) {
        Alert.alert('Error', 'No se pudo obtener tu sesión. Vuelve a iniciar sesión.');
        return;
      }

      const payload = {
        userId: Number(currentUser.userId),
        gymActivityScheduleId: schedule.id,
        reservationDate,
        status: 'CONFIRMED',
      };
      console.log('[Reserva] Enviando payload:', JSON.stringify(payload));
      await createMutation.mutateAsync(payload);

      // Mostrar animación de éxito antes de navegar
      setShowSuccess(true);
    } catch (error: any) {
      // ── DEBUG: ver qué responde exactamente el backend ──────────────
      console.error('[Reserva] Error completo:', JSON.stringify({
        status:  error?.response?.status,
        data:    error?.response?.data,
        message: error?.message,
      }, null, 2));
      // ─────────────────────────────────────────────────────────────────
      const errCode = error?.response?.data?.code || error?.response?.data?.message || 'ERROR_UNKNOWN';
      Alert.alert(
        'Error al reservar',
        ERROR_MAP[errCode] ?? error?.response?.data?.message ?? 'No se pudo completar la reserva.',
      );
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Cargando actividades...</Text>
      </View>
    );
  }

  if (error || !activities?.length) {
    return (
      <View style={styles.center}>
        <MaterialCommunityIcons name="calendar-remove" size={48} color={Colors.textSoft} />
        <Text style={styles.emptyText}>No hay actividades disponibles en este gimnasio.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* ── Modal de éxito con animación de checkmark ── */}
      <Modal visible={showSuccess} transparent animationType="none">
        <View style={styles.successOverlay}>
          <Animated.View
            style={[
              styles.successCard,
              { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
            ]}
          >
            <View style={styles.checkCircle}>
              <MaterialCommunityIcons name="check-bold" size={56} color="#fff" />
            </View>
            <Text style={styles.successTitle}>¡Reserva confirmada!</Text>
            <Text style={styles.successSubtitle}>
              Actividad agregada a Mis Reservas
            </Text>
          </Animated.View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Elige una actividad</Text>
        <Text style={styles.sectionSubtitle}>{gymName}</Text>

        {activities.map((activity) => {
          const isSelected = selectedActivity?.id === activity.id;
          const schedule = activity.availableSchedule;

          return (
            <TouchableOpacity
              key={activity.id}
              style={[styles.activityCard, isSelected && styles.activityCardSelected]}
              onPress={() => setSelectedActivity(isSelected ? null : activity)}
              activeOpacity={0.8}
            >
              {/* Cabecera de la actividad */}
              <View style={styles.activityHeader}>
                <View style={styles.activityInfo}>
                  <Text style={[styles.activityName, isSelected && styles.activityNameSelected]}>
                    {activity.name}
                  </Text>
                  <Text style={styles.activityDesc}>{activity.description}</Text>
                </View>
                <View style={[styles.durationBadge, isSelected && styles.durationBadgeSelected]}>
                  <Text style={[styles.durationText, isSelected && styles.durationTextSelected]}>
                    {activity.defaultDurationMin} min
                  </Text>
                </View>
              </View>

              {/* Selector de días — solo el día disponible está iluminado */}
              <View style={styles.daysRow}>
                {ALL_DAYS.map((day) => {
                  const isAvailableDay = schedule?.dayOfWeek === day;
                  return (
                    <View
                      key={day}
                      style={[
                        styles.dayPill,
                        isAvailableDay && styles.dayPillActive,
                        isAvailableDay && isSelected && styles.dayPillActiveSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayPillText,
                          isAvailableDay && styles.dayPillTextActive,
                          isAvailableDay && isSelected && styles.dayPillTextSelected,
                        ]}
                      >
                        {day}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Horario disponible */}
              {schedule && (
                <View style={styles.scheduleRow}>
                  <MaterialCommunityIcons name="clock-outline" size={14} color={isSelected ? Colors.primary : Colors.textSoft} />
                  <Text style={[styles.scheduleText, isSelected && styles.scheduleTextSelected]}>
                    {schedule.startTime.substring(0, 5)} – {schedule.endTime.substring(0, 5)}
                  </Text>
                  <Text style={styles.scheduleDay}>
                    · {activity.availableDayLabel}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Fase 2: Resumen + Botón de confirmación */}
      {selectedActivity?.availableSchedule && (
        <View style={styles.bottomBar}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryActivityName} numberOfLines={1}>
              {selectedActivity.name}
            </Text>
            <Text style={styles.summaryDetails}>
              {selectedActivity.availableDayLabel} · {selectedActivity.availableSchedule.startTime.substring(0, 5)} – {selectedActivity.availableSchedule.endTime.substring(0, 5)}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.confirmButton, createMutation.isPending && styles.confirmButtonLoading]}
            onPress={handleConfirm}
            disabled={createMutation.isPending}
            activeOpacity={0.85}
          >
            {createMutation.isPending ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.confirmButtonText}>Confirmar Reserva</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    gap: 12,
    padding: 24,
  },
  loadingText: {
    color: Colors.textSoft,
    fontSize: 14,
    marginTop: 8,
  },
  emptyText: {
    color: Colors.textSoft,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8,
  },
  scrollContent: {
    padding: 16,
    // Espacio para: bottomBar cuando está visible (~150px) + tab bar flotante (101px)
    paddingBottom: 260,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.textSoft,
    marginBottom: 20,
  },

  // --- Tarjeta de Actividad ---
  activityCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  activityCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(255, 94, 0, 0.08)',
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  activityInfo: {
    flex: 1,
    marginRight: 12,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  activityNameSelected: {
    color: Colors.primary,
  },
  activityDesc: {
    fontSize: 12,
    color: Colors.textSoft,
  },
  durationBadge: {
    backgroundColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  durationBadgeSelected: {
    backgroundColor: 'rgba(255, 94, 0, 0.2)',
  },
  durationText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSoft,
  },
  durationTextSelected: {
    color: Colors.primary,
  },

  // --- Fila de días ---
  daysRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  dayPill: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.background,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dayPillActive: {
    backgroundColor: 'rgba(0, 217, 255, 0.12)',
    borderColor: Colors.secondary,
  },
  dayPillActiveSelected: {
    backgroundColor: 'rgba(255, 94, 0, 0.18)',
    borderColor: Colors.primary,
  },
  dayPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.border,
  },
  dayPillTextActive: {
    color: Colors.secondary,
  },
  dayPillTextSelected: {
    color: Colors.primary,
  },

  // --- Horario ---
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scheduleText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSoft,
  },
  scheduleTextSelected: {
    color: Colors.primary,
  },
  scheduleDay: {
    fontSize: 13,
    color: Colors.textSoft,
  },

  // --- Barra inferior ---
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    // Tab Bar flotante: bottom(24) + height(65) + margen(12) = 101px
    paddingBottom: 101,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
  },
  summaryBox: {
    paddingHorizontal: 4,
  },
  summaryActivityName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  summaryDetails: {
    fontSize: 13,
    color: Colors.textSoft,
  },
  confirmButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonLoading: {
    opacity: 0.7,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // ── Animación de éxito ──────────────────────────────────────
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    paddingVertical: 40,
    paddingHorizontal: 48,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 20,
    gap: 16,
  },
  checkCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#22C55E', // verde vivo
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  successTitle: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  successSubtitle: {
    color: Colors.textSoft,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});
