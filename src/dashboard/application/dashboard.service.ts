import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import type { RequestWithUser } from '../../common/security/gym-scope';

@Injectable({ scope: Scope.REQUEST })
export class DashboardService {
  constructor(
    @InjectDataSource() private readonly db: DataSource,
    @Inject(REQUEST) private readonly request: RequestWithUser,
  ) {}

  private gymId(): number | null {
    const u = this.request.user;
    return u?.role?.toUpperCase() === 'GERENTE' ? (u?.gymId ?? null) : null;
  }

  private buildHistory(
    rows: { date: string; count: string }[],
  ): { v: number }[] {
    const map = new Map(rows.map((r) => [r.date, Number(r.count)]));
    const result: { v: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - i);
      result.push({ v: map.get(d.toISOString().slice(0, 10)) ?? 0 });
    }
    return result;
  }

  async getSummary() {
    const gymId = this.gymId();

    // ── Users ──────────────────────────────────────────────────────────────────
    const [usersTotal, usersHistory] = await Promise.all([
      gymId !== null
        ? this.db.query<{ total: string }[]>(
            `SELECT COUNT(DISTINCT u.id) AS total
             FROM users u
             INNER JOIN user_roles ur ON ur.user_id = u.id AND ur.gym_id = $1
             WHERE u.is_active = true`,
            [gymId],
          )
        : this.db.query<{ total: string }[]>(
            `SELECT COUNT(*) AS total FROM users WHERE is_active = true`,
          ),

      gymId !== null
        ? this.db.query<{ date: string; count: string }[]>(
            `SELECT DATE(u.created_at)::text AS date, COUNT(DISTINCT u.id)::text AS count
             FROM users u
             INNER JOIN user_roles ur ON ur.user_id = u.id AND ur.gym_id = $1
             WHERE u.created_at >= CURRENT_DATE - INTERVAL '6 days'
             GROUP BY DATE(u.created_at)`,
            [gymId],
          )
        : this.db.query<{ date: string; count: string }[]>(
            `SELECT DATE(created_at)::text AS date, COUNT(*)::text AS count
             FROM users
             WHERE created_at >= CURRENT_DATE - INTERVAL '6 days'
             GROUP BY DATE(created_at)`,
          ),
    ]);

    // ── Check-ins ──────────────────────────────────────────────────────────────
    const [checkinsTotal, checkinsHistory] = await Promise.all([
      gymId !== null
        ? this.db.query<{ total: string }[]>(
            `SELECT COUNT(*) AS total FROM check_ins WHERE gym_id = $1 AND DATE(check_in_time) = CURRENT_DATE`,
            [gymId],
          )
        : this.db.query<{ total: string }[]>(
            `SELECT COUNT(*) AS total FROM check_ins WHERE DATE(check_in_time) = CURRENT_DATE`,
          ),

      gymId !== null
        ? this.db.query<{ date: string; count: string }[]>(
            `SELECT DATE(check_in_time)::text AS date, COUNT(*)::text AS count
             FROM check_ins
             WHERE gym_id = $1 AND check_in_time >= CURRENT_DATE - INTERVAL '6 days'
             GROUP BY DATE(check_in_time)`,
            [gymId],
          )
        : this.db.query<{ date: string; count: string }[]>(
            `SELECT DATE(check_in_time)::text AS date, COUNT(*)::text AS count
             FROM check_ins
             WHERE check_in_time >= CURRENT_DATE - INTERVAL '6 days'
             GROUP BY DATE(check_in_time)`,
          ),
    ]);

    // ── Reservations ───────────────────────────────────────────────────────────
    const [reservationsTotal, reservationsHistory] = await Promise.all([
      gymId !== null
        ? this.db.query<{ total: string }[]>(
            `SELECT COUNT(*) AS total FROM reservations WHERE gym_id = $1 AND reservation_date = CURRENT_DATE`,
            [gymId],
          )
        : this.db.query<{ total: string }[]>(
            `SELECT COUNT(*) AS total FROM reservations WHERE reservation_date = CURRENT_DATE`,
          ),

      gymId !== null
        ? this.db.query<{ date: string; count: string }[]>(
            `SELECT reservation_date::text AS date, COUNT(*)::text AS count
             FROM reservations
             WHERE gym_id = $1 AND reservation_date >= CURRENT_DATE - INTERVAL '6 days'
             GROUP BY reservation_date`,
            [gymId],
          )
        : this.db.query<{ date: string; count: string }[]>(
            `SELECT reservation_date::text AS date, COUNT(*)::text AS count
             FROM reservations
             WHERE reservation_date >= CURRENT_DATE - INTERVAL '6 days'
             GROUP BY reservation_date`,
          ),
    ]);

    return {
      users: {
        total: Number(usersTotal[0]?.total ?? 0),
        history: this.buildHistory(usersHistory),
      },
      checkins: {
        total: Number(checkinsTotal[0]?.total ?? 0),
        history: this.buildHistory(checkinsHistory),
      },
      reservations: {
        total: Number(reservationsTotal[0]?.total ?? 0),
        history: this.buildHistory(reservationsHistory),
      },
    };
  }
}
