export enum TipoMetodoAcceso {
  QR = 'QR',
}

export class MetodoAcceso {
  constructor(public readonly tipo: TipoMetodoAcceso) {
    if (tipo !== TipoMetodoAcceso.QR) {
      throw new Error('Metodo de acceso invalido: solo se permite QR.');
    }
  }
}
