/**
 * Sede — Entidad raíz del agregado de Geolocalización.
 * 
 * Representa una sede/sucursal de gimnasio con su ubicación,
 * información de aforo y servicios disponibles.
 */

import { Identifier } from '../../shared/kernel/Identifier';
import { Coordenadas } from '../value-objects/Coordenadas.vo';
import { Aforo } from '../value-objects/Aforo.vo';
import { HorariosSede, HorariosMap } from '../value-objects/HorariosSede.vo';

export type ServicioSede = 'Musculación' | 'Crossfit' | 'Yoga' | 'Pilates' | 'Zumba' | 'Natación' | 'Ciclismo' | 'Artes Marciales' | (string & {});
export type BeneficioSede = 'WiFi' | 'Duchas' | 'Parqueo' | 'Cafetería' | 'Armarios' | 'Fisioterapia' | 'Sauna' | (string & {});

export type SedeProps = {
  id: Identifier;
  nombre: string;
  direccion: string;
  coordenadas: Coordenadas;
  aforo: Aforo;
  horarios?: HorariosSede;
  servicios?: ServicioSede[];
  beneficios?: BeneficioSede[];
  imagenUrl?: string;
  rating?: number;
  resenasCount?: number;
  telefono?: string;
};

export interface SedeDTO {
  id: string;
  nombre: string;
  direccion: string;
  latitude: number;
  longitude: number;
  aforoMaximo: number;
  aforoActual: number;
  horarios?: HorariosMap;
  servicios?: string[];
  beneficios?: string[];
  imagenUrl?: string;
  rating?: number;
  resenasCount?: number;
  telefono?: string;
}

export class Sede {
  private constructor(private readonly props: SedeProps) {}

  static create(props: SedeProps): Sede {
    if (!props.nombre || props.nombre.trim().length === 0) {
      throw new Error('El nombre de la sede no puede estar vacío');
    }
    if (!props.direccion || props.direccion.trim().length === 0) {
      throw new Error('La dirección de la sede no puede estar vacía');
    }
    return new Sede(props);
  }

  // === Getters ===
  get id(): Identifier { return this.props.id; }
  get nombre(): string { return this.props.nombre; }
  get direccion(): string { return this.props.direccion; }
  get coordenadas(): Coordenadas { return this.props.coordenadas; }
  get aforo(): Aforo { return this.props.aforo; }
  get horarios(): HorariosSede | undefined { return this.props.horarios; }
  get servicios(): ServicioSede[] { return this.props.servicios ?? []; }
  get beneficios(): BeneficioSede[] { return this.props.beneficios ?? []; }
  get imagenUrl(): string | undefined { return this.props.imagenUrl; }
  get rating(): number | undefined { return this.props.rating; }
  get resenasCount(): number | undefined { return this.props.resenasCount; }
  get telefono(): string | undefined { return this.props.telefono; }

  // === Métodos de dominio ===

  /**
   * Indica si la sede tiene cupos disponibles.
   */
  get estaDisponible(): boolean {
    return this.props.aforo.hayCuposDisponibles;
  }

  /**
   * Indica si la sede ofrece un servicio específico.
   */
  tieneServicio(servicio: ServicioSede): boolean {
    return this.servicios.includes(servicio);
  }

  /**
   * Indica si la sede está abierta en este momento exacto.
   */
  get estaAbierta(): boolean {
    if (!this.props.horarios) return false;
    return this.props.horarios.estaAbiertoAhora();
  }

  /**
   * Convierte la entidad a un DTO plano para serialización.
   */
  toDTO(): SedeDTO {
    return {
      id: this.props.id.value,
      nombre: this.props.nombre,
      direccion: this.props.direccion,
      latitude: this.props.coordenadas.latitude,
      longitude: this.props.coordenadas.longitude,
      aforoMaximo: this.props.aforo.maximo,
      aforoActual: this.props.aforo.actual,
      horarios: this.props.horarios?.raw,
      servicios: this.props.servicios,
      beneficios: this.props.beneficios,
      imagenUrl: this.props.imagenUrl,
      rating: this.props.rating,
      resenasCount: this.props.resenasCount,
      telefono: this.props.telefono,
    };
  }
}
