/**
 * ReservarHorarioScreen.tsx
 * 
 * Capa de Presentación para el Sistema de Reservas de GymSync Pro Mobile.
 * Conectada al ReservasController Zustand Store para validación de horarios y aforo en runtime.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  TextInput,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ReservationsModule } from '../../../app/Providers/ReservationsModule.container';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const ReservarHorarioScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const gymId = route.params?.gymId;

  // --- CONTROLLER CONNECTION ---
  const controller = ReservationsModule.useController();
  const { detalleSucursal, loading, error, cargarDetallesSucursal } = controller;

  // --- STATE FOR FORM ---
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>(''); // Formato HH:mm
  const [selectedActivity, setSelectedActivity] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (gymId) {
      cargarDetallesSucursal(String(gymId));
    } else {
      Alert.alert('Error', 'Falta el ID del gimnasio para iniciar la reserva.', [
        { text: 'Volver', onPress: () => navigation.goBack() }
      ]);
    }
  }, [gymId]);

  // --- GENERATE NEXT 7 DAYS FOR SELECTOR ---
  const getNext7Days = (): Date[] => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const nextDate = new Date();
      nextDate.setDate(today.getDate() + i);
      dates.push(nextDate);
    }
    return dates;
  };

  const daysOfWeekSpanish = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
  const datesToSelect = getNext7Days();

  // --- CHECK IF DAY OPERATES ---
  const getDaySchedule = (date: Date) => {
    if (!detalleSucursal) return null;
    const dayName = daysOfWeekSpanish[date.getDay()];
    return detalleSucursal.horariosDeOperacion.find(
      (h: any) => h.dia.toLowerCase() === dayName.toLowerCase()
    );
  };

  // --- RUNTIME VALIDATIONS ---
  const validateSelection = (date: Date | null, timeStr: string, activityStr: string) => {
    setValidationError(null);

    if (!date) return;
    
    // 1. Validar que la sucursal abra ese día
    const schedule = getDaySchedule(date);
    if (!schedule || schedule.cerrado) {
      setValidationError('La sucursal está cerrada este día de la semana.');
      return;
    }

    if (!timeStr) return;

    // 2. Validar formato de hora
    if (!timeStr.match(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
      setValidationError('Introduce una hora válida en formato HH:mm.');
      return;
    }

    // 3. Validar rango de horarios
    const [selHour, selMin] = timeStr.split(':').map(Number);
    const [openHour, openMin] = schedule.apertura.split(':').map(Number);
    const [closeHour, closeMin] = schedule.cierre.split(':').map(Number);

    const selTotalMin = selHour * 60 + selMin;
    const openTotalMin = openHour * 60 + openMin;
    const closeTotalMin = closeHour * 60 + closeMin;

    if (selTotalMin < openTotalMin || selTotalMin > closeTotalMin) {
      setValidationError(
        `La hora elegida debe estar dentro del horario de operación (${schedule.apertura} a ${schedule.cierre}).`
      );
      return;
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    validateSelection(date, selectedTime, selectedActivity);
  };

  const handleTimeChange = (time: string) => {
    setSelectedTime(time);
    validateSelection(selectedDate, time, selectedActivity);
  };

  const handleActivitySelect = (activity: string) => {
    setSelectedActivity(activity);
    validateSelection(selectedDate, selectedTime, activity);
  };

  const handleContinue = async () => {
    if (!selectedDate || !selectedTime || !selectedActivity) {
      Alert.alert('Campos Incompletos', 'Por favor selecciona fecha, hora y el servicio para la reserva.');
      return;
    }

    if (validationError) {
      Alert.alert('Error de Validación', validationError);
      return;
    }

    try {
      const result = await controller.confirmarNuevaReserva({
        gymId: String(gymId),
        fecha: selectedDate,
        hora: selectedTime,
        actividad: selectedActivity,
      });

      if (result.isRight()) {
        const res = result.value;
        Alert.alert(
          'Reserva Confirmada',
          `¡Tu reserva ha sido procesada y confirmada con éxito!\n\n• Actividad: ${res.activityName}\n• Fecha: ${res.fecha.toLocaleDateString()}\n• Hora: ${res.horaInicio}\n• Estado: ${res.estado}`,
          [
            {
              text: 'Ver mis reservas',
              onPress: () => {
                navigation.navigate('MainTabs', { screen: 'Mis Reservas' });
              }
            }
          ]
        );
      } else {
        Alert.alert('Error de Reserva', result.value.message || 'El servidor rechazó la reserva.');
      }
    } catch (e: any) {
      Alert.alert('Error de Conexión', e?.message || 'No se pudo contactar con el backend.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00D9FF" />
        <Text style={styles.loadingText}>Cargando detalles de la sucursal...</Text>
      </View>
    );
  }

  if (error || !detalleSucursal) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle-outline" size={60} color="#ff4444" />
        <Text style={styles.errorText}>No se pudo cargar la sucursal.</Text>
        <Text style={styles.errorSubText}>{error || 'Error de conexión.'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => gymId && cargarDetallesSucursal(String(gymId))}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const selectedDaySchedule = selectedDate ? getDaySchedule(selectedDate) : null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header Sucursal info */}
        <View style={styles.branchHeader}>
          <Text style={styles.branchTitle}>{detalleSucursal.nombre}</Text>
          <Text style={styles.branchSubtitle}>
            <MaterialCommunityIcons name="map-marker" size={14} color="#666" /> {detalleSucursal.direccion}
          </Text>
          
          {/* Badge Aforo Glassmorphic */}
          <View style={styles.aforoCard}>
            <MaterialCommunityIcons 
              name={detalleSucursal.estaDisponible ? "account-group-outline" : "account-lock-outline"} 
              size={18} 
              color={detalleSucursal.estaDisponible ? "#00D9FF" : "#ff4444"} 
            />
            <Text style={styles.aforoText}>
              Aforo: <Text style={{ fontWeight: 'bold', color: '#fff' }}>{detalleSucursal.aforoActual} / {detalleSucursal.aforoMaximo}</Text>
            </Text>
            <View style={[
              styles.statusDot, 
              { backgroundColor: detalleSucursal.estaDisponible ? '#00D9FF' : '#ff4444' }
            ]} />
          </View>
        </View>

        {/* 1. SELECCIÓN DE FECHA */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>1. Selecciona el Día</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateList}>
            {datesToSelect.map((date, idx) => {
              const isSelected = selectedDate?.toDateString() === date.toDateString();
              const schedule = getDaySchedule(date);
              const isClosed = !schedule || schedule.cerrado;
              
              return (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.8}
                  style={[
                    styles.dateChip,
                    isSelected && styles.dateChipSelected,
                    isClosed && styles.dateChipClosed
                  ]}
                  onPress={() => handleDateSelect(date)}
                >
                  <Text style={[
                    styles.dateChipDayName,
                    isSelected && styles.textSelected,
                    isClosed && styles.textClosed
                  ]}>
                    {daysOfWeekSpanish[date.getDay()].substring(0, 3)}
                  </Text>
                  <Text style={[
                    styles.dateChipDayNum,
                    isSelected && styles.textSelected,
                    isClosed && styles.textClosed
                  ]}>
                    {date.getDate()}
                  </Text>
                  {isClosed && (
                    <Text style={styles.closedIndicator}>Cerrado</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 2. HORA DE RESERVA */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>2. Selecciona la Hora</Text>
          
          {selectedDate ? (
            <View>
              {selectedDaySchedule && !selectedDaySchedule.cerrado ? (
                <View>
                  <Text style={styles.scheduleNotice}>
                    Horario de operación hoy: <Text style={{ color: '#00D9FF', fontWeight: 'bold' }}>{selectedDaySchedule.apertura} a {selectedDaySchedule.cierre}</Text>
                  </Text>
                  
                  <View style={styles.timeInputWrapper}>
                    <MaterialCommunityIcons name="clock-outline" size={22} color="#00D9FF" style={styles.timeIcon} />
                    <TextInput
                      style={styles.timeInput}
                      placeholder="Ej: 14:30"
                      placeholderTextColor="#444"
                      value={selectedTime}
                      onChangeText={handleTimeChange}
                      keyboardType="numbers-and-punctuation"
                      maxLength={5}
                    />
                  </View>
                </View>
              ) : (
                <Text style={styles.closedWarning}>
                  La sucursal está cerrada el día seleccionado.
                </Text>
              )}
            </View>
          ) : (
            <Text style={styles.placeholderNotice}>
              Selecciona primero un día para ver los horarios.
            </Text>
          )}
        </View>

        {/* 3. SERVICIOS ACTIVOS Y PURGADOS */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>3. Selecciona la Actividad</Text>
          
          {detalleSucursal.actividadesDisponibles.length > 0 ? (
            <View style={styles.activitiesContainer}>
              {detalleSucursal.actividadesDisponibles.map((act: string, idx: number) => {
                const isSelected = selectedActivity === act;
                return (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.8}
                    style={[
                      styles.activityChip,
                      isSelected && styles.activityChipSelected
                    ]}
                    onPress={() => handleActivitySelect(act)}
                  >
                    <MaterialCommunityIcons 
                      name="lightning-bolt" 
                      size={14} 
                      color={isSelected ? "#000" : "#00D9FF"} 
                      style={{ marginRight: 6 }}
                    />
                    <Text style={[
                      styles.activityText,
                      isSelected && styles.activityTextSelected
                    ]}>
                      {act}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <Text style={styles.placeholderNotice}>
              No hay actividades programadas en esta sucursal.
            </Text>
          )}
        </View>

        {/* FEEDBACK DE VALIDACIÓN RUNTIME */}
        {validationError && (
          <View style={styles.validationErrorCard}>
            <MaterialCommunityIcons name="alert-outline" size={20} color="#ff4444" />
            <Text style={styles.validationErrorText}>{validationError}</Text>
          </View>
        )}

        {/* BOTÓN CONTINUAR */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.continueButton,
            (!selectedDate || !selectedTime || !selectedActivity || !!validationError) && styles.continueButtonDisabled
          ]}
          onPress={handleContinue}
          disabled={!selectedDate || !selectedTime || !selectedActivity || !!validationError}
        >
          <Text style={styles.continueButtonText}>Continuar con la Reserva</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 25,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#050505',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#666',
    marginTop: 15,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#050505',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
  },
  errorSubText: {
    color: '#555',
    textAlign: 'center',
    marginTop: 8,
    fontSize: 14,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#00D9FF',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 25,
  },
  retryButtonText: {
    color: '#000',
    fontWeight: 'bold',
  },
  branchHeader: {
    marginBottom: 30,
  },
  branchTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
  },
  branchSubtitle: {
    fontSize: 14,
    color: '#777',
    marginTop: 6,
  },
  aforoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 28, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 15,
    alignSelf: 'flex-start',
  },
  aforoText: {
    color: '#aaa',
    fontSize: 13,
    marginLeft: 8,
    marginRight: 15,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionContainer: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 15,
  },
  dateList: {
    flexDirection: 'row',
  },
  dateChip: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 14,
    width: 65,
    height: 75,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  dateChipSelected: {
    backgroundColor: '#00D9FF',
    borderColor: '#00D9FF',
  },
  dateChipClosed: {
    backgroundColor: '#111',
    opacity: 0.35,
  },
  dateChipDayName: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dateChipDayNum: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  closedIndicator: {
    color: '#ff4444',
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  textSelected: {
    color: '#000',
  },
  textClosed: {
    color: '#444',
  },
  scheduleNotice: {
    color: '#aaa',
    fontSize: 13,
    marginBottom: 12,
  },
  timeInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 28, 0.7)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#222',
    paddingHorizontal: 15,
    height: 55,
  },
  timeIcon: {
    marginRight: 10,
  },
  timeInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  closedWarning: {
    color: '#ff4444',
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: 'rgba(255, 68, 68, 0.08)',
    borderColor: 'rgba(255, 68, 68, 0.2)',
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
  },
  placeholderNotice: {
    color: '#555',
    fontSize: 14,
    fontStyle: 'italic',
  },
  activitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  activityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  activityChipSelected: {
    backgroundColor: '#00D9FF',
    borderColor: '#00D9FF',
  },
  activityText: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '600',
  },
  activityTextSelected: {
    color: '#000',
  },
  validationErrorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 68, 68, 0.08)',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.2)',
    marginBottom: 25,
  },
  validationErrorText: {
    color: '#ff4444',
    fontSize: 13,
    marginLeft: 10,
    flex: 1,
    lineHeight: 18,
  },
  continueButton: {
    backgroundColor: '#00D9FF',
    borderRadius: 14,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00D9FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
    marginTop: 15,
    marginBottom: 30,
  },
  continueButtonDisabled: {
    backgroundColor: '#222',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
