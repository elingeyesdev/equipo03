import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { MachineInventory } from '../domain/machine-inventory.entity';
import { Gym } from '../domain/gym.entity';
import { StorageService } from '../../shared/infrastructure/storage/storage.service';
import type { RequestUser } from '../../common/security/gym-scope';
import { CreateMachineDto, UpdateMachineDto } from './dtos/machines.dto';

@Injectable()
export class MachinesService {
  constructor(
    @InjectRepository(MachineInventory)
    private repo: Repository<MachineInventory>,
    @InjectRepository(Gym)
    private gymRepo: Repository<Gym>,
    private readonly storage: StorageService,
  ) {}

  // ── Resolución de jurisdicción ──────────────────────────────────────────────

  /**
   * Devuelve los gymIds visibles para el usuario:
   *   level >= 10 → null (sin filtro)
   *   level == 5  → sucursales de su marca
   *   level == 4  → solo su gymId
   */
  private async resolveVisibleGymIds(caller: RequestUser): Promise<number[] | null> {
    const level = caller.level ?? 0;

    if (level >= 10) return null;

    if (level <= 4) {
      const gymId = caller.gymId ? Number(caller.gymId) : null;
      if (!gymId) throw new ForbiddenException('No tienes una sucursal asignada.');
      return [gymId];
    }

    // level 5-9: marca completa
    const brandId = caller.brandId ? Number(caller.brandId) : null;
    const gymId = caller.gymId ? Number(caller.gymId) : null;
    const anchorId = brandId ?? gymId;
    if (!anchorId) throw new ForbiddenException('No tienes una marca o sucursal asignada.');

    const anchor = await this.gymRepo.findOne({
      where: { id: anchorId },
      select: ['id', 'parentId'],
    });
    if (!anchor) throw new ForbiddenException('Sede asignada no encontrada.');

    const resolvedBrandId = anchor.parentId ?? anchor.id;
    const branches = await this.gymRepo.find({
      where: { parentId: resolvedBrandId, isActive: true },
      select: ['id'],
    });

    return branches.map((b) => b.id);
  }

  /**
   * Valida que el usuario tenga jurisdicción sobre el gymId objetivo.
   *   level >= 10 → pasa directo
   *   level 5-9   → gymId debe pertenecer a su marca
   *   level 4     → gymId debe ser exactamente su sucursal
   */
  private async assertJurisdiction(gymId: number, caller: RequestUser): Promise<void> {
    const level = caller.level ?? 0;
    if (level >= 10) return;

    const gym = await this.gymRepo.findOne({
      where: { id: gymId },
      select: ['id', 'parentId'],
    });
    if (!gym) throw new NotFoundException(`Sucursal ${gymId} no encontrada.`);
    if (!gym.parentId) {
      throw new BadRequestException('Las máquinas solo se asignan a sucursales físicas, no a marcas.');
    }

    const allowed = await this.resolveVisibleGymIds(caller);
    if (allowed !== null && !allowed.includes(gymId)) {
      throw new ForbiddenException('No tienes jurisdicción sobre esta sucursal.');
    }
  }

  /**
   * Para level 4: sobrescribe gymId con el del JWT (anti-manipulación).
   * Para level 5+: respeta el gymId del payload.
   */
  private enforceGymId(payloadGymId: number, caller: RequestUser): number {
    const level = caller.level ?? 0;
    if (level <= 4) {
      const forced = caller.gymId ? Number(caller.gymId) : null;
      if (!forced) throw new ForbiddenException('No tienes una sucursal asignada.');
      return forced;
    }
    return payloadGymId;
  }

  // ── Queries ─────────────────────────────────────────────────────────────────

  async findAll(gymId: number | undefined, caller?: RequestUser, status?: string) {
    const user  = caller ?? this.getFallbackCaller();
    const level = user.level ?? 0;

    // Sanitize status to prevent injection with unknown enum values.
    const VALID_STATUSES = ['AVAILABLE', 'MAINTENANCE'];
    const safeStatus = status ? VALID_STATUSES.find(s => s === status.toUpperCase()) : undefined;

    // level 1-3 (clientes, instructores, nutricionistas): sin gymId en JWT.
    // Solo pueden leer el inventario de una sucursal específica vía gymId explícito.
    if (level < 4) {
      if (!gymId) throw new ForbiddenException('Se requiere el parámetro gymId para consultar máquinas.');
      const where: Record<string, unknown> = { gymId };
      if (safeStatus) where['status'] = safeStatus;
      return this.repo.find({ where, order: { name: 'ASC' }, relations: ['gym', 'gym.parent'] });
    }

    // level 10+: super admin, ve todo.
    if (level >= 10) {
      const where: Record<string, unknown> = {};
      if (gymId) where['gymId'] = gymId;
      if (safeStatus) where['status'] = safeStatus;
      return this.repo.find({ where, order: { createdAt: 'DESC' }, relations: ['gym', 'gym.parent'] });
    }

    // level 4-9: jurisdicción por JWT (sucursal o marca).
    const visibleIds = await this.resolveVisibleGymIds(user);

    if (visibleIds === null) {
      const where: Record<string, unknown> = gymId ? { gymId } : {};
      if (safeStatus) where['status'] = safeStatus;
      return this.repo.find({ where, order: { createdAt: 'DESC' }, relations: ['gym', 'gym.parent'] });
    }

    if (visibleIds.length === 0) return [];

    const effectiveIds = gymId
      ? visibleIds.includes(gymId) ? [gymId] : []
      : visibleIds;

    if (effectiveIds.length === 0) return [];

    const where: Record<string, unknown> = { gymId: In(effectiveIds) };
    if (safeStatus) where['status'] = safeStatus;
    return this.repo.find({
      where,
      order: { createdAt: 'DESC' },
      relations: ['gym', 'gym.parent'],
    });
  }

  async findOne(id: string, caller?: RequestUser) {
    const machine = await this.repo.findOne({
      where: { id },
      relations: ['gym', 'gym.parent'],
    });
    if (!machine) throw new NotFoundException(`Máquina ${id} no encontrada.`);

    if (caller) {
      const visibleIds = await this.resolveVisibleGymIds(caller);
      if (visibleIds !== null && !visibleIds.includes(machine.gymId)) {
        throw new ForbiddenException('No tienes acceso a esta máquina.');
      }
    }

    return machine;
  }

  // ── Mutaciones ──────────────────────────────────────────────────────────────

  async create(dto: CreateMachineDto, caller: RequestUser) {
    const gymId = this.enforceGymId(dto.gymId, caller);
    await this.assertJurisdiction(gymId, caller);

    const machine = this.repo.create({ ...dto, gymId });
    return this.repo.save(machine);
  }

  async update(id: string, dto: UpdateMachineDto, caller: RequestUser) {
    const machine = await this.findOne(id, caller);
    await this.assertJurisdiction(machine.gymId, caller);

    if (dto.gymId !== undefined && dto.gymId !== machine.gymId) {
      const newGymId = this.enforceGymId(dto.gymId, caller);
      await this.assertJurisdiction(newGymId, caller);
      dto.gymId = newGymId;
    }

    Object.assign(machine, dto);
    return this.repo.save(machine);
  }

  async updateImage(id: string, fileBuffer: Buffer, caller: RequestUser) {
    const machine = await this.findOne(id, caller);
    await this.assertJurisdiction(machine.gymId, caller);

    if (machine.imageUrl) {
      await this.storage.deleteImage(machine.imageUrl).catch(() => {});
    }

    machine.imageUrl = await this.storage.uploadImage(fileBuffer, 'machine_inventory');
    return this.repo.save(machine);
  }

  async deleteImage(id: string, caller: RequestUser) {
    const machine = await this.findOne(id, caller);
    await this.assertJurisdiction(machine.gymId, caller);

    if (machine.imageUrl) {
      await this.storage.deleteImage(machine.imageUrl);
      machine.imageUrl = null;
      return this.repo.save(machine);
    }
    return machine;
  }

  async remove(id: string, caller: RequestUser) {
    const machine = await this.findOne(id, caller);
    await this.assertJurisdiction(machine.gymId, caller);

    if (machine.imageUrl) {
      await this.storage.deleteImage(machine.imageUrl);
    }
    await this.repo.delete(id);
    return { message: `Máquina "${machine.name}" eliminada.` };
  }

  private getFallbackCaller(): RequestUser {
    return { userId: 0, email: '', level: 0 };
  }
}
