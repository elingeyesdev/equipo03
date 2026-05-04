import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import QRCode from 'react-native-qrcode-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';

type RootStackParamList = {
  ReservationSuccess: { qrToken: string; activityName: string };
  MyReservations: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'ReservationSuccess'>;

export const ReservationSuccessScreen = ({ route, navigation }: Props) => {
  const { qrToken, activityName } = route.params;

  return (
    <View style={styles.container}>
      <View style={styles.successIconContainer}>
        <MaterialCommunityIcons name="check-circle" size={80} color={Colors.accent} />
      </View>
      
      <Text style={styles.title}>¡Reserva Confirmada!</Text>
      <Text style={styles.subtitle}>Tu lugar para {activityName} está asegurado.</Text>

      <View style={styles.qrContainer}>
        <QRCode
          value={qrToken}
          size={220}
          color={Colors.background}
          backgroundColor={Colors.surface}
        />
        <Text style={styles.qrInstruction}>
          Muestra este código en recepción o en el torniquete al llegar al gimnasio.
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => navigation.navigate('MyReservations')}
        >
          <Text style={styles.primaryButtonText}>Ver mis reservas</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => navigation.popToTop()} // Volver al inicio/mapa
        >
          <Text style={styles.secondaryButtonText}>Volver al mapa</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successIconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSoft,
    textAlign: 'center',
    marginBottom: 40,
  },
  qrContainer: {
    backgroundColor: Colors.surface,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderColor: Colors.border,
    borderWidth: 1,
    marginBottom: 40,
    width: '100%',
  },
  qrInstruction: {
    marginTop: 20,
    fontSize: 14,
    color: Colors.textSoft,
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
