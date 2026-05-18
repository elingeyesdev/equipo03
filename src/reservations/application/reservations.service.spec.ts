import {
  ConflictException,
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

describe('ReservationsService — createReservationWithLock', () => {
  let service: ReservationsService;
  let repo: Record<string, jest.Mock>;
  let scheduleRepo: { findOne: jest.Mock };
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
    repo = {};
    scheduleRepo = { findOne: jest.fn() };

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
});
