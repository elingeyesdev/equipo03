/**
 * ValidadorUbicacion — Servicio de dominio para validar ubicaciones.
 * 
 * Contiene reglas de negocio sobre la validez de una ubicación
 * (precisión mínima, antigüedad máxima, etc.)
 */

import { Coordenadas } from '../value-objects/Coordenadas.vo';

export class ValidadorUbicacion {
  private static readonly PRECISION_MINIMA_METROS = 100;
  private static readonly ANTIGUEDAD_MAXIMA_MS = 5 * 60 * 1000; // 5 minutos

  /**
   * Verifica si una ubicación tiene precisión suficiente para cálculos fiables.
   */
  static tienePrecisionSuficiente(coordenadas: Coordenadas): boolean {
    if (coordenadas.accuracy === undefined) return true; // Si no hay accuracy, asumir ok
    return coordenadas.accuracy <= this.PRECISION_MINIMA_METROS;
  }

  /**
   * Verifica si la ubicación no es demasiado antigua.
   */
  static esReciente(coordenadas: Coordenadas): boolean {
    if (!coordenadas.timestamp) return true;
    const ahora = new Date();
    const diferencia = ahora.getTime() - coordenadas.timestamp.getTime();
    return diferencia <= this.ANTIGUEDAD_MAXIMA_MS;
  }

  /**
   * Validación completa de la ubicación del usuario.
   */
  static esValida(coordenadas: Coordenadas): {
    valida: boolean;
    razones: string[];
  } {
    const razones: string[] = [];

    if (!this.tienePrecisionSuficiente(coordenadas)) {
      razones.push(`Precisión insuficiente: ${coordenadas.accuracy}m (mínimo: ${this.PRECISION_MINIMA_METROS}m)`);
    }

    if (!this.esReciente(coordenadas)) {
      razones.push('La ubicación es demasiado antigua (más de 5 minutos)');
    }

    return {
      valida: razones.length === 0,
      razones,
    };
  }
}
