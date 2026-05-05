import { Inject, Injectable, ForbiddenException, NotFoundException, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CheckIn } from '../domain/check-in.entity';
import { getManagerGymId, type RequestWithUser } from '../../common/security/gym-scope';

@Injectable({ scope: Scope.REQUEST })
export class CheckinsService {
    constructor(
        @InjectRepository(CheckIn) private repo: Repository<CheckIn>,
        @Inject(REQUEST) private readonly request: any, // Usamos any para evitar líos de tipos en la demo
    ) {}

    // --- Helpers de Seguridad Existentes ---
    private getManagerGymId(): number | null {
        const user = this.request.user;
        return user?.role === 'GERENTE' ? user.gymId : null;
    }

    private ensureManagerCanAccessGym(gymId: number): void {
        const managerGymId = this.getManagerGymId();
        if (managerGymId !== null && managerGymId !== gymId) {
            throw new ForbiddenException('No tiene permisos para acceder a otra sucursal');
        }
    }

    // --- Métodos de Negocio ---

    async findAllHistory() {
        const user = this.request.user;
        const managerGymId = this.getManagerGymId();

        const qb = this.repo.createQueryBuilder('checkIn')
            .leftJoinAndSelect('checkIn.user', 'user')
            .leftJoinAndSelect('checkIn.gym', 'gym')
            .orderBy('checkIn.check_in_time', 'DESC');

        // Aplicar Scoping por Rol
        if (user.role === 'GERENTE' && managerGymId) {
            qb.andWhere('checkIn.gym_id = :gymId', { gymId: managerGymId });
        } else if (user.role === 'USER') {
            qb.andWhere('checkIn.user_id = :userId', { userId: user.sub });
        }

        const records = await qb.getMany();

        // Mapeo para la App Móvil (Evita el 404 y errores de undefined)
        return records.map(c => ({
            id: c.id,
            userName: c.user ? `${c.user.email}` : 'Usuario Desconocido', // Ajusta según tus campos de nombre
            gymName: c.gym?.name || 'Sede no asignada',
            status: c.status, // AUTORIZADO o DENEGADO
            checkInTime: c.checkInTime || (c as any).check_in_time, // Soporte para ambos nombres de columna
            method: c.method || 'QR'
        }));
    }

    // --- Resto de tus métodos (create, findAll, etc.) ---
    create(data: Partial<CheckIn>) { return this.repo.save(this.repo.create(data)); }

    findAll() {
        const managerGymId = this.getManagerGymId();
        const qb = this.repo.createQueryBuilder('checkIn')
            .leftJoinAndSelect('checkIn.user', 'user')
            .leftJoinAndSelect('checkIn.gym', 'gym')
            .orderBy('checkIn.check_in_time', 'DESC');
        if (managerGymId !== null) qb.andWhere('checkIn.gym_id = :gymId', { gymId: managerGymId });
        return qb.getMany();
    }

    findByUser(userId: number) {
        const managerGymId = this.getManagerGymId();
        const qb = this.repo.createQueryBuilder('checkIn')
            .leftJoinAndSelect('checkIn.gym', 'gym')
            .where('checkIn.user_id = :userId', { userId })
            .orderBy('checkIn.check_in_time', 'DESC');
        if (managerGymId !== null) qb.andWhere('checkIn.gym_id = :gymId', { gymId: managerGymId });
        return qb.getMany();
    }

    findByGym(gymId: number) {
        this.ensureManagerCanAccessGym(gymId);
        return this.repo.createQueryBuilder('checkIn')
            .leftJoinAndSelect('checkIn.user', 'user')
            .where('checkIn.gym_id = :gymId', { gymId })
            .orderBy('checkIn.check_in_time', 'DESC')
            .getMany();
    }

    async findOne(id: number) {
        const managerGymId = this.getManagerGymId();
        const qb = this.repo.createQueryBuilder('checkIn')
            .leftJoinAndSelect('checkIn.user', 'user')
            .leftJoinAndSelect('checkIn.gym', 'gym')
            .where('checkIn.id = :id', { id });
        if (managerGymId !== null) qb.andWhere('checkIn.gym_id = :gymId', { gymId: managerGymId });
        const c = await qb.getOne();
        if (!c) throw new NotFoundException(`Check-in ${id} no encontrado`);
        return c;
    }

    async checkOut(id: number) {
        const c = await this.findOne(id);
        c.checkOutTime = new Date();
        return this.repo.save(c);
    }
}
