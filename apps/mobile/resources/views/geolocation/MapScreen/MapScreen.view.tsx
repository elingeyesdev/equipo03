/**
 * MapScreen View — Componente de presentación puro.
 * 
 * Solo recibe props tipadas y renderiza. Cero lógica de negocio.
 * Usa react-native-maps con tiles de OpenStreetMap.
 */

import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Marker, UrlTile } from 'react-native-maps';
import MapView from 'react-native-maps';
import { useFilterStore } from '../../../../app/Providers/geolocation/stores/FilterStore';

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
import { useAuth } from '../../../../app/Shared/hooks/useAuth';

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
  onReserve: (sede: Sede) => void;
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
  onReserve,
  onRetry,
}) => {
  const { user } = useAuth();
  const isGerente = user?.role === 'GERENTE';

  const mapRef = useRef<MapView>(null);

  const [filterVisible, setFilterVisible] = useState(false);
  const [toastConfig, setToastConfig] = useState<{message: string, type: 'error' | 'success', key: number} | null>(null);

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToastConfig({ message, type, key: Date.now() });
    setTimeout(() => setToastConfig(null), 3500);
  };

  const { filtros, toggleServicio, toggleBeneficio, toggleMarca } = useFilterStore();

  const activeFiltersCount =
    (filtros.servicios?.length || 0) +
    (filtros.beneficios?.length || 0) +
    (filtros.marcas?.length || 0);

  // Marcas únicas disponibles extraídas en tiempo real de las sedes cargadas
  const marcasDisponibles = [...new Set(
    sedes.map(s => s.sede.parentName).filter((n): n is string => !!n)
  )].sort();


  if (loading && sedes.length === 0) {
    return <LoadingOverlay message="Buscando marcas cercanas..." />;
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



  const handleSelectSedeFromCatalog = (sede: Sede) => {
    onMarkerPress(sede);
    onToggleListView();

    // Pequeño retardo para asegurar fluidez en el cierre del catálogo
    setTimeout(() => {
      if (mapRef.current && sede.coordenadas) {
        mapRef.current.animateToRegion({
          latitude: sede.coordenadas.latitude,
          longitude: sede.coordenadas.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        }, 1000);
      }
    }, 300);
  };

  // Encontrar la distancia para la sede seleccionada
  const selectedSedeDistancia = selectedSede
    ? sedes.find(s => s.sede.id.value === selectedSede.id.value)?.distancia
    : null;

  return (
    <View style={styles.container}>
      {/* Contenedor del Mapa - Siempre montado debajo */}
      <View style={StyleSheet.absoluteFillObject}>
        {/* Floating Header with Semi-Transparent Glass Effect */}
        <View style={styles.headerContainer} pointerEvents="box-none">
          <View style={styles.headerBlur}>
            <View style={styles.headerRow}>
              <View style={styles.headerTextCol}>
                <Text style={styles.headerTitle}>Marcas Cercanas</Text>
                <Text style={styles.headerSubtitle}>
                  {sedes.length} {sedes.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}
                </Text>
              </View>
              <TouchableOpacity style={styles.catalogBtn} onPress={onToggleListView} activeOpacity={0.8}>
                <MaterialCommunityIcons name="view-list" size={20} color="#1C1C1E" />
              </TouchableOpacity>
            </View>

            {/* Active Filter Chips */}
            {activeFiltersCount > 0 && (
              <View style={styles.activeFiltersRow}>
                {filtros.servicios?.map(servicio => (
                  <TouchableOpacity key={servicio} style={styles.activeFilterChip} onPress={() => toggleServicio(servicio)}>
                    <Text style={styles.activeFilterText}>{servicio}</Text>
                    <MaterialCommunityIcons name="close" size={14} color="#FFF" />
                  </TouchableOpacity>
                ))}
                {filtros.beneficios?.map(beneficio => (
                  <TouchableOpacity key={beneficio} style={styles.activeFilterChip} onPress={() => toggleBeneficio(beneficio)}>
                    <Text style={styles.activeFilterText}>{beneficio}</Text>
                    <MaterialCommunityIcons name="close" size={14} color="#FFF" />
                  </TouchableOpacity>
                ))}
                {filtros.marcas?.map(marca => (
                  <TouchableOpacity key={marca} style={styles.activeFilterChip} onPress={() => toggleMarca(marca)}>
                    <Text style={styles.activeFilterText}>{marca}</Text>
                    <MaterialCommunityIcons name="close" size={14} color="#FFF" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
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

          {/* Marcadores de sedes — solo sucursales con coordenadas válidas */}
          {sedes.map(({ sede, distancia }) => {
            const lat = sede.coordenadas?.latitude;
            const lng = sede.coordenadas?.longitude;
            // Saltar si coordenadas vacías o (0,0) — dato ausente del mapper
            if (!lat || !lng || (lat === 0 && lng === 0)) return null;
            return (
              <SedeMarker
                key={sede.id.value}
                sede={sede}
                distancia={distancia}
                onPress={() => onMarkerPress(sede)}
              />
            );
          })}
        </MapView>

        {/* Atribución OSM */}
        <View style={styles.attribution}>
          <Text style={styles.attributionText}>{OSMConfig.attribution}</Text>
        </View>

        {/* Filter FAB */}
        <TouchableOpacity style={styles.filterFab} onPress={() => setFilterVisible(true)}>
          <MaterialCommunityIcons name="filter-variant" size={24} color="#00D9FF" />
        </TouchableOpacity>

        {/* GPS FAB */}
        <GPSReCenterButton style={styles.gpsFab} onPress={handleReCenter} />

        {/* Modal de información de sede */}
        {selectedSede && selectedSedeDistancia && !isListView && (
          <SedeInfoModalView
            sede={selectedSede}
            distancia={selectedSedeDistancia}
            visible={!!selectedSede}
            onClose={onModalClose}
            onNavigate={() => onNavigate(selectedSede)}
            onReserve={isGerente ? undefined : () => onReserve(selectedSede)}
            isAdmin={isGerente}
          />
        )}
      </View>

      {/* Catálogo Superpuesto */}
      {isListView && (
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#0A0A0A', zIndex: 100, elevation: 100 }]}>
          <SedesCatalog 
            sedes={sedes} 
            onSelectSede={handleSelectSedeFromCatalog} 
            onCerrarCatalogo={onToggleListView} 
          />
        </View>
      )}

      {/* Modal de Filtros */}
      <FilterBottomSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        marcasDisponibles={marcasDisponibles}
      />

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
