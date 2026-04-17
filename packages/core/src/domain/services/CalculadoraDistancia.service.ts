/**
 * CalculadoraDistancia — Servicio de dominio puro.
 * 
 * Encapsula la lógica de cálculo de distancias entre coordenadas
 * usando la librería geolib. Mantiene el dominio desacoplado
 * de la dependencia externa.
 */

import { getDistance, getCenter } from 'geolib';
import { Coordenadas } from '../value-objects/Coordenadas.vo';
import { Distancia } from '../value-objects/Distancia.vo';

export class CalculadoraDistancia {
  /**
   * Calcula la distancia en metros entre dos coordenadas.
   * Usa la fórmula de Haversine (implementada por geolib).
   */
  static calcular(origen: Coordenadas, destino: Coordenadas): Distancia {
    const metros = getDistance(
      origen.toGeolibFormat(),
      destino.toGeolibFormat()
    );
    return Distancia.create(metros);
  }

  /**
   * Verifica si un destino está dentro de un radio dado (en km).
   */
  static estaDentroDeRadio(
    origen: Coordenadas,
    destino: Coordenadas,
    radioKm: number
  ): boolean {
    const distancia = this.calcular(origen, destino);
    return distancia.km <= radioKm;
  }

  /**
   * Encuentra el punto central de un conjunto de coordenadas.
   * Útil para centrar el mapa automáticamente.
   */
  static calcularCentro(coordenadas: Coordenadas[]): Coordenadas | null {
    if (coordenadas.length === 0) return null;

    const centro = getCenter(
      coordenadas.map(c => c.toGeolibFormat())
    );

    if (!centro) return null;

    return Coordenadas.create({
      latitude: centro.latitude,
      longitude: centro.longitude,
    });
  }
}
