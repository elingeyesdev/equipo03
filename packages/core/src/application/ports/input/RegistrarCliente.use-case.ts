import type { IAuthApiService, RegistrarClienteDTO } from '../output/IAuthApiService.port';
import { Either, right, left } from '../../../shared/kernel/Either';

export class RegistrarClienteUseCase {
  constructor(private readonly authApiService: IAuthApiService) {}

  async execute(dto: RegistrarClienteDTO): Promise<Either<Error, void>> {
    try {
      // Regla de Negocio: Limpiar cualquier parámetro malicioso o intentos de elevar roles.
      // El DTO solo debe empaquetar estrictamente name, email, password y phone.
      const sanitizedDto: RegistrarClienteDTO = {
        name: String(dto.name || '').trim(),
        email: String(dto.email || '').trim().toLowerCase(),
        password: String(dto.password || ''),
      };
      
      if (dto.phone) {
        sanitizedDto.phone = String(dto.phone).trim();
      }

      // Validaciones básicas de negocio en el Core (por si fallan los filtros superiores)
      if (!sanitizedDto.name) {
        return left(new Error('El nombre es obligatorio.'));
      }
      if (!sanitizedDto.email) {
        return left(new Error('El correo electrónico es obligatorio.'));
      }
      if (!sanitizedDto.password || sanitizedDto.password.length < 8) {
        return left(new Error('La contraseña debe tener al menos 8 caracteres.'));
      }

      await this.authApiService.registrarCliente(sanitizedDto);
      return right(undefined);
    } catch (error: any) {
      return left(error instanceof Error ? error : new Error(String(error?.message || 'Error en el registro.')));
    }
  }
}
