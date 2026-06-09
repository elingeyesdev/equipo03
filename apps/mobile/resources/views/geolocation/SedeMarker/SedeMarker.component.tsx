/**
 * SedeMarker — Marcador personalizado de sede en el mapa.
 * 
 * Muestra un marcador con color según disponibilidad de aforo
 * y un callout con nombre, distancia e info de aforo.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker, Callout } from 'react-native-maps';
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
    <Marker
      coordinate={sede.coordenadas.toMapCoordinate()}
      pinColor={pinColor}
      onPress={onPress}
      accessibilityLabel={`Marca ${sede.nombre}, a ${distancia.legible}. ${statusLabel}`}
    >
      <Callout tooltip onPress={onPress}>
        <View style={styles.calloutContainer}>
          <Text style={styles.calloutTitle} numberOfLines={1}>
            {sede.nombre}
          </Text>
          <View style={styles.calloutInfo}>
            <Text style={styles.calloutDistance}>📍 {distancia.kmCorta}</Text>
            <AforoBadge aforo={sede.aforo} size="small" />
          </View>
          <Text style={[styles.calloutStatus, { color: pinColor }]}>
            ● {statusLabel}
          </Text>
          <Text style={styles.calloutHint}>Toca para más info →</Text>
        </View>
      </Callout>
    </Marker>
  );
};

const styles = StyleSheet.create({
  calloutContainer: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 12,
    minWidth: 180,
    maxWidth: 240,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
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
