export enum TipoEstadoAcceso {
  AUTORIZADO = 'AUTORIZADO',
  DENEGADO = 'DENEGADO',
}

export class EstadoAcceso {
  constructor(
    public readonly estado: TipoEstadoAcceso,
    public readonly motivoDenegacion?: string
  ) {}
}
