/**
 * MapScreen View — Componente de presentación puro.
 * 
 * Solo recibe props tipadas y renderiza. Cero lógica de negocio.
 * Usa react-native-maps con tiles de OpenStreetMap.
 */

import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Marker, UrlTile } from 'react-native-maps';
import MapView from 'react-native-maps';
import { SedeMarker } from '../SedeMarker/SedeMarker.component';
import { SedeInfoModalView } from '../SedeInfoModal/SedeInfoModal.view';
import { SedesCatalog } from '../SedesCatalog/SedesCatalog.view';
import { LoadingOverlay } from '../UI/LoadingOverlay/LoadingOverlay.component';
import { ErrorMessage } from '../UI/ErrorMessage/ErrorMessage.component';
import { FilterBottomSheet } from '../UI/FilterBottomSheet/FilterBottomSheet.component';
import { GPSReCenterButton } from '../UI/GPSReCenterButton/GPSReCenterButton.component';
import { Toast } from '../UI/Toast/Toast.component';
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
  const mapRef = useRef<MapView>(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const [toastConfig, setToastConfig] = useState<{message: string, type: 'error' | 'success', key: number} | null>(null);

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToastConfig({ message, type, key: Date.now() });
    setTimeout(() => setToastConfig(null), 3500);
  };

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

  const handleReCenter = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: OSMConfig.defaults.initialRegion.latitudeDelta,
        longitudeDelta: OSMConfig.defaults.initialRegion.longitudeDelta,
      }, 1000);
    } else {
      const msg = error?.toLowerCase().includes('red') || error?.toLowerCase().includes('internet')
        ? 'No hay conexión a internet para triangular tu área actual.'
        : 'No se puede acceder a tu ubicación. Verifica tus permisos de GPS.';
        
      showToast(msg, 'error');
    }
  };



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
        <View style={styles.headerTextCol}>
          <Text style={styles.headerTitle}>Filtros Activos</Text>
          <Text style={styles.headerSubtitle}>
            {sedes.length} {sedes.length === 1 ? 'resultado' : 'resultados'}
          </Text>
        </View>
        <TouchableOpacity style={styles.catalogTopButton} onPress={onToggleListView} activeOpacity={0.8}>
          <MaterialCommunityIcons name="view-carousel-outline" size={24} color="#00D9FF" />
          <Text style={styles.catalogTopButtonText}>Catálogo</Text>
        </TouchableOpacity>
      </View>

      {/* Mapa con OpenStreetMap */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={center}
        showsUserLocation={true}
        showsMyLocationButton={false}
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

      {/* Botón flotante eliminado por nuevo diseño top-right */}

      {/* Filter FAB */}
      <TouchableOpacity style={styles.filterFab} onPress={() => setFilterVisible(true)}>
        <MaterialCommunityIcons name="filter-variant" size={24} color="#00D9FF" />
      </TouchableOpacity>

      {/* GPS FAB */}
      <GPSReCenterButton style={styles.gpsFab} onPress={handleReCenter} />

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

      {/* Modal de Filtros */}
      <FilterBottomSheet visible={filterVisible} onClose={() => setFilterVisible(false)} />

      {/* Toast Notificador */}
      <Toast 
        key={toastConfig?.key} 
        visible={!!toastConfig} 
        message={toastConfig?.message || ''} 
        type={toastConfig?.type} 
      />
    </View>
  );
};
