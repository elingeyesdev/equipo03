/**
 * Aforo — Value Object para control de capacidad de una sede.
 * 
 * Reglas de dominio:
 * - aforoMaximo > 0
 * - aforoActual >= 0 && aforoActual <= aforoMaximo
 * - hayCuposDisponibles cuando aforoActual < aforoMaximo
 */

export type AforoProps = {
  maximo: number;
  actual: number;
};

export class Aforo {
  private constructor(private readonly props: AforoProps) {}

  static create(props: AforoProps): Aforo {
    if (props.maximo <= 0) {
      throw new Error('El aforo máximo debe ser mayor a 0');
    }
    if (props.actual < 0) {
      throw new Error('El aforo actual no puede ser negativo');
    }
    if (props.actual > props.maximo) {
      throw new Error('El aforo actual no puede superar el máximo');
    }
    return new Aforo(props);
  }

  get maximo(): number {
    return this.props.maximo;
  }

  get actual(): number {
    return this.props.actual;
  }

  get cuposDisponibles(): number {
    return this.props.maximo - this.props.actual;
  }

  get hayCuposDisponibles(): boolean {
    return this.props.actual < this.props.maximo;
  }

  /**
   * Porcentaje de ocupación [0, 100].
   */
  get porcentajeOcupacion(): number {
    return Math.round((this.props.actual / this.props.maximo) * 100);
  }

  /**
   * Nivel de ocupación para determinar color del badge.
   * - 'bajo' (verde):  < 60%
   * - 'medio' (amarillo): 60% - 85%
   * - 'alto' (rojo):   > 85%
   */
  get nivelOcupacion(): 'bajo' | 'medio' | 'alto' {
    const porcentaje = this.porcentajeOcupacion;
    if (porcentaje < 60) return 'bajo';
    if (porcentaje <= 85) return 'medio';
    return 'alto';
  }

  /**
   * Texto formateado para mostrar en la UI.
   */
  get textoFormateado(): string {
    return `${this.props.actual}/${this.props.maximo}`;
  }

  equals(other: Aforo): boolean {
    return this.maximo === other.maximo && this.actual === other.actual;
  }
}
