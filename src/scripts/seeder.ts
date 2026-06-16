// src/scripts/seeder.ts  — Idempotente: findOrCreate / skipIfExists. Sin TRUNCATE.
import { AppDataSource } from '../config/data-source.cli';
import * as bcrypt from 'bcrypt';
import { Repository, In } from 'typeorm';

import { Role } from '../roles/domain/role.entity';
import { Permission } from '../roles/domain/permission.entity';
import { User } from '../users/domain/user.entity';
import { UserProfile } from '../users/domain/user-profile.entity';
import { UserRole } from '../roles/domain/user-role.entity';
import { Gym } from '../gyms/domain/gym.entity';
import { GymLocation } from '../gyms/domain/gym-location.entity';
import { GymSchedule } from '../gyms/domain/gym-schedule.entity';
import { SubscriptionPlan } from '../subscriptions/domain/subscription-plan.entity';
import { UserSubscription } from '../subscriptions/domain/user-subscription.entity';
import { ExerciseCatalog } from '../exercises/domain/exercise-catalog.entity';
import { GymActivity } from '../activities/domain/gym-activity.entity';
import { GymActivitySchedule } from '../activities/domain/gym-activity-schedule.entity';
import { Reservation } from '../reservations/domain/reservation.entity';
import { CheckIn } from '../checkins/domain/check-in.entity';
import { Routine } from '../routines/domain/routine.entity';
import { RoutineExercise } from '../routines/domain/routine-exercise.entity';
import { UserTraining } from '../training/domain/user-training.entity';
import { UserTrainingGoals } from '../training/domain/user-training-goals.entity';
import { WorkoutSession } from '../training/domain/workout-session.entity';
import { WorkoutSet } from '../training/domain/workout-set.entity';
import { SystemSetting } from '../system/domain/system-setting.entity';
import { NotificationTemplate } from '../notifications/domain/notification-template.entity';

// ── Helpers ───────────────────────────────────────────────────────────────────

type AnyRepo = Repository<any>;

/**
 * Resync all table sequences to MAX(id)+1.
 * Prevents PK conflicts when sequences are out of sync with existing data
 * (happens after TRUNCATE RESTART IDENTITY or table recreation).
 */
async function resetSequences(qr: any): Promise<void> {
  const tables = [
    'roles', 'permissions', 'role_permissions', 'user_roles',
    'users', 'user_profiles',
    'gyms', 'gym_location', 'gym_schedules', 'gym_infrastructure',
    'subscription_plans', 'user_subscriptions', 'subscription_payments',
    'exercise_catalog',
    'gym_activity', 'gym_activity_schedule', 'gym_activity_attendance',
    'reservations', 'waitlist_entries', 'check_ins',
    'routines', 'routine_exercises',
    'user_training', 'user_training_goals', 'user_training_preferences',
    'user_training_restrictions', 'emergency_contacts',
    'workout_sessions', 'workout_sets', 'physical_metrics_history',
    'notification_templates', 'notifications', 'user_notification_preferences',
    'system_settings',
  ];
  for (const t of tables) {
    await qr.query(
      `SELECT setval(pg_get_serial_sequence('"${t}"', 'id'), COALESCE((SELECT MAX(id) FROM "${t}"), 0) + 1, false)`,
    );
  }
}

/** Busca por `where`; crea+guarda solo si no existe. Devuelve siempre el registro. */
async function findOrCreate(
  repo: AnyRepo,
  where: any,
  data: any,
): Promise<any> {
  const found = await repo.findOneBy(where);
  if (found) return found;
  return repo.save(repo.create(data));
}

/** Devuelve true si la tabla ya tiene algún registro. */
async function hasData(repo: AnyRepo): Promise<boolean> {
  return (await repo.count()) > 0;
}

/** Crea o actualiza por nombre. Siempre marca isActive=true para reactivar si estaba desactivado. */
async function upsertExercise(repo: AnyRepo, data: any): Promise<any> {
  const found = await repo.findOneBy({ name: data.name });
  if (found) {
    Object.assign(found, { ...data, isActive: true });
    return repo.save(found);
  }
  return repo.save(repo.create({ ...data, isActive: true }));
}

// ── Seed principal ────────────────────────────────────────────────────────────

async function runSeed() {
  console.log('🌱 Iniciando Seed Idempotente...');

  const dataSource = await AppDataSource.initialize();
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // Resync sequences before any INSERT to prevent PK conflicts
    await resetSequences(queryRunner);

    // ── 1. ROLES ──────────────────────────────────────────────────────────────
    const roleRepo = queryRunner.manager.getRepository(Role);
    const rolesData = [
      {
        name: 'SUPER_ADMIN',
        description: 'Control total del sistema',
        hierarchyLevel: 10,
        isSystemRole: true,
      },
      {
        name: 'ADMIN_SEDE',
        description: 'Gestión de sede específica',
        hierarchyLevel: 5,
        isSystemRole: true,
      },
      {
        name: 'ENTRENADOR',
        description: 'Asignación de rutinas',
        hierarchyLevel: 3,
        isSystemRole: true,
      },
      {
        name: 'RECEPCION',
        description: 'Validación de ingresos',
        hierarchyLevel: 2,
        isSystemRole: true,
      },
      {
        name: 'CLIENTE',
        description: 'Acceso a app móvil',
        hierarchyLevel: 1,
        isSystemRole: true,
      },
    ];
    const roles = await Promise.all(
      rolesData.map((r) => findOrCreate(roleRepo, { name: r.name } as any, r)),
    );

    // ── 2. PERMISSIONS ────────────────────────────────────────────────────────
    const permRepo = queryRunner.manager.getRepository(Permission);
    await Promise.all([
      findOrCreate(permRepo, { code: 'users.read' } as any, {
        code: 'users.read',
        name: 'Ver usuarios',
        resource: 'users',
        action: 'leer',
      }),
      findOrCreate(permRepo, { code: 'gyms.manage' } as any, {
        code: 'gyms.manage',
        name: 'Gestionar sedes',
        resource: 'gyms',
        action: 'escribir',
      }),
      findOrCreate(permRepo, { code: 'reservations.create' } as any, {
        code: 'reservations.create',
        name: 'Crear reservas',
        resource: 'reservations',
        action: 'crear',
      }),
      findOrCreate(permRepo, { code: 'routines.assign' } as any, {
        code: 'routines.assign',
        name: 'Asignar rutinas',
        resource: 'routines',
        action: 'escribir',
      }),
      findOrCreate(permRepo, { code: 'reports.view' } as any, {
        code: 'reports.view',
        name: 'Ver reportes',
        resource: 'reports',
        action: 'leer',
      }),
    ]);

    // ── 3. USERS ──────────────────────────────────────────────────────────────
    const hashedPassword = await bcrypt.hash('123456', 10);
    const userRepo = queryRunner.manager.getRepository(User);
    const usersData = [
      {
        email: 'admin@gymsync.com',
        passwordHash: hashedPassword,
        isActive: true,
      },
      {
        email: 'gerente.santaCruz@gymsync.com',
        passwordHash: hashedPassword,
        isActive: true,
      },
      {
        email: 'entrenador.ana@gymsync.com',
        passwordHash: hashedPassword,
        isActive: true,
      },
      {
        email: 'entrenador.luis@gymsync.com',
        passwordHash: hashedPassword,
        isActive: true,
      },
      {
        email: 'cliente.maria@ejemplo.com',
        passwordHash: hashedPassword,
        isActive: true,
      },
      {
        email: 'cliente.jorge@ejemplo.com',
        passwordHash: hashedPassword,
        isActive: true,
      },
      {
        email: 'cliente.sofia@ejemplo.com',
        passwordHash: hashedPassword,
        isActive: true,
      },
    ];
    const users = await Promise.all(
      usersData.map((u) =>
        findOrCreate(userRepo, { email: u.email } as any, u),
      ),
    );

    // ── 4. GYMS ───────────────────────────────────────────────────────────────
    const gymRepo = queryRunner.manager.getRepository(Gym);
    const gymsData = [
      {
        name: 'Smart Fit Centro',
        description: 'Tecnología y zona de pesas',
        maxCapacity: 250,
        isActive: true,
        isOpen: true,
      },
      {
        name: 'Premier Equipetrol',
        description: 'Zona premium y spa',
        maxCapacity: 120,
        isActive: true,
        isOpen: true,
      },
      {
        name: 'BioFitness Sur',
        description: 'Enfoque rehabilitación',
        maxCapacity: 80,
        isActive: true,
        isOpen: true,
      },
      {
        name: 'CrossBox Norte',
        description: 'Box de CrossFit funcional',
        maxCapacity: 60,
        isActive: true,
        isOpen: true,
      },
      {
        name: 'MegaGym Plan 3000',
        description: 'Espacio familiar amplio',
        maxCapacity: 300,
        isActive: true,
        isOpen: false,
      },
    ];
    const gyms = await Promise.all(
      gymsData.map((g) => findOrCreate(gymRepo, { name: g.name } as any, g)),
    );

    // ── 5. SUBSCRIPTION PLANS ─────────────────────────────────────────────────
    const planRepo = queryRunner.manager.getRepository(SubscriptionPlan);
    const plansData = [
      {
        name: 'Básico',
        description: '1 sede, horario restringido',
        priceMonthly: 120,
        maxGymsAccess: 1,
        features: ['acceso_gimnasio'],
      },
      {
        name: 'Estándar',
        description: '2 sedes, horario completo',
        priceMonthly: 180,
        maxGymsAccess: 2,
        features: ['acceso_gimnasio', 'reservas'],
      },
      {
        name: 'Premium',
        description: 'Todas las sedes + clases',
        priceMonthly: 250,
        maxGymsAccess: 5,
        features: ['acceso_ilimitado', 'clases', 'rutinas'],
      },
      {
        name: 'Corporativo',
        description: 'Planes empresariales',
        priceMonthly: 300,
        maxGymsAccess: 5,
        features: ['facturacion', 'reportes', 'soporte'],
      },
      {
        name: 'Estudiante',
        description: 'Descuento con carnet válido',
        priceMonthly: 90,
        maxGymsAccess: 1,
        features: ['acceso_gimnasio', 'horario_diurno'],
      },
    ];
    const plans = await Promise.all(
      plansData.map((p) => findOrCreate(planRepo, { name: p.name } as any, p)),
    );

    // ── 6. EXERCISE CATALOG ───────────────────────────────────────────────────
    const exerciseRepo = queryRunner.manager.getRepository(ExerciseCatalog);

    // Desactivar ejercicios con nombres legacy que son reemplazados por el nuevo catálogo
    const legacyNames = [
      'Press Banca Plano', 'Sentadilla Libre', 'Dominadas Pecho',
      'Press Militar', 'Curl Bíceps Alterno', 'Plancha Abdominal',
    ];
    await exerciseRepo.update({ name: In(legacyNames) }, { isActive: false });

    const exercisesData = [
      // ── FUERZA — Pectorales ──────────────────────────────────────────────
      { name: 'Press de Banca Plano',              muscleGroup: 'Pectorales',     category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Barra olímpica, banco plano' },
      { name: 'Press de Banca Inclinado',           muscleGroup: 'Pectorales',     category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Barra olímpica, banco inclinado' },
      { name: 'Aperturas con Mancuernas',           muscleGroup: 'Pectorales',     category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'BASICO',     equipmentRequired: 'Mancuernas, banco plano' },
      { name: 'Fondos en Paralelas',                muscleGroup: 'Pectorales',     category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Paralelas' },
      { name: 'Crossover en Polea',                 muscleGroup: 'Pectorales',     category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'BASICO',     equipmentRequired: 'Polea alta' },
      { name: 'Push-ups (Flexiones)',               muscleGroup: 'Pectorales',     category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'BASICO',     equipmentRequired: null },
      // ── FUERZA — Dorsales ────────────────────────────────────────────────
      { name: 'Jalón al Pecho',                     muscleGroup: 'Dorsales',       category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'BASICO',     equipmentRequired: 'Polea alta' },
      { name: 'Remo con Barra',                     muscleGroup: 'Dorsales',       category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Barra' },
      { name: 'Remo con Mancuerna',                 muscleGroup: 'Dorsales',       category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'BASICO',     equipmentRequired: 'Mancuerna, banco' },
      { name: 'Dominadas (Pull-ups)',               muscleGroup: 'Dorsales',       category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'AVANZADO',   equipmentRequired: 'Barra dominadas' },
      { name: 'Remo en Polea Baja',                 muscleGroup: 'Dorsales',       category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'BASICO',     equipmentRequired: 'Polea baja' },
      { name: 'Pullover con Mancuerna',             muscleGroup: 'Dorsales',       category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Mancuerna, banco' },
      // ── FUERZA — Hombros ─────────────────────────────────────────────────
      { name: 'Press Militar con Barra',            muscleGroup: 'Hombros',        category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Barra' },
      { name: 'Press de Hombros con Mancuernas',   muscleGroup: 'Hombros',        category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'BASICO',     equipmentRequired: 'Mancuernas' },
      { name: 'Elevaciones Laterales',              muscleGroup: 'Hombros',        category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'BASICO',     equipmentRequired: 'Mancuernas' },
      { name: 'Elevaciones Frontales',              muscleGroup: 'Hombros',        category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'BASICO',     equipmentRequired: 'Mancuernas' },
      { name: 'Vuelos Posteriores',                 muscleGroup: 'Hombros',        category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'BASICO',     equipmentRequired: 'Mancuernas' },
      // ── FUERZA — Bíceps ──────────────────────────────────────────────────
      { name: 'Curl de Bíceps con Barra',          muscleGroup: 'Bíceps',         category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'BASICO',     equipmentRequired: 'Barra' },
      { name: 'Curl con Mancuernas Alterno',        muscleGroup: 'Bíceps',         category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'BASICO',     equipmentRequired: 'Mancuernas' },
      { name: 'Curl en Polea Baja',                 muscleGroup: 'Bíceps',         category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'BASICO',     equipmentRequired: 'Polea baja' },
      { name: 'Curl Martillo',                      muscleGroup: 'Bíceps',         category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'BASICO',     equipmentRequired: 'Mancuernas' },
      { name: 'Curl Concentrado',                   muscleGroup: 'Bíceps',         category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'BASICO',     equipmentRequired: 'Mancuerna' },
      // ── FUERZA — Tríceps ─────────────────────────────────────────────────
      { name: 'Press Francés',                      muscleGroup: 'Tríceps',        category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Barra EZ, banco' },
      { name: 'Extensiones en Polea Alta',          muscleGroup: 'Tríceps',        category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'BASICO',     equipmentRequired: 'Polea alta' },
      { name: 'Extensiones con Mancuerna sobre la Cabeza', muscleGroup: 'Tríceps', category: 'FUERZA',   exerciseType: 'STRENGTH',  difficultyLevel: 'BASICO',     equipmentRequired: 'Mancuerna' },
      { name: 'Patada de Tríceps',                  muscleGroup: 'Tríceps',        category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'BASICO',     equipmentRequired: 'Mancuerna' },
      { name: 'Fondos para Tríceps',                muscleGroup: 'Tríceps',        category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'BASICO',     equipmentRequired: 'Banco o silla' },
      // ── FUERZA — Cuádriceps ──────────────────────────────────────────────
      { name: 'Sentadilla con Barra (Back Squat)',  muscleGroup: 'Cuádriceps',     category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Barra, rack' },
      { name: 'Sentadilla Frontal (Front Squat)',   muscleGroup: 'Cuádriceps',     category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'AVANZADO',   equipmentRequired: 'Barra, rack' },
      { name: 'Prensa de Piernas',                  muscleGroup: 'Cuádriceps',     category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'BASICO',     equipmentRequired: 'Máquina prensa' },
      { name: 'Zancadas (Lunges)',                  muscleGroup: 'Cuádriceps',     category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'BASICO',     equipmentRequired: 'Mancuernas o cuerpo' },
      { name: 'Sentadilla Búlgara',                 muscleGroup: 'Cuádriceps',     category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Mancuernas, banco' },
      { name: 'Extensión de Cuádriceps',            muscleGroup: 'Cuádriceps',     category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'BASICO',     equipmentRequired: 'Máquina de extensión' },
      // ── FUERZA — Isquiotibiales ──────────────────────────────────────────
      { name: 'Peso Muerto (Deadlift)',             muscleGroup: 'Isquiotibiales', category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'AVANZADO',   equipmentRequired: 'Barra' },
      { name: 'Peso Muerto Rumano',                 muscleGroup: 'Isquiotibiales', category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Barra o mancuernas' },
      { name: 'Curl de Piernas (Máquina)',          muscleGroup: 'Isquiotibiales', category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'BASICO',     equipmentRequired: 'Máquina curl' },
      { name: 'Buenos Días (Good Mornings)',        muscleGroup: 'Isquiotibiales', category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Barra' },
      // ── FUERZA — Gemelos ─────────────────────────────────────────────────
      { name: 'Elevación de Gemelos de Pie',        muscleGroup: 'Gemelos',        category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'BASICO',     equipmentRequired: 'Máquina o libre' },
      { name: 'Elevación de Gemelos Sentado',       muscleGroup: 'Gemelos',        category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'BASICO',     equipmentRequired: 'Máquina de gemelos' },
      // ── FUERZA — Core ────────────────────────────────────────────────────
      { name: 'Crunch Abdominal',                   muscleGroup: 'Core',           category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'BASICO',     equipmentRequired: null },
      { name: 'Plancha (Plank)',                    muscleGroup: 'Core',           category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'BASICO',     equipmentRequired: null },
      { name: 'Elevación de Piernas Colgado',       muscleGroup: 'Core',           category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Barra dominadas' },
      { name: 'Russian Twist',                      muscleGroup: 'Core',           category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'BASICO',     equipmentRequired: 'Disco o pelota' },
      { name: 'Ab Wheel (Rueda Abdominal)',         muscleGroup: 'Core',           category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Rueda abdominal' },
      { name: 'Crunches en Polea',                  muscleGroup: 'Core',           category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'BASICO',     equipmentRequired: 'Polea alta' },
      // ── CARDIO — Steady-State ────────────────────────────────────────────
      { name: 'Correr en Cinta',                    muscleGroup: 'Cardio',         category: 'CARDIO',    exerciseType: 'CARDIO',    difficultyLevel: 'BASICO',     equipmentRequired: 'Cinta de correr' },
      { name: 'Bicicleta Estática',                 muscleGroup: 'Cardio',         category: 'CARDIO',    exerciseType: 'CARDIO',    difficultyLevel: 'BASICO',     equipmentRequired: 'Bicicleta estática' },
      { name: 'Elíptica',                           muscleGroup: 'Cardio',         category: 'CARDIO',    exerciseType: 'CARDIO',    difficultyLevel: 'BASICO',     equipmentRequired: 'Máquina elíptica' },
      { name: 'Remo en Máquina (Rowing)',           muscleGroup: 'Cardio',         category: 'CARDIO',    exerciseType: 'CARDIO',    difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Máquina de remo' },
      { name: 'Caminata Rápida',                    muscleGroup: 'Cardio',         category: 'CARDIO',    exerciseType: 'CARDIO',    difficultyLevel: 'BASICO',     equipmentRequired: 'Cinta o exterior' },
      // ── CARDIO — Intervalos ──────────────────────────────────────────────
      { name: 'Caminata con Inclinación Progresiva', muscleGroup: 'Cardio',        category: 'CARDIO',    exerciseType: 'CARDIO',    difficultyLevel: 'BASICO',     equipmentRequired: 'Cinta de correr' },
      { name: 'Sprint en Cinta',                    muscleGroup: 'Cardio',         category: 'CARDIO',    exerciseType: 'CARDIO',    difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Cinta de correr' },
      { name: 'Cycling Intervals',                  muscleGroup: 'Cardio',         category: 'CARDIO',    exerciseType: 'CARDIO',    difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Bicicleta estática' },
      // ── FUNCIONAL — CrossFit ─────────────────────────────────────────────
      { name: 'Burpees',                            muscleGroup: 'Funcional',      category: 'FUNCIONAL', exerciseType: 'FUNCTIONAL', difficultyLevel: 'INTERMEDIO', equipmentRequired: null },
      { name: 'Box Jump (Salto al Cajón)',           muscleGroup: 'Funcional',      category: 'FUNCIONAL', exerciseType: 'FUNCTIONAL', difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Cajón pliométrico' },
      { name: 'Kettlebell Swing',                   muscleGroup: 'Funcional',      category: 'FUNCIONAL', exerciseType: 'FUNCTIONAL', difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Kettlebell' },
      { name: 'Wall Ball',                          muscleGroup: 'Funcional',      category: 'FUNCIONAL', exerciseType: 'FUNCTIONAL', difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Balón medicinal, pared' },
      { name: 'Slam Ball',                          muscleGroup: 'Funcional',      category: 'FUNCIONAL', exerciseType: 'FUNCTIONAL', difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Slam ball' },
      { name: 'Tire Flip (Volteo de Llanta)',       muscleGroup: 'Funcional',      category: 'FUNCIONAL', exerciseType: 'FUNCTIONAL', difficultyLevel: 'AVANZADO',   equipmentRequired: 'Llanta' },
      // ── FUNCIONAL — HIIT ─────────────────────────────────────────────────
      { name: 'Tabata Squat',                       muscleGroup: 'HIIT',           category: 'FUNCIONAL', exerciseType: 'HIIT',       difficultyLevel: 'INTERMEDIO', equipmentRequired: null },
      { name: 'Tabata Push-ups',                    muscleGroup: 'HIIT',           category: 'FUNCIONAL', exerciseType: 'HIIT',       difficultyLevel: 'INTERMEDIO', equipmentRequired: null },
      { name: 'Mountain Climbers',                  muscleGroup: 'HIIT',           category: 'FUNCIONAL', exerciseType: 'HIIT',       difficultyLevel: 'BASICO',     equipmentRequired: null },
      { name: 'Jump Rope (Saltar la Cuerda)',       muscleGroup: 'HIIT',           category: 'FUNCIONAL', exerciseType: 'HIIT',       difficultyLevel: 'BASICO',     equipmentRequired: 'Cuerda de saltar' },
      // ── FUNCIONAL — Movilidad ─────────────────────────────────────────────
      { name: 'Estiramiento de Cuádriceps',         muscleGroup: 'Movilidad',      category: 'FUNCIONAL', exerciseType: 'MOBILITY',   difficultyLevel: 'BASICO',     equipmentRequired: null },
      { name: 'Hip Flexor Stretch',                 muscleGroup: 'Movilidad',      category: 'FUNCIONAL', exerciseType: 'MOBILITY',   difficultyLevel: 'BASICO',     equipmentRequired: null },
      { name: "World's Greatest Stretch",           muscleGroup: 'Movilidad',      category: 'FUNCIONAL', exerciseType: 'MOBILITY',   difficultyLevel: 'INTERMEDIO', equipmentRequired: null },
      { name: 'Cat-Cow Stretch',                    muscleGroup: 'Movilidad',      category: 'FUNCIONAL', exerciseType: 'MOBILITY',   difficultyLevel: 'BASICO',     equipmentRequired: null },
      { name: 'Pigeon Pose',                        muscleGroup: 'Movilidad',      category: 'FUNCIONAL', exerciseType: 'MOBILITY',   difficultyLevel: 'BASICO',     equipmentRequired: null },
      { name: 'Shoulder Stretch',                   muscleGroup: 'Movilidad',      category: 'FUNCIONAL', exerciseType: 'MOBILITY',   difficultyLevel: 'BASICO',     equipmentRequired: null },
    ];

    const exercises = await Promise.all(
      exercisesData.map((e) => upsertExercise(exerciseRepo, e)),
    );

    // ── 7. GYM LOCATION (único por gymId) ────────────────────────────────────
    const locRepo = queryRunner.manager.getRepository(GymLocation);
    await Promise.all([
      findOrCreate(locRepo, { gymId: gyms[0].id } as any, {
        gym: gyms[0],
        address: 'Av. Banzer 4to Anillo',
        city: 'Santa Cruz',
        latitude: -17.7833,
        longitude: -63.1822,
      }),
      findOrCreate(locRepo, { gymId: gyms[1].id } as any, {
        gym: gyms[1],
        address: 'Calle Beni Equipetrol',
        city: 'Santa Cruz',
        latitude: -17.76,
        longitude: -63.17,
      }),
      findOrCreate(locRepo, { gymId: gyms[2].id } as any, {
        gym: gyms[2],
        address: 'Av. Roca y Coronado',
        city: 'Santa Cruz',
        latitude: -17.8011,
        longitude: -63.195,
      }),
      findOrCreate(locRepo, { gymId: gyms[3].id } as any, {
        gym: gyms[3],
        address: 'Av. San Martín Km 4',
        city: 'Santa Cruz',
        latitude: -17.755,
        longitude: -63.165,
      }),
      findOrCreate(locRepo, { gymId: gyms[4].id } as any, {
        gym: gyms[4],
        address: '2do Anillo Plan 3000',
        city: 'Santa Cruz',
        latitude: -17.82,
        longitude: -63.14,
      }),
    ]);

    // ── 8. USER PROFILES (único por userId) ───────────────────────────────────
    const profileRepo = queryRunner.manager.getRepository(UserProfile);
    await Promise.all([
      findOrCreate(profileRepo, { userId: users[0].id } as any, {
        user: users[0],
        firstName: 'Admin',
        lastName: 'Global',
        phone: '+59170000001',
        gender: 'OTHER',
      }),
      findOrCreate(profileRepo, { userId: users[1].id } as any, {
        user: users[1],
        firstName: 'Carlos',
        lastName: 'Gerente',
        phone: '+59170000002',
        gender: 'MALE',
      }),
      findOrCreate(profileRepo, { userId: users[2].id } as any, {
        user: users[2],
        firstName: 'Ana',
        lastName: 'Entrenadora',
        phone: '+59170000003',
        gender: 'FEMALE',
      }),
      findOrCreate(profileRepo, { userId: users[3].id } as any, {
        user: users[3],
        firstName: 'Luis',
        lastName: 'Entrenador',
        phone: '+59170000004',
        gender: 'MALE',
      }),
      findOrCreate(profileRepo, { userId: users[4].id } as any, {
        user: users[4],
        firstName: 'María',
        lastName: 'Cliente',
        phone: '+59170000005',
        gender: 'FEMALE',
      }),
      findOrCreate(profileRepo, { userId: users[5].id } as any, {
        user: users[5],
        firstName: 'Jorge',
        lastName: 'Cliente',
        phone: '+59170000006',
        gender: 'MALE',
      }),
      findOrCreate(profileRepo, { userId: users[6].id } as any, {
        user: users[6],
        firstName: 'Sofía',
        lastName: 'Cliente',
        phone: '+59170000007',
        gender: 'FEMALE',
      }),
    ]);

    // ── 9. USER ROLES (único por userId + roleId) ─────────────────────────────
    const userRoleRepo = queryRunner.manager.getRepository(UserRole);
    const userRolesData = [
      {
        user: users[0],
        role: roles[0],
        gym: undefined,
        assignedByUser: users[0],
      },
      {
        user: users[1],
        role: roles[1],
        gym: gyms[0],
        assignedByUser: users[0],
      },
      {
        user: users[2],
        role: roles[2],
        gym: gyms[0],
        assignedByUser: users[0],
      },
      {
        user: users[3],
        role: roles[2],
        gym: gyms[1],
        assignedByUser: users[0],
      },
      {
        user: users[4],
        role: roles[4],
        gym: undefined,
        assignedByUser: users[0],
      },
      {
        user: users[5],
        role: roles[4],
        gym: undefined,
        assignedByUser: users[0],
      },
      {
        user: users[6],
        role: roles[4],
        gym: undefined,
        assignedByUser: users[0],
      },
    ];
    for (const ur of userRolesData) {
      const exists = await userRoleRepo.findOneBy({
        userId: ur.user.id,
        roleId: ur.role.id,
      });
      if (!exists) await userRoleRepo.save(userRoleRepo.create(ur as any));
    }

    // ── 10. GYM SCHEDULES (único por gymId + dayOfWeek + opensAt) ─────────────
    const scheduleRepo = queryRunner.manager.getRepository(GymSchedule);
    const gymSchedulesData = [
      { gym: gyms[0], dayOfWeek: 'LUN', opensAt: '06:00', closesAt: '22:00' },
      { gym: gyms[0], dayOfWeek: 'MAR', opensAt: '06:00', closesAt: '22:00' },
      { gym: gyms[1], dayOfWeek: 'LUN', opensAt: '07:00', closesAt: '23:00' },
      { gym: gyms[2], dayOfWeek: 'LUN', opensAt: '08:00', closesAt: '20:00' },
      { gym: gyms[3], dayOfWeek: 'MIE', opensAt: '06:30', closesAt: '21:30' },
      { gym: gyms[4], dayOfWeek: 'JUE', opensAt: '07:00', closesAt: '21:00' },
      { gym: gyms[0], dayOfWeek: 'VIE', opensAt: '06:00', closesAt: '22:00' },
    ];
    for (const s of gymSchedulesData) {
      const exists = await scheduleRepo.findOneBy({
        gymId: s.gym.id,
        dayOfWeek: s.dayOfWeek,
        opensAt: s.opensAt,
      });
      if (!exists) await scheduleRepo.save(scheduleRepo.create(s as any));
    }

    // ── 11. GYM ACTIVITIES (único por gymId + name) ───────────────────────────
    const actRepo = queryRunner.manager.getRepository(GymActivity);
    const activitiesData = [
      {
        gym: gyms[0],
        name: 'Spinning Pro',
        description: 'Ciclismo indoor alta intensidad',
        defaultDurationMin: 45,
        isActive: true,
      },
      {
        gym: gyms[0],
        name: 'Yoga Flow',
        description: 'Flexibilidad y respiración',
        defaultDurationMin: 60,
        isActive: true,
      },
      {
        gym: gyms[1],
        name: 'Pilates Mat',
        description: 'Core y postura',
        defaultDurationMin: 50,
        isActive: true,
      },
      {
        gym: gyms[3],
        name: 'WOD CrossFit',
        description: 'Entrenamiento funcional diario',
        defaultDurationMin: 60,
        isActive: true,
      },
      {
        gym: gyms[2],
        name: 'Tai Chi Suave',
        description: 'Movilidad articular',
        defaultDurationMin: 45,
        isActive: true,
      },
      {
        gym: gyms[0],
        name: 'HIIT Quema',
        description: 'Intervalos alta intensidad',
        defaultDurationMin: 30,
        isActive: true,
      },
      {
        gym: gyms[1],
        name: 'Boxeo Cardio',
        description: 'Técnica y resistencia',
        defaultDurationMin: 55,
        isActive: true,
      },
    ];
    const activities: GymActivity[] = [];
    for (const a of activitiesData) {
      activities.push(
        await findOrCreate(
          actRepo,
          { gymId: a.gym.id, name: a.name } as any,
          a,
        ),
      );
    }

    // ── 12. ACTIVITY SCHEDULES (único por gymActivityId + dayOfWeek + startTime) ─
    const actSchedRepo = queryRunner.manager.getRepository(GymActivitySchedule);
    const actSchedulesData = [
      {
        gymActivity: activities[0],
        instructor: users[2],
        dayOfWeek: 'LUN',
        startTime: '18:00',
        endTime: '18:45',
        maxAttendees: 20,
        isRecurring: true,
      },
      {
        gymActivity: activities[1],
        instructor: users[2],
        dayOfWeek: 'MAR',
        startTime: '19:00',
        endTime: '20:00',
        maxAttendees: 15,
        isRecurring: true,
      },
      {
        gymActivity: activities[2],
        instructor: users[3],
        dayOfWeek: 'LUN',
        startTime: '10:00',
        endTime: '10:50',
        maxAttendees: 12,
        isRecurring: true,
      },
      {
        gymActivity: activities[3],
        instructor: users[2],
        dayOfWeek: 'MIE',
        startTime: '17:30',
        endTime: '18:30',
        maxAttendees: 10,
        isRecurring: true,
      },
      {
        gymActivity: activities[4],
        instructor: undefined,
        dayOfWeek: 'JUE',
        startTime: '08:00',
        endTime: '08:45',
        maxAttendees: 25,
        isRecurring: true,
      },
      {
        gymActivity: activities[5],
        instructor: users[3],
        dayOfWeek: 'VIE',
        startTime: '18:30',
        endTime: '19:00',
        maxAttendees: 30,
        isRecurring: true,
      },
      {
        gymActivity: activities[6],
        instructor: users[2],
        dayOfWeek: 'SAB',
        startTime: '09:00',
        endTime: '09:55',
        maxAttendees: 18,
        isRecurring: true,
      },
    ];
    const schedules: GymActivitySchedule[] = [];
    for (const s of actSchedulesData) {
      const found = await actSchedRepo.findOneBy({
        gymActivityId: s.gymActivity.id,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
      });
      schedules.push(
        found ??
          ((await actSchedRepo.save(
            actSchedRepo.create(s as any),
          )) as unknown as GymActivitySchedule),
      );
    }

    // ── 13. RESERVATIONS (saltar si ya existen) ───────────────────────────────
    const resRepo = queryRunner.manager.getRepository(Reservation);
    if (!(await hasData(resRepo))) {
      await resRepo.save([
        {
          user: users[4],
          gymActivitySchedule: schedules[0],
          reservationDate: new Date('2026-04-28'),
          status: 'CONFIRMADA',
          createdBy: users[4].id,
          createdAt: new Date(),
        },
        {
          user: users[5],
          gymActivitySchedule: schedules[2],
          reservationDate: new Date('2026-04-29'),
          status: 'CONFIRMADA',
          createdBy: users[5].id,
          createdAt: new Date(),
        },
        {
          user: users[6],
          gymActivitySchedule: schedules[1],
          reservationDate: new Date('2026-04-30'),
          status: 'CONFIRMADA',
          createdBy: users[6].id,
          createdAt: new Date(),
        },
        {
          user: users[4],
          gymActivitySchedule: schedules[3],
          reservationDate: new Date('2026-05-01'),
          status: 'CANCELADA',
          createdBy: users[4].id,
          createdAt: new Date(),
          cancelledAt: new Date(),
        },
        {
          user: users[5],
          gymActivitySchedule: schedules[4],
          reservationDate: new Date('2026-05-02'),
          status: 'CONFIRMADA',
          createdBy: users[5].id,
          createdAt: new Date(),
        },
        {
          user: users[6],
          gymActivitySchedule: schedules[5],
          reservationDate: new Date('2026-05-03'),
          status: 'CONFIRMADA',
          createdBy: users[6].id,
          createdAt: new Date(),
        },
        {
          user: users[4],
          gymActivitySchedule: schedules[6],
          reservationDate: new Date('2026-05-04'),
          status: 'CONFIRMADA',
          createdBy: users[4].id,
          createdAt: new Date(),
        },
      ]);
    }

    // ── 14. CHECK-INS (saltar si ya existen) ──────────────────────────────────
    const checkRepo = queryRunner.manager.getRepository(CheckIn);
    if (!(await hasData(checkRepo))) {
      await checkRepo.save([
        {
          user: users[4],
          gym: gyms[0],
          checkInTime: new Date(Date.now() - 86400000),
          method: 'QR',
          status: 'COMPLETED',
        },
        {
          user: users[5],
          gym: gyms[1],
          checkInTime: new Date(Date.now() - 172800000),
          method: 'MANUAL',
          status: 'COMPLETED',
        },
        {
          user: users[6],
          gym: gyms[2],
          checkInTime: new Date(Date.now() - 259200000),
          method: 'QR',
          status: 'DENIED',
        },
        {
          user: users[4],
          gym: gyms[0],
          checkInTime: new Date(Date.now() - 345600000),
          method: 'QR',
          status: 'COMPLETED',
        },
        {
          user: users[5],
          gym: gyms[3],
          checkInTime: new Date(Date.now() - 432000000),
          method: 'BIOMETRIC',
          status: 'COMPLETED',
        },
        {
          user: users[6],
          gym: gyms[1],
          checkInTime: new Date(Date.now() - 518400000),
          method: 'QR',
          status: 'COMPLETED',
        },
        {
          user: users[4],
          gym: gyms[0],
          checkInTime: new Date(Date.now() - 604800000),
          method: 'MANUAL',
          status: 'COMPLETED',
        },
      ]);
    }

    // ── 15. USER TRAINING (único por userId) ──────────────────────────────────
    const trainingRepo = queryRunner.manager.getRepository(UserTraining);
    const trainingsUsers = [users[4], users[5], users[6], users[2], users[3]];
    const trainings: UserTraining[] = await Promise.all(
      trainingsUsers.map((u) =>
        findOrCreate(trainingRepo, { userId: u.id } as any, { user: u }),
      ),
    );

    // ── 16. TRAINING GOALS (único por userTrainingId) ─────────────────────────
    const goalRepo = queryRunner.manager.getRepository(UserTrainingGoals);
    const goalsData = [
      {
        userTraining: trainings[0],
        primaryGoal: 'BAJAR_PESO',
        experienceLevel: 'PRINCIPIANTE',
      },
      {
        userTraining: trainings[1],
        primaryGoal: 'GANAR_MUSCULO',
        experienceLevel: 'INTERMEDIO',
      },
      {
        userTraining: trainings[2],
        primaryGoal: 'RENDIMIENTO',
        experienceLevel: 'AVANZADO',
      },
      {
        userTraining: trainings[3],
        primaryGoal: 'MANTENER',
        experienceLevel: 'AVANZADO',
      },
      {
        userTraining: trainings[4],
        primaryGoal: 'SALUD',
        experienceLevel: 'INTERMEDIO',
      },
    ];
    for (const g of goalsData) {
      await findOrCreate(
        goalRepo,
        { userTrainingId: g.userTraining.id } as any,
        g,
      );
    }

    // ── 17. USER SUBSCRIPTIONS (saltar si ya existen) ─────────────────────────
    const subRepo = queryRunner.manager.getRepository(UserSubscription);
    if (!(await hasData(subRepo))) {
      await subRepo.save([
        {
          user: users[4],
          plan: plans[2],
          homeGym: gyms[0],
          status: 'ACTIVO',
          startDate: new Date('2026-01-15'),
          endDate: new Date('2027-01-15'),
          autoRenew: true,
        },
        {
          user: users[5],
          plan: plans[0],
          homeGym: gyms[1],
          status: 'ACTIVO',
          startDate: new Date('2026-03-01'),
          endDate: new Date('2026-09-01'),
          autoRenew: false,
        },
        {
          user: users[6],
          plan: plans[4],
          homeGym: gyms[2],
          status: 'ACTIVO',
          startDate: new Date('2026-02-10'),
          endDate: new Date('2026-08-10'),
          autoRenew: true,
        },
        {
          user: users[4],
          plan: plans[1],
          homeGym: gyms[0],
          status: 'PAUSADO',
          startDate: new Date('2025-06-01'),
          endDate: new Date('2025-12-01'),
          autoRenew: false,
        },
        {
          user: users[5],
          plan: plans[3],
          homeGym: gyms[3],
          status: 'VENCIDO',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-12-31'),
          autoRenew: false,
        },
      ]);
    }

    // ── 18. ROUTINES (único por name) ─────────────────────────────────────────
    const routineRepo = queryRunner.manager.getRepository(Routine);
    const routinesData = [
      {
        name: 'Full Body Principiante',
        description: 'Adaptación general 4 semanas',
        trainer: users[2],
        assignedUser: users[4],
        difficultyLevel: 'BASICO',
        durationWeeks: 4,
        isActive: true,
      },
      {
        name: 'Hipertrofia Pecho/Espalda',
        description: 'Volumen tren superior',
        trainer: users[3],
        assignedUser: users[5],
        difficultyLevel: 'INTERMEDIO',
        durationWeeks: 6,
        isActive: true,
      },
      {
        name: 'Potencia Piernas',
        description: 'Fuerza explosiva',
        trainer: users[2],
        assignedUser: users[6],
        difficultyLevel: 'AVANZADO',
        durationWeeks: 8,
        isActive: true,
      },
      {
        name: 'Mantenimiento Cardio',
        description: 'Rutina ligera recuperación',
        trainer: users[3],
        assignedUser: users[2],
        difficultyLevel: 'BASICO',
        durationWeeks: 2,
        isActive: true,
      },
      {
        name: 'Core & Movilidad',
        description: 'Prevención lesiones',
        trainer: users[2],
        assignedUser: undefined,
        difficultyLevel: 'INTERMEDIO',
        durationWeeks: 4,
        isActive: true,
      },
    ];
    const routines: Routine[] = await Promise.all(
      routinesData.map((r) =>
        findOrCreate(routineRepo, { name: r.name } as any, r),
      ),
    );

    // ── 19. ROUTINE EXERCISES + WORKOUT SESSIONS + SETS (saltar si ya existen) ─
    const routineExRepo = queryRunner.manager.getRepository(RoutineExercise);
    if (!(await hasData(routineExRepo))) {
      await routineExRepo.save([
        // routines[0] "Full Body Principiante" — ejercicios base multi-musculares
        { routine: routines[0], exercise: exercises[0],  orderPosition: 1, setsRecommended: 3, repsRecommended: '12-15', restSecondsBetweenSets: 60  }, // Press de Banca Plano
        { routine: routines[0], exercise: exercises[6],  orderPosition: 2, setsRecommended: 3, repsRecommended: '12',    restSecondsBetweenSets: 60  }, // Jalón al Pecho
        { routine: routines[0], exercise: exercises[27], orderPosition: 3, setsRecommended: 3, repsRecommended: '15',    restSecondsBetweenSets: 60  }, // Sentadilla con Barra
        // routines[1] "Hipertrofia Pecho/Espalda" — volumen tren superior
        { routine: routines[1], exercise: exercises[0],  orderPosition: 1, setsRecommended: 4, repsRecommended: '8-10',  restSecondsBetweenSets: 120 }, // Press de Banca Plano
        { routine: routines[1], exercise: exercises[1],  orderPosition: 2, setsRecommended: 4, repsRecommended: '8-10',  restSecondsBetweenSets: 120 }, // Press de Banca Inclinado
        { routine: routines[1], exercise: exercises[6],  orderPosition: 3, setsRecommended: 4, repsRecommended: '8-10',  restSecondsBetweenSets: 120 }, // Jalón al Pecho
        { routine: routines[1], exercise: exercises[7],  orderPosition: 4, setsRecommended: 4, repsRecommended: '8-10',  restSecondsBetweenSets: 120 }, // Remo con Barra
        // routines[2] "Potencia Piernas" — fuerza explosiva
        { routine: routines[2], exercise: exercises[27], orderPosition: 1, setsRecommended: 5, repsRecommended: '5',     restSecondsBetweenSets: 180 }, // Sentadilla con Barra
        { routine: routines[2], exercise: exercises[33], orderPosition: 2, setsRecommended: 4, repsRecommended: '5',     restSecondsBetweenSets: 180 }, // Peso Muerto
        { routine: routines[2], exercise: exercises[29], orderPosition: 3, setsRecommended: 3, repsRecommended: '12',    restSecondsBetweenSets: 120 }, // Prensa de Piernas
        // routines[3] "Mantenimiento Cardio" — CARDIO con polimorfismo params JSONB
        { routine: routines[3], exercise: exercises[45], orderPosition: 1, setsRecommended: 1, repsRecommended: null, params: { durationMin: 30, distanceKm: 5,  speedKmh: 10 } }, // Correr en Cinta
        { routine: routines[3], exercise: exercises[46], orderPosition: 2, setsRecommended: 1, repsRecommended: null, params: { durationMin: 20, distanceKm: 8,  speedKmh: 24 } }, // Bicicleta Estática
        // routines[4] "Core & Movilidad" — Core STRENGTH + MOBILITY con polimorfismo
        { routine: routines[4], exercise: exercises[39], orderPosition: 1, setsRecommended: 3, repsRecommended: '20',   restSecondsBetweenSets: 30  }, // Crunch Abdominal
        { routine: routines[4], exercise: exercises[40], orderPosition: 2, setsRecommended: 3, repsRecommended: '45s',  restSecondsBetweenSets: 30  }, // Plancha
        { routine: routines[4], exercise: exercises[64], orderPosition: 3, setsRecommended: 2, repsRecommended: null,   params: { durationSeconds: 30, sets: 2 } }, // Hip Flexor Stretch
      ]);
    }

    const sessionRepo = queryRunner.manager.getRepository(WorkoutSession);
    if (!(await hasData(sessionRepo))) {
      const sessions = await sessionRepo.save([
        {
          routine: routines[1], user: users[5], gym: gyms[1],
          startedAt: new Date(Date.now() - 86400000),
          finishedAt: new Date(Date.now() - 86400000 + 3600000),
          status: 'COMPLETED', durationSeconds: 3600,
        },
        {
          routine: routines[2], user: users[6], gym: gyms[3],
          startedAt: new Date(Date.now() - 172800000),
          finishedAt: new Date(Date.now() - 172800000 + 4500000),
          status: 'COMPLETED', durationSeconds: 4500,
        },
        {
          routine: routines[0], user: users[4], gym: gyms[0],
          startedAt: new Date(), finishedAt: undefined,
          status: 'IN_PROGRESS', durationSeconds: undefined,
        },
        {
          routine: routines[1], user: users[5], gym: gyms[1],
          startedAt: new Date(Date.now() - 259200000),
          finishedAt: new Date(Date.now() - 259200000 + 3300000),
          status: 'COMPLETED', durationSeconds: 3300,
        },
        {
          routine: routines[3], user: users[2], gym: gyms[0],
          startedAt: new Date(Date.now() - 345600000),
          finishedAt: new Date(Date.now() - 345600000 + 2700000),
          status: 'COMPLETED', durationSeconds: 2700,
        },
      ]);

      // Carga los routine exercises para referenciarlos por routineId + orderPosition
      // (evita IDs hardcodeados que fallan cuando el auto-increment no empieza en 1)
      const allRoutineEx = await routineExRepo.find();
      const reByPos = (routineIdx: number, pos: number) =>
        allRoutineEx.find(re => re.routineId === routines[routineIdx].id && re.orderPosition === pos) ?? null;

      const setRepo = queryRunner.manager.getRepository(WorkoutSet);
      await setRepo.save([
        // sessions[0] → routines[1] Hipertrofia, pos 1 = Press de Banca Plano
        { session: sessions[0], routineExercise: reByPos(1, 1), setNumber: 1, repsCompleted: 10, weightUsedKg: 40.0, restTakenSeconds: 120 },
        { session: sessions[0], routineExercise: reByPos(1, 1), setNumber: 2, repsCompleted: 9,  weightUsedKg: 40.0, restTakenSeconds: 125 },
        // sessions[0] → routines[1], pos 3 = Jalón al Pecho
        { session: sessions[0], routineExercise: reByPos(1, 3), setNumber: 1, repsCompleted: 8,  weightUsedKg: 50.0, restTakenSeconds: 130 },
        // sessions[1] → routines[2] Potencia Piernas, pos 1 = Sentadilla
        { session: sessions[1], routineExercise: reByPos(2, 1), setNumber: 1, repsCompleted: 5,  weightUsedKg: 80.0, restTakenSeconds: 180 },
        { session: sessions[1], routineExercise: reByPos(2, 1), setNumber: 2, repsCompleted: 4,  weightUsedKg: 85.0, restTakenSeconds: 190 },
        // sessions[3] → routines[1], pos 2 = Press de Banca Inclinado
        { session: sessions[3], routineExercise: reByPos(1, 2), setNumber: 1, repsCompleted: 10, weightUsedKg: 60.0, restTakenSeconds: 110 },
        // sessions[4] → routines[3] Cardio, pos 1 = Correr en Cinta (duración, no reps)
        { session: sessions[4], routineExercise: reByPos(3, 1), setNumber: 1, durationSeconds: 1800, restTakenSeconds: 60 },
      ]);
    }

    // ── 20. SYSTEM SETTINGS (único por settingKey) ────────────────────────────
    const settingRepo = queryRunner.manager.getRepository(SystemSetting);
    const settingsData = [
      {
        settingKey: 'app.maintenance_mode',
        settingValue: false,
        description: 'Modo mantenimiento global',
        updatedByUser: users[0],
      },
      {
        settingKey: 'reservations.max_advance_days',
        settingValue: 30,
        description: 'Días máximos para reservar',
        updatedByUser: users[0],
      },
      {
        settingKey: 'reservations.cancellation_window_hours',
        settingValue: 2,
        description: 'Ventana de cancelación sin penalización',
        updatedByUser: users[0],
      },
      {
        settingKey: 'aforo.alert_threshold_percent',
        settingValue: 90,
        description: 'Umbral de alerta de saturación',
        updatedByUser: users[0],
      },
      {
        settingKey: 'notifications.push_batch_size',
        settingValue: 100,
        description: 'Lote máximo de push notifications',
        updatedByUser: users[0],
      },
      {
        settingKey: 'geolocation.fallback_radius_km',
        settingValue: 5,
        description: 'Radio fallback GPS',
        updatedByUser: users[0],
      },
      {
        settingKey: 'training.auto_assign_templates',
        settingValue: true,
        description: 'Asignar templates por defecto al registrar usuario',
        updatedByUser: users[0],
      },
    ];
    for (const s of settingsData) {
      await findOrCreate(settingRepo, { settingKey: s.settingKey } as any, s);
    }

    // ── 21. NOTIFICATION TEMPLATES (único por type) ───────────────────────────
    const templateRepo =
      queryRunner.manager.getRepository(NotificationTemplate);
    const templatesData = [
      {
        type: 'RESERVA_CONFIRMADA',
        titleTemplate: '✅ Reserva Confirmada',
        bodyTemplate: 'Tu clase de {{activity}} el {{date}} ha sido reservada.',
      },
      {
        type: 'RECORDATORIO_CLASE',
        titleTemplate: '⏰ Tu clase comienza pronto',
        bodyTemplate: 'Recuerda tu clase de {{activity}} en 1 hora.',
      },
      {
        type: 'CANCELACION_ADMIN',
        titleTemplate: '⚠️ Clase Cancelada',
        bodyTemplate:
          'La actividad {{activity}} ha sido cancelada por la administración.',
      },
      {
        type: 'CUPO_LIBRE',
        titleTemplate: '🎉 ¡Cupo Disponible!',
        bodyTemplate: 'Se liberó un lugar en {{activity}}. ¡Resérvalo ya!',
      },
      {
        type: 'VENCIMIENTO_SUSCRIPCION',
        titleTemplate: '📅 Membresía por vencer',
        bodyTemplate:
          'Tu plan vence en {{days}} días. Renueva para no perder acceso.',
      },
      {
        type: 'CHECKIN_EXITOSO',
        titleTemplate: '️ Bienvenido/a',
        bodyTemplate: 'Check-in registrado en {{gym}}. ¡Buen entreno!',
      },
      {
        type: 'META_CUMPLIDA',
        titleTemplate: '🏆 ¡Felicidades!',
        bodyTemplate: 'Has completado tu meta de {{goal}}. Revisa tu progreso.',
      },
    ];
    await Promise.all(
      templatesData.map((t) =>
        findOrCreate(templateRepo, { type: t.type } as any, t),
      ),
    );

    await queryRunner.commitTransaction();
    console.log(
      '✅ Seed idempotente completado. Segunda ejecución: sin duplicados, sin destrucción.',
    );
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('❌ Error en seed:', error);
    process.exit(1);
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }
}

runSeed();
