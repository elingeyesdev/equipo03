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
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { Colors } from '../theme/colors';
import { useGymActivitiesQuery, GymActivityUI } from '../hooks/useGymActivitiesQuery';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reservationApi } from '../api/reservation.api';
import { ERROR_MAP } from '../api/reservation.types';

type RootStackParamList = {
  ScheduleSelection: { gymId: number; gymName: string };
  MisReservas: undefined;
};
type Props = NativeStackScreenProps<RootStackParamList, 'ScheduleSelection'>;

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const WEEK_LABELS = ['Lu','Ma','Mi','Ju','Vi','Sá','Do'];
const JS_TO_DOW: Record<number, string> = { 0:'DOMINGO',1:'LUNES',2:'MARTES',3:'MIERCOLES',4:'JUEVES',5:'VIERNES',6:'SABADO' };
const HOURS   = Array.from({ length: 17 }, (_, i) => String(i + 6).padStart(2, '0'));
const MINUTES = ['00','15','30','45'];

const timeToMin = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
};

const nearestMinIdx = (m: number): number =>
  MINUTES.map((mv, i) => ({ i, d: Math.abs(parseInt(mv) - m) }))
    .sort((a, b) => a.d - b.d)[0].i;

const isGymOpenAt = (date: string, start: string, end: string, _acts: GymActivityUI[]): boolean => {
  // Los schedules de actividades NO son horarios operativos del gym.
  // Sin datos reales de apertura/cierre → asumir siempre abierto.
  // Solo validamos que end > start.
  if (!date || !start || !end) return true;
  if (timeToMin(end) <= timeToMin(start)) return false;
  return true;
};

const WheelPicker = ({ items, selectedIdx, onChange }: {
  items: string[];
  selectedIdx: number;
  onChange: (i: number) => void;
}) => {
  const prev = () => onChange(Math.max(0, selectedIdx - 1));
  const next = () => onChange(Math.min(items.length - 1, selectedIdx + 1));
  return (
    <View style={wp.wrap}>
      <TouchableOpacity onPress={prev} style={wp.btn} activeOpacity={0.6} hitSlop={{ top: 8, bottom: 4, left: 12, right: 12 }}>
        <MaterialCommunityIcons name="chevron-up" size={22} color={Colors.textSoft} />
      </TouchableOpacity>
      <View style={wp.valBox}>
        <Text style={wp.val}>{items[selectedIdx]}</Text>
      </View>
      <TouchableOpacity onPress={next} style={wp.btn} activeOpacity={0.6} hitSlop={{ top: 4, bottom: 8, left: 12, right: 12 }}>
        <MaterialCommunityIcons name="chevron-down" size={22} color={Colors.textSoft} />
      </TouchableOpacity>
    </View>
  );
};

const wp = StyleSheet.create({
  wrap:   { alignItems: 'center', width: 64 },
  btn:    { padding: 6 },
  valBox: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.secondary + '80', backgroundColor: 'rgba(0,217,255,0.08)', minWidth: 52, alignItems: 'center' },
  val:    { fontSize: 26, fontWeight: '800', color: Colors.secondary },
});

const TimeEditModal = ({ visible, startH, startM, endH, endM, onConfirm, onClose }: {
  visible: boolean;
  startH: string; startM: string;
  endH: string;   endM: string;
  onConfirm: (sh: string, sm: string, eh: string, em: string) => void;
  onClose: () => void;
}) => {
  const [sh, setSh] = useState('');
  const [sm, setSm] = useState('');
  const [eh, setEh] = useState('');
  const [em, setEm] = useState('');

  useEffect(() => {
    if (!visible) return;
    setSh(startH);
    setSm(startM);
    setEh(endH);
    setEm(endM);
  }, [visible]);

  const confirm = () => {
    const h24S = Math.max(6, Math.min(22, parseInt(sh) || 6));
    const h24E = Math.max(6, Math.min(22, parseInt(eh) || 6));
    const smN  = Math.max(0, Math.min(59, parseInt(sm) || 0));
    const emN  = Math.max(0, Math.min(59, parseInt(em) || 0));
    onConfirm(
      String(h24S).padStart(2, '0'),
      String(smN).padStart(2, '0'),
      String(h24E).padStart(2, '0'),
      String(emN).padStart(2, '0'),
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <TouchableOpacity style={tem.overlay} onPress={onClose} activeOpacity={1} />
        <View style={tem.card}>
          <Text style={tem.title}>Editar Horario</Text>
          <View style={tem.row}>
            <View style={tem.group}>
              <Text style={tem.groupLabel}>INICIO</Text>
              <View style={tem.inputs}>
                <TextInput
                  style={tem.input}
                  value={sh}
                  onChangeText={setSh}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="hh"
                  placeholderTextColor={Colors.border}
                  selectTextOnFocus
                />
                <Text style={tem.sep}>:</Text>
                <TextInput
                  style={tem.input}
                  value={sm}
                  onChangeText={setSm}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="mm"
                  placeholderTextColor={Colors.border}
                  selectTextOnFocus
                />
              </View>
            </View>

            <MaterialCommunityIcons name="arrow-right" size={20} color={Colors.textSoft} />

            <View style={tem.group}>
              <Text style={tem.groupLabel}>FIN</Text>
              <View style={tem.inputs}>
                <TextInput
                  style={tem.input}
                  value={eh}
                  onChangeText={setEh}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="hh"
                  placeholderTextColor={Colors.border}
                  selectTextOnFocus
                />
                <Text style={tem.sep}>:</Text>
                <TextInput
                  style={tem.input}
                  value={em}
                  onChangeText={setEm}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="mm"
                  placeholderTextColor={Colors.border}
                  selectTextOnFocus
                />
              </View>
            </View>
          </View>

          <Text style={tem.hint}>Hora: 6–22 · Minutos: 00–59</Text>

          <TouchableOpacity style={tem.confirmBtn} onPress={confirm} activeOpacity={0.85}>
            <Text style={tem.confirmTxt}>Aplicar</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const tem = StyleSheet.create({
  overlay:    { flex: 1 },
  card:       { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 16, borderTopWidth: 1, borderColor: Colors.border },
  title:      { fontSize: 17, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  row:        { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  group:      { alignItems: 'center', gap: 10 },
  groupLabel: { fontSize: 11, fontWeight: '700', color: Colors.textSoft, letterSpacing: 0.8 },
  inputs:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  input:      { width: 56, height: 52, backgroundColor: Colors.background, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, textAlign: 'center', fontSize: 24, fontWeight: '700', color: Colors.text },
  sep:        { fontSize: 24, fontWeight: '700', color: Colors.secondary },
  hint:       { textAlign: 'center', fontSize: 11, color: Colors.textSoft },
  confirmBtn: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  confirmTxt: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

const CalendarPicker = ({ selected, onSelect }: { selected: string | null; onSelect: (d: string) => void }) => {
  const today = new Date();
  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + 30);
  const [view, setView] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const year  = view.getFullYear();
  const month = view.getMonth();
  const offset    = (new Date(year, month, 1).getDay() + 6) % 7;
  const totalDays = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <View style={cal.container}>
      <View style={cal.header}>
        <TouchableOpacity style={cal.arrow} onPress={() => setView(new Date(year, month - 1, 1))}>
          <MaterialCommunityIcons name="chevron-left" size={22} color={Colors.secondary} />
        </TouchableOpacity>
        <Text style={cal.monthTitle}>{MONTHS_ES[month]} {year}</Text>
        <TouchableOpacity style={cal.arrow} onPress={() => { const n = new Date(year, month + 1, 1); if (n <= maxDate) setView(n); }}>
          <MaterialCommunityIcons name="chevron-right" size={22} color={Colors.secondary} />
        </TouchableOpacity>
      </View>
      <View style={cal.weekRow}>
        {WEEK_LABELS.map(d => <Text key={d} style={cal.weekLabel}>{d}</Text>)}
      </View>
      <View style={cal.grid}>
        {cells.map((day, i) => {
          if (!day) return <View key={`_${i}`} style={cal.cell} />;
          const d    = new Date(year, month, day);
          const str  = format(d, 'yyyy-MM-dd');
          const isSel    = selected === str;
          const isPast   = d < new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const isFar    = d > maxDate;
          const disabled = isPast || isFar;
          const isToday  = str === format(today, 'yyyy-MM-dd');
          return (
            <TouchableOpacity
              key={str}
              style={[cal.cell, isSel && cal.cellSel, isToday && !isSel && cal.cellToday]}
              onPress={() => !disabled && onSelect(str)}
              disabled={disabled}
              activeOpacity={0.75}
            >
              <Text style={[cal.cellTxt, isSel && cal.cellTxtSel, disabled && cal.cellTxtDisabled, isToday && !isSel && cal.cellTxtToday]}>
                {day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const cal = StyleSheet.create({
  container:       { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border },
  header:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  arrow:           { padding: 4 },
  monthTitle:      { fontSize: 15, fontWeight: '700', color: Colors.text },
  weekRow:         { flexDirection: 'row', marginBottom: 6 },
  weekLabel:       { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', color: Colors.textSoft },
  grid:            { flexDirection: 'row', flexWrap: 'wrap' },
  cell:            { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  cellSel:         { backgroundColor: Colors.secondary },
  cellToday:       { borderWidth: 1.5, borderColor: Colors.secondary },
  cellTxt:         { fontSize: 13, fontWeight: '600', color: Colors.text },
  cellTxtSel:      { color: '#000', fontWeight: '800' },
  cellTxtDisabled: { color: Colors.border },
  cellTxtToday:    { color: Colors.secondary },
});

export const ScheduleSelectionScreen = ({ route, navigation }: Props) => {
  const { gymId, gymName } = route.params;

  const [selectedDate,     setSelectedDate]     = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<GymActivityUI | null>(null);
  const [showSuccess,      setShowSuccess]      = useState(false);
  const [showTimeEdit,     setShowTimeEdit]     = useState(false);
  const [startHourIdx,      setStartHourIdx]      = useState(2);
  const [startMinIdx,       setStartMinIdx]       = useState(0);
  const [endHourIdx,        setEndHourIdx]        = useState(4);
  const [endMinIdx,         setEndMinIdx]         = useState(0);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null);

  const scaleAnim   = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const { data: activities = [], isLoading, error } = useGymActivitiesQuery(gymId);
  const queryClient = useQueryClient();

  const startTime = `${HOURS[startHourIdx]}:${MINUTES[startMinIdx]}`;
  const endTime   = `${HOURS[endHourIdx]}:${MINUTES[endMinIdx]}`;

  // Lectura defensiva de schedules (backend puede usar 'schedules' o 'gymActivitySchedules')
  const getScheds = (act: GymActivityUI) =>
    (act as any).gymActivitySchedules ?? act.schedules ?? [];

  // Día de semana del backend para la fecha seleccionada
  const selectedDOW = selectedDate
    ? JS_TO_DOW[new Date(selectedDate + 'T12:00:00').getDay()]
    : null;

  // Bloques de la actividad programada que corresponden al día elegido
  const daySchedules = selectedActivity && !selectedActivity.isFreeAccess && selectedDOW
    ? getScheds(selectedActivity).filter((sc: any) => (sc.dayOfWeek ?? '').toUpperCase() === selectedDOW)
    : [];

  const gymOpen    = isGymOpenAt(selectedDate ?? '', startTime, endTime, activities);
  const canConfirm = !!selectedDate && !!selectedActivity && !isLoading && (
    selectedActivity.isFreeAccess
      ? gymOpen                          // libre: end > start (isGymOpenAt simplificado)
      : selectedScheduleId != null       // programada: bloque seleccionado (permite id=0)
  );

  // Mutación para actividades de ACCESO LIBRE (payload con startTime/endTime)
  const createMutation = useMutation({
    mutationFn: reservationApi.createFreeReservation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] });
      setShowSuccess(true);
    },
    onError: (err: any) => {
      const errCode = err?.response?.data?.code || err?.response?.data?.message || 'ERROR_UNKNOWN';
      Alert.alert('Error al reservar', ERROR_MAP[errCode] ?? err?.response?.data?.message ?? 'No se pudo completar la reserva.');
    },
  });

  // Mutación para actividades PROGRAMADAS (payload con gymActivityScheduleId)
  const schedMutation = useMutation({
    mutationFn: reservationApi.createReservation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] });
      setShowSuccess(true);
    },
    onError: (err: any) => {
      const errCode = err?.response?.data?.code || err?.response?.data?.message || 'ERROR_UNKNOWN';
      Alert.alert('Error al reservar', ERROR_MAP[errCode] ?? err?.response?.data?.message ?? 'No se pudo completar la reserva.');
    },
  });

  const isPending = createMutation.isPending || schedMutation.isPending;

  useEffect(() => {
    if (!showSuccess) return;
    Animated.parallel([
      Animated.spring(scaleAnim,   { toValue: 1, useNativeDriver: true, bounciness: 18, speed: 6 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    const t = setTimeout(() => {
      setShowSuccess(false);
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      (navigation as any).getParent()?.navigate('Mis Reservas');
    }, 1800);
    return () => clearTimeout(t);
  }, [showSuccess]);

  const handleTimeConfirm = (sh: string, sm: string, eh: string, em: string) => {
    const hIdx = HOURS.indexOf(sh);
    if (hIdx >= 0) setStartHourIdx(hIdx);
    const mIdxS = MINUTES.indexOf(sm) >= 0 ? MINUTES.indexOf(sm) : nearestMinIdx(parseInt(sm));
    setStartMinIdx(mIdxS);
    const ehIdx = HOURS.indexOf(eh);
    if (ehIdx >= 0) setEndHourIdx(ehIdx);
    const mIdxE = MINUTES.indexOf(em) >= 0 ? MINUTES.indexOf(em) : nearestMinIdx(parseInt(em));
    setEndMinIdx(mIdxE);
    setShowTimeEdit(false);
  };

  const handleConfirm = () => {
    if (!canConfirm || !selectedDate || !selectedActivity) return;
    if (selectedActivity.isFreeAccess) {
      // Acceso libre → activityId REQUERIDO por el backend (flujo isFreeAccess=true)
      createMutation.mutate({
        gymId,
        activityId: selectedActivity.id,
        reservationDate: selectedDate,
        startTime,
        endTime,
      });
    } else {
      // Programada → solo el id del bloque seleccionado
      if (!selectedScheduleId) return;
      schedMutation.mutate({ gymActivityScheduleId: selectedScheduleId, reservationDate: selectedDate });
    }
  };

  if (isLoading) return (
    <View style={s.center}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={s.soft}>Cargando actividades...</Text>
    </View>
  );

  if (error) return (
    <View style={s.center}>
      <MaterialCommunityIcons name="calendar-remove" size={48} color={Colors.textSoft} />
      <Text style={s.soft}>No hay actividades disponibles.</Text>
    </View>
  );

  return (
    <View style={s.root}>
      <Modal visible={showSuccess} transparent animationType="none">
        <View style={s.overlay}>
          <Animated.View style={[s.successCard, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
            <View style={s.checkCircle}>
              <MaterialCommunityIcons name="check-bold" size={56} color="#fff" />
            </View>
            <Text style={s.successTitle}>¡Reserva confirmada!</Text>
            <Text style={s.successSub}>Actividad agregada a Mis Reservas</Text>
          </Animated.View>
        </View>
      </Modal>

      <TimeEditModal
        visible={showTimeEdit}
        startH={HOURS[startHourIdx]}
        startM={MINUTES[startMinIdx]}
        endH={HOURS[endHourIdx]}
        endM={MINUTES[endMinIdx]}
        onConfirm={handleTimeConfirm}
        onClose={() => setShowTimeEdit(false)}
      />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.pageTitle}>Nueva Reserva</Text>
        <Text style={s.gymName}>{gymName}</Text>

        <Text style={s.stepLabel}>1 · Selecciona una fecha</Text>
        <CalendarPicker selected={selectedDate} onSelect={setSelectedDate} />

        <Text style={s.stepLabel}>2 · Selecciona una actividad</Text>
        {activities.length === 0 ? (
          <Text style={s.soft}>Sin actividades disponibles.</Text>
        ) : activities.map((a) => {
          const sel = selectedActivity?.id === a.id;
          // Programada sin horarios = error de red o backend, se muestra pero deshabilitada
          const isScheduled = a.isFreeAccess !== true;
          const noSchedules = isScheduled && getScheds(a).length === 0;
          return (
            <TouchableOpacity
              key={a.id}
              style={[s.actCard, sel && s.actCardSel, noSchedules && s.actCardDisabled]}
              onPress={() => {
                if (noSchedules) return; // no permitir seleccionar sin horarios
                setSelectedActivity(sel ? null : a);
                setSelectedScheduleId(null);
              }}
              activeOpacity={noSchedules ? 1 : 0.8}
            >
              <View style={s.actRow}>
                <View style={s.actInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[s.actName, sel && s.actNameSel]}>{a?.name ?? '—'}</Text>
                    {/* Badge tipo */}
                    <Text style={a.isFreeAccess ? s.badgeFree : s.badgeSched}>
                      {a.isFreeAccess ? '🔓 Libre' : '📅 Horarios'}
                    </Text>
                  </View>
                  {!!a?.description && <Text style={s.actDesc} numberOfLines={2}>{a.description}</Text>}
                  {noSchedules && (
                    <Text style={s.actNoSched}>⚠️ Sin horarios disponibles</Text>
                  )}
                </View>
                <View style={[s.durBadge, sel && s.durBadgeSel]}>
                  <Text style={[s.durTxt, sel && s.durTxtSel]}>{a?.defaultDurationMin ?? '?'} min</Text>
                </View>
              </View>
              {sel && <MaterialCommunityIcons name="check-circle" size={18} color={Colors.secondary} style={s.checkIcon} />}
            </TouchableOpacity>
          );
        })}

        {/* ── Paso 3: condicional según tipo de actividad ─────────────────── */}
        {selectedActivity?.isFreeAccess === false ? (
          // ── PROGRAMADA: grilla de bloques del día ──
          <>
            <Text style={[s.stepLabel]}>3 · Selecciona un bloque</Text>
            {!selectedDate ? (
              <Text style={s.soft}>Elige una fecha primero.</Text>
            ) : !selectedActivity ? (
              <Text style={s.soft}>Selecciona una actividad primero.</Text>
            ) : daySchedules.length === 0 ? (
              <Text style={[s.soft, { color: '#EF4444' }]}>
                No hay clases de {selectedActivity.name} este día.{'\n'}Prueba otra fecha.
              </Text>
            ) : (
              <View style={s.schedGrid}>
                {daySchedules.map(sc => {
                  // Resolución defensiva del ID: campo 'id' o fallbacks del backend
                  const scId: number = sc.id ?? (sc as any).gymActivityScheduleId ?? (sc as any).scheduleId ?? sc.id;
                  const isSel = selectedScheduleId === scId;
                  return (
                    <TouchableOpacity
                      key={scId ?? sc.startTime}
                      style={[s.schedBlock, isSel && s.schedBlockSel]}
                      onPress={() => setSelectedScheduleId(isSel ? null : scId)}
                      activeOpacity={0.8}
                    >
                      <Text style={[s.schedTime, isSel && s.schedTimeSel]}>
                        {sc.startTime.substring(0, 5)} – {sc.endTime.substring(0, 5)}
                      </Text>
                      <Text style={[s.schedCap, isSel && s.schedCapSel]}>
                        👥 {sc.maxAttendees} cupos
                      </Text>
                      {isSel && (
                        <MaterialCommunityIcons name="check-circle" size={16} color={Colors.secondary} style={{ marginTop: 4 }} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </>
        ) : (
          // ── ACCESO LIBRE: selectores de hora manual ──
          <>
            <View style={s.stepRow}>
              <Text style={[s.stepLabel, { marginTop: 0, marginBottom: 0 }]}>3 · Selecciona el horario</Text>
              <TouchableOpacity style={s.editBtn} onPress={() => setShowTimeEdit(true)}>
                <MaterialCommunityIcons name="pencil-outline" size={14} color={Colors.secondary} />
                <Text style={s.editBtnTxt}>Editar</Text>
              </TouchableOpacity>
            </View>
            {!selectedDate ? (
              <Text style={s.soft}>Elige una fecha primero.</Text>
            ) : (
              <>
                <View style={s.timeContainer}>
                  <View style={s.timeGroup}>
                    <Text style={s.timeGroupLabel}>INICIO</Text>
                    <View style={s.wheelRow}>
                      <WheelPicker items={HOURS} selectedIdx={startHourIdx} onChange={setStartHourIdx} />
                      <Text style={s.timeSep}>:</Text>
                      <WheelPicker items={MINUTES} selectedIdx={startMinIdx} onChange={setStartMinIdx} />
                    </View>
                  </View>
                  <View style={s.timeDivider} />
                  <View style={s.timeGroup}>
                    <Text style={s.timeGroupLabel}>FIN</Text>
                    <View style={s.wheelRow}>
                      <WheelPicker items={HOURS} selectedIdx={endHourIdx} onChange={setEndHourIdx} />
                      <Text style={s.timeSep}>:</Text>
                      <WheelPicker items={MINUTES} selectedIdx={endMinIdx} onChange={setEndMinIdx} />
                    </View>
                  </View>
                </View>
                {!gymOpen && (
                  <Text style={[s.soft, { color: '#EF4444', marginTop: 8 }]}>
                    Fuera del horario de atención del gimnasio.
                  </Text>
                )}
              </>
            )}
          </>
        )}

        <View style={{ height: 200 }} />
      </ScrollView>

      <View style={s.bottomBar}>
        {selectedActivity && selectedDate && (
          <View style={s.summaryBox}>
            <Text style={s.summaryName} numberOfLines={1}>{selectedActivity.name}</Text>
            <Text style={s.summarySub}>
              {selectedDate}
              {selectedActivity.isFreeAccess
                ? ` · ${startTime} – ${endTime}`
                : selectedScheduleId
                  ? (() => {
                      const sc = getScheds(selectedActivity).find((x: any) => x.id === selectedScheduleId);
                      return sc ? ` · ${sc.startTime.substring(0, 5)} – ${sc.endTime.substring(0, 5)}` : '';
                    })()
                  : ''}
            </Text>
          </View>
        )}
        <TouchableOpacity
          style={[s.confirmBtn, (!canConfirm || isPending) && s.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={!canConfirm || isPending}
          activeOpacity={0.85}
        >
          {isPending
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.confirmTxt}>Confirmar Reserva</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background, gap: 12, padding: 24 },
  soft:   { color: Colors.textSoft, fontSize: 14, textAlign: 'center' },
  scroll: { padding: 16, paddingBottom: 260 },

  pageTitle: { fontSize: 22, fontWeight: '800', color: Colors.text, marginTop: 8, marginBottom: 2 },
  gymName:   { fontSize: 13, color: Colors.textSoft, marginBottom: 20 },
  stepLabel: { fontSize: 12, fontWeight: '700', color: Colors.secondary, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 20, marginBottom: 12 },
  stepRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, marginBottom: 12 },
  editBtn:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: Colors.secondary + '60', backgroundColor: 'rgba(0,217,255,0.08)' },
  editBtnTxt:{ fontSize: 12, fontWeight: '700', color: Colors.secondary },

  actCard:        { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1.5, borderColor: Colors.border },
  actCardSel:     { borderColor: Colors.secondary, backgroundColor: 'rgba(0,217,255,0.07)' },
  actCardDisabled:{ opacity: 0.45 },
  actRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  actInfo:        { flex: 1, marginRight: 12 },
  actName:        { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  actNameSel:     { color: Colors.secondary },
  actDesc:        { fontSize: 12, color: Colors.textSoft },
  actNoSched:     { fontSize: 11, color: '#EF4444', marginTop: 5, fontWeight: '600' },
  badgeFree:      { fontSize: 10, fontWeight: '700', color: '#FF5E00', backgroundColor: 'rgba(255,94,0,0.12)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' },
  badgeSched:     { fontSize: 10, fontWeight: '700', color: Colors.secondary, backgroundColor: 'rgba(0,217,255,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' },
  durBadge:   { backgroundColor: Colors.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  durBadgeSel:{ backgroundColor: 'rgba(0,217,255,0.2)' },
  durTxt:     { fontSize: 12, fontWeight: '600', color: Colors.textSoft },
  durTxtSel:  { color: Colors.secondary },
  checkIcon:  { alignSelf: 'flex-end', marginTop: 8 },

  timeContainer:  { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 16, alignItems: 'center', justifyContent: 'space-around' },
  timeGroup:      { alignItems: 'center', gap: 10 },
  timeGroupLabel: { fontSize: 11, fontWeight: '700', color: Colors.textSoft, letterSpacing: 0.8 },
  wheelRow:       { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeSep:        { fontSize: 28, fontWeight: '700', color: Colors.secondary, marginBottom: 4 },
  timeDivider:    { width: 1, height: 80, backgroundColor: Colors.border },

  bottomBar:  { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 101, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border, gap: 10 },
  summaryBox: { paddingHorizontal: 4 },
  summaryName:{ fontSize: 15, fontWeight: '700', color: Colors.text },
  summarySub: { fontSize: 12, color: Colors.textSoft },
  confirmBtn: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  confirmBtnDisabled: { opacity: 0.35 },
  confirmTxt: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },

  // ── Grilla bloques programados ───────────────────────────────────────────────
  schedGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  schedBlock:    { flex: 1, minWidth: '45%', backgroundColor: Colors.surface, borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', gap: 4 },
  schedBlockSel: { borderColor: Colors.secondary, backgroundColor: 'rgba(0,217,255,0.07)' },
  schedTime:     { fontSize: 15, fontWeight: '700', color: Colors.text },
  schedTimeSel:  { color: Colors.secondary },
  schedCap:      { fontSize: 11, color: Colors.textSoft },
  schedCapSel:   { color: Colors.secondary + 'AA' },

  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center' },
  successCard:  { backgroundColor: Colors.surface, borderRadius: 24, paddingVertical: 40, paddingHorizontal: 48, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 20, gap: 16 },
  checkCircle:  { width: 100, height: 100, borderRadius: 50, backgroundColor: '#22C55E', justifyContent: 'center', alignItems: 'center', shadowColor: '#22C55E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 10 },
  successTitle: { color: Colors.text, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  successSub:   { color: Colors.textSoft, fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
