import { Sede } from '../../../domain/entities/Sede.entity';
import { Coordenadas } from '../../../domain/value-objects/Coordenadas.vo';

export interface INavigationService {
  abrirNavegacion(origen: Coordenadas | null, destino: Sede): Promise<void>;
  abrirEnNavegador(destino: Sede): Promise<void>;
}
