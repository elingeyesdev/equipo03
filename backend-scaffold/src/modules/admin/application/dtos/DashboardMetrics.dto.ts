/**
 * DTOs para el Módulo Administrativo (Backoffice)
 * Estas interfaces dictan la forma del JSON que el frontend WebReact consumirá
 * desde los endpoints de NestJS.
 */

export interface RendimientoGlobalDTO {
  ocupacionTotalAyer: number;
  ocupacionPromedioSemana: number;
  crecimientoUsuariosPorcentaje: number; // vs periodo previo
  sedesEnCapacidadMaxima: number; 
}

export interface EstadoMembresiasDTO {
  totalMembresiasActivas: number;
  membresiasProximasAVencer: number; // en próximos 7 días
  nuevasInscripcionesMesActual: number;
  tasaDesercionMensual: number; // churn rate
}

export interface IngresosFinancierosDTO {
  ingresosNetosMensuales: number;
  proyeccionIngresosFinDeMes: number;
  ticketPromedioPorSocio: number;
  moneda: string; // ej. 'BOB' o 'USD'
}
