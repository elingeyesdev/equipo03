import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// ── Domain Modules (Estructura Modular por Dominios) ─────────
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { GymsModule } from './gyms/gyms.module';
import { ActivitiesModule } from './activities/activities.module';
import { ExercisesModule } from './exercises/exercises.module';
import { RoutinesModule } from './routines/routines.module';
import { TrainingModule } from './training/training.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { ReservationsModule } from './reservations/reservations.module';
import { WaitlistModule } from './waitlist/waitlist.module';
import { CheckinsModule } from './checkins/checkins.module';
import { MetricsModule } from './metrics/metrics.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SystemModule } from './system/system.module';

@Module({
  imports: [
    // ── Configuration ──────────────────────────────────────────
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),

    // ── Database ───────────────────────────────────────────────
    // IMPORTANTE: Para la primera ejecución después del reset de la DB,
    // puedes activar DROP_SCHEMA=true en .env para forzar recreación.
    // Después de la primera ejecución exitosa, QUITA esa variable.
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'postgres',
        host: cfg.get<string>('DB_HOST'),
        port: cfg.get<number>('DB_PORT'),
        username: cfg.get<string>('DB_USERNAME'),
        password: cfg.get<string>('DB_PASSWORD'),
        database: cfg.get<string>('DB_DATABASE'),
        autoLoadEntities: true,
        synchronize: cfg.get('NODE_ENV') !== 'production',
        // Activar SOLO para la primera ejecución post-reset si es necesario
        dropSchema: cfg.get<string>('DROP_SCHEMA') === 'true',
        // Logging siempre activo para diagnóstico — desactivar en production
        logging: true,
      }),
    }),

    // ── Feature Modules (33 tablas, 15 módulos) ────────────────
    AuthModule,
    UsersModule,
    RolesModule,
    GymsModule,
    ActivitiesModule,
    ExercisesModule,
    RoutinesModule,
    TrainingModule,
    SubscriptionsModule,
    ReservationsModule,
    WaitlistModule,
    CheckinsModule,
    MetricsModule,
    NotificationsModule,
    SystemModule,
  ],
})
export class AppModule {}
