import { ForbiddenException, ConflictException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ActivitiesService } from './activities.service';
import { GymActivity } from '../domain/gym-activity.entity';
import { GymActivitySchedule } from '../domain/gym-activity-schedule.entity';
import { GymActivityAttendance } from '../domain/gym-activity-attendance.entity';
import { User } from '../../users/domain/user.entity';
import { GymSchedule } from '../../gyms/domain/gym-schedule.entity';
import { DayOfWeek } from './dtos/create-activity-schedule.dto';

describe('ActivitiesService — createSchedule', () => {
  let service: ActivitiesService;
  let qbMock: { where: jest.Mock; andWhere: jest.Mock; getCount: jest.Mock };
  let schedRepo: {
    createQueryBuilder: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let actRepo: { findOne: jest.Mock };
  let userRepo: { findOne: jest.Mock };
  let gymScheduleRepo: { find: jest.Mock };

  const mockRequest = { user: undefined };

  beforeEach(async () => {
    qbMock = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn(),
    };

    schedRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(qbMock),
      create: jest.fn((row) => row),
      save: jest.fn(async (row) => ({ id: 99, ...row })),
    };

    actRepo = { findOne: jest.fn() };
    userRepo = { findOne: jest.fn() };
    gymScheduleRepo = { find: jest.fn().mockResolvedValue([]) };

    const moduleFixture = await Test.createTestingModule({
      providers: [
        ActivitiesService,
        { provide: getRepositoryToken(GymActivity), useValue: actRepo },
        { provide: getRepositoryToken(GymActivitySchedule), useValue: schedRepo },
        { provide: getRepositoryToken(GymActivityAttendance), useValue: {} },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(GymSchedule), useValue: gymScheduleRepo },
        { provide: REQUEST, useValue: mockRequest },
      ],
    }).compile();

    service = await moduleFixture.resolve(ActivitiesService);
  });

  function baseActivity() {
    return { id: 1, gymId: 10, isActive: true };
  }

  function instructorUser() {
    return {
      id: 5,
      isActive: true,
      userRoles: [{ role: { name: 'ENTRENADOR' } }],
    };
  }

  it('lanza ConflictException si el instructor ya tiene clase solapada', async () => {
    actRepo.findOne.mockResolvedValue(baseActivity());
    userRepo.findOne.mockResolvedValue(instructorUser());
    qbMock.getCount.mockResolvedValue(1);

    await expect(
      service.createSchedule(1, {
        instructorId: 5,
        dayOfWeek: DayOfWeek.LUNES,
        startTime: '08:30',
        endTime: '09:30',
        maxAttendees: 12,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(schedRepo.save).not.toHaveBeenCalled();
  });

  it('permite crear cuando no hay solapamiento (p. ej. 10:00–11:00 vs otro 09:00–10:00 en BD)', async () => {
    actRepo.findOne.mockResolvedValue(baseActivity());
    userRepo.findOne.mockResolvedValue(instructorUser());
    qbMock.getCount.mockResolvedValue(0);

    await service.createSchedule(1, {
      instructorId: 5,
      dayOfWeek: DayOfWeek.LUNES,
      startTime: '10:00',
      endTime: '11:00',
      maxAttendees: 15,
    });

    expect(schedRepo.save).toHaveBeenCalledTimes(1);
  });

  it('rechaza instructor sin rol válido', async () => {
    actRepo.findOne.mockResolvedValue(baseActivity());
    userRepo.findOne.mockResolvedValue({
      id: 5,
      isActive: true,
      userRoles: [{ role: { name: 'CLIENTE' } }],
    });

    await expect(
      service.createSchedule(1, {
        instructorId: 5,
        dayOfWeek: DayOfWeek.LUNES,
        startTime: '08:00',
        endTime: '09:00',
        maxAttendees: 10,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
