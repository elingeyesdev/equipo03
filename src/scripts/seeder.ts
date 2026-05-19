// src/scripts/seed.ts
import { AppDataSource } from '../config/data-source.cli';
import * as bcrypt from 'bcrypt';

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

async function runSeed() {
    console.log('🌱 Iniciando Seed Profesional (Máx 7 regs/tabla)...');

    const dataSource = await AppDataSource.initialize();
    const queryRunner = dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        // ==========================================
        // 1. LIMPIEZA SEGURA (Idempotencia)
        // ==========================================
        console.log('🧹 Limpiando tablas...');
        await queryRunner.query(`
      TRUNCATE TABLE 
        "workout_sets", "workout_sessions", "routine_exercises", "routines",
        "user_training_goals", "user_training_preferences", "user_training_restrictions", "user_training",
        "reservations", "gym_activity_attendance", "gym_activity_schedule", "gym_activity",
        "user_subscriptions", "subscription_payments", "subscription_plans",
        "check_ins", "gym_schedules", "gym_location", "gyms",
        "user_roles", "role_permissions", "user_profiles",
        "permissions", "roles", "users", "exercise_catalog",
        "system_settings", "notification_templates", "notifications"
      RESTART IDENTITY CASCADE;
    `);

        // ==========================================
        // 2. DATOS BASE (Sin dependencias)
        // ==========================================
        console.log('📦 Insertando datos base...');

        const roleRepo = queryRunner.manager.getRepository(Role);
        const roles = await roleRepo.save([
            { name: 'SUPER_ADMIN', description: 'Control total del sistema', hierarchyLevel: 10, isSystemRole: true },
            { name: 'ADMIN_SEDE', description: 'Gestión de sede específica', hierarchyLevel: 5, isSystemRole: true },
            { name: 'ENTRENADOR', description: 'Asignación de rutinas', hierarchyLevel: 3, isSystemRole: true },
            { name: 'RECEPCION', description: 'Validación de ingresos', hierarchyLevel: 2, isSystemRole: true },
            { name: 'CLIENTE', description: 'Acceso a app móvil', hierarchyLevel: 1, isSystemRole: true },
        ]);

        const permRepo = queryRunner.manager.getRepository(Permission);
        await permRepo.save([
            { code: 'users.read', name: 'Ver usuarios', resource: 'users', action: 'leer' },
            { code: 'gyms.manage', name: 'Gestionar sedes', resource: 'gyms', action: 'escribir' },
            { code: 'reservations.create', name: 'Crear reservas', resource: 'reservations', action: 'crear' },
            { code: 'routines.assign', name: 'Asignar rutinas', resource: 'routines', action: 'escribir' },
            { code: 'reports.view', name: 'Ver reportes', resource: 'reports', action: 'leer' },
        ]);

        const hashedPassword = await bcrypt.hash('123456', 10);
        const userRepo = queryRunner.manager.getRepository(User);
        const users = await userRepo.save([
            { email: 'admin@gymsync.com', passwordHash: hashedPassword, isActive: true },
            { email: 'gerente.santaCruz@gymsync.com', passwordHash: hashedPassword, isActive: true },
            { email: 'entrenador.ana@gymsync.com', passwordHash: hashedPassword, isActive: true },
            { email: 'entrenador.luis@gymsync.com', passwordHash: hashedPassword, isActive: true },
            { email: 'cliente.maria@ejemplo.com', passwordHash: hashedPassword, isActive: true },
            { email: 'cliente.jorge@ejemplo.com', passwordHash: hashedPassword, isActive: true },
            { email: 'cliente.sofia@ejemplo.com', passwordHash: hashedPassword, isActive: true },
        ]);

        const gymRepo = queryRunner.manager.getRepository(Gym);
        const gyms = await gymRepo.save([
            { name: 'Smart Fit Centro', description: 'Tecnología y zona de pesas', maxCapacity: 250, isActive: true, isOpen: true },
            { name: 'Premier Equipetrol', description: 'Zona premium y spa', maxCapacity: 120, isActive: true, isOpen: true },
            { name: 'BioFitness Sur', description: 'Enfoque rehabilitación', maxCapacity: 80, isActive: true, isOpen: true },
            { name: 'CrossBox Norte', description: 'Box de CrossFit funcional', maxCapacity: 60, isActive: true, isOpen: true },
            { name: 'MegaGym Plan 3000', description: 'Espacio familiar amplio', maxCapacity: 300, isActive: true, isOpen: false },
        ]);

        const planRepo = queryRunner.manager.getRepository(SubscriptionPlan);
        const plans = await planRepo.save([
            {
                name: 'Básico',
                description: '1 sede, horario restringido',
                priceMonthly: 120.0,
                maxGymsAccess: 1,
                features: ["acceso_gimnasio"],
            },
            { name: 'Estándar', description: '2 sedes, horario completo', priceMonthly: 180.00, maxGymsAccess: 2, features: ["acceso_gimnasio","reservas"] },
            { name: 'Premium', description: 'Todas las sedes + clases', priceMonthly: 250.00, maxGymsAccess: 5, features: ["acceso_ilimitado","clases","rutinas"] },
            { name: 'Corporativo', description: 'Planes empresariales', priceMonthly: 300.00, maxGymsAccess: 5, features: ["facturacion","reportes","soporte"] },
            { name: 'Estudiante', description: 'Descuento con carnet válido', priceMonthly: 90.00, maxGymsAccess: 1, features: ["acceso_gimnasio","horario_diurno"] },
        ]);

        const exerciseRepo = queryRunner.manager.getRepository(ExerciseCatalog);
        const exercises = await exerciseRepo.save([
            {
                name: 'Press Banca Plano',
                description: 'Desarrollo pectoral mayor',
                muscleGroup: 'PECHO',
                difficultyLevel: 'INTERMEDIO',
                equipmentRequired: 'BANCA_BARRA',
            },
            { name: 'Sentadilla Libre', description: 'Base fuerza tren inferior', muscleGroup: 'PIERNAS', difficultyLevel: 'AVANZADO', equipmentRequired: 'BARRA' },
            { name: 'Dominadas Pecho', description: 'Tracción espalda alta', muscleGroup: 'ESPALDA', difficultyLevel: 'INTERMEDIO', equipmentRequired: 'BARRA_DOMINADAS' },
            { name: 'Press Militar', description: 'Hombros y tríceps', muscleGroup: 'HOMBROS', difficultyLevel: 'INTERMEDIO', equipmentRequired: 'MANCUERNAS' },
            { name: 'Curl Bíceps Alterno', description: 'Aislamiento bíceps', muscleGroup: 'BRAZOS', difficultyLevel: 'BASICO', equipmentRequired: 'MANCUERNAS' },
            { name: 'Plancha Abdominal', description: 'Estabilidad core', muscleGroup: 'CORE', difficultyLevel: 'BASICO', equipmentRequired: 'CUERPO' },
            { name: 'Peso Muerto Rumano', description: 'Cadena posterior', muscleGroup: 'PIERNAS', difficultyLevel: 'AVANZADO', equipmentRequired: 'BARRA_MANCUERNAS' },
        ]);

        // ==========================================
        // 3. RELACIONES Y CONFIGURACIÓN
        // ==========================================
        console.log('🔗 Insertando relaciones y perfiles...');

        const locRepo = queryRunner.manager.getRepository(GymLocation);
        await locRepo.save([
            { gym: gyms[0], address: 'Av. Banzer 4to Anillo', city: 'Santa Cruz', latitude: -17.7833, longitude: -63.1822 },
            { gym: gyms[1], address: 'Calle Beni Equipetrol', city: 'Santa Cruz', latitude: -17.7600, longitude: -63.1700 },
            { gym: gyms[2], address: 'Av. Roca y Coronado', city: 'Santa Cruz', latitude: -17.8011, longitude: -63.1950 },
            { gym: gyms[3], address: 'Av. San Martín Km 4', city: 'Santa Cruz', latitude: -17.7550, longitude: -63.1650 },
            { gym: gyms[4], address: '2do Anillo Plan 3000', city: 'Santa Cruz', latitude: -17.8200, longitude: -63.1400 },
        ]);

        const profileRepo = queryRunner.manager.getRepository(UserProfile);
        await profileRepo.save([
            { user: users[0], firstName: 'Admin', lastName: 'Global', phone: '+59170000001', gender: 'OTHER' },
            { user: users[1], firstName: 'Carlos', lastName: 'Gerente', phone: '+59170000002', gender: 'MALE' },
            { user: users[2], firstName: 'Ana', lastName: 'Entrenadora', phone: '+59170000003', gender: 'FEMALE' },
            { user: users[3], firstName: 'Luis', lastName: 'Entrenador', phone: '+59170000004', gender: 'MALE' },
            { user: users[4], firstName: 'María', lastName: 'Cliente', phone: '+59170000005', gender: 'FEMALE' },
            { user: users[5], firstName: 'Jorge', lastName: 'Cliente', phone: '+59170000006', gender: 'MALE' },
            { user: users[6], firstName: 'Sofía', lastName: 'Cliente', phone: '+59170000007', gender: 'FEMALE' },
        ]);

        const userRoleRepo = queryRunner.manager.getRepository(UserRole);
        await userRoleRepo.save([
            { user: users[0], role: roles[0], assignedByUser: users[0] },
            { user: users[1], role: roles[1], gym: gyms[0], assignedByUser: users[0] },
            { user: users[2], role: roles[2], gym: gyms[0], assignedByUser: users[0] },
            { user: users[3], role: roles[2], gym: gyms[1], assignedByUser: users[0] },
            { user: users[4], role: roles[4], assignedByUser: users[0] },
            { user: users[5], role: roles[4], assignedByUser: users[0] },
            { user: users[6], role: roles[4], assignedByUser: users[0] },
        ]);

        const scheduleRepo = queryRunner.manager.getRepository(GymSchedule);
        await scheduleRepo.save([
            { gym: gyms[0], dayOfWeek: 'LUN', opensAt: '06:00', closesAt: '22:00' },
            { gym: gyms[0], dayOfWeek: 'MAR', opensAt: '06:00', closesAt: '22:00' },
            { gym: gyms[1], dayOfWeek: 'LUN', opensAt: '07:00', closesAt: '23:00' },
            { gym: gyms[2], dayOfWeek: 'LUN', opensAt: '08:00', closesAt: '20:00' },
            { gym: gyms[3], dayOfWeek: 'MIE', opensAt: '06:30', closesAt: '21:30' },
            { gym: gyms[4], dayOfWeek: 'JUE', opensAt: '07:00', closesAt: '21:00' },
            { gym: gyms[0], dayOfWeek: 'VIE', opensAt: '06:00', closesAt: '22:00' },
        ]);

        // ==========================================
        // 4. SUSCRIPCIONES Y ACTIVIDADES
        // ==========================================
        console.log('💳 Insertando suscripciones y actividades...');

        const subRepo = queryRunner.manager.getRepository(UserSubscription);
        await subRepo.save([
            { user: users[4], plan: plans[2], homeGym: gyms[0], status: 'ACTIVO', startDate: new Date('2026-01-15'), endDate: new Date('2027-01-15'), autoRenew: true },
            { user: users[5], plan: plans[0], homeGym: gyms[1], status: 'ACTIVO', startDate: new Date('2026-03-01'), endDate: new Date('2026-09-01'), autoRenew: false },
            { user: users[6], plan: plans[4], homeGym: gyms[2], status: 'ACTIVO', startDate: new Date('2026-02-10'), endDate: new Date('2026-08-10'), autoRenew: true },
            { user: users[4], plan: plans[1], homeGym: gyms[0], status: 'PAUSADO', startDate: new Date('2025-06-01'), endDate: new Date('2025-12-01'), autoRenew: false },
            { user: users[5], plan: plans[3], homeGym: gyms[3], status: 'VENCIDO', startDate: new Date('2025-01-01'), endDate: new Date('2025-12-31'), autoRenew: false },
        ]);

        const actRepo = queryRunner.manager.getRepository(GymActivity);
        const activities = await actRepo.save([
            { gym: gyms[0], name: 'Spinning Pro', description: 'Ciclismo indoor alta intensidad', defaultDurationMin: 45, isActive: true },
            { gym: gyms[0], name: 'Yoga Flow', description: 'Flexibilidad y respiración', defaultDurationMin: 60, isActive: true },
            { gym: gyms[1], name: 'Pilates Mat', description: 'Core y postura', defaultDurationMin: 50, isActive: true },
            { gym: gyms[3], name: 'WOD CrossFit', description: 'Entrenamiento funcional diario', defaultDurationMin: 60, isActive: true },
            { gym: gyms[2], name: 'Tai Chi Suave', description: 'Movilidad articular', defaultDurationMin: 45, isActive: true },
            { gym: gyms[0], name: 'HIIT Quema', description: 'Intervalos alta intensidad', defaultDurationMin: 30, isActive: true },
            { gym: gyms[1], name: 'Boxeo Cardio', description: 'Técnica y resistencia', defaultDurationMin: 55, isActive: true },
        ]);

        const actSchedRepo = queryRunner.manager.getRepository(GymActivitySchedule);
        const schedules = await actSchedRepo.save([
            { gymActivity: activities[0], instructor: users[2], dayOfWeek: 'LUN', startTime: '18:00', endTime: '18:45', maxAttendees: 20, isRecurring: true },
            { gymActivity: activities[1], instructor: users[2], dayOfWeek: 'MAR', startTime: '19:00', endTime: '20:00', maxAttendees: 15, isRecurring: true },
            { gymActivity: activities[2], instructor: users[3], dayOfWeek: 'LUN', startTime: '10:00', endTime: '10:50', maxAttendees: 12, isRecurring: true },
            { gymActivity: activities[3], instructor: users[2], dayOfWeek: 'MIE', startTime: '17:30', endTime: '18:30', maxAttendees: 10, isRecurring: true },
            { gymActivity: activities[4], instructor: undefined, dayOfWeek: 'JUE', startTime: '08:00', endTime: '08:45', maxAttendees: 25, isRecurring: true },
            { gymActivity: activities[5], instructor: users[3], dayOfWeek: 'VIE', startTime: '18:30', endTime: '19:00', maxAttendees: 30, isRecurring: true },
            { gymActivity: activities[6], instructor: users[2], dayOfWeek: 'SAB', startTime: '09:00', endTime: '09:55', maxAttendees: 18, isRecurring: true },
        ]);

        const resRepo = queryRunner.manager.getRepository(Reservation);
        await resRepo.save([
            { user: users[4], gymActivitySchedule: schedules[0], reservationDate: new Date('2026-04-28'), status: 'CONFIRMADA', createdBy: users[4].id, createdAt: new Date() },
            { user: users[5], gymActivitySchedule: schedules[2], reservationDate: new Date('2026-04-29'), status: 'CONFIRMADA', createdBy: users[5].id, createdAt: new Date() },
            { user: users[6], gymActivitySchedule: schedules[1], reservationDate: new Date('2026-04-30'), status: 'CONFIRMADA', createdBy: users[6].id, createdAt: new Date() },
            { user: users[4], gymActivitySchedule: schedules[3], reservationDate: new Date('2026-05-01'), status: 'CANCELADA', createdBy: users[4].id, createdAt: new Date(), cancelledAt: new Date() },
            { user: users[5], gymActivitySchedule: schedules[4], reservationDate: new Date('2026-05-02'), status: 'CONFIRMADA', createdBy: users[5].id, createdAt: new Date() },
            { user: users[6], gymActivitySchedule: schedules[5], reservationDate: new Date('2026-05-03'), status: 'CONFIRMADA', createdBy: users[6].id, createdAt: new Date() },
            { user: users[4], gymActivitySchedule: schedules[6], reservationDate: new Date('2026-05-04'), status: 'CONFIRMADA', createdBy: users[4].id, createdAt: new Date() },
        ]);

        const checkRepo = queryRunner.manager.getRepository(CheckIn);
        await checkRepo.save([
            { user: users[4], gym: gyms[0], checkInTime: new Date(Date.now() - 86400000), method: 'QR', status: 'COMPLETED' },
            { user: users[5], gym: gyms[1], checkInTime: new Date(Date.now() - 172800000), method: 'MANUAL', status: 'COMPLETED' },
            { user: users[6], gym: gyms[2], checkInTime: new Date(Date.now() - 259200000), method: 'QR', status: 'DENIED' },
            { user: users[4], gym: gyms[0], checkInTime: new Date(Date.now() - 345600000), method: 'QR', status: 'COMPLETED' },
            { user: users[5], gym: gyms[3], checkInTime: new Date(Date.now() - 432000000), method: 'BIOMETRIC', status: 'COMPLETED' },
            { user: users[6], gym: gyms[1], checkInTime: new Date(Date.now() - 518400000), method: 'QR', status: 'COMPLETED' },
            { user: users[4], gym: gyms[0], checkInTime: new Date(Date.now() - 604800000), method: 'MANUAL', status: 'COMPLETED' },
        ]);

        // ==========================================
        // 5. ENTRENAMIENTO Y RUTINAS
        // ==========================================
        console.log('🏋️ Insertando entrenamiento y rutinas...');

        const trainingRepo = queryRunner.manager.getRepository(UserTraining);
        const trainings = await trainingRepo.save([
            { user: users[4] }, { user: users[5] }, { user: users[6] },
            { user: users[2] }, { user: users[3] },
        ]);

        const goalRepo = queryRunner.manager.getRepository(UserTrainingGoals);
        await goalRepo.save([
            { userTraining: trainings[0], primaryGoal: 'BAJAR_PESO', experienceLevel: 'PRINCIPIANTE' },
            { userTraining: trainings[1], primaryGoal: 'GANAR_MUSCULO', experienceLevel: 'INTERMEDIO' },
            { userTraining: trainings[2], primaryGoal: 'RENDIMIENTO', experienceLevel: 'AVANZADO' },
            { userTraining: trainings[3], primaryGoal: 'MANTENER', experienceLevel: 'AVANZADO' },
            { userTraining: trainings[4], primaryGoal: 'SALUD', experienceLevel: 'INTERMEDIO' },
        ]);

        const routineRepo = queryRunner.manager.getRepository(Routine);
        const routines = await routineRepo.save([
            { name: 'Full Body Principiante', description: 'Adaptación general 4 semanas', trainer: users[2], assignedUser: users[4], difficultyLevel: 'BASICO', durationWeeks: 4, isActive: true },
            { name: 'Hipertrofia Pecho/Espalda', description: 'Volumen tren superior', trainer: users[3], assignedUser: users[5], difficultyLevel: 'INTERMEDIO', durationWeeks: 6, isActive: true },
            { name: 'Potencia Piernas', description: 'Fuerza explosiva', trainer: users[2], assignedUser: users[6], difficultyLevel: 'AVANZADO', durationWeeks: 8, isActive: true },
            { name: 'Mantenimiento Cardio', description: 'Rutina ligera recuperación', trainer: users[3], assignedUser: users[2], difficultyLevel: 'BASICO', durationWeeks: 2, isActive: true },
            { name: 'Core & Movilidad', description: 'Prevención lesiones', trainer: users[2], assignedUser: undefined, difficultyLevel: 'INTERMEDIO', durationWeeks: 4, isActive: true },
        ]);

        const routineExRepo = queryRunner.manager.getRepository(RoutineExercise);
        await routineExRepo.save([
            { routine: routines[0], exercise: exercises[0], orderPosition: 1, setsRecommended: 3, repsRecommended: '12-15', restSecondsBetweenSets: 60 },
            { routine: routines[0], exercise: exercises[5], orderPosition: 2, setsRecommended: 3, repsRecommended: '30s', restSecondsBetweenSets: 45 },
            { routine: routines[1], exercise: exercises[1], orderPosition: 1, setsRecommended: 4, repsRecommended: '8-10', restSecondsBetweenSets: 120 },
            { routine: routines[1], exercise: exercises[2], orderPosition: 2, setsRecommended: 4, repsRecommended: '8-10', restSecondsBetweenSets: 120 },
            { routine: routines[2], exercise: exercises[6], orderPosition: 1, setsRecommended: 5, repsRecommended: '5', restSecondsBetweenSets: 180 },
            { routine: routines[3], exercise: exercises[4], orderPosition: 1, setsRecommended: 2, repsRecommended: '15', restSecondsBetweenSets: 30 },
            { routine: routines[4], exercise: exercises[5], orderPosition: 1, setsRecommended: 3, repsRecommended: '45s', restSecondsBetweenSets: 60 },
        ]);

        const sessionRepo = queryRunner.manager.getRepository(WorkoutSession);
        const sessions = await sessionRepo.save([
            { routine: routines[1], user: users[5], gym: gyms[1], startedAt: new Date(Date.now() - 86400000), finishedAt: new Date(Date.now() - 86400000 + 3600000), status: 'COMPLETED', totalDurationMinutes: 60 },
            { routine: routines[2], user: users[6], gym: gyms[3], startedAt: new Date(Date.now() - 172800000), finishedAt: new Date(Date.now() - 172800000 + 4500000), status: 'COMPLETED', totalDurationMinutes: 75 },
            { routine: routines[0], user: users[4], gym: gyms[0], startedAt: new Date(), finishedAt: undefined, status: 'IN_PROGRESS', totalDurationMinutes: undefined },
            { routine: routines[1], user: users[5], gym: gyms[1], startedAt: new Date(Date.now() - 259200000), finishedAt: new Date(Date.now() - 259200000 + 3300000), status: 'COMPLETED', totalDurationMinutes: 55 },
            { routine: routines[3], user: users[2], gym: gyms[0], startedAt: new Date(Date.now() - 345600000), finishedAt: new Date(Date.now() - 345600000 + 2700000), status: 'COMPLETED', totalDurationMinutes: 45 },
        ]);

        const setRepo = queryRunner.manager.getRepository(WorkoutSet);
        await setRepo.save([
            { session: sessions[0], routineExercise: routineExRepo.create({ id: 3 }), setNumber: 1, repsCompleted: 10, weightUsedKg: 40.0, restTakenSeconds: 120, completedAt: new Date() },
            { session: sessions[0], routineExercise: routineExRepo.create({ id: 3 }), setNumber: 2, repsCompleted: 9, weightUsedKg: 40.0, restTakenSeconds: 125, completedAt: new Date() },
            { session: sessions[1], routineExercise: routineExRepo.create({ id: 5 }), setNumber: 1, repsCompleted: 5, weightUsedKg: 80.0, restTakenSeconds: 180, completedAt: new Date() },
            { session: sessions[3], routineExercise: routineExRepo.create({ id: 4 }), setNumber: 1, repsCompleted: 10, weightUsedKg: 60.0, restTakenSeconds: 110, completedAt: new Date() },
            { session: sessions[4], routineExercise: routineExRepo.create({ id: 7 }), setNumber: 1, repsCompleted: 45, weightUsedKg: 0, restTakenSeconds: 60, completedAt: new Date() },
            { session: sessions[0], routineExercise: routineExRepo.create({ id: 4 }), setNumber: 1, repsCompleted: 8, weightUsedKg: 50.0, restTakenSeconds: 130, completedAt: new Date() },
            { session: sessions[1], routineExercise: routineExRepo.create({ id: 5 }), setNumber: 2, repsCompleted: 4, weightUsedKg: 85.0, restTakenSeconds: 190, completedAt: new Date() },
        ]);

        // ==========================================
        // 6. SISTEMA Y NOTIFICACIONES
        // ==========================================
        console.log('⚙️ Insertando configuración del sistema...');

        const settingRepo = queryRunner.manager.getRepository(SystemSetting);
        await settingRepo.save([
            { settingKey: 'app.maintenance_mode', settingValue: false, description: 'Modo mantenimiento global', updatedByUser: users[0] },
            { settingKey: 'reservations.max_advance_days', settingValue: 30, description: 'Días máximos para reservar', updatedByUser: users[0] },
            { settingKey: 'reservations.cancellation_window_hours', settingValue: 2, description: 'Ventana de cancelación sin penalización', updatedByUser: users[0] },
            { settingKey: 'aforo.alert_threshold_percent', settingValue: 90, description: 'Umbral de alerta de saturación', updatedByUser: users[0] },
            { settingKey: 'notifications.push_batch_size', settingValue: 100, description: 'Lote máximo de push notifications', updatedByUser: users[0] },
            { settingKey: 'geolocation.fallback_radius_km', settingValue: 5, description: 'Radio fallback GPS', updatedByUser: users[0] },
            { settingKey: 'training.auto_assign_templates', settingValue: true, description: 'Asignar templates por defecto al registrar usuario', updatedByUser: users[0] },
        ]);

        const templateRepo = queryRunner.manager.getRepository(NotificationTemplate);
        await templateRepo.save([
            { type: 'RESERVA_CONFIRMADA', titleTemplate: '✅ Reserva Confirmada', bodyTemplate: 'Tu clase de {{activity}} el {{date}} ha sido reservada.' },
            { type: 'RECORDATORIO_CLASE', titleTemplate: '⏰ Tu clase comienza pronto', bodyTemplate: 'Recuerda tu clase de {{activity}} en 1 hora.' },
            { type: 'CANCELACION_ADMIN', titleTemplate: '⚠️ Clase Cancelada', bodyTemplate: 'La actividad {{activity}} ha sido cancelada por la administración.' },
            { type: 'CUPO_LIBRE', titleTemplate: '🎉 ¡Cupo Disponible!', bodyTemplate: 'Se liberó un lugar en {{activity}}. ¡Resérvalo ya!' },
            { type: 'VENCIMIENTO_SUSCRIPCION', titleTemplate: '📅 Membresía por vencer', bodyTemplate: 'Tu plan vence en {{days}} días. Renueva para no perder acceso.' },
            { type: 'CHECKIN_EXITOSO', titleTemplate: '️ Bienvenido/a', bodyTemplate: 'Check-in registrado en {{gym}}. ¡Buen entreno!' },
            { type: 'META_CUMPLIDA', titleTemplate: '🏆 ¡Felicidades!', bodyTemplate: 'Has completado tu meta de {{goal}}. Revisa tu progreso.' },
        ]);

        await queryRunner.commitTransaction();
        console.log('✅ Seed completado exitosamente. Base lista para desarrollo.');

    } catch (error) {
        await queryRunner.rollbackTransaction();
        console.error('❌ Error fatal en seed:', error);
        process.exit(1);
    } finally {
        await queryRunner.release();
        await dataSource.destroy();
    }
}

runSeed();