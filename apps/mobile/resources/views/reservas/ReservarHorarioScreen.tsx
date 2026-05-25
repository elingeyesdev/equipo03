import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Colors } from '../../../app/Providers/reservations/theme/colors';
import { useGymActivitiesQuery } from '../../../app/Providers/reservations/hooks/useGymActivitiesQuery';
import { reservationApi } from '../../../app/Providers/reservations/api/reservation.api';
import { CreateFreeReservationPayload } from '../../../app/Providers/reservations/api/reservation.types';

type RootStackParamList = {
  ReservarHorario: { gymId: number; gymName: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'ReservarHorario'>;

const TIME_SLOTS = [
  { label: '08:00 – 10:00', start: '08:00', end: '10:00' },
  { label: '10:00 – 12:00', start: '10:00', end: '12:00' },
  { label: '14:00 – 16:00', start: '14:00', end: '16:00' },
  { label: '16:00 – 18:00', start: '16:00', end: '18:00' },
];

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const generateDays = () =>
  Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      value: format(d, 'yyyy-MM-dd'),
      label: format(d, 'dd/MM'),
      dayName: DAY_NAMES[d.getDay()],
    };
  });

export const ReservarHorarioScreen = ({ route, navigation }: Props) => {
  const { gymId, gymName } = route.params;
  const days = useMemo(generateDays, []);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<typeof TIME_SLOTS[0] | null>(null);

  const { data: activities = [], isLoading } = useGymActivitiesQuery(gymId);

  const mutation = useMutation({
    mutationFn: (payload: CreateFreeReservationPayload) =>
      reservationApi.createFreeReservation(payload),
    onSuccess: () => {
      Alert.alert('¡Reserva confirmada!', 'Tu reserva fue creada con éxito.', [
        {
          text: 'Ver mis reservas',
          onPress: () => (navigation as any).getParent()?.navigate('Mis Reservas'),
        },
      ]);
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message ?? 'No se pudo completar la reserva.';
      Alert.alert('Error al reservar', msg);
    },
  });

  const canConfirm = !!selectedDate && !!selectedActivityId && !!selectedSlot;

  const handleConfirm = () => {
    if (!canConfirm || !selectedSlot) return;
    mutation.mutate({
      gymId,
      reservationDate: selectedDate!,
      startTime: selectedSlot.start,
      endTime: selectedSlot.end,
    });
  };

  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.gymName}>{gymName}</Text>

        <Text style={s.sectionLabel}>Selecciona un día</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.carousel}>
          {days.map((d) => {
            const active = selectedDate === d.value;
            return (
              <TouchableOpacity
                key={d.value}
                style={[s.dayChip, active && s.dayChipActive]}
                onPress={() => setSelectedDate(active ? null : d.value)}
                activeOpacity={0.8}
              >
                <Text style={[s.dayName, active && s.dayTextActive]}>{d.dayName}</Text>
                <Text style={[s.dayDate, active && s.dayTextActive]}>{d.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={s.sectionLabel}>Selecciona una actividad</Text>
        {isLoading ? (
          <ActivityIndicator color={Colors.secondary} style={{ marginVertical: 16 }} />
        ) : activities.length === 0 ? (
          <Text style={s.empty}>No hay actividades disponibles.</Text>
        ) : (
          activities.map((a) => {
            const active = selectedActivityId === a.id;
            return (
              <TouchableOpacity
                key={a.id}
                style={[s.actCard, active && s.actCardActive]}
                onPress={() => setSelectedActivityId(active ? null : a.id)}
                activeOpacity={0.8}
              >
                <View style={s.actRow}>
                  <View style={s.actInfo}>
                    <Text style={[s.actName, active && s.actNameActive]}>{a.name}</Text>
                    {!!a.description && (
                      <Text style={s.actDesc} numberOfLines={2}>{a.description}</Text>
                    )}
                  </View>
                  <View style={[s.badge, active && s.badgeActive]}>
                    <Text style={[s.badgeTxt, active && s.badgeTxtActive]}>
                      {a.defaultDurationMin} min
                    </Text>
                  </View>
                </View>
                {active && (
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={18}
                    color={Colors.secondary}
                    style={s.checkIcon}
                  />
                )}
              </TouchableOpacity>
            );
          })
        )}

        <Text style={s.sectionLabel}>Selecciona un horario</Text>
        <View style={s.slotsGrid}>
          {TIME_SLOTS.map((slot) => {
            const active = selectedSlot?.start === slot.start;
            return (
              <TouchableOpacity
                key={slot.start}
                style={[s.slotBtn, active && s.slotBtnActive]}
                onPress={() => setSelectedSlot(active ? null : slot)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={15}
                  color={active ? Colors.secondary : Colors.textSoft}
                />
                <Text style={[s.slotTxt, active && s.slotTxtActive]}>{slot.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 130 }} />
      </ScrollView>

      <View style={s.bottomBar}>
        <TouchableOpacity
          style={[s.confirmBtn, (!canConfirm || mutation.isPending) && s.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={!canConfirm || mutation.isPending}
          activeOpacity={0.85}
        >
          {mutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.confirmTxt}>Confirmar Reserva</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20 },

  gymName:      { fontSize: 13, color: Colors.textSoft, marginBottom: 20 },
  sectionLabel: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 12, marginTop: 8 },
  empty:        { color: Colors.textSoft, fontSize: 14, marginBottom: 16 },

  carousel: { flexGrow: 0, marginBottom: 24 },
  dayChip: {
    width: 62,
    marginRight: 10,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  dayChipActive:   { borderColor: Colors.secondary, backgroundColor: 'rgba(0,217,255,0.1)' },
  dayName:         { fontSize: 11, fontWeight: '700', color: Colors.textSoft },
  dayDate:         { fontSize: 13, fontWeight: '600', color: Colors.textSoft, marginTop: 4 },
  dayTextActive:   { color: Colors.secondary },

  actCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  actCardActive:  { borderColor: Colors.secondary, backgroundColor: 'rgba(0,217,255,0.07)' },
  actRow:         { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  actInfo:        { flex: 1, marginRight: 10 },
  actName:        { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 3 },
  actNameActive:  { color: Colors.secondary },
  actDesc:        { fontSize: 12, color: Colors.textSoft, lineHeight: 17 },
  badge:          { backgroundColor: Colors.border, borderRadius: 7, paddingHorizontal: 9, paddingVertical: 3 },
  badgeActive:    { backgroundColor: 'rgba(0,217,255,0.2)' },
  badgeTxt:       { fontSize: 11, fontWeight: '600', color: Colors.textSoft },
  badgeTxtActive: { color: Colors.secondary },
  checkIcon:      { marginTop: 8, alignSelf: 'flex-end' },

  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  slotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    width: '47%',
  },
  slotBtnActive: { borderColor: Colors.secondary, backgroundColor: 'rgba(0,217,255,0.1)' },
  slotTxt:       { fontSize: 13, fontWeight: '600', color: Colors.textSoft },
  slotTxtActive: { color: Colors.secondary },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 101,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  confirmBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnDisabled: { opacity: 0.35 },
  confirmTxt: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },
});
