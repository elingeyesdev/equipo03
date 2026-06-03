import { ICheckInsRepository } from '../ports/output/ICheckInsRepository';
import { IGymsRepository } from '../ports/output/IGymsRepository';
import { IEventBus } from '../../shared/domain/events/IEventBus';
import { AccessDeniedDomainEvent } from '../../domain/events/AccessDenied.event';
import { CheckIn } from '../../domain/entities/CheckIn.entity';

export class CheckinsService {
  constructor(
    private checkInsRepository: ICheckInsRepository,
    private gymsRepository: IGymsRepository,
    private eventBus: IEventBus,
  ) {}

  async processCheckIn(userId: number, gymId: number, method: 'QR' | 'NFC' | 'MANUAL'): Promise<CheckIn> {
    // 1. Lógica de dominio para determinar si el acceso es válido...
    const isAllowed = await this.evaluateAccess(userId, gymId);
    const status = isAllowed ? 'AUTORIZADO' : 'DENEGADO';

    // 2. Persistir el log en check_ins
    const checkIn = new CheckIn({
      userId,
      gymId,
      status,
      method,
      checkInTime: new Date(),
    });
    
    await this.checkInsRepository.save(checkIn);

    // 3. Nueva Lógica: Si fue denegado, publicar el evento de dominio
    if (status === 'DENEGADO') {
      const gym = await this.gymsRepository.findById(gymId);
      
      if (gym) {
        const event = new AccessDeniedDomainEvent(
          gymId,
          gym.name,
          userId,
          'Intento de acceso no autorizado',
        );
        
        // Publicamos el evento (Desacoplamiento según DDD)
        await this.eventBus.publish(event);
      }
    }

    return checkIn;
  }

  private async evaluateAccess(userId: number, gymId: number): Promise<boolean> {
    // Implementación real de validación de membresía, deuda, etc.
    return false; // Forzado a false para el ejemplo si el usuario no tiene acceso
  }
}
