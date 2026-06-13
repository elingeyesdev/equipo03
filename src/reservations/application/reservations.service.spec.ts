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
import { JwtService } from '@nestjs/jwt';
import { ReservationsService } from './reservations.service';
import { Reservation } from '../domain/reservation.entity';
import { GymActivity } from '../../activities/domain/gym-activity.entity';
import { GymActivitySchedule } from '../../activities/domain/gym-activity-schedule.entity';
import { GymSchedule } from '../../gyms/domain/gym-schedule.entity';
import { User } from '../../users/domain/user.entity';
import { CheckIn } from '../../checkins/domain/check-in.entity';
import { PushNotificationsService } from '../../push-notifications/application/push-notifications.service';
import { UsersService } from '../../users/application/users.service';
import { GymGateway } from '../../notifications/infrastructure/gym.gateway';

const mockGenericRepo = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  exist: jest.fn(),
  exists: jest.fn(),
  count: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  createQueryBuilder: jest.fn(),
  delete: jest.fn(),
});

function createQueryBuilderMock() {
  const qb: Record<string, jest.Mock> = {};
  const self = () => qb;
  const methods = [
    'select', 'addSelect', 'from',
    'innerJoin', 'innerJoinAndSelect',
    'leftJoin', 'leftJoinAndSelect',
    'where', 'andWhere', 'orWhere',
    'orderBy', 'addOrderBy',
    'groupBy', 'addGroupBy',
    'offset', 'limit', 'skip', 'take',
  ];
  for (const m of methods) {
    qb[m] = jest.fn().mockReturnValue(qb);
  }
  qb.getMany  = jest.fn().mockResolvedValue([]);
  qb.getOne   = jest.fn().mockResolvedValue(null);
  qb.getRawMany = jest.fn().mockResolvedValue([]);
  qb.getRawOne  = jest.fn().mockResolvedValue(null);
  void self;
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
        // ── Repositorios requeridos por el constructor ──────────────────────
        { provide: getRepositoryToken(Reservation),         useValue: repo },
        { provide: getRepositoryToken(GymActivity),         useValue: mockGenericRepo() },
        { provide: getRepositoryToken(GymActivitySchedule), useValue: scheduleRepo },
        { provide: getRepositoryToken(GymSchedule),         useValue: mockGenericRepo() },
        { provide: getRepositoryToken(User),                useValue: usersRepo },
        { provide: getRepositoryToken(CheckIn),             useValue: mockGenericRepo() },
        // ── Otros tokens inyectados ─────────────────────────────────────────
        { provide: DataSource, useValue: dataSource },
        { provide: REQUEST,    useValue: { user: undefined } },
        { provide: JwtService, useValue: { sign: jest.fn(), verify: jest.fn() } },
        {
          provide: PushNotificationsService,
          useValue: { sendPushToUser: jest.fn(), sendPushToMany: jest.fn() },
        },
        {
          provide: UsersService,
          useValue: { findOne: jest.fn(), findByEmail: jest.fn() },
        },
        {
          provide: GymGateway,
          useValue: { notifyGymManagers: jest.fn(), server: {} },
        },
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

    await service.createReservationWithLock(
      1,
      99,
      '2026-06-04',
      'CONFIRMADA',
      50,
    );

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
    repo = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
      exist: jest.fn(),
    };
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
        // ── Repositorios requeridos por el constructor ──────────────────────
        { provide: getRepositoryToken(Reservation),         useValue: repo },
        { provide: getRepositoryToken(GymActivity),         useValue: mockGenericRepo() },
        { provide: getRepositoryToken(GymActivitySchedule), useValue: scheduleRepo },
        { provide: getRepositoryToken(GymSchedule),         useValue: mockGenericRepo() },
        { provide: getRepositoryToken(User),                useValue: usersRepo },
        { provide: getRepositoryToken(CheckIn),             useValue: mockGenericRepo() },
        // ── Otros tokens inyectados ─────────────────────────────────────────
        { provide: DataSource, useValue: dataSource },
        { provide: REQUEST,    useValue: requestUser },
        { provide: JwtService, useValue: { sign: jest.fn(), verify: jest.fn() } },
        {
          provide: PushNotificationsService,
          useValue: { sendPushToUser: jest.fn(), sendPushToMany: jest.fn() },
        },
        {
          provide: UsersService,
          useValue: { findOne: jest.fn(), findByEmail: jest.fn() },
        },
        {
          provide: GymGateway,
          useValue: { notifyGymManagers: jest.fn(), server: {} },
        },
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

    await service.findAll({ page: 1, limit: 10 });

    expect(qb.andWhere).toHaveBeenCalledWith('reservation.user_id = :uid', {
      uid: 10,
    });
  });

  it('ENTRENADOR findAll lanza ForbiddenException de asistencia', async () => {
    requestUser.user = { userId: 3, role: 'ENTRENADOR' };
    const qb = createQueryBuilderMock();
    repo.createQueryBuilder.mockReturnValue(qb);

    await expect(service.findAll({ page: 1, limit: 10 })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(service.findAll({ page: 1, limit: 10 })).rejects.toThrow(
      'Los entrenadores deben usar el endpoint de asistencia por clase.',
    );
  });

  it('SUPER_ADMIN findAll no aplica filtro de usuario ni sede', async () => {
    requestUser.user = { userId: 1, role: 'SUPER_ADMIN' };
    const qb = createQueryBuilderMock();
    repo.createQueryBuilder.mockReturnValue(qb);

    await service.findAll({ page: 1, limit: 10 });

    // SUPER_ADMIN no recibe filtro por userId ni por gymId;
    // el servicio sí aplica un filtro de status por defecto (ocultar CANCELLED)
    // pero NO aplica filtro de aislamiento de sede ni usuario.
    const calls: [string, unknown][] = qb.andWhere.mock.calls;
    const hasUserFilter = calls.some(([q]) => String(q).includes('user_id'));
    const hasGymFilter  = calls.some(([q]) => String(q).includes('gym_id'));
    expect(hasUserFilter).toBe(false);
    expect(hasGymFilter).toBe(false);
  });

  it('GERENTE findAll filtra por gym_id de la actividad', async () => {
    requestUser.user = { userId: 20, role: 'GERENTE', gymId: 3 };
    const qb = createQueryBuilderMock();
    repo.createQueryBuilder.mockReturnValue(qb);

    await service.findAll({ page: 1, limit: 10 });

    expect(qb.andWhere).toHaveBeenCalledWith(
      '(activity.gym_id = :gymId OR reservation.gym_id = :gymId)',
      { gymId: 3 },
    );
  });

  it('CLIENTE findByUser de otro usuario no lanza (el servicio sobrescribe el userId)', async () => {
    requestUser.user = { userId: 10, role: 'CLIENTE' };
    const qb = createQueryBuilderMock();
    // findByUser para CLIENTE ignora el userId externo y usa el del JWT
    repo.createQueryBuilder.mockReturnValue(qb);

    // No debe lanzar; el servicio reemplaza userId=99 por userId=10 (JWT)
    await expect(service.findByUser(99)).resolves.toBeDefined();

    // Verifica que el filtro aplicado usa el userId del JWT (10), no el parámetro (99)
    expect(qb.andWhere).toHaveBeenCalledWith(
      'reservation.userId = :userId',
      { userId: 10 },
    );
  });
});
