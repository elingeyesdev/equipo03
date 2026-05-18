/**
 * DomainEvent — Clase base para eventos de dominio.
 * 
 * Los eventos de dominio representan algo que ocurrió en el dominio
 * y que puede ser de interés para otros módulos.
 */

export abstract class DomainEvent {
  public readonly occurredOn: Date;
  public readonly eventName: string;

  protected constructor(eventName: string) {
    this.eventName = eventName;
    this.occurredOn = new Date();
  }

  abstract toPrimitives(): Record<string, unknown>;
}
