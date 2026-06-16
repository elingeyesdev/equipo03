/**
 * SedeMarker — Marcador personalizado de sede en el mapa.
 *
 * Muestra un marcador con color según disponibilidad de aforo
 * y un callout con nombre, distancia e info de aforo.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SedeMarkerProps } from './SedeMarker.props';
import { AforoBadge } from '../UI/AforoBadge/AforoBadge.component';

export const SedeMarker: React.FC<SedeMarkerProps> = ({ sede, distancia, onPress }) => {
  const isClosed = !sede.estaAbierta;
  const pinColor = isClosed
    ? '#8e8e93'
    : sede.estaDisponible
    ? '#2ecc71'
    : '#e74c3c';

  const statusLabel = isClosed
    ? 'Cerrado'
    : sede.estaDisponible
    ? 'Abierto ahora'
    : 'Lleno';

  return (
    <TouchableOpacity onPress={onPress} accessibilityLabel={`Marca ${sede.nombre}, a ${distancia.legible}. ${statusLabel}`}>
      <View style={styles.calloutContainer}>
        <Text style={styles.calloutTitle} numberOfLines={1}>
          {sede.nombre}
        </Text>
        <View style={styles.calloutInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <MaterialCommunityIcons name="map-marker-distance" size={12} color="#a0a0b8" />
            <Text style={styles.calloutDistance}>{distancia.kmCorta}</Text>
          </View>
          <AforoBadge aforo={sede.aforo} size="small" />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
          <MaterialCommunityIcons name="account-group-outline" size={12} color="#a0a0b8" />
          <Text style={styles.calloutAforo}>
            Aforo hoy: {sede.aforo.actual} / {sede.aforo.maximo}
          </Text>
        </View>
        {sede.capacidadMaquinas > 0 && (
          <Text style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>
            Aforo Máquinas: {sede.capacidadMaquinas}
          </Text>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <MaterialCommunityIcons name="circle-small" size={14} color={pinColor} />
          <Text style={[styles.calloutStatus, { color: pinColor }]}>{statusLabel}</Text>
        </View>
        <Text style={styles.calloutHint}>Toca para más info</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  calloutContainer: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 12,
    minWidth: 180,
    maxWidth: 240,
    borderWidth: 1,
    borderColor: '#2a2a4a',
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 6,
  },
  calloutInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  calloutDistance: {
    fontSize: 12,
    color: '#a0a0b8',
    fontWeight: '600',
  },
  calloutAforo: {
    fontSize: 11,
    color: '#a0a0b8',
    fontWeight: '600',
  },
  calloutStatus: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  calloutHint: {
    fontSize: 10,
    color: '#e94560',
    fontWeight: '500',
    textAlign: 'right',
  },
});
