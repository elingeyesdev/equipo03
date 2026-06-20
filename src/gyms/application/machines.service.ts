import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
  Scope,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { MachineInventory } from '../domain/machine-inventory.entity';
import { Gym } from '../domain/gym.entity';
import { StorageService } from '../../shared/infrastructure/storage/storage.service';
import type { RequestWithUser } from '../../common/security/gym-scope';
import { CreateMachineDto } from './dtos/machines.dto';
import { UpdateMachineDto } from './dtos/machines.dto';

@Injectable({ scope: Scope.REQUEST })
export class MachinesService {
  constructor(
    @InjectRepository(MachineInventory)
    private repo: Repository<MachineInventory>,
    @InjectRepository(Gym)
    private gymRepo: Repository<Gym>,
    private readonly storage: StorageService,
    @Inject(REQUEST) private readonly request: RequestWithUser,
  ) {}

  private get auth() {
    const user = this.request.user;
    if (!user?.userId) throw new ForbiddenException('Sesión no válida.');
    return user;
  }

  private get level(): number {
    return this.auth.level ?? 0;
  }

  /**
   * Resuelve los IDs de sucursales visibles según el nivel jerárquico:
   *   >= 10 → null (sin filtro, ve todo)
   *   == 5  → todas las sucursales de su marca (herencia por parentId)
   *   == 4  → solo su sucursal asignada (gymId del JWT)
   */
  private async resolveVisibleGymIds(): Promise<number[] | null> {
    if (this.level >= 10) return null;

    if (this.level === 4) {
      const gymId = this.auth.gymId ? Number(this.auth.gymId) : null;
      if (!gymId) {
        throw new ForbiddenException('No tienes una sucursal asignada.');
      }
      return [gymId];
    }

    const gymId = this.auth.gymId ? Number(this.auth.gymId) : null;
    const brandId = this.auth.brandId ? Number(this.auth.brandId) : null;
    const anchorId = brandId ?? gymId;

    if (!anchorId) {
      throw new ForbiddenException('No tienes una marca o sucursal asignada.');
    }

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

  private async assertWriteAccess(gymId: number): Promise<void> {
    if (this.level >= 10) return;

    if (this.level < 5) {
      throw new ForbiddenException(
        'Se requiere nivel jerárquico >= 5 para gestionar máquinas.',
      );
    }

    const gym = await this.gymRepo.findOne({
      where: { id: gymId },
      select: ['id', 'parentId'],
    });
    if (!gym) throw new NotFoundException(`Sucursal ${gymId} no encontrada.`);
    if (!gym.parentId) {
      throw new BadRequestException(
        'Las máquinas solo se asignan a sucursales físicas, no a marcas.',
      );
    }

    const allowed = await this.resolveVisibleGymIds();
    if (allowed !== null && !allowed.includes(gymId)) {
      throw new ForbiddenException(
        'No tienes permisos para gestionar máquinas en esta sucursal.',
      );
    }
  }

  async findAll(gymId?: number) {
    const visibleIds = await this.resolveVisibleGymIds();

    if (visibleIds === null) {
      const where = gymId ? { gymId } : {};
      return this.repo.find({ where, order: { createdAt: 'DESC' }, relations: ['gym'] });
    }

    if (visibleIds.length === 0) return [];

    const effectiveIds = gymId
      ? visibleIds.includes(gymId) ? [gymId] : []
      : visibleIds;

    if (effectiveIds.length === 0) return [];

    return this.repo.find({
      where: { gymId: In(effectiveIds) },
      order: { createdAt: 'DESC' },
      relations: ['gym'],
    });
  }

  async findOne(id: string) {
    const machine = await this.repo.findOne({
      where: { id },
      relations: ['gym'],
    });
    if (!machine) throw new NotFoundException(`Máquina ${id} no encontrada.`);

    const visibleIds = await this.resolveVisibleGymIds();
    if (visibleIds !== null && !visibleIds.includes(machine.gymId)) {
      throw new ForbiddenException('No tienes acceso a esta máquina.');
    }

    return machine;
  }

  async create(dto: CreateMachineDto) {
    await this.assertWriteAccess(dto.gymId);
    const machine = this.repo.create(dto);
    return this.repo.save(machine);
  }

  async update(id: string, dto: UpdateMachineDto) {
    const machine = await this.findOne(id);
    await this.assertWriteAccess(machine.gymId);

    if (dto.gymId !== undefined && dto.gymId !== machine.gymId) {
      await this.assertWriteAccess(dto.gymId);
    }

    Object.assign(machine, dto);
    return this.repo.save(machine);
  }

  async updateImage(id: string, fileBuffer: Buffer) {
    const machine = await this.findOne(id);
    await this.assertWriteAccess(machine.gymId);

    if (machine.imageUrl) {
      await this.storage.deleteImage(machine.imageUrl).catch(() => {});
    }

    machine.imageUrl = await this.storage.uploadImage(fileBuffer, 'machine_inventory');
    return this.repo.save(machine);
  }

  async deleteImage(id: string) {
    const machine = await this.findOne(id);
    await this.assertWriteAccess(machine.gymId);

    if (machine.imageUrl) {
      await this.storage.deleteImage(machine.imageUrl);
      machine.imageUrl = null;
      return this.repo.save(machine);
    }
    return machine;
  }

  async remove(id: string) {
    const machine = await this.findOne(id);
    await this.assertWriteAccess(machine.gymId);

    if (machine.imageUrl) {
      await this.storage.deleteImage(machine.imageUrl);
    }
    await this.repo.delete(id);
    return { message: `Máquina "${machine.name}" eliminada.` };
  }
}
