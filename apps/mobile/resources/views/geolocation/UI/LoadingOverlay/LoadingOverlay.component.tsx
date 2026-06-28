import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import { DumbbellSpinner } from '../../../../../app/Shared/components/ui/DumbbellSpinner';

type LoadingOverlayProps = {
  message?: string;
};

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = 'Cargando...',
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <DumbbellSpinner size="large" color="#e94560" />
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3A3A3C',
    padding: 32,
    alignItems: 'center',
    minWidth: 200,
  },
  message: {
    color: '#B0B0B0',
    fontSize: 15,
    marginTop: 16,
    fontWeight: '500',
  },
});
