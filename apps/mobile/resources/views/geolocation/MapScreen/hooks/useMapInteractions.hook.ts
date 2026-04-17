/**
 * useMapInteractions — Hook para lógica de interacción con el mapa.
 * 
 * Encapsula gestos, zoom, movimiento y selección en el mapa.
 */

import { useState, useCallback, useRef } from 'react';
import MapView, { Region } from 'react-native-maps';
import { Coordenadas } from '@gymsync/core';

export const useMapInteractions = () => {
  const mapRef = useRef<MapView>(null);
  const [currentRegion, setCurrentRegion] = useState<Region | null>(null);

  /**
   * Centra el mapa en unas coordenadas específicas con animación.
   */
  const centrarEnCoordenadas = useCallback((coordenadas: Coordenadas, zoom?: number) => {
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: coordenadas.latitude,
        longitude: coordenadas.longitude,
        latitudeDelta: zoom ?? 0.02,
        longitudeDelta: zoom ?? 0.02,
      }, 500);
    }
  }, []);

  /**
   * Ajusta el mapa para mostrar todas las coordenadas proporcionadas.
   */
  const ajustarAMarcadores = useCallback((coordenadas: Coordenadas[]) => {
    if (mapRef.current && coordenadas.length > 0) {
      mapRef.current.fitToCoordinates(
        coordenadas.map(c => c.toMapCoordinate()),
        {
          edgePadding: { top: 100, right: 50, bottom: 200, left: 50 },
          animated: true,
        }
      );
    }
  }, []);

  const onRegionChange = useCallback((region: Region) => {
    setCurrentRegion(region);
  }, []);

  return {
    mapRef,
    currentRegion,
    centrarEnCoordenadas,
    ajustarAMarcadores,
    onRegionChange,
  };
};
