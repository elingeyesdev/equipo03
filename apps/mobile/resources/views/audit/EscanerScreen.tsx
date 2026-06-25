import { useRef, useState, useEffect } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { reservationApi } from '../../../app/Providers/reservations/api/reservation.api';
import { checkinsApi } from '../../../app/Providers/access/api/checkins.api';
import { DumbbellSpinner } from '../../../app/Shared/components/ui/DumbbellSpinner';

const WIN = Dimensions.get('window');
const BOX = WIN.width * 0.65;

// mode: 'reservations' = escanear QR de reserva de cliente
//       'staff'        = escanear carnet QR del personal para registrar ingreso
type ScanMode = 'reservations' | 'staff';

// Decodifica el payload del JWT sin verificar firma (sirve incluso si el token expiró)
const decodeJwtPayload = (token: string): { sub?: number; gymId?: number; type?: string } | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const padded = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
};

const fmtDate = (d: string) => {
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
};

const fmtTime = (t?: string) => (t ? t.substring(0, 5) : '?');

// Devuelve true si la hora actual (HH:mm) supera la hora de fin de la reserva
const isTimePast = (endTime?: string): boolean => {
  if (!endTime) return false;
  const now  = new Date();
  const [eh, em] = endTime.split(':').map(Number);
  return now.getHours() > eh || (now.getHours() === eh && now.getMinutes() >= em);
};

const MODES: Record<ScanMode, { title: string; hint: string; iconName: string }> = {
  reservations: {
    title:    'Escanear Reserva de Cliente',
    hint:     'Apunta el QR de reserva del cliente dentro del recuadro',
    iconName: 'ticket-confirmation-outline',
  },
  staff: {
    title:    'Registrar Ingreso de Personal',
    hint:     'Apunta el carnet QR del empleado dentro del recuadro',
    iconName: 'badge-account-outline',
  },
};

export const EscanerScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<Record<string, object | undefined>>>();
  const route = useRoute<any>();
  const mode: ScanMode = route.params?.mode ?? 'reservations';

  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning]     = useState(true);
  const [processing, setProcessing] = useState(false);
  const queryClient = useQueryClient();
  const lastScan    = useRef<string | null>(null);

  const { title, hint, iconName } = MODES[mode];

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCode = async ({ data }: { data: string }) => {
    if (!scanning || processing || data === lastScan.current) return;
    lastScan.current = data;
    setScanning(false);
    setProcessing(true);

    try {
      if (mode === 'reservations') {
        await handleReservationScan(data);
      } else {
        await handleStaffScan(data);
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleReservationScan = async (data: string) => {
    const token = data.trim();
    if (!token) { resetScan(); return; }

    // Detección cruzada: número puro = carnet de empleado
    if (/^\d+$/.test(token)) {
      Alert.alert(
        '⚠️ Escáner incorrecto',
        'Este QR es el carnet de un empleado.\n\nUsa el botón "Registrar Ingreso del Personal" para registrar el ingreso de staff.',
        [{ text: 'Entendido', onPress: () => resetScan() }]
      );
      return;
    }

    try {
      await reservationApi.checkInByToken(token);

      await queryClient.invalidateQueries({ queryKey: ['audit-history'] });
      await queryClient.invalidateQueries({ queryKey: ['gym-reservations'] });
      await queryClient.invalidateQueries({ queryKey: ['gym-audit-reservations'] });

      Alert.alert(
        '✅ Ingreso Autorizado',
        'Reserva del cliente registrada correctamente.',
        [
          { text: 'Escanear otro', onPress: () => resetScan() },
          { text: 'Volver', style: 'cancel', onPress: () => navigation?.goBack() },
        ]
      );
    } catch (err: any) {
      const httpStatus = err?.response?.status;
      const errorData  = err?.response?.data;

      // 409: reserva futura — el JWT sigue válido, usar forceCheckIn directamente
      if (httpStatus === 409 && errorData?.code === 'FUTURE_RESERVATION_WARNING') {
        const msg = typeof errorData?.message === 'string'
          ? errorData.message
          : 'Esta reserva es para una fecha futura.';
        Alert.alert(
          'Reserva Futura',
          `${msg}\n\n¿Confirmar el ingreso de todas formas?`,
          [
            {
              text: 'Forzar Ingreso',
              onPress: async () => {
                try {
                  await reservationApi.checkInByToken(token, true);
                  await queryClient.invalidateQueries({ queryKey: ['audit-history'] });
                  await queryClient.invalidateQueries({ queryKey: ['gym-reservations'] });
                  await queryClient.invalidateQueries({ queryKey: ['gym-audit-reservations'] });
                  Alert.alert(
                    '✅ Ingreso Autorizado',
                    'Reserva del cliente registrada correctamente.',
                    [
                      { text: 'Escanear otro', onPress: () => resetScan() },
                      { text: 'Volver', style: 'cancel', onPress: () => navigation?.goBack() },
                    ]
                  );
                } catch (e: any) {
                  const emsg = e?.response?.data?.message || e?.message || 'Error al confirmar.';
                  Alert.alert('Error', emsg, [{ text: 'Entendido', onPress: () => resetScan() }]);
                }
              },
            },
            { text: 'Cancelar', style: 'cancel', onPress: () => resetScan() },
          ]
        );
        return;
      }

      // 403: violación territorial — mostrar mensaje estructurado del backend
      if (httpStatus === 403 && errorData?.code === 'TERRITORY_VIOLATION') {
        const msg = typeof errorData?.message === 'string'
          ? errorData.message
          : 'Esta reserva pertenece a otra sucursal. No tienes acceso para registrar ingresos aquí.';
        Alert.alert(
          'Reserva de otra sucursal',
          msg,
          [{ text: 'Entendido', onPress: () => resetScan() }]
        );
        return;
      }

      // Fallback: decodificar JWT y usar el flujo rico existente (expirado, cancelada, etc.)
      const jwtPayload = decodeJwtPayload(token);
      const reservationId = typeof jwtPayload?.sub === 'number' ? jwtPayload.sub : null;

      if (reservationId) {
        await handleReservationError(reservationId, err);
      } else {
        Alert.alert(
          '❌ QR no reconocido',
          'Este código QR no es válido para check-in de reservas. Verifica que el cliente muestre el QR correcto desde su pantalla de reservas.',
          [
            { text: 'Reintentar', onPress: () => resetScan() },
            { text: 'Cancelar', style: 'cancel', onPress: () => navigation?.goBack() },
          ]
        );
      }
    }
  };

  // Obtiene detalles de la reserva y muestra el mensaje contextual adecuado
  const handleReservationError = async (reservationId: number, originalErr: any) => {
    // Detectar 403 por status HTTP (no por texto, que puede variar según el backend)
    const isCrossBrand = originalErr?.response?.status === 403;

    try {
      const r = await reservationApi.getReservationById(reservationId);

      const clientName  = r.user?.profile?.fullName || 'el cliente';
      const date        = r.reservationDate || '';          // YYYY-MM-DD
      const startTime   = fmtTime(r.startTime ?? r.gymActivitySchedule?.startTime);
      const endTime     = fmtTime(r.endTime   ?? r.gymActivitySchedule?.endTime);
      const activity    = r.freeActivity?.name ?? r.gymActivitySchedule?.gymActivity?.name ?? '';
      const fmtDateStr  = date ? fmtDate(date) : '?';

      if (isCrossBrand) {
        const gymName   = r.gym?.name;
        const brandName = r.gym?.brand?.name ?? r.gym?.parent?.name;
        const location  = [gymName, brandName].filter(Boolean).join(' — ');
        Alert.alert(
          '🏢 Reserva de otra sucursal',
          `La reserva de ${clientName}${activity ? ` (${activity})` : ''} está registrada en "${location || 'otra sucursal'}" para el ${fmtDateStr} de ${startTime} a ${endTime}.\n\nNo tienes acceso para registrar ingresos de esta sucursal.`,
          [{ text: 'Entendido', onPress: () => resetScan() }]
        );
        return;
      }

      // Reserva ya completada
      if (r.status === 'COMPLETADA') {
        Alert.alert(
          'ℹ️ Reserva ya completada',
          `La reserva de ${clientName}${activity ? ` (${activity})` : ''} para el ${fmtDateStr} ya fue registrada como completada.`,
          [{ text: 'Entendido', onPress: () => resetScan() }]
        );
        return;
      }

      // Reserva cancelada
      if (r.status === 'CANCELADA' || r.status === 'CANCELLED') {
        Alert.alert(
          '❌ Reserva cancelada',
          `La reserva de ${clientName}${activity ? ` (${activity})` : ''} para el ${fmtDateStr} fue cancelada y no puede procesarse.`,
          [{ text: 'Entendido', onPress: () => resetScan() }]
        );
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const isToday    = date === today;
      const isPastDate = date < today;
      const isFuture   = date > today;

      // Caducada: fecha pasada
      if (isPastDate) {
        Alert.alert(
          '⏱️ Reserva caducada',
          `La reserva de ${clientName}${activity ? ` (${activity})` : ''} ha caducado.\n\nEstaba programada para el ${fmtDateStr} de ${startTime} a ${endTime}.`,
          [{ text: 'Entendido', onPress: () => resetScan() }]
        );
        return;
      }

      // Caducada: mismo día pero ya pasó la hora fin
      if (isToday && isTimePast(r.endTime ?? r.gymActivitySchedule?.endTime)) {
        Alert.alert(
          '⏱️ Horario caducado',
          `La reserva de ${clientName}${activity ? ` (${activity})` : ''} ha caducado.\n\nEstaba programada para el ${fmtDateStr} de ${startTime} a ${endTime}.`,
          [{ text: 'Entendido', onPress: () => resetScan() }]
        );
        return;
      }

      // Fecha futura: ofrecer check-in adelantado con confirmación
      if (isFuture) {
        Alert.alert(
          '📅 Reserva futura',
          `La reserva de ${clientName}${activity ? ` (${activity})` : ''} está registrada para el ${fmtDateStr} de ${startTime} a ${endTime}.\n\n¿Confirmar el ingreso de todas formas?`,
          [
            {
              text: 'Confirmar ingreso',
              onPress: async () => {
                try {
                  await reservationApi.confirmReservation(reservationId);
                  await queryClient.invalidateQueries({ queryKey: ['audit-history'] });
                  await queryClient.invalidateQueries({ queryKey: ['gym-audit-reservations'] });
                  Alert.alert(
                    '✅ Ingreso Confirmado',
                    `Ingreso de ${clientName} registrado correctamente.`,
                    [
                      { text: 'Escanear otro', onPress: () => resetScan() },
                      { text: 'Volver', style: 'cancel', onPress: () => navigation?.goBack() },
                    ]
                  );
                } catch (e: any) {
                  const msg = e?.response?.data?.message || e?.message || 'Error al confirmar.';
                  Alert.alert('❌ Error', msg, [{ text: 'Entendido', onPress: () => resetScan() }]);
                }
              },
            },
            { text: 'Cancelar', style: 'cancel', onPress: () => resetScan() },
          ]
        );
        return;
      }

      // Hoy pero QR expirado (JWT de 3 min vencido): ofrecer check-in manual
      Alert.alert(
        '⏱️ QR expirado',
        `El QR de ${clientName} ha expirado (validez: 3 minutos).\n\nLa reserva es para hoy ${fmtDateStr} de ${startTime} a ${endTime}. ¿Confirmar el ingreso manualmente?`,
        [
          {
            text: 'Confirmar igualmente',
            onPress: async () => {
              try {
                await reservationApi.confirmReservation(reservationId);
                await queryClient.invalidateQueries({ queryKey: ['audit-history'] });
                await queryClient.invalidateQueries({ queryKey: ['gym-audit-reservations'] });
                Alert.alert(
                  '✅ Ingreso Confirmado',
                  `Ingreso de ${clientName} registrado correctamente.`,
                  [
                    { text: 'Escanear otro', onPress: () => resetScan() },
                    { text: 'Volver', style: 'cancel', onPress: () => navigation?.goBack() },
                  ]
                );
              } catch (e: any) {
                const msg = e?.response?.data?.message || e?.message || 'Error al confirmar.';
                Alert.alert('❌ Error', msg, [{ text: 'Entendido', onPress: () => resetScan() }]);
              }
            },
          },
          { text: 'Cancelar', style: 'cancel', onPress: () => resetScan() },
        ]
      );
    } catch {
      if (isCrossBrand) {
        const backendMsg = typeof originalErr?.response?.data?.message === 'string'
          ? originalErr.response.data.message
          : null;
        Alert.alert(
          '🏢 Reserva de otra sucursal',
          backendMsg ?? 'Esta reserva pertenece a otra sucursal. Solo puedes registrar ingresos de las sucursales asignadas a tu cuenta.',
          [{ text: 'Entendido', onPress: () => resetScan() }]
        );
      } else {
        Alert.alert(
          '❌ No se pudo procesar',
          'No fue posible obtener los detalles de esta reserva. Verifica tu conexión e intenta de nuevo.',
          [
            { text: 'Reintentar', onPress: () => resetScan() },
            { text: 'Cancelar', style: 'cancel', onPress: () => navigation?.goBack() },
          ]
        );
      }
    }
  };

  const handleStaffScan = async (data: string) => {
    try {
      const raw = data.trim();
      const userId = parseInt(raw, 10);

      // Detección cruzada: si el contenido NO es un número puro, es un QR de reserva
      const looksLikeReservationQR = isNaN(userId) || userId <= 0 || String(userId) !== raw;
      if (looksLikeReservationQR) {
        Alert.alert(
          '⚠️ Escáner incorrecto',
          'Este QR es de una reserva de cliente.\n\nUsa el botón "Escanear Reserva de Cliente" para validar el ingreso de un miembro.',
          [{ text: 'Entendido', onPress: () => resetScan() }]
        );
        return;
      }

      await checkinsApi.staffCheckIn(userId);

      await queryClient.invalidateQueries({ queryKey: ['audit-history'] });

      Alert.alert(
        '✅ Ingreso Registrado',
        'El ingreso del personal ha sido registrado correctamente.',
        [
          { text: 'Escanear otro', onPress: () => resetScan() },
          { text: 'Volver', style: 'cancel', onPress: () => navigation?.goBack() },
        ]
      );
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error   ||
        err?.message                 ||
        'Error al registrar el ingreso del personal.';

      Alert.alert('❌ No se pudo registrar', msg, [
        { text: 'Reintentar', onPress: () => resetScan() },
        { text: 'Cancelar', style: 'cancel', onPress: () => navigation?.goBack() },
      ]);
    }
  };

  const resetScan = () => {
    lastScan.current = null;
    setScanning(true);
    setProcessing(false);
  };

  if (!permission) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <DumbbellSpinner size="large" color="#f05b22" />
          <Text style={s.hint}>Verificando permisos de cámara…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <MaterialCommunityIcons name="camera-off" size={52} color="#666" />
          <Text style={s.errorTxt}>Permiso de cámara requerido.</Text>
          <Text style={s.hint}>Actívalo desde Configuración del dispositivo.</Text>
          {permission.canAskAgain && (
            <TouchableOpacity style={s.permBtn} onPress={requestPermission}>
              <Text style={s.permTxt}>Conceder permiso</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[s.permBtn, { marginTop: 8, borderColor: '#444' }]} onPress={() => navigation?.goBack()}>
            <Text style={[s.permTxt, { color: '#999' }]}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={s.root}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanning && !processing ? handleBarCode : undefined}
      />

      <View style={s.overlay}>
        <View style={s.overlayTop} />

        <View style={s.overlayMid}>
          <View style={s.overlaySide} />
          <View style={s.window}>
            <View style={[s.corner, s.tl]} />
            <View style={[s.corner, s.tr]} />
            <View style={[s.corner, s.bl]} />
            <View style={[s.corner, s.br]} />
          </View>
          <View style={s.overlaySide} />
        </View>

        <View style={s.overlayBot}>
          {processing ? (
            <View style={s.processingRow}>
              <DumbbellSpinner size="small" color="#f05b22" />
              <Text style={s.processingTxt}>Verificando…</Text>
            </View>
          ) : scanning ? (
            <Text style={s.hint}>{hint}</Text>
          ) : (
            <Text style={s.hint}>Procesando…</Text>
          )}

          <TouchableOpacity style={s.backBtn} onPress={() => navigation?.goBack()} activeOpacity={0.8}>
            <MaterialCommunityIcons name="chevron-left" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Cabecera flotante con modo actual */}
      <SafeAreaView style={s.header} pointerEvents="none">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <MaterialCommunityIcons name={iconName as any} size={16} color="#fff" />
          <Text style={s.headerTxt}>{title}</Text>
        </View>
      </SafeAreaView>
    </View>
  );
};

const OVERLAY = 'rgba(0,0,0,0.72)';

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#000' },
  safe:   { flex: 1, backgroundColor: '#0A0A0A' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 14 },

  overlay:    { flex: 1 },
  overlayTop: { flex: 1, backgroundColor: OVERLAY },
  overlayMid: { flexDirection: 'row', height: BOX },
  overlaySide:{ flex: 1, backgroundColor: OVERLAY },
  overlayBot: { flex: 1, backgroundColor: OVERLAY, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 24 },

  window: { width: BOX, height: BOX },

  corner: { position: 'absolute', width: 26, height: 26, borderColor: '#f05b22', borderWidth: 3 },
  tl: { top: 0, left: 0,  borderRightWidth: 0, borderBottomWidth: 0 },
  tr: { top: 0, right: 0, borderLeftWidth:  0, borderBottomWidth: 0 },
  bl: { bottom: 0, left: 0,  borderRightWidth: 0, borderTopWidth: 0 },
  br: { bottom: 0, right: 0, borderLeftWidth:  0, borderTopWidth: 0 },

  header:    { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', paddingTop: 12 },
  headerTxt: { color: '#fff', fontSize: 15, fontWeight: '700', textShadowColor: '#000', textShadowRadius: 6, textShadowOffset: { width: 0, height: 1 } },

  hint:          { color: '#E5E5EA', fontSize: 13, textAlign: 'center', lineHeight: 18 },
  processingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  processingTxt: { color: '#f05b22', fontSize: 14, fontWeight: '600' },

  errorTxt: { color: '#FF5E00', fontSize: 15, fontWeight: '700', textAlign: 'center' },

  permBtn: { marginTop: 4, paddingHorizontal: 24, paddingVertical: 11, borderRadius: 10, borderWidth: 1, borderColor: '#f05b22' },
  permTxt: { color: '#f05b22', fontWeight: '600', fontSize: 14 },

  backBtn: { width: 40, height: 40, backgroundColor: '#1C1C1E', borderRadius: 12, borderWidth: 1, borderColor: '#3A3A3C', justifyContent: 'center', alignItems: 'center' },
});
