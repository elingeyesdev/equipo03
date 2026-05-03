import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors } from '../theme/colors';

interface Props {
  visible: boolean;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  activityName: string;
  timeString: string;
}

export const ReservationConfirmModal = ({ visible, isLoading, onConfirm, onCancel, activityName, timeString }: Props) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Confirmar Reserva</Text>
          
          <Text style={styles.description}>
            ¿Estás seguro de que deseas reservar un cupo para <Text style={styles.bold}>{activityName}</Text> en el horario de <Text style={styles.bold}>{timeString}</Text>?
          </Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={onCancel} 
              disabled={isLoading}
            >
              <Text style={styles.cancelText}>No, cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.confirmButton} 
              onPress={onConfirm} 
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.confirmText}>Sí, reservar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)', // Fondo muy oscuro para el contraste
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    borderColor: Colors.border,
    borderWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: Colors.textSoft,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  bold: {
    fontWeight: 'bold',
    color: Colors.primary, // Resaltamos la información clave en naranja
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cancelText: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: 16,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
