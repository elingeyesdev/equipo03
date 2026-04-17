/**
 * MapScreen View — Componente de presentación puro.
 * 
 * Solo recibe props tipadas y renderiza. Cero lógica de negocio.
 * Usa react-native-maps con tiles de OpenStreetMap.
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Marker, UrlTile } from 'react-native-maps';
import MapView from 'react-native-maps';
import { SedeMarker } from '../SedeMarker/SedeMarker.component';
import { SedeInfoModalView } from '../SedeInfoModal/SedeInfoModal.view';
import { SedesCatalog } from '../SedesCatalog/SedesCatalog.view';
import { LoadingOverlay } from '../UI/LoadingOverlay/LoadingOverlay.component';
import { ErrorMessage } from '../UI/ErrorMessage/ErrorMessage.component';
import { Coordenadas } from '@gymsync/core';
import { SedeConDistancia } from '@gymsync/core';
import { Sede } from '@gymsync/core';
import { OSMConfig } from '../../../../app/Providers/geolocation/config/osm.config';
import { styles } from './MapScreen.styles';

type MapScreenViewProps = {
  userLocation: Coordenadas | null;
  sedes: SedeConDistancia[];
  selectedSede: Sede | null;
  loading: boolean;
  error: string | null;
  isListView: boolean;
  onToggleListView: () => void;
  onMarkerPress: (sede: Sede) => void;
  onModalClose: () => void;
  onNavigate: (sede: Sede) => void;
  onRetry: () => void;
};

export const MapScreenView: React.FC<MapScreenViewProps> = ({
  userLocation,
  sedes,
  selectedSede,
  loading,
  error,
  isListView,
  onToggleListView,
  onMarkerPress,
  onModalClose,
  onNavigate,
  onRetry,
}) => {
  if (loading && sedes.length === 0) {
    return <LoadingOverlay message="Buscando sedes cercanas..." />;
  }

  if (error && sedes.length === 0) {
    return <ErrorMessage message={error} onRetry={onRetry} />;
  }

  // Usar ubicación del usuario o centro por defecto (Santa Cruz)
  const center = userLocation
    ? {
        ...OSMConfig.defaults.initialRegion,
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      }
    : OSMConfig.defaults.initialRegion;

  if (isListView) {
    return (
      <SedesCatalog 
        sedes={sedes} 
        onSelectSede={onMarkerPress} 
        onCerrarCatalogo={onToggleListView} 
      />
    );
  }

  // Encontrar la distancia para la sede seleccionada
  const selectedSedeDistancia = selectedSede
    ? sedes.find(s => s.sede.id.value === selectedSede.id.value)?.distancia
    : null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sedes Cercanas</Text>
        <Text style={styles.headerSubtitle}>
          {sedes.length} {sedes.length === 1 ? 'sede encontrada' : 'sedes encontradas'}
        </Text>
      </View>

      {/* Mapa con OpenStreetMap */}
      <MapView
        style={styles.map}
        initialRegion={center}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        rotateEnabled={true}
        zoomEnabled={true}
        pitchEnabled={false}
      >
        {/* Tiles de OpenStreetMap */}
        <UrlTile
          urlTemplate={OSMConfig.tileUrlTemplate}
          maximumZ={OSMConfig.tiles.maximumZ}
          flipY={OSMConfig.tiles.flipY}
          tileSize={OSMConfig.tiles.tileSize}
        />

        {/* Marcador del usuario */}
        {userLocation && (
          <Marker
            coordinate={userLocation.toMapCoordinate()}
            title="Tu ubicación"
            pinColor="#4A90D9"
            zIndex={1000}
          />
        )}

        {/* Marcadores de sedes */}
        {sedes.map(({ sede, distancia }) => (
          <SedeMarker
            key={sede.id.value}
            sede={sede}
            distancia={distancia}
            onPress={() => onMarkerPress(sede)}
          />
        ))}
      </MapView>

      {/* Atribución OSM */}
      <View style={styles.attribution}>
        <Text style={styles.attributionText}>{OSMConfig.attribution}</Text>
      </View>

      {/* Floating Toggle Button */}
      <TouchableOpacity 
        style={{
          position: 'absolute', bottom: 30, left: '50%', transform: [{translateX: -60}],
          backgroundColor: '#00D9FF', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5
        }}
        onPress={onToggleListView}
        activeOpacity={0.8}
      >
        <Text style={{color: '#0A0A0A', fontWeight: 'bold'}}>Ver Catálogo</Text>
      </TouchableOpacity>

      {/* Modal de información de sede */}
      {selectedSede && selectedSedeDistancia && (
        <SedeInfoModalView
          sede={selectedSede}
          distancia={selectedSedeDistancia}
          visible={!!selectedSede}
          onClose={onModalClose}
          onNavigate={() => onNavigate(selectedSede)}
        />
      )}
    </View>
  );
};
