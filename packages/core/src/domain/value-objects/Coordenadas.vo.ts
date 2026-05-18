/**
 * Coordenadas — Value Object para coordenadas geográficas.
 * 
 * Reglas de dominio:
 * - Latitude: [-90, 90]
 * - Longitude: [-180, 180]
 * - Accuracy en metros (opcional)
 * 
 * Inmutable por diseño (Value Object pattern).
 */

export type CoordenadasProps = {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: Date;
};

export class Coordenadas {
  private constructor(private readonly props: CoordenadasProps) {}

  static create(props: CoordenadasProps): Coordenadas {
    if (props.latitude < -90 || props.latitude > 90) {
      throw new Error('Latitude fuera de rango válido [-90, 90]');
    }
    if (props.longitude < -180 || props.longitude > 180) {
      throw new Error('Longitude fuera de rango válido [-180, 180]');
    }
    if (props.accuracy !== undefined && props.accuracy < 0) {
      throw new Error('Accuracy no puede ser negativa');
    }
    return new Coordenadas({
      ...props,
      timestamp: props.timestamp ?? new Date(),
    });
  }

  get latitude(): number {
    return this.props.latitude;
  }

  get longitude(): number {
    return this.props.longitude;
  }

  get accuracy(): number | undefined {
    return this.props.accuracy;
  }

  get timestamp(): Date | undefined {
    return this.props.timestamp;
  }

  /**
   * Convierte a formato compatible con geolib.
   */
  toGeolibFormat(): { latitude: number; longitude: number } {
    return {
      latitude: this.latitude,
      longitude: this.longitude,
    };
  }

  /**
   * Convierte a formato compatible con react-native-maps.
   */
  toMapCoordinate(): { latitude: number; longitude: number } {
    return {
      latitude: this.latitude,
      longitude: this.longitude,
    };
  }

  equals(other: Coordenadas): boolean {
    return (
      this.latitude === other.latitude &&
      this.longitude === other.longitude
    );
  }

  toString(): string {
    return `(${this.latitude.toFixed(6)}, ${this.longitude.toFixed(6)})`;
  }
}
