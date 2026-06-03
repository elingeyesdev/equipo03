/**
 * Puerto de salida para el servicio de autenticación y registro.
 */
export interface RegistrarClienteDTO {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface IAuthApiService {
  registrarCliente(dto: RegistrarClienteDTO): Promise<void>;
}

export const IAuthApiService = Symbol('IAuthApiService');
