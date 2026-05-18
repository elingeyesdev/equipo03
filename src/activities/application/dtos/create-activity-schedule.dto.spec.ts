import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  CreateActivityScheduleDto,
  DayOfWeek,
} from './create-activity-schedule.dto';

describe('CreateActivityScheduleDto', () => {
  it('acepta datos válidos (día completo)', async () => {
    const dto = plainToInstance(CreateActivityScheduleDto, {
      instructorId: 5,
      dayOfWeek: DayOfWeek.LUNES,
      startTime: '08:00',
      endTime: '09:00',
      maxAttendees: 20,
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.dayOfWeek).toBe(DayOfWeek.LUNES);
  });

  it('acepta abreviatura de día (LUN → LUNES)', async () => {
    const dto = plainToInstance(CreateActivityScheduleDto, {
      instructorId: 3,
      dayOfWeek: 'LUN',
      startTime: '10:00',
      endTime: '11:00',
      maxAttendees: 12,
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.dayOfWeek).toBe(DayOfWeek.LUNES);
  });

  it('rechaza instructorId no positivo', async () => {
    const dtoNeg = plainToInstance(CreateActivityScheduleDto, {
      instructorId: -1,
      dayOfWeek: DayOfWeek.MARTES,
      startTime: '10:00',
      endTime: '11:00',
      maxAttendees: 15,
    });
    expect((await validate(dtoNeg)).some((e) => e.property === 'instructorId')).toBe(
      true,
    );

    const dtoZero = plainToInstance(CreateActivityScheduleDto, {
      instructorId: 0,
      dayOfWeek: DayOfWeek.MARTES,
      startTime: '10:00',
      endTime: '11:00',
      maxAttendees: 15,
    });
    expect(
      (await validate(dtoZero)).some((e) => e.property === 'instructorId'),
    ).toBe(true);
  });

  it('rechaza formato de hora inválido en startTime', async () => {
    const dto = plainToInstance(CreateActivityScheduleDto, {
      instructorId: 3,
      dayOfWeek: DayOfWeek.MIERCOLES,
      startTime: '8:00',
      endTime: '09:00',
      maxAttendees: 10,
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'startTime')).toBe(true);
  });

  it('rechaza endTime anterior o igual a startTime', async () => {
    const dtoBefore = plainToInstance(CreateActivityScheduleDto, {
      instructorId: 2,
      dayOfWeek: DayOfWeek.JUEVES,
      startTime: '14:00',
      endTime: '13:00',
      maxAttendees: 25,
    });
    expect(
      (await validate(dtoBefore)).some((e) => e.property === 'endTime'),
    ).toBe(true);

    const dtoEqual = plainToInstance(CreateActivityScheduleDto, {
      instructorId: 2,
      dayOfWeek: DayOfWeek.JUEVES,
      startTime: '14:00',
      endTime: '14:00',
      maxAttendees: 25,
    });
    expect(
      (await validate(dtoEqual)).some((e) => e.property === 'endTime'),
    ).toBe(true);
  });

  it('rechaza dayOfWeek inválido', async () => {
    const dto = plainToInstance(CreateActivityScheduleDto, {
      instructorId: 1,
      dayOfWeek: 'FUNDAY',
      startTime: '09:00',
      endTime: '10:00',
      maxAttendees: 5,
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'dayOfWeek')).toBe(true);
  });

  it('rechaza maxAttendees < 1', async () => {
    const dto = plainToInstance(CreateActivityScheduleDto, {
      instructorId: 4,
      dayOfWeek: DayOfWeek.VIERNES,
      startTime: '09:00',
      endTime: '10:00',
      maxAttendees: 0,
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'maxAttendees')).toBe(true);
  });
});
