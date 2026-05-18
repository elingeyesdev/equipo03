/**
 * Either<L, R> — Tipo funcional para manejo de errores sin excepciones.
 * 
 * Left  = caso de error
 * Right = caso de éxito
 * 
 * Inspirado en Either de fp-ts / Scala.
 */

export type Either<L, R> = Left<L, R> | Right<L, R>;

export class Left<L, R> {
  readonly _tag = 'Left' as const;

  constructor(readonly value: L) {}

  isLeft(): this is Left<L, R> {
    return true;
  }

  isRight(): this is Right<L, R> {
    return false;
  }

  map<B>(_fn: (r: R) => B): Either<L, B> {
    return this as unknown as Either<L, B>;
  }

  flatMap<B>(_fn: (r: R) => Either<L, B>): Either<L, B> {
    return this as unknown as Either<L, B>;
  }

  fold<B>(onLeft: (l: L) => B, _onRight: (r: R) => B): B {
    return onLeft(this.value);
  }

  getOrElse(defaultValue: R): R {
    return defaultValue;
  }
}

export class Right<L, R> {
  readonly _tag = 'Right' as const;

  constructor(readonly value: R) {}

  isLeft(): this is Left<L, R> {
    return false;
  }

  isRight(): this is Right<L, R> {
    return true;
  }

  map<B>(fn: (r: R) => B): Either<L, B> {
    return new Right(fn(this.value));
  }

  flatMap<B>(fn: (r: R) => Either<L, B>): Either<L, B> {
    return fn(this.value);
  }

  fold<B>(_onLeft: (l: L) => B, onRight: (r: R) => B): B {
    return onRight(this.value);
  }

  getOrElse(_defaultValue: R): R {
    return this.value;
  }
}

// Helper constructors
export const left = <L, R>(value: L): Either<L, R> => new Left(value);
export const right = <L, R>(value: R): Either<L, R> => new Right(value);
