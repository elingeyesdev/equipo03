/**
 * Distancia — Value Object para representar distancias geográficas.
 * 
 * Almacena internamente en metros y provee getters formateados
 * para diferentes necesidades de presentación.
 */

export class Distancia {
  private constructor(private readonly _metros: number) {}

  static create(metros: number): Distancia {
    if (metros < 0) {
      throw new Error('La distancia no puede ser negativa');
    }
    return new Distancia(metros);
  }

  /**
   * Distancia en metros (valor crudo).
   */
  get metros(): number {
    return this._metros;
  }

  /**
   * Distancia en kilómetros (valor numérico).
   */
  get km(): number {
    return this._metros / 1000;
  }

  /**
   * Distancia formateada con 1 decimal (ej: "2.3 km").
   */
  get kmFija(): string {
    return this.km.toFixed(1);
  }

  /**
   * Distancia corta para badges (ej: "2.3km" o "500m").
   */
  get kmCorta(): string {
    if (this._metros < 1000) {
      return `${Math.round(this._metros)}m`;
    }
    return `${this.km.toFixed(1)}km`;
  }

  /**
   * Distancia legible para el usuario (ej: "2.3 kilómetros" o "500 metros").
   */
  get legible(): string {
    if (this._metros < 1000) {
      return `${Math.round(this._metros)} metros`;
    }
    return `${this.km.toFixed(1)} kilómetros`;
  }

  /**
   * Compara con otra distancia.
   */
  esMenorQue(otra: Distancia): boolean {
    return this._metros < otra._metros;
  }

  esMayorQue(otra: Distancia): boolean {
    return this._metros > otra._metros;
  }

  equals(otra: Distancia): boolean {
    return this._metros === otra._metros;
  }
}
