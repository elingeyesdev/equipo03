import React, { useCallback, useEffect, useRef } from 'react';
import { useDependencyInjection } from '../../../../app/Shared/hooks/useDependencyInjection';
import { MapScreenView } from './MapScreen.view';
import { MapScreenController } from '../../../../app/Http/Controllers/geolocation/MapScreen.Controller';
import { Sede } from '@gymsync/core';

import { useNavigation, useRoute, RouteProp, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BuscarStackParamList } from '../../../../routes/BuscarStack';

type NavigationProp = NativeStackNavigationProp<BuscarStackParamList, 'Mapa'>;
type MapRoute = RouteProp<BuscarStackParamList, 'Mapa'>;

export const MapScreenContainer: React.FC = () => {
  const { obtenerSedesCercanasUseCase, calcularRutaUseCase, filtrarSedesUseCase, sedesApiAdapter } = useDependencyInjection();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<MapRoute>();
  const rawFocusParam = route.params?.focusSedeId;
  const focusSedeId = rawFocusParam ? String(rawFocusParam).split('-')[0] : null;
  const isFocused = useIsFocused();
  const lastHandledParam = useRef<string | number | null>(null);

  const viewModel = MapScreenController(
    obtenerSedesCercanasUseCase,
    calcularRutaUseCase,
    filtrarSedesUseCase
  );

  useEffect(() => {
    viewModel.cargarSedesCercanas();
  }, []);

  useEffect(() => {
    if (!isFocused || !rawFocusParam || viewModel.loading || !viewModel.sedesFiltradas.length) return;
    if (lastHandledParam.current === rawFocusParam) return;
    lastHandledParam.current = rawFocusParam;
    const found = viewModel.sedesFiltradas.find(s => String(s.sede.id.value) === focusSedeId);
    if (found) {
      handleMarkerPress(found.sede);
    }
  }, [isFocused, rawFocusParam, viewModel.loading, viewModel.sedesFiltradas]);

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
      focusSedeId={focusSedeId}
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
