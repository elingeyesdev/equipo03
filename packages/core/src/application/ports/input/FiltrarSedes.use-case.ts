/**
 * FiltrarSedesUseCase — Inbound Port / Interactor
 * 
 * Se encarga de aplicar lógicas complejas de filtrado sobre un arreglo
 * ya cargado de sedes. Filtra por servicios, beneficios o estado operativo.
 */

import { Sede, ServicioSede, BeneficioSede } from '../../../domain/entities/Sede.entity';

export interface FiltrosCatalogo {
  servicios?: ServicioSede[];
  beneficios?: BeneficioSede[];
  soloDisponibles?: boolean;
  soloAbiertos?: boolean;
}

export class FiltrarSedesUseCase {
  execute(sedes: Sede[], filtros: FiltrosCatalogo): Sede[] {
    let result = [...sedes];

    if (filtros.soloDisponibles) {
      result = result.filter(sede => sede.estaDisponible);
    }

    if (filtros.soloAbiertos) {
      result = result.filter(sede => sede.estaAbierta);
    }

    if (filtros.servicios && filtros.servicios.length > 0) {
      result = result.filter(sede => 
        filtros.servicios!.every(servicioRequerido => sede.tieneServicio(servicioRequerido))
      );
    }

    if (filtros.beneficios && filtros.beneficios.length > 0) {
      result = result.filter(sede => 
        filtros.beneficios!.every(beneficioRequerido => sede.beneficios.includes(beneficioRequerido))
      );
    }

    return result;
  }
}
