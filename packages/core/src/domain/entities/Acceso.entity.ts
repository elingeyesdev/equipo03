import { Identifier } from '../../shared/kernel/Identifier';
import { MetodoAcceso } from '../value-objects/MetodoAcceso.vo';
import { EstadoAcceso } from '../value-objects/EstadoAcceso.vo';

// Tipos auxiliares para mapear la información relacionada en la vista (user_profiles, gyms)
export type UserProfileInfo = {
  nombre: string;
  avatarUrl?: string;
  email: string;
  rol?: string;
};

export type GymInfo = {
  nombre: string;
  direccion: string;
  coordenadas: { lat: number; lng: number };
};

export class Acceso {
  constructor(
    public readonly id: Identifier,
    public readonly userId: Identifier, // Mapea a check_ins.user_id
    public readonly gymId: Identifier,  // Mapea a check_ins.gym_id
    public readonly checkInTime: Date,  // Mapea a check_ins.check_in_time
    public readonly method: MetodoAcceso, // Mapea a check_ins.method
    public readonly status: EstadoAcceso, // Mapea a check_ins.status
    
    // Relaciones (Cargadas mediante JOINs en el backend real)
    public readonly userInfo: UserProfileInfo,
    public readonly gymInfo: GymInfo
  ) {}
}
