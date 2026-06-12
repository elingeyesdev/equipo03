import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  Inject,
  Scope,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Gym } from '../domain/gym.entity';
import { GymLocation } from '../domain/gym-location.entity';
import { GymSchedule } from '../domain/gym-schedule.entity';
import { Reservation } from '../../reservations/domain/reservation.entity';
import { CheckIn } from '../../checkins/domain/check-in.entity';
import { getManagerGymId, getStaffGymId, type RequestWithUser } from '../../common/security/gym-scope';


const DAY_CODES = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'] as const;


function isGymOpenNow(schedules: GymSchedule[]): boolean {
  if (!schedules || schedules.length === 0) return false;

  const tz  = process.env.APP_TIMEZONE ?? 'America/La_Paz';
  const now  = new Date(new Date().toLocaleString('en-US', { timeZone: tz }));
  const today = DAY_CODES[now.getDay()];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const todaySchedule = schedules.find(s => s.dayOfWeek === today && !s.isHoliday);
  if (!todaySchedule) return false;

  const [openH,  openM]  = todaySchedule.opensAt.split(':').map(Number);
  const [closeH, closeM] = todaySchedule.closesAt.split(':').map(Number);
  const openMinutes  = openH  * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}

@Injectable({ scope: Scope.REQUEST })
export class GymsService {
  constructor(
    @InjectRepository(Gym) private gymsRepo: Repository<Gym>,
    @InjectRepository(GymLocation) private locRepo: Repository<GymLocation>,
    @InjectRepository(GymSchedule) private schedRepo: Repository<GymSchedule>,
    @InjectRepository(Reservation) private reservationRepo: Repository<Reservation>,
    @InjectRepository(CheckIn) private checkInRepo: Repository<CheckIn>,
    @Inject(REQUEST) private readonly request: RequestWithUser,
  ) {}

  private managerGymId(): number | null {
    return getManagerGymId(this.request);
  }

  private staffGymId(): number | null {
    return getStaffGymId(this.request);
  }

  async create(data: any) {
    const { location, schedules, ...gymData } = data as {
      location?: { latitude?: number; longitude?: number; [k: string]: any };
      schedules?: any[];
      name: string;
      [key: string]: unknown;
    };

    const existing = await this.gymsRepo.findOneBy({ name: gymData.name });
    if (existing) {
      throw new ConflictException('Ya existe una Marca registrada con ese nombre.');
    }

    if (location?.latitude && location?.longitude) {
      const existingLocation = await this.locRepo.findOneBy({
        latitude: location.latitude,
        longitude: location.longitude,
      });
      if (existingLocation) {
        throw new ConflictException(
          'Ya existe una sucursal registrada exactamente en esa ubicación del mapa.',
        );
      }
    }

    const gymEntity = this.gymsRepo.create(gymData as Partial<Gym>);
    const gym = await this.gymsRepo.save(gymEntity);
    if (location) await this.locRepo.save(this.locRepo.create({ ...location, gymId: gym.id }));
    if (schedules?.length) {
      const items = schedules.map((s: any) => this.schedRepo.create({ ...s, gymId: gym.id } as any));
      await this.schedRepo.save(items as any);
    }
    return this.findOne(gym.id);
  }

  async findAll(lat?: number, lng?: number, radiusKm = 50) {
    const sg = this.staffGymId();

    if (sg !== null) {
      // Obtener la marca (parentId) de la sucursal del staff
      const staffGym = await this.gymsRepo.findOne({
        where: { id: sg },
        select: ['id', 'parentId'],
      });

      if (!staffGym) return [];

      const brandId = staffGym.parentId;

      // Si el gym no tiene padre, sg ES la marca → devolver todas sus sucursales activas
      if (!brandId) {
        const branches = await this.gymsRepo.find({
          where: { parentId: sg, isActive: true },
          relations: ['location', 'schedules', 'parent'],
          order: { id: 'ASC' },
        });
        return branches.map((gym) => this.mapGymToDto(gym));
      }

      // Devolver TODAS las sucursales activas de la misma marca, sin filtro de distancia
      const brandGyms = await this.gymsRepo.find({
        where: { parentId: brandId, isActive: true },
        relations: ['location', 'schedules', 'parent'],
        order: { id: 'ASC' },
      });
      return brandGyms.map((gym) => this.mapGymToDto(gym));
    }

    const qb = this.gymsRepo
      .createQueryBuilder('gym')
      .leftJoinAndSelect('gym.location', 'location')
      .leftJoinAndSelect('gym.schedules', 'schedules')
      .leftJoinAndSelect('gym.parent', 'parent')
      .where('gym.isActive = :active', { active: true })
      .andWhere('gym.parentId IS NOT NULL')
      .orderBy('gym.id', 'ASC')
      .distinct(true);

    if (lat !== undefined && lng !== undefined) {
      qb.andWhere(
        `(
          6371 * acos(
            cos(radians(:lat)) * cos(radians(location.latitude)) *
            cos(radians(location.longitude) - radians(:lng)) +
            sin(radians(:lat)) * sin(radians(location.latitude))
          )
        ) <= :radius`,
        { lat, lng, radius: radiusKm },
      );
    }

    const gyms = await qb.getMany();

    const seen = new Set<number>();
    const unique = gyms.filter((g) => {
      if (seen.has(g.id)) return false;
      seen.add(g.id);
      return true;
    });

    return unique.map((gym) => this.mapGymToDto(gym));
  }

  async findBrands() {
    const brands = await this.gymsRepo
      .createQueryBuilder('gym')
      .where('gym.isActive = :active', { active: true })
      .andWhere('gym.parentId IS NULL')
      .orderBy('gym.id', 'ASC')
      .getMany();
    return brands.map((g) => ({ id: g.id, name: g.name, description: g.description, parentId: null }));
  }

  async findOne(id: number) {
    const gym = await this.gymsRepo.findOne({ where: { id }, relations: ['location', 'schedules', 'activities', 'parent'] });
    if (!gym) throw new NotFoundException(`Gimnasio ${id} no encontrado`);
    return this.mapGymToDto(gym);
  }

  private mapGymToDto(gym: Gym) {
    if (gym.location) {
      gym.location.latitude = Number(gym.location.latitude);
      gym.location.longitude = Number(gym.location.longitude);
    }

    return {
      ...gym,
      // Sobreescribe el campo estático isOpen con el cálculo dinámico basado en schedules
      isOpen: isGymOpenNow(gym.schedules ?? []),
      parentName: gym.parent?.name ?? null,
      aforoActual: Math.floor(Math.random() * ((gym.maxCapacity || 100) / 2)),
      imagenUrl: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=1000&auto=format&fit=crop',
      rating: Number((Math.random() * (5.0 - 4.0) + 4.0).toFixed(1)),
      resenasCount: Math.floor(Math.random() * 500) + 50,
      servicios: ['Musculación', 'Cardio', 'Zumba'],
      beneficios: ['Duchas', 'AC', 'Estacionamiento'],
      telefono: '+591 3 3456789',
    };
  }

  async update(id: number, data: any) {
    const gym = await this.findOne(id);
    Object.assign(gym, data);
    return this.gymsRepo.save(gym);
  }

  async remove(id: number) {
    const r = await this.gymsRepo.delete(id);
    if (r.affected === 0) throw new NotFoundException(`Gimnasio ${id} no encontrado`);
  }

  // ── Schedules ─────────────────────────────────────
  addSchedule(gymId: number, data: any) {
    const mg = this.managerGymId();
    if (mg !== null && mg !== gymId) {
      throw new ForbiddenException('No puede agregar horarios a otra sucursal');
    }
    return this.schedRepo.save(this.schedRepo.create({ ...data, gymId }));
  }

  findSchedules(gymId: number) {
    return this.schedRepo.find({ where: { gymId } });
  }

  async removeSchedule(id: number) {
    const mg = this.managerGymId();
    if (mg !== null) {
      const sched = await this.schedRepo.findOne({ where: { id } });
      if (!sched) throw new NotFoundException(`Horario ${id} no encontrado`);
      if (sched.gymId !== mg) {
        throw new ForbiddenException('No puede eliminar horarios de otra sucursal');
      }
    }
    return this.schedRepo.delete(id);
  }

  // ── Location ──────────────────────────────────────
  async updateLocation(gymId: number, data: any) {
    let loc = await this.locRepo.findOne({ where: { gymId } });
    if (loc) { Object.assign(loc, data); return this.locRepo.save(loc); }
    return this.locRepo.save(this.locRepo.create({ ...data, gymId }));
  }

  // ── Frequent Gyms (CLIENTE) ───────────────────────
  async getFrequentGyms(userId: number) {
    const rows = await this.checkInRepo
      .createQueryBuilder('ci')
      .select('ci.gym_id', 'gymId')
      .addSelect('COUNT(*)', 'visitCount')
      .where('ci.user_id = :userId', { userId })
      .groupBy('ci.gym_id')
      .orderBy('COUNT(*)', 'DESC')
      .limit(3)
      .getRawMany<{ gymId: number; visitCount: string }>();

    if (rows.length === 0) return [];

    const gymIds = rows.map((r) => Number(r.gymId));
    const gyms   = await this.gymsRepo.find({
      where: gymIds.map((id) => ({ id })),
      relations: ['location'],
    });
    const gymMap = new Map(gyms.map((g) => [g.id, g]));

    const aforoRows = await Promise.all(
      gymIds.map((gymId) =>
        this.checkInRepo
          .createQueryBuilder('ci')
          .select('COUNT(*)', 'current')
          .where('ci.gym_id = :gymId', { gymId })
          .andWhere('DATE(ci.check_in_time) = CURRENT_DATE')
          .andWhere('ci.check_out_time IS NULL')
          .andWhere("ci.status = 'ACTIVO'")
          .getRawOne<{ current: string }>()
          .then((r) => ({ gymId, current: Number(r?.current ?? 0) })),
      ),
    );
    const aforoMap = new Map(aforoRows.map((r) => [r.gymId, r.current]));

    return rows.map((r) => {
      const gymId = Number(r.gymId);
      const gym   = gymMap.get(gymId);
      const max   = gym?.maxCapacity ?? 100;
      const curr  = aforoMap.get(gymId) ?? 0;
      const pct   = Math.round((curr / max) * 100);
      const label = pct < 40 ? 'Tranquilo' : pct <= 70 ? 'Moderado' : 'Concurrido';
      return {
        gymId,
        name:       gym?.name ?? `Sede ${gymId}`,
        address:    gym?.location ? `${gym.location.latitude}, ${gym.location.longitude}` : null,
        imagenUrl:  'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=1000&auto=format&fit=crop',
        visitCount: Number(r.visitCount),
        aforo:      { current: curr, max, percent: pct, label },
      };
    });
  }

  // ── Dashboard Stats ───────────────────────────────
  async getDashboardStats(overrideGymId?: number): Promise<{
    capacity: number;
    occupancy: number;
    totalToday: number;
    pending: number;
    completed: number;
  }> {
    const gymId = this.managerGymId() ?? overrideGymId;
    if (!gymId) {
      throw new BadRequestException('Proporciona ?gymId para SUPER_ADMIN.');
    }

    const gym = await this.gymsRepo.findOne({
      where: { id: gymId },
      select: ['id', 'maxCapacity'],
    });
    if (!gym) throw new NotFoundException(`Sede ${gymId} no encontrada.`);

    const raw = await this.reservationRepo
      .createQueryBuilder('r')
      .select('COUNT(*)', 'totalToday')
      .addSelect("COUNT(*) FILTER (WHERE r.status = 'CONFIRMADA')", 'pending')
      .addSelect("COUNT(*) FILTER (WHERE r.status = 'COMPLETADA')", 'completed')
      .where('r.gym_id = :gymId', { gymId })
      .andWhere('r.reservation_date = CURRENT_DATE')
      .getRawOne<{ totalToday: string; pending: string; completed: string }>();

    const totalToday = Number(raw?.totalToday ?? 0);
    const pending    = Number(raw?.pending    ?? 0);
    const completed  = Number(raw?.completed  ?? 0);

    return {
      capacity:   gym.maxCapacity,
      occupancy:  completed,
      totalToday,
      pending,
      completed,
    };
  }
}
