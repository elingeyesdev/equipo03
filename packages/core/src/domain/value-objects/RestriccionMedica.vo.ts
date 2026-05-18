/**
 * RestriccionMedica — Value Object
 * 
 * Representa una condición médica que afecta el desempeño o 
 * capacidades deportivas del usuario.
 */

export type NivelSeveridad = 'BAJA' | 'MEDIA' | 'ALTA';

export interface RestriccionMedicaProps {
  condicion: string;
  severidad: NivelSeveridad;
  recomendaciones?: string;
}

export class RestriccionMedica {
  private constructor(private readonly props: RestriccionMedicaProps) {}

  static create(props: RestriccionMedicaProps): RestriccionMedica {
    if (!props.condicion || props.condicion.trim().length === 0) {
      throw new Error('La condición médica no puede estar vacía');
    }
    return new RestriccionMedica(props);
  }

  get condicion(): string { return this.props.condicion; }
  get severidad(): NivelSeveridad { return this.props.severidad; }
  get recomendaciones(): string | undefined { return this.props.recomendaciones; }

  get isAlta(): boolean {
    return this.props.severidad === 'ALTA';
  }

  toJSON(): RestriccionMedicaProps {
    return {
      condicion: this.props.condicion,
      severidad: this.props.severidad,
      recomendaciones: this.props.recomendaciones,
    };
  }
}
