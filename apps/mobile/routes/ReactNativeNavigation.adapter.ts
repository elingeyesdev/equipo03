import { Linking, Platform } from 'react-native';
import { INavigationService, Sede, Coordenadas } from '@gymsync/core';

export class ReactNativeNavigationAdapter implements INavigationService {
  async abrirNavegacion(origen: Coordenadas | null, destino: Sede): Promise<void> {
    const { latitude, longitude } = destino.coordenadas;
    const label = encodeURIComponent(destino.nombre);

    let url: string;

    if (Platform.OS === 'ios') {
      url = `maps://app?daddr=${latitude},${longitude}&q=${label}`;
    } else {
      url = `google.navigation:q=${latitude},${longitude}&label=${label}`;
    }

    const canOpen = await Linking.canOpenURL(url);

    if (canOpen) {
      await Linking.openURL(url);
    } else {
      const webUrl = `https://www.openstreetmap.org/directions?from=${
        origen ? `${origen.latitude},${origen.longitude}` : ''
      }&to=${latitude},${longitude}`;
      await Linking.openURL(webUrl);
    }
  }

  async abrirEnNavegador(destino: Sede): Promise<void> {
    const { latitude, longitude } = destino.coordenadas;
    const url = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}`;
    await Linking.openURL(url);
  }
}
