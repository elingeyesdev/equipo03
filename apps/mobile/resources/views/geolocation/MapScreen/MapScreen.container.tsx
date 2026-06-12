/**
 * MapScreen Container — Componente contenedor con lógica de negocio.
 *
 * Patrón Container/View: este componente maneja la inyección de
 * dependencias y la conexión con los casos de uso. La View es "tonta".
 */

import React, { useCallback, useEffect } from 'react';
import { useDependencyInjection } from '../../../../app/Shared/hooks/useDependencyInjection';
import { MapScreenView } from './MapScreen.view';
import { MapScreenController } from '../../../../app/Http/Controllers/geolocation/MapScreen.Controller';
import { Sede } from '@gymsync/core';

import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BuscarStackParamList } from '../../../../routes/BuscarStack';

type NavigationProp = NativeStackNavigationProp<BuscarStackParamList, 'Mapa'>;

export const MapScreenContainer: React.FC = () => {
  const { obtenerSedesCercanasUseCase, calcularRutaUseCase, filtrarSedesUseCase, sedesApiAdapter } = useDependencyInjection();
  const navigation = useNavigation<NavigationProp>();

  const viewModel = MapScreenController(
    obtenerSedesCercanasUseCase,
    calcularRutaUseCase,
    filtrarSedesUseCase
  );

  useEffect(() => {
    viewModel.cargarSedesCercanas();
  }, []);

  const handleMarkerPress = useCallback(async (sede: Sede) => {
    viewModel.seleccionarSede(sede);
    try {
      const result = await sedesApiAdapter.obtenerSedePorId(String(sede.id.value));
      if (result.isRight()) {
        viewModel.seleccionarSede(result.value);
      }
    } catch {
      // mantiene los datos básicos ya mostrados
    }
  }, [sedesApiAdapter]);

  return (
    <MapScreenView
      userLocation={viewModel.userLocation}
      sedes={viewModel.sedesFiltradas}
      selectedSede={viewModel.selectedSede}
      loading={viewModel.loading}
      error={viewModel.error}
      isListView={viewModel.isListView}
      onToggleListView={viewModel.toggleListView}
      onMarkerPress={handleMarkerPress}
      onModalClose={viewModel.cerrarModalSede}
      onNavigate={viewModel.comoLlegar}
      onRetry={viewModel.reintentarCarga}
      onBack={() => navigation.goBack()}
      onReserve={(sede) => {
        viewModel.cerrarModalSede();
        navigation.navigate('ScheduleSelection', {
          gymId: Number(sede.id.value),
          gymName: sede.nombre,
        });
      }}
    />
  );
};
