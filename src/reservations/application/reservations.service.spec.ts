import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ReservationsService } from './reservations.service';
import { Reservation } from '../domain/reservation.entity';
import { GymActivitySchedule } from '../../activities/domain/gym-activity-schedule.entity';
import { User } from '../../users/domain/user.entity';

function createQueryBuilderMock() {
  const qb = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
    getOne: jest.fn().mockResolvedValue(null),
  };
  return qb;
}

describe('ReservationsService — createReservationWithLock', () => {
  let service: ReservationsService;
  let repo: Record<string, jest.Mock>;
  let scheduleRepo: { findOne: jest.Mock };
  let usersRepo: { exist: jest.Mock };
  let dataSource: { createQueryRunner: jest.Mock };
  let mockQr: {
    connect: jest.Mock;
    startTransaction: jest.Mock;
    commitTransaction: jest.Mock;
    rollbackTransaction: jest.Mock;
    release: jest.Mock;
    manager: {
      findOne: jest.Mock;
      exists: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      save: jest.Mock;
    };
  };

  beforeEach(async () => {
    repo = { createQueryBuilder: jest.fn(), exist: jest.fn() };
    scheduleRepo = { findOne: jest.fn() };
    usersRepo = { exist: jest.fn() };

    mockQr = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        findOne: jest.fn(),
        exists: jest.fn(),
        count: jest.fn(),
        create: jest.fn((_cls, payload) => payload),
        save: jest.fn(async (row) => ({ id: 7, ...row })),
      },
    };

    dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQr),
    };

    const moduleFixture = await Test.createTestingModule({
      providers: [
        ReservationsService,
        { provide: getRepositoryToken(Reservation), useValue: repo },
        { provide: getRepositoryToken(GymActivitySchedule), useValue: scheduleRepo },
        { provide: getRepositoryToken(User), useValue: usersRepo },
        { provide: DataSource, useValue: dataSource },
        { provide: REQUEST, useValue: { user: undefined } },
      ],
    }).compile();

    service = await moduleFixture.resolve(ReservationsService);
  });

  it('lanza ConflictException si no hay cupos disponibles', async () => {
    mockQr.manager.findOne.mockResolvedValue({
      id: 1,
      maxAttendees: 20,
      gymActivity: { gymId: 1 },
    });
    mockQr.manager.exists.mockResolvedValue(false);
    mockQr.manager.count.mockResolvedValue(20);

    await expect(
      service.createReservationWithLock(1, 99, '2026-06-01'),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(mockQr.rollbackTransaction).toHaveBeenCalled();
    expect(mockQr.commitTransaction).not.toHaveBeenCalled();
    expect(mockQr.release).toHaveBeenCalled();
  });

  it('hace rollback si save lanza error', async () => {
    mockQr.manager.findOne.mockResolvedValue({
      id: 1,
      maxAttendees: 20,
      gymActivity: { gymId: 1 },
    });
    mockQr.manager.exists.mockResolvedValue(false);
    mockQr.manager.count.mockResolvedValue(5);
    mockQr.manager.save.mockRejectedValue(new Error('db failure'));

    await expect(
      service.createReservationWithLock(1, 99, '2026-06-02'),
    ).rejects.toBeInstanceOf(InternalServerErrorException);

    expect(mockQr.rollbackTransaction).toHaveBeenCalled();
    expect(mockQr.release).toHaveBeenCalled();
  });

  it('lanza NotFoundException si el horario no existe', async () => {
    mockQr.manager.findOne.mockResolvedValue(null);

    await expect(
      service.createReservationWithLock(999, 1, '2026-06-03'),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(mockQr.rollbackTransaction).toHaveBeenCalled();
    expect(mockQr.release).toHaveBeenCalled();
  });

  it('persiste createdBy cuando se proporciona', async () => {
    mockQr.manager.findOne.mockResolvedValue({
      id: 1,
      maxAttendees: 20,
      gymActivity: { gymId: 1 },
    });
    mockQr.manager.exists.mockResolvedValue(false);
    mockQr.manager.count.mockResolvedValue(0);

    await service.createReservationWithLock(1, 99, '2026-06-04', 'CONFIRMADA', 50);

    expect(mockQr.manager.create).toHaveBeenCalledWith(
      Reservation,
      expect.objectContaining({ userId: 99, createdBy: 50 }),
    );
  });
});

describe('ReservationsService — RBAC createReservation / findAll', () => {
  let service: ReservationsService;
  let repo: { createQueryBuilder: jest.Mock; exist: jest.Mock };
  let scheduleRepo: { findOne: jest.Mock };
  let usersRepo: { exist: jest.Mock };
  let dataSource: { createQueryRunner: jest.Mock };
  let requestUser: { user: { userId: number; role: string; gymId?: number } };
  let mockQr: {
    connect: jest.Mock;
    startTransaction: jest.Mock;
    commitTransaction: jest.Mock;
    rollbackTransaction: jest.Mock;
    release: jest.Mock;
    manager: {
      findOne: jest.Mock;
      exists: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      save: jest.Mock;
    };
  };

  beforeEach(async () => {
    const qb = createQueryBuilderMock();
    repo = { createQueryBuilder: jest.fn().mockReturnValue(qb), exist: jest.fn() };
    scheduleRepo = { findOne: jest.fn() };
    usersRepo = { exist: jest.fn().mockResolvedValue(true) };
    requestUser = { user: { userId: 10, role: 'CLIENTE' } };

    mockQr = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        findOne: jest.fn().mockResolvedValue({
          id: 1,
          maxAttendees: 20,
          gymActivity: { gymId: 1 },
        }),
        exists: jest.fn().mockResolvedValue(false),
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn((_cls, payload) => payload),
        save: jest.fn(async (row) => ({ id: 1, ...row })),
      },
    };

    dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQr),
    };

    const moduleFixture = await Test.createTestingModule({
      providers: [
        ReservationsService,
        { provide: getRepositoryToken(Reservation), useValue: repo },
        { provide: getRepositoryToken(GymActivitySchedule), useValue: scheduleRepo },
        { provide: getRepositoryToken(User), useValue: usersRepo },
        { provide: DataSource, useValue: dataSource },
        { provide: REQUEST, useValue: requestUser },
      ],
    }).compile();

    service = await moduleFixture.resolve(ReservationsService);
  });

  it('CLIENTE ignora targetUserId y reserva con su propio userId', async () => {
    const lockSpy = jest.spyOn(service, 'createReservationWithLock');

    await service.createReservation({
      targetUserId: 999,
      gymActivityScheduleId: 1,
      reservationDate: '2026-06-10',
    });

    expect(lockSpy).toHaveBeenCalledWith(1, 10, '2026-06-10', 'CONFIRMADA', 10);
    lockSpy.mockRestore();
  });

  it('GERENTE sin targetUserId lanza BadRequestException', async () => {
    requestUser.user = { userId: 20, role: 'GERENTE', gymId: 1 };

    await expect(
      service.createReservation({
        gymActivityScheduleId: 1,
        reservationDate: '2026-06-10',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('GERENTE con usuario inexistente lanza NotFoundException', async () => {
    requestUser.user = { userId: 20, role: 'GERENTE', gymId: 1 };
    usersRepo.exist.mockResolvedValue(false);

    await expect(
      service.createReservation({
        targetUserId: 5,
        gymActivityScheduleId: 1,
        reservationDate: '2026-06-10',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('SUPER_ADMIN no puede crear reservas', async () => {
    requestUser.user = { userId: 1, role: 'SUPER_ADMIN' };

    await expect(
      service.createReservation({
        gymActivityScheduleId: 1,
        reservationDate: '2026-06-10',
      }),
    ).rejects.toMatchObject({
      response: { message: 'Tu rol no permite crear reservas.' },
    });
  });

  it('ENTRENADOR no puede crear reservas', async () => {
    requestUser.user = { userId: 2, role: 'ENTRENADOR' };

    await expect(
      service.createReservation({
        gymActivityScheduleId: 1,
        reservationDate: '2026-06-10',
      }),
    ).rejects.toMatchObject({
      response: { message: 'Tu rol no permite crear reservas.' },
    });
  });

  it('CLIENTE findAll filtra por user_id del JWT', async () => {
    requestUser.user = { userId: 10, role: 'CLIENTE' };
    const qb = createQueryBuilderMock();
    repo.createQueryBuilder.mockReturnValue(qb);

    await service.findAll();

    expect(qb.andWhere).toHaveBeenCalledWith('reservation.user_id = :uid', { uid: 10 });
  });

  it('ENTRENADOR findAll lanza ForbiddenException de asistencia', () => {
    requestUser.user = { userId: 3, role: 'ENTRENADOR' };

    expect(() => service.findAll()).toThrow(ForbiddenException);
    expect(() => service.findAll()).toThrow(
      'Los entrenadores deben usar el endpoint de asistencia por clase.',
    );
  });

  it('SUPER_ADMIN findAll no aplica filtro de usuario ni sede', async () => {
    requestUser.user = { userId: 1, role: 'SUPER_ADMIN' };
    const qb = createQueryBuilderMock();
    repo.createQueryBuilder.mockReturnValue(qb);

    await service.findAll();

    expect(qb.andWhere).not.toHaveBeenCalled();
  });

  it('GERENTE findAll filtra por gym_id de la actividad', async () => {
    requestUser.user = { userId: 20, role: 'GERENTE', gymId: 3 };
    const qb = createQueryBuilderMock();
    repo.createQueryBuilder.mockReturnValue(qb);

    await service.findAll();

    expect(qb.andWhere).toHaveBeenCalledWith('activity.gym_id = :gymId', { gymId: 3 });
  });

  it('CLIENTE findByUser de otro usuario lanza ForbiddenException', () => {
    requestUser.user = { userId: 10, role: 'CLIENTE' };

    expect(() => service.findByUser(99)).toThrow(ForbiddenException);
    expect(() => service.findByUser(99)).toThrow(
      'No tiene permisos para ver reservas de otro usuario.',
    );
  });
});
