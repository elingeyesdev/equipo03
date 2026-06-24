export class Result<T> {
  public readonly isSuccess: boolean;
  public readonly isFailure: boolean;
  public readonly error: string | null;
  private readonly _value: T | null;

  private constructor(isSuccess: boolean, error: string | null, value: T | null) {
    this.isSuccess = isSuccess;
    this.isFailure = !isSuccess;
    this.error = error;
    this._value = value;

    Object.freeze(this);
  }

  get value(): T {
    if (!this.isSuccess) {
      throw new Error('No se puede obtener el valor de un Result fallido. Usar error en su lugar.');
    }
    return this._value as T;
  }

  static ok<U>(value: U): Result<U> {
    return new Result<U>(true, null, value);
  }

  static fail<U>(error: string): Result<U> {
    return new Result<U>(false, error, null);
  }

  static combine(results: Result<unknown>[]): Result<void> {
    for (const result of results) {
      if (result.isFailure) {
        return Result.fail(result.error!);
      }
    }
    return Result.ok<void>(undefined);
  }

  map<U>(fn: (value: T) => U): Result<U> {
    if (this.isFailure) {
      return Result.fail<U>(this.error!);
    }
    return Result.ok(fn(this._value as T));
  }
}
