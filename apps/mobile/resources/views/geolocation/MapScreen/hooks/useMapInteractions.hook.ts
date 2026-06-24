/**
 * useMapInteractions — Hook para lógica de interacción con el mapa.
 * 
 * Encapsula gestos, zoom, movimiento y selección en el mapa.
 */

import { useState, useCallback, useRef } from 'react';
import { Coordenadas } from '@gymsync/core';
import { LeafletMapHandle } from '../../../geolocation/LeafletMap/LeafletMapView';

export const useMapInteractions = () => {
  const mapRef = useRef<LeafletMapHandle>(null);
  const [currentRegion, setCurrentRegion] = useState<{ lat: number; lng: number } | null>(null);

  const centrarEnCoordenadas = useCallback((coordenadas: Coordenadas, zoom?: number) => {
    mapRef.current?.flyTo(coordenadas.latitude, coordenadas.longitude, zoom ? 1 / zoom * 10 : 15);
  }, []);

  const ajustarAMarcadores = useCallback((_coordenadas: Coordenadas[]) => {
    // fitToCoordinates not supported in Leaflet WebView mode
  }, []);

  const onRegionChange = useCallback((region: { lat: number; lng: number }) => {
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
