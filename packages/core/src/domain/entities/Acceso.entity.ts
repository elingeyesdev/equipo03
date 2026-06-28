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
    public readonly userId: Identifier,
    public readonly gymId: Identifier,
    public readonly checkInTime: Date,
    public readonly method: MetodoAcceso,
    public readonly status: EstadoAcceso,
    public readonly userInfo: UserProfileInfo,
    public readonly gymInfo: GymInfo,
    public readonly actionType?: string | null,
  ) {}
}
