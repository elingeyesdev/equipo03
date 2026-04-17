/**
 * IStorageService — Puerto de salida para almacenamiento local.
 * 
 * Define el contrato para persistir datos localmente (caché de sedes, etc.)
 */

import { Either } from '../../../shared/kernel/Either';

export interface IStorageService {
  /**
   * Guarda un valor en el almacenamiento local.
   */
  guardar<T>(clave: string, valor: T): Promise<Either<Error, void>>;

  /**
   * Obtiene un valor del almacenamiento local.
   */
  obtener<T>(clave: string): Promise<Either<Error, T | null>>;

  /**
   * Elimina un valor del almacenamiento local.
   */
  eliminar(clave: string): Promise<Either<Error, void>>;

  /**
   * Limpia todo el almacenamiento local.
   */
  limpiar(): Promise<Either<Error, void>>;
}
