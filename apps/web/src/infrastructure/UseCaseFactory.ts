/**
 * UseCaseFactory.ts — Fábrica de casos de uso para la app web.
 *
 * Centraliza la construcción de los casos de uso (@gymsync/core)
 * con sus dependencias de infraestructura web inyectadas.
 *
 * Uso:
 *   const uc = UseCaseFactory.getObtenerUsuariosUC();
 *   const result = await uc.execute(authCtx);
 */
import { ObtenerUsuariosUseCase, ObtenerSedesMapaUseCase } from '@gymsync/core';
import { usersApiAdapter } from './AxiosUsersApi.adapter';
import { gymsApiAdapter } from './AxiosGymsApi.adapter';

export const UseCaseFactory = {
  /**
   * Retorna la instancia del caso de uso ObtenerUsuarios
   * con el adaptador de Axios web inyectado.
   *
   * Singleton lazy: la instancia se crea una sola vez y se reutiliza.
   */
  getObtenerUsuariosUC: (() => {
    let instance: ObtenerUsuariosUseCase | null = null;
    return (): ObtenerUsuariosUseCase => {
      if (!instance) {
        instance = new ObtenerUsuariosUseCase(usersApiAdapter);
      }
      return instance;
    };
  })(),

  /**
   * Retorna la instancia del caso de uso ObtenerSedesMapa
   * con el adaptador de Axios inyectado.
   *
   * Solo debe ser invocado por SUPER_ADMIN (la verificación está en el Core).
   * Singleton lazy: la instancia se crea una sola vez y se reutiliza.
   */
  getObtenerSedesMapaUC: (() => {
    let instance: ObtenerSedesMapaUseCase | null = null;
    return (): ObtenerSedesMapaUseCase => {
      if (!instance) {
        instance = new ObtenerSedesMapaUseCase(gymsApiAdapter);
      }
      return instance;
    };
  })(),
};
