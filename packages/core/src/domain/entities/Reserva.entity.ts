/**
 * Reserva — Entidad de dominio para el sistema de reservas.
 */

import { Identifier } from '../../shared/kernel/Identifier';

export type EstadoReserva = 'CONFIRMADA' | 'PENDIENTE' | 'CANCELADA' | (string & {});

export type ReservaProps = {
  id: Identifier;
  userId: string;
  gymId: string;
  activityId: string;
  scheduleId: string;
  activityName: string;
  fecha: Date;
  horaInicio: string; // Formato HH:mm
  horaFin: string;    // Formato HH:mm
  estado: EstadoReserva;
  instructorName?: string;
  createdAt?: Date;
};

export interface ReservaDTO {
  id: string;
  userId: string;
  gymId: string;
  activityId: string;
  scheduleId: string;
  activityName: string;
  fecha: string; // ISO string
  horaInicio: string;
  horaFin: string;
  estado: string;
  instructorName?: string;
  createdAt?: string;
}

export class Reserva {
  private constructor(private readonly props: ReservaProps) {}

  static create(props: ReservaProps): Reserva {
    if (!props.userId) throw new Error('El ID de usuario es obligatorio');
    if (!props.gymId) throw new Error('El ID del gimnasio es obligatorio');
    if (!props.activityId) throw new Error('El ID de la actividad es obligatorio');
    if (!props.scheduleId) throw new Error('El ID del horario es obligatorio');
    if (!props.activityName) throw new Error('El nombre de la actividad es obligatorio');
    
    return new Reserva({
      ...props,
      estado: props.estado || 'PENDIENTE',
      createdAt: props.createdAt || new Date(),
    });
  }

  // === Getters ===
  get id(): Identifier { return this.props.id; }
  get userId(): string { return this.props.userId; }
  get gymId(): string { return this.props.gymId; }
  get activityId(): string { return this.props.activityId; }
  get scheduleId(): string { return this.props.scheduleId; }
  get activityName(): string { return this.props.activityName; }
  get fecha(): Date { return this.props.fecha; }
  get horaInicio(): string { return this.props.horaInicio; }
  get horaFin(): string { return this.props.horaFin; }
  get estado(): EstadoReserva { return this.props.estado; }
  get instructorName(): string | undefined { return this.props.instructorName; }
  get createdAt(): Date | undefined { return this.props.createdAt; }

  // === Métodos de negocio ===
  confirmar(): Reserva {
    return new Reserva({
      ...this.props,
      estado: 'CONFIRMADA',
    });
  }

  cancelar(): Reserva {
    return new Reserva({
      ...this.props,
      estado: 'CANCELADA',
    });
  }

  get esConfirmada(): boolean {
    return this.props.estado === 'CONFIRMADA';
  }

  get esCancelada(): boolean {
    return this.props.estado === 'CANCELADA';
  }

  toDTO(): ReservaDTO {
    return {
      id: this.props.id.value,
      userId: this.props.userId,
      gymId: this.props.gymId,
      activityId: this.props.activityId,
      scheduleId: this.props.scheduleId,
      activityName: this.props.activityName,
      fecha: this.props.fecha.toISOString(),
      horaInicio: this.props.horaInicio,
      horaFin: this.props.horaFin,
      estado: this.props.estado,
      instructorName: this.props.instructorName,
      createdAt: this.props.createdAt?.toISOString(),
    };
  }
}
