/**
 * PerfilDeportivo — Entidad
 * 
 * Representa el perfil físico, deportivo y médico de un usuario.
 */

import { Identifier } from '../../shared/kernel/Identifier';
import { RestriccionMedica, RestriccionMedicaProps } from '../value-objects/RestriccionMedica.vo';

export type NivelExperiencia = 'PRINCIPIANTE' | 'INTERMEDIO' | 'AVANZADO';
export type ObjetivoDeportivo = 'PERDIDA_PESO' | 'GANANCIA_MUSCULAR' | 'MANTENIMIENTO' | 'RESISTENCIA';

export interface PerfilDeportivoProps {
  id: Identifier;
  pesoKg: number;
  alturaCm: number;
  nivelExperiencia: NivelExperiencia;
  objetivos: ObjetivoDeportivo[];
  restriccionesMedicas: RestriccionMedica[];
}

export interface PerfilDeportivoDTO {
  id: string;
  pesoKg: number;
  alturaCm: number;
  nivelExperiencia: NivelExperiencia;
  objetivos: ObjetivoDeportivo[];
  restriccionesMedicas: RestriccionMedicaProps[];
}

export class PerfilDeportivo {
  private constructor(private props: PerfilDeportivoProps) {}

  static create(props: PerfilDeportivoProps): PerfilDeportivo {
    if (props.pesoKg <= 0 || props.pesoKg > 300) {
      throw new Error('El peso debe estar entre 1kg y 300kg');
    }
    if (props.alturaCm <= 0 || props.alturaCm > 300) {
      throw new Error('La altura debe ser válida (entre 1cm y 300cm)');
    }
    return new PerfilDeportivo(props);
  }

  // === Getters ===
  get id(): Identifier { return this.props.id; }
  get pesoKg(): number { return this.props.pesoKg; }
  get alturaCm(): number { return this.props.alturaCm; }
  get nivelExperiencia(): NivelExperiencia { return this.props.nivelExperiencia; }
  get objetivos(): ObjetivoDeportivo[] { return [...this.props.objetivos]; }
  get restriccionesMedicas(): RestriccionMedica[] { return [...this.props.restriccionesMedicas]; }

  // === Métodos de Dominio ===
  
  get imc(): number {
    const alturaMts = this.props.alturaCm / 100;
    return this.props.pesoKg / (alturaMts * alturaMts);
  }

  get tieneRestriccionesAltas(): boolean {
    return this.props.restriccionesMedicas.some(r => r.isAlta);
  }

  agregarRestriccion(restriccion: RestriccionMedica): void {
    const existe = this.props.restriccionesMedicas.find(r => r.condicion === restriccion.condicion);
    if (!existe) {
      this.props.restriccionesMedicas.push(restriccion);
    }
  }

  removerRestriccion(condicion: string): void {
    this.props.restriccionesMedicas = this.props.restriccionesMedicas.filter(r => r.condicion !== condicion);
  }

  actualizarMetricas(pesoKg: number, alturaCm: number): void {
    if (pesoKg <= 0 || alturaCm <= 0) {
      throw new Error('Las métricas corporales no pueden ser 0 o negativas');
    }
    this.props.pesoKg = pesoKg;
    this.props.alturaCm = alturaCm;
  }

  toDTO(): PerfilDeportivoDTO {
    return {
      id: this.props.id.value,
      pesoKg: this.props.pesoKg,
      alturaCm: this.props.alturaCm,
      nivelExperiencia: this.props.nivelExperiencia,
      objetivos: this.props.objetivos,
      restriccionesMedicas: this.props.restriccionesMedicas.map(r => r.toJSON())
    };
  }
}
