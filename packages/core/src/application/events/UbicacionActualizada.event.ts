/**
 * UbicacionActualizadaEvent — Evento de dominio.
 * 
 * Se dispara cuando la ubicación del usuario se actualiza,
 * permitiendo que otros módulos reaccionen (ej: recalcular distancias).
 */

import { DomainEvent } from '../../shared/kernel/DomainEvent';
import { Coordenadas } from '../../domain/value-objects/Coordenadas.vo';

export class UbicacionActualizadaEvent extends DomainEvent {
  public readonly coordenadas: Coordenadas;
  public readonly precision?: number;

  constructor(coordenadas: Coordenadas) {
    super('ubicacion.actualizada');
    this.coordenadas = coordenadas;
    this.precision = coordenadas.accuracy;
  }

  toPrimitives(): Record<string, unknown> {
    return {
      eventName: this.eventName,
      occurredOn: this.occurredOn,
      latitude: this.coordenadas.latitude,
      longitude: this.coordenadas.longitude,
      precision: this.precision,
    };
  }
}
