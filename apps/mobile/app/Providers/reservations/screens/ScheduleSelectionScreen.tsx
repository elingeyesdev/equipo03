import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../theme/colors';
import { DateStripSelector } from '../components/DateStripSelector';
import { ScheduleSlot } from '../components/ScheduleSlot';
import { ReservationConfirmModal } from '../components/ReservationConfirmModal';
import { useSchedulesQuery } from '../hooks/useSchedulesQuery';
import { useCreateReservationMutation } from '../hooks/useCreateReservationMutation';
import { useSubscriptionGuard } from '../hooks/useSubscriptionGuard';
import { ERROR_MAP } from '../api/reservation.types';
import { format } from 'date-fns';

// Props para la navegación (Deberías agregar esto a tu RootStackParamList)
type RootStackParamList = {
  ScheduleSelection: { activityId: number; gymName: string; defaultDate?: string };
  ReservationSuccess: { qrToken: string; activityName: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'ScheduleSelection'>;

export const ScheduleSelectionScreen = ({ route, navigation }: Props) => {
  const { activityId, gymName, defaultDate } = route.params;
  
  const [selectedDate, setSelectedDate] = useState<Date>(
    defaultDate ? new Date(defaultDate) : new Date()
  );
  
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Hooks de lógica
  const { isActive, isLoading: isCheckingSub } = useSubscriptionGuard();
  
  // BYPASS TEMPORAL: Como tu backend aún no tiene la tabla de suscripciones,
  // forzaremos a que siempre sea true para que puedas probar el flujo.
  const canReserve = true; 

  const { data: schedules, isLoading: isLoadingSchedules } = useSchedulesQuery(
    activityId, 
    format(selectedDate, 'yyyy-MM-dd')
  );
  const createMutation = useCreateReservationMutation();

  const handleConfirmReservation = async () => {
    if (!selectedSlotId) return;
    
    try {
      const response = await createMutation.mutateAsync({
        gymActivityScheduleId: selectedSlotId,
        reservationDate: format(selectedDate, 'yyyy-MM-dd')
      });
      
      setIsModalVisible(false);
      // Navegar a la pantalla de éxito pasando el QR Token
      navigation.navigate('ReservationSuccess', { 
        qrToken: response.qrToken || 'TOKEN_FALLBACK_123',
        activityName: gymName
      });
      
    } catch (error: any) {
      setIsModalVisible(false);
      const errCode = error.response?.data?.code || 'ERROR_UNKNOWN';
      Alert.alert('Error', ERROR_MAP[errCode] || 'No se pudo completar la reserva.');
    }
  };

  if (isCheckingSub) {
    return <View style={styles.loadingCenter}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Horarios disponibles</Text>
      <Text style={styles.headerSubtitle}>{gymName}</Text>

      {/* Selector de Fechas */}
      <DateStripSelector 
        selectedDate={selectedDate} 
        onSelectDate={(date) => {
          setSelectedDate(date);
          setSelectedSlotId(null); // Resetear selección al cambiar de día
        }} 
      />

      {/* Lista de Slots */}
      <View style={styles.content}>
        {!canReserve && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              Necesitas una membresía activa para poder reservar.
            </Text>
          </View>
        )}

        {isLoadingSchedules ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
        ) : schedules?.length === 0 ? (
          <Text style={styles.emptyText}>No hay horarios disponibles para este día.</Text>
        ) : (
          <FlatList
            data={schedules}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            renderItem={({ item }) => (
              <ScheduleSlot
                slot={item}
                isSelected={selectedSlotId === item.id}
                onSelect={() => {
                  setSelectedSlotId(item.id);
                }}
              />
            )}
          />
        )}
      </View>

      {/* Botón Flotante de Reservar */}
      {selectedSlotId && canReserve && (
        <View style={styles.bottomBar}>
          <TouchableOpacity 
            style={styles.reserveButton}
            onPress={() => setIsModalVisible(true)}
          >
            <Text style={styles.reserveButtonText}>Reservar Cupo</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal de Confirmación */}
      <ReservationConfirmModal
        visible={isModalVisible}
        isLoading={createMutation.isPending}
        onCancel={() => setIsModalVisible(false)}
        onConfirm={handleConfirmReservation}
        activityName={gymName}
        timeString={
          schedules?.find(s => s.id === selectedSlotId)?.startTime.substring(0, 5) || ''
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSoft,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  warningBox: {
    backgroundColor: 'rgba(255, 69, 58, 0.1)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.danger,
    marginBottom: 16,
  },
  warningText: {
    color: Colors.danger,
    textAlign: 'center',
    fontWeight: '600',
  },
  emptyText: {
    color: Colors.textSoft,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  reserveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  reserveButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
