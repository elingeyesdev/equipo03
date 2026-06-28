import {
  Injectable,
  Logger,
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
import { MachineInventory } from '../domain/machine-inventory.entity';
import { Reservation } from '../../reservations/domain/reservation.entity';
import { CheckIn } from '../../checkins/domain/check-in.entity';
import { UserRole } from '../../roles/domain/user-role.entity';
import {
  getManagerGymId,
  type RequestWithUser,
} from '../../common/security/gym-scope';

const DAY_CODES = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'] as const;

function isGymOpenNow(schedules: GymSchedule[]): boolean {
  if (!schedules || schedules.length === 0) return false;

  const tz = process.env.APP_TIMEZONE ?? 'America/La_Paz';
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: tz }));
  const today = DAY_CODES[now.getDay()];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const todaySchedule = schedules.find(
    (s) => s.dayOfWeek === today && !s.isHoliday,
  );
  if (!todaySchedule) return false;

  const [openH, openM] = todaySchedule.opensAt.split(':').map(Number);
  const [closeH, closeM] = todaySchedule.closesAt.split(':').map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}

@Injectable({ scope: Scope.REQUEST })
export class GymsService {
  private readonly logger = new Logger(GymsService.name);

  constructor(
    @InjectRepository(Gym) private gymsRepo: Repository<Gym>,
    @InjectRepository(GymLocation) private locRepo: Repository<GymLocation>,
    @InjectRepository(GymSchedule) private schedRepo: Repository<GymSchedule>,
    @InjectRepository(MachineInventory)
    private machineRepo: Repository<MachineInventory>,
    @InjectRepository(Reservation)
    private reservationRepo: Repository<Reservation>,
    @InjectRepository(CheckIn) private checkInRepo: Repository<CheckIn>,
    @InjectRepository(UserRole) private userRoleRepo: Repository<UserRole>,
    @Inject(REQUEST) private readonly request: RequestWithUser,
  ) {}

  private managerGymId(): number | null {
    return getManagerGymId(this.request);
  }

  private validateScheduleOverlaps(rawSchedules: any) {
    if (!rawSchedules) return;

    // Blindaje contra JSON stringificado accidental
    let schedules = rawSchedules;
    if (typeof schedules === 'string') {
      try { schedules = JSON.parse(schedules); } catch { return; }
    }

    if (!Array.isArray(schedules) || schedules.length === 0) return;

    const timeToMinutes = (timeString: string): number => {
      if (!timeString || typeof timeString !== 'string') return 0;
      const parts = timeString.split(':').map(Number);
      return (parts[0] * 60) + (parts[1] || 0);
    };

    const schedulesByDay: Record<string, { open: string; close: string }[]> = {};

    for (const curr of schedules) {
      const isHoliday = curr.isHoliday ?? curr.is_holiday ?? curr.isFeriado ?? curr.is_feriado ?? false;
      if (isHoliday === true || isHoliday === 'true') continue;

      // Extracción agresiva: cubre todas las variantes camelCase / snake_case del frontend y el DTO
      const day   = curr.dayOfWeek  ?? curr.day_of_week ?? curr.day ?? curr.dia;
      const open  = curr.opensAt    ?? curr.opens_at    ?? curr.startTime ?? curr.start_time ?? curr.open ?? curr.apertura;
      const close = curr.closesAt   ?? curr.closes_at   ?? curr.endTime   ?? curr.end_time   ?? curr.close ?? curr.cierre;

      // Si falta un dato vital, reventar la petición para exponer el bug de formato, NO silenciarlo.
      if (!day || !open || !close) {
        this.logger.error(`[CRÍTICO] Formato de horario irreconocible en el payload: ${JSON.stringify(curr)}`);
        throw new BadRequestException(
          'Error de integridad: falta el día o la hora en el payload de horarios. Revisa la consola del backend.',
        );
      }

      const dayKey = day.toString().trim().toUpperCase();
      if (!schedulesByDay[dayKey]) schedulesByDay[dayKey] = [];
      schedulesByDay[dayKey].push({ open: String(open), close: String(close) });
    }

    // Validación matemática estricta: permite contiguos (06:00–12:00 y 12:00–18:00), rechaza invasiones
    for (const day in schedulesByDay) {
      const dayScheds = schedulesByDay[day];

      for (let i = 0; i < dayScheds.length; i++) {
        for (let j = i + 1; j < dayScheds.length; j++) {
          const startA = timeToMinutes(dayScheds[i].open);
          const endA   = timeToMinutes(dayScheds[i].close);
          const startB = timeToMinutes(dayScheds[j].open);
          const endB   = timeToMinutes(dayScheds[j].close);

          if (startA < endB && endA > startB) {
            throw new BadRequestException(
              `Horarios superpuestos en ${day}: el rango ${dayScheds[i].open}–${dayScheds[i].close} choca con ${dayScheds[j].open}–${dayScheds[j].close}.`,
            );
          }
        }
      }
    }
  }

  async create(data: any) {
    this.validateScheduleOverlaps(data.schedules);
    const { location, schedules, ...gymData } = data as {
      location?: { latitude?: number; longitude?: number; [k: string]: any };
      schedules?: any[];
      name: string;
      [key: string]: unknown;
    };

    const existing = await this.gymsRepo.findOneBy({ name: gymData.name });
    if (existing) {
      throw new ConflictException(
        'Ya existe una Marca registrada con ese nombre.',
      );
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

    try {
      const gym = await this.gymsRepo.save(gymEntity);
      if (location)
        await this.locRepo.save(
          this.locRepo.create({ ...location, gymId: gym.id }),
        );
      if (schedules?.length) {
        const items = schedules.map((s: any) =>
          this.schedRepo.create({ ...s, gymId: gym.id }),
        );
        await this.schedRepo.save(items as any);
      }
      return this.findOne(gym.id);
    } catch (error: any) {
      if (error?.code === '23503') {
        throw new BadRequestException(
          'La sucursal matriz (parentId) especificada no existe.',
        );
      }
      throw error;
    }
  }

  async findAll(lat?: number, lng?: number, radiusKm = 50) {
    const currentUser = this.request.user;

    // ── 1. Obtener el rol de mayor jerarquía desde la BD ─────────────────────
    let callerLevel = 0;
    let callerGymId = 0;

    if (currentUser?.userId) {
      const callerDbRole = await this.userRoleRepo
        .createQueryBuilder('ur')
        .innerJoinAndSelect('ur.role', 'role')
        .leftJoinAndSelect('ur.gym', 'gym')
        .where('ur.user_id = :userId', { userId: Number(currentUser.userId) })
        .orderBy('role.hierarchyLevel', 'DESC')
        .getOne();

      callerLevel = Number(callerDbRole?.role?.hierarchyLevel ?? 0);
      callerGymId = Number(callerDbRole?.gymId ?? 0);
    }

    // ── 2. Construir QueryBuilder base ────────────────────────────────────────
    const query = this.gymsRepo
      .createQueryBuilder('gym')
      .leftJoinAndSelect('gym.location', 'location')
      .leftJoinAndSelect('gym.schedules', 'schedules')
      .leftJoinAndSelect('gym.parent', 'parent')
      .leftJoinAndSelect('gym.machines', 'machines')
      .leftJoinAndSelect('gym.activities', 'activities')
      .where('gym.isActive = :active', { active: true })
      .orderBy('gym.id', 'ASC')
      .distinct(true);

    // ── 3. Aplicar filtros territoriales según RBAC ───────────────────────────
    if (callerLevel >= 10) {
      // SUPER ADMIN: visibilidad global — sin filtro territorial
    } else if (callerLevel === 5) {
      // GERENTE: su Marca (padre) y todas sus sucursales hijas
      if (!callerGymId) throw new ForbiddenException('Gerente sin marca asignada.');
      query.andWhere('(gym.id = :callerGymId OR gym.parent_id = :callerGymId)', { callerGymId });
    } else if (callerLevel === 4) {
      // RECEPCIONISTA: estrictamente su propia sucursal
      if (!callerGymId) throw new ForbiddenException('Recepcionista sin sucursal asignada.');
      query.andWhere('gym.id = :callerGymId', { callerGymId });
    } else {
      // Público / clientes / staff sin privilegios admin: solo sucursales con filtro geo opcional
      query.andWhere('gym.parentId IS NOT NULL');
      if (lat !== undefined && lng !== undefined) {
        query.andWhere(
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
    }

    const gymsToMap = await query.getMany();
    if (gymsToMap.length === 0) return [];

    const gymIds = gymsToMap.map((g) => g.id);
    const occupancyMap = await this.getOccupancyMap(gymIds);

    return gymsToMap.map((gym) =>
      this.mapGymToDto(gym, occupancyMap.get(gym.id) ?? 0),
    );
  }

  async findBrands() {
    const currentUser = this.request?.user;

    const qb = this.gymsRepo
      .createQueryBuilder('gym')
      .where('gym.isActive = :active', { active: true })
      .andWhere('gym.parentId IS NULL')
      .orderBy('gym.id', 'ASC');

    if (currentUser?.userId) {
      const callerDbRole = await this.userRoleRepo
        .createQueryBuilder('ur')
        .innerJoinAndSelect('ur.role', 'role')
        .where('ur.user_id = :userId', { userId: Number(currentUser.userId) })
        .orderBy('role.hierarchyLevel', 'DESC')
        .getOne();

      const callerLevel = Number(callerDbRole?.role?.hierarchyLevel ?? currentUser.level ?? 0);
      const callerGymId = Number(callerDbRole?.gymId ?? currentUser.gymId ?? 0);

      if (callerLevel >= 10) {
        // Super Admin: todas las marcas, sin restricción territorial
      } else if (callerLevel === 5 && callerGymId) {
        // Gerente: únicamente su propia Marca
        qb.andWhere('gym.id = :callerGymId', { callerGymId });
      } else if (callerLevel === 4 && callerGymId) {
        // Recepcionista: la Marca padre de su sucursal
        qb.andWhere(
          'gym.id = (SELECT g2.parent_id FROM gyms g2 WHERE g2.id = :callerGymId)',
          { callerGymId },
        );
      }
      // Niveles < 4 (staff, clientes): sin restricción adicional
    }

    const brands = await qb.getMany();
    return brands.map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      parentId: null,
    }));
  }

  async findOne(id: number) {
    const gym = await this.gymsRepo.findOne({
      where: { id },
      relations: [
        'location',
        'schedules',
        'activities',
        'parent',
        'machines',
      ],
    });
    if (!gym) throw new NotFoundException(`Gimnasio ${id} no encontrado`);
    return this.mapGymToDto(gym);
  }

  private async getOccupancyMap(
    gymIds: number[],
  ): Promise<Map<number, number>> {
    if (gymIds.length === 0) return new Map();
    const rows = await this.checkInRepo
      .createQueryBuilder('c')
      .select('c.gym_id', 'gymId')
      .addSelect('COUNT(*)', 'current')
      .where('c.gym_id IN (:...gymIds)', { gymIds })
      .andWhere('c.check_out_time IS NULL')
      .andWhere("c.status = 'ACTIVO'")
      .groupBy('c.gym_id')
      .getRawMany<{ gymId: string; current: string }>();
    return new Map(
      rows.map((r) => [Number(r.gymId), Number(r.current)]),
    );
  }

  private mapGymToDto(gym: Gym, currentOccupancy = 0) {
    if (gym.location) {
      gym.location.latitude = Number(gym.location.latitude);
      gym.location.longitude = Number(gym.location.longitude);
    }

    const activeServices = (gym.activities ?? [])
      .filter(a => a.isActive)
      .map(a => a.name);

    const machines = gym.machines ?? [];
    const machineCapacity = machines.length;
    const machinesAvailable = machines.filter(m => m.status === 'AVAILABLE').length;
    const machinesInMaintenance = machines.filter(m => m.status === 'MAINTENANCE').length;

    return {
      ...gym,
      isOpen: isGymOpenNow(gym.schedules ?? []),
      parentName: gym.parent?.name ?? null,
      currentOccupancy,
      aforoActual: currentOccupancy,
      servicios: activeServices,
      machineStats: {
        total: machineCapacity,
        available: machinesAvailable,
        maintenance: machinesInMaintenance,
      },
    };
  }

  async update(id: number, data: any) {
    if (data.schedules) {
      this.validateScheduleOverlaps(data.schedules);
    }
    const rawGym = await this.gymsRepo.findOne({ where: { id } });
    if (!rawGym) throw new NotFoundException(`Gimnasio ${id} no encontrado`);

    Object.assign(rawGym, data);
    await this.gymsRepo.save(rawGym);

    return this.findOne(id);
  }

  async remove(id: number) {
    const r = await this.gymsRepo.delete(id);
    if (r.affected === 0)
      throw new NotFoundException(`Gimnasio ${id} no encontrado`);
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
        throw new ForbiddenException(
          'No puede eliminar horarios de otra sucursal',
        );
      }
    }
    return this.schedRepo.delete(id);
  }

  // ── Location ──────────────────────────────────────
  async updateLocation(gymId: number, data: any) {
    const loc = await this.locRepo.findOne({ where: { gymId } });
    if (loc) {
      Object.assign(loc, data);
      return this.locRepo.save(loc);
    }
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
    const gyms = await this.gymsRepo.find({
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
      const gym = gymMap.get(gymId);
      const max = gym?.maxCapacity ?? 100;
      const curr = aforoMap.get(gymId) ?? 0;
      const pct = Math.round((curr / max) * 100);
      const label =
        pct < 40 ? 'Tranquilo' : pct <= 70 ? 'Moderado' : 'Concurrido';
      return {
        gymId,
        name: gym?.name ?? `Sede ${gymId}`,
        address: gym?.location
          ? `${gym.location.latitude}, ${gym.location.longitude}`
          : null,
        imagenUrl:
          'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=1000&auto=format&fit=crop',
        visitCount: Number(r.visitCount),
        aforo: { current: curr, max, percent: pct, label },
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
    const pending = Number(raw?.pending ?? 0);
    const completed = Number(raw?.completed ?? 0);

    return {
      capacity: gym.maxCapacity,
      occupancy: completed,
      totalToday,
      pending,
      completed,
    };
  }

  async findAllLocations() {
    const locations = await this.locRepo
      .createQueryBuilder('loc')
      .innerJoinAndSelect('loc.gym', 'gym')
      .leftJoinAndSelect('gym.parent', 'brand')
      .where('gym.isActive = true')
      .getMany();

    return locations.map((l) => ({
      gymId: l.gymId,
      gymName: l.gym.name,
      brandName: l.gym.parent?.name ?? null,
      latitude: Number(l.latitude),
      longitude: Number(l.longitude),
    }));
  }

  async getOccupancyStats(gymId: number, period: 'day' | 'week' | 'month' | 'year' = 'day') {
    const gym = await this.gymsRepo.findOne({
      where: { id: gymId },
    });
    if (!gym) throw new NotFoundException(`Gym ${gymId} no encontrado`);

    const tz = process.env.APP_TIMEZONE ?? 'America/La_Paz';
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: tz }));

    let since: Date;
    if (period === 'year') {
      since = new Date(now.getFullYear(), 0, 1);
    } else if (period === 'month') {
      since = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === 'week') {
      const day = now.getDay();
      since = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
    } else {
      since = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    const completed = await this.reservationRepo
      .createQueryBuilder('r')
      .where('r.gymId = :gymId', { gymId })
      .andWhere('r.status IN (:...st)', { st: ['COMPLETADA', 'USADA', 'USED'] })
      .andWhere('r.reservation_date >= :since', { since: since.toISOString().slice(0, 10) })
      .getCount();

    const breakdown = await this.reservationRepo
      .createQueryBuilder('r')
      .select("TO_CHAR(r.reservation_date, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('r.gymId = :gymId', { gymId })
      .andWhere('r.status IN (:...st)', { st: ['COMPLETADA', 'USADA', 'USED'] })
      .andWhere('r.reservation_date >= :since', { since: since.toISOString().slice(0, 10) })
      .groupBy("TO_CHAR(r.reservation_date, 'YYYY-MM-DD')")
      .orderBy("TO_CHAR(r.reservation_date, 'YYYY-MM-DD')", 'ASC')
      .getRawMany();

    const maxCapacity = gym.maxCapacity || 1;
    const pct = Math.min(100, Math.round((completed / maxCapacity) * 100));

    return {
      gymId,
      gymName: gym.name,
      period,
      since: since.toISOString().slice(0, 10),
      completedReservations: completed,
      maxCapacity,
      occupancyPct: period === 'day' ? pct : undefined,
      breakdown: breakdown.map((r: any) => ({ date: r.date, count: Number(r.count) })),
    };
  }
}
