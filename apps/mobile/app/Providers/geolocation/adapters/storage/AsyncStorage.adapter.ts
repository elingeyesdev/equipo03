import AsyncStorage from '@react-native-async-storage/async-storage';
import { IStorageService } from '@gymsync/core';
import { Either, left, right } from '@gymsync/core';

export class AsyncStorageAdapter implements IStorageService {
  private readonly PREFIX = '@gymsync:';

  private getKey(clave: string): string {
    return `${this.PREFIX}${clave}`;
  }

  async guardar<T>(clave: string, valor: T): Promise<Either<Error, void>> {
    try {
      const jsonValue = JSON.stringify(valor);
      await AsyncStorage.setItem(this.getKey(clave), jsonValue);
      return right(undefined);
    } catch (error: unknown) {
      return left(new Error(`Error al guardar '${clave}': ${error}`));
    }
  }

  async obtener<T>(clave: string): Promise<Either<Error, T | null>> {
    try {
      const jsonValue = await AsyncStorage.getItem(this.getKey(clave));
      if (jsonValue === null) {
        return right(null);
      }
      return right(JSON.parse(jsonValue) as T);
    } catch (error: unknown) {
      return left(new Error(`Error al obtener '${clave}': ${error}`));
    }
  }

  async eliminar(clave: string): Promise<Either<Error, void>> {
    try {
      await AsyncStorage.removeItem(this.getKey(clave));
      return right(undefined);
    } catch (error: unknown) {
      return left(new Error(`Error al eliminar '${clave}': ${error}`));
    }
  }

  async limpiar(): Promise<Either<Error, void>> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const appKeys = keys.filter(key => key.startsWith(this.PREFIX));
      await Promise.all(appKeys.map(key => AsyncStorage.removeItem(key)));
      return right(undefined);
    } catch (error: unknown) {
      return left(new Error(`Error al limpiar almacenamiento: ${error}`));
    }
  }
}
