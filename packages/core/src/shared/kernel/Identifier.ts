/**
 * Identifier — Value Object para IDs fuertemente tipados.
 * 
 * Evita confundir IDs de diferentes entidades (SedeId vs UsuarioId)
 * al darles un tipo explícito en tiempo de compilación.
 */

export class Identifier {
  private constructor(private readonly _value: string) {}

  static create(value: string | number): Identifier {
    if (value === undefined || value === null) {
      throw new Error('Identifier no puede ser null o undefined');
    }
    return new Identifier(String(value));
  }

  get value(): string {
    return this._value;
  }

  equals(other: Identifier): boolean {
    if (!other) return false;
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
