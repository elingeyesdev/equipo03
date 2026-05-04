/**
 * MapScreen Container — Componente contenedor con lógica de negocio.
 * 
 * Patrón Container/View: este componente maneja la inyección de
 * dependencias y la conexión con los casos de uso. La View es "tonta".
 */

import React, { useEffect } from 'react';
import { useDependencyInjection } from '../../../../app/Shared/hooks/useDependencyInjection';
import { MapScreenView } from './MapScreen.view';
import { MapScreenController } from '../../../../app/Http/Controllers/geolocation/MapScreen.Controller';

import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BuscarStackParamList } from '../../../../routes/BuscarStack';

type NavigationProp = NativeStackNavigationProp<BuscarStackParamList, 'Mapa'>;

export const MapScreenContainer: React.FC = () => {
  const { obtenerSedesCercanasUseCase, calcularRutaUseCase, filtrarSedesUseCase } = useDependencyInjection();
  const navigation = useNavigation<NavigationProp>();
  
  const viewModel = MapScreenController(
    obtenerSedesCercanasUseCase,
    calcularRutaUseCase,
    filtrarSedesUseCase
  );

  useEffect(() => {
    viewModel.cargarSedesCercanas();
  }, []);

  return (
    <MapScreenView
      userLocation={viewModel.userLocation}
      sedes={viewModel.sedesFiltradas}
      selectedSede={viewModel.selectedSede}
      loading={viewModel.loading}
      error={viewModel.error}
      isListView={viewModel.isListView}
      onToggleListView={viewModel.toggleListView}
      onMarkerPress={viewModel.seleccionarSede}
      onModalClose={viewModel.cerrarModalSede}
      onNavigate={viewModel.comoLlegar}
      onRetry={viewModel.reintentarCarga}
      onReserve={(sede) => {
        viewModel.cerrarModalSede();
        navigation.navigate('ScheduleSelection', {
          activityId: Number(sede.id.value) || 1, // Fallback mientras se crea selector de actividades
          gymName: sede.nombre
        });
      }}
    />
  );
};
