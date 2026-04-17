import { RendimientoGlobalDTO, EstadoMembresiasDTO, IngresosFinancierosDTO } from '../dtos/DashboardMetrics.dto';

/**
 * IAdminDashboardService (Puerto Entrante de Backoffice)
 * 
 * Este puerto dicta todos los casos de uso que la interfaz Web podrá solicitar.
 * El Application Layer de NestJS deberá implementar este servicio invocando
 * los repositorios (Infraestructura) subyacentes.
 */
export interface IAdminDashboardService {
  /**
   * Retorna métricas puramente geográficas/operacionales de las sedes.
   * Si contextSedeId es provisto (ej. por rol GERENTE_SEDE), filtra.
   */
  obtenerRendimientoOperativo(contextSedeId?: string): Promise<RendimientoGlobalDTO>;

  /**
   * Retorna indicadores comerciales de membresías.
   */
  obtenerEstadoMembresias(contextSedeId?: string): Promise<EstadoMembresiasDTO>;

  /**
   * Retorna ingresos y proyecciones monetarias del backoffice. 
   * Seguramente reservado a rol SUPER_ADMIN.
   */
  obtenerMétricasFinancieras(): Promise<IngresosFinancierosDTO>;
}
