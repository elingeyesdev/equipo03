/**
 * EscanerScreen — Escáner QR para GERENTE.
 * Lee el JSON { reservationId } del QR del cliente
 * y dispara PUT /api/reservations/{id}/confirm.
 */
import { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { reservationApi } from '../../../app/Providers/reservations/api/reservation.api';

const WIN = Dimensions.get('window');
const BOX = WIN.width * 0.65;

export const EscanerScreen = ({ navigation }: any) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning]   = useState(true);   // false = pausado
  const [processing, setProcessing] = useState(false);
  const queryClient = useQueryClient();
  const lastScan    = useRef<string | null>(null);

  // Pedir permiso automático al montar
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCode = async ({ data }: { data: string }) => {
    // Evitar doble disparo
    if (!scanning || processing || data === lastScan.current) return;
    lastScan.current = data;
    setScanning(false);
    setProcessing(true);

    try {
      // Parsear JSON del QR
      let reservationId: number | null = null;
      try {
        const parsed = JSON.parse(data);
        reservationId = Number(parsed?.reservationId);
      } catch {
        throw new Error('QR inválido: no es un pase de GymSync.');
      }

      if (!reservationId || isNaN(reservationId)) {
        throw new Error('QR inválido: no contiene reservationId.');
      }

      // Confirmar reserva en el backend
      await reservationApi.confirmReservation(reservationId);

      // Invalidar auditoría para refrescar lista
      await queryClient.invalidateQueries({ queryKey: ['audit-history'] });
      await queryClient.invalidateQueries({ queryKey: ['gym-reservations'] });

      Alert.alert(
        '✅ Ingreso Autorizado',
        `Reserva #${reservationId} confirmada correctamente.`,
        [
          {
            text: 'Escanear otro',
            onPress: () => {
              lastScan.current = null;
              setScanning(true);
              setProcessing(false);
            },
          },
          {
            text: 'Volver',
            style: 'cancel',
            onPress: () => navigation?.goBack(),
          },
        ]
      );
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error   ||
        err?.message                 ||
        'Error al confirmar el ingreso.';

      Alert.alert('❌ Acceso Denegado', msg, [
        {
          text: 'Reintentar',
          onPress: () => {
            lastScan.current = null;
            setScanning(true);
            setProcessing(false);
          },
        },
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: () => navigation?.goBack(),
        },
      ]);
    } finally {
      setProcessing(false);
    }
  };

  // Sin permiso aún
  if (!permission) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <ActivityIndicator size="large" color="#f05b22" />
          <Text style={s.hint}>Verificando permisos de cámara…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Permiso denegado
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

      {/* Overlay oscuro con ventana transparente */}
      <View style={s.overlay}>
        {/* Fila superior */}
        <View style={s.overlayTop} />

        {/* Fila central: lateral + ventana + lateral */}
        <View style={s.overlayMid}>
          <View style={s.overlaySide} />
          <View style={s.window}>
            {/* Esquinas decorativas */}
            <View style={[s.corner, s.tl]} />
            <View style={[s.corner, s.tr]} />
            <View style={[s.corner, s.bl]} />
            <View style={[s.corner, s.br]} />
          </View>
          <View style={s.overlaySide} />
        </View>

        {/* Fila inferior */}
        <View style={s.overlayBot}>
          {processing ? (
            <View style={s.processingRow}>
              <ActivityIndicator size="small" color="#f05b22" />
              <Text style={s.processingTxt}>Verificando…</Text>
            </View>
          ) : scanning ? (
            <Text style={s.hint}>Apunta el QR del cliente dentro del recuadro</Text>
          ) : (
            <Text style={s.hint}>Procesando…</Text>
          )}

          <TouchableOpacity style={s.backBtn} onPress={() => navigation?.goBack()} activeOpacity={0.8}>
            <MaterialCommunityIcons name="arrow-left" size={18} color="#fff" />
            <Text style={s.backTxt}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Cabecera flotante */}
      <SafeAreaView style={s.header} pointerEvents="none">
        <Text style={s.headerTxt}>📷 Escanear Ingreso</Text>
      </SafeAreaView>
    </View>
  );
};

const OVERLAY = 'rgba(0,0,0,0.72)';

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#000' },
  safe:   { flex: 1, backgroundColor: '#0A0A0A' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 14 },

  // Cámara overlay
  overlay:    { flex: 1 },
  overlayTop: { flex: 1, backgroundColor: OVERLAY },
  overlayMid: { flexDirection: 'row', height: BOX },
  overlaySide:{ flex: 1, backgroundColor: OVERLAY },
  overlayBot: { flex: 1, backgroundColor: OVERLAY, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 24 },

  window: {
    width: BOX, height: BOX,
    // Sin fondo → cámara visible
  },

  // Esquinas de la mira
  corner: { position: 'absolute', width: 26, height: 26, borderColor: '#f05b22', borderWidth: 3 },
  tl: { top: 0, left: 0,  borderRightWidth: 0, borderBottomWidth: 0 },
  tr: { top: 0, right: 0, borderLeftWidth:  0, borderBottomWidth: 0 },
  bl: { bottom: 0, left: 0,  borderRightWidth: 0, borderTopWidth: 0 },
  br: { bottom: 0, right: 0, borderLeftWidth:  0, borderTopWidth: 0 },

  // Cabecera
  header:    { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', paddingTop: 12 },
  headerTxt: { color: '#fff', fontSize: 17, fontWeight: '700', textShadowColor: '#000', textShadowRadius: 6, textShadowOffset: { width: 0, height: 1 } },

  // Textos
  hint:          { color: '#E5E5EA', fontSize: 13, textAlign: 'center', lineHeight: 18 },
  processingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  processingTxt: { color: '#f05b22', fontSize: 14, fontWeight: '600' },

  errorTxt: { color: '#FF5E00', fontSize: 15, fontWeight: '700', textAlign: 'center' },

  permBtn: { marginTop: 4, paddingHorizontal: 24, paddingVertical: 11, borderRadius: 10, borderWidth: 1, borderColor: '#f05b22' },
  permTxt: { color: '#f05b22', fontWeight: '600', fontSize: 14 },

  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(0,0,0,0.4)' },
  backTxt: { color: '#fff', fontWeight: '600', fontSize: 13 },
});
