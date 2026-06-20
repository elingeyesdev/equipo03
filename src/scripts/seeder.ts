// src/scripts/seeder.ts
import { AppDataSource } from '../config/data-source.cli';
import * as bcrypt from 'bcrypt';
import { Role } from '../roles/domain/role.entity';
import { User } from '../users/domain/user.entity';
import { UserProfile } from '../users/domain/user-profile.entity';
import { UserRole } from '../roles/domain/user-role.entity';
import { Gym } from '../gyms/domain/gym.entity';
import { GymLocation } from '../gyms/domain/gym-location.entity';
import { ExerciseCatalog } from '../exercises/domain/exercise-catalog.entity';
import { GymActivity } from '../activities/domain/gym-activity.entity';
import { GymSchedule } from '../gyms/domain/gym-schedule.entity';
import { GymActivitySchedule } from '../activities/domain/gym-activity-schedule.entity';
import { GymInfrastructure } from '../gyms/domain/gym-infrastructure.entity';

async function runSeed() {
  console.log('🌱 Iniciando seed de GymSync...');

  const dataSource = await AppDataSource.initialize();
  const qr = dataSource.createQueryRunner();
  await qr.connect();

  // ── TRUNCATE: limpiar todas las tablas y reiniciar secuencias ──────────────
  // Orden: hijos primero para respetar FK; CASCADE cubre dependencias restantes.
  const tables = [
    // Staff / Asesorías
    'client_advisors', 'staff_schedules', 'nutritional_appointments', 'trainer_plans',
    // Roles y permisos
    'role_permissions', 'user_roles',
    // Entrenamientos
    'workout_sets', 'workout_sessions',
    // Reservas y accesos
    'reservations', 'check_ins', 'waitlist_entries', 'visits',
    // Actividades
    'gym_activity_attendance', 'gym_activity_schedule', 'gym_activity',
    // Gimnasios
    'gym_schedules', 'gym_location', 'gym_infrastructure', 'gyms',
    // Usuarios
    'emergency_contacts', 'user_profiles', 'users',
    // Catálogos
    'permissions', 'roles', 'exercise_catalog',
    'routines', 'routine_exercises',
    // Métricas y training
    'physical_metrics_history',
    'user_training', 'user_training_goals', 'user_training_preferences',
    'user_training_restrictions',
    // Notificaciones
    'notification_templates', 'notifications', 'user_notification_preferences',
    // Suscripciones
    'subscription_plans', 'user_subscriptions', 'subscription_payments',
    // Sistema
    'system_settings',
  ];
  console.log('Limpiando tablas y reiniciando secuencias...');
  for (const t of tables) {
    try {
      await qr.query(`TRUNCATE TABLE "${t}" RESTART IDENTITY CASCADE;`);
    } catch {
      // La tabla aún no existe en esta migración — se ignora
    }
  }

  
  console.log('\n[1/6] Creando roles (IDs 1-9)...');
  const roleRepo = qr.manager.getRepository(Role);
  const rolesData = [
    { name: 'SUPER_ADMIN',          description: 'Administrador Global — acceso total',           hierarchyLevel: 10, isSystemRole: true  },
    { name: 'GERENTE',              description: 'Gerente de Sede o Marca',                        hierarchyLevel:  5, isSystemRole: true  },
    { name: 'USER',                 description: 'Cliente / Socio del gimnasio',                   hierarchyLevel:  1, isSystemRole: false },
    { name: 'ENTRENADOR',           description: 'Entrenador Personal',                            hierarchyLevel:  3, isSystemRole: true  },
    { name: 'COORDINADOR',          description: 'Coordinador de Sede',                            hierarchyLevel:  2, isSystemRole: false },
    { name: 'PERSONAL_DE_LIMPIEZA', description: 'Personal de Limpieza',                           hierarchyLevel:  1, isSystemRole: false },
    { name: 'INSTRUCTOR',           description: 'Instructor de Clases Grupales',                  hierarchyLevel:  3, isSystemRole: false },
    { name: 'NUTRICIONISTA',        description: 'Nutricionista',                                  hierarchyLevel:  3, isSystemRole: true  },
    { name: 'RECEPCIONISTA',        description: 'Recepcionista / Cajero',                         hierarchyLevel:  4, isSystemRole: false },
  ];

  const savedRoles: Role[] = [];
  for (const r of rolesData) {
    savedRoles.push(await roleRepo.save(roleRepo.create(r)));
  }

  const roleByName = (name: string): Role => {
    const found = savedRoles.find(r => r.name === name);
    if (!found) throw new Error(`Rol '${name}' no encontrado en el seed`);
    return found;
  };

  console.log('   Roles creados:', savedRoles.map(r => `${r.id}=${r.name}`).join(', '));


  // PASO 2 — MARCAS (10 registros; IDs 1-10)

  console.log('\n[2/6] Creando 10 marcas (Gimnasios Reales de SCZ)...');
  const gymRepo = qr.manager.getRepository(Gym);
  const locRepo = qr.manager.getRepository(GymLocation);
  const schedRepo = qr.manager.getRepository(GymSchedule);
  const infraRepo = qr.manager.getRepository(GymInfrastructure);

  const brandNames = [
    'Premier',
    'Megatlon',
    'Smart Fit',
    'Reyes',
    'Sport',
    'Bio Center',
    'Olimpia',
    'Fit Bull',
    'VIP',
    'Body Masters'
  ];
  
  const savedBrands: Gym[] = [];
  for (const bName of brandNames) {
    savedBrands.push(await gymRepo.save(gymRepo.create({
      name: bName, description: 'Cadena matriz', maxCapacity: 0,
      isActive: true, isOpen: true,
    })));
  }


  // PASO 3 — SUCURSALES (30 registros; IDs 11-40)

  console.log('\n[3/6] Creando 30 sucursales y sus horarios de atención...');
  const savedBranches: Gym[] = [];
  
  // Zonas y direcciones realistas en SCZ
  const sczZones = [
    { zone: 'Equipetrol', address: 'Av. San Martín, 3er Anillo Interno', lat: -17.7667, lng: -63.1970 },
    { zone: 'Centro', address: 'Calle 24 de Septiembre #150, Plaza 24 de Septiembre', lat: -17.7833, lng: -63.1821 },
    { zone: 'Urubó', address: 'Av. Principal del Urubó, pasando el puente', lat: -17.7512, lng: -63.2201 },
    { zone: 'Plan 3000', address: 'Rotonda del Plan 3000, Av. Paurito', lat: -17.8335, lng: -63.1415 },
    { zone: 'Villa 1ro de Mayo', address: 'Plaza Principal Villa 1ro de Mayo', lat: -17.8011, lng: -63.1366 },
    { zone: 'Santos Dumont', address: 'Av. Santos Dumont, 4to Anillo', lat: -17.8172, lng: -63.1855 },
    { zone: 'Banzer', address: 'Av. Banzer, 5to Anillo', lat: -17.7441, lng: -63.1702 },
    { zone: 'Doble Vía a La Guardia', address: 'Doble Vía a La Guardia, Km 3', lat: -17.8089, lng: -63.2081 },
    { zone: 'Mutualista', address: 'Av. Mutualista, 3er Anillo Externo', lat: -17.7655, lng: -63.1598 },
    { zone: 'Las Palmas', address: 'Barrio Las Palmas, Av. Iberica', lat: -17.7951, lng: -63.2005 }
  ];

  let branchCount = 0;
  for (const parent of savedBrands) {
    // 3 sucursales por marca, elegimos zonas secuencialmente
    for (let i = 0; i < 3; i++) {
      const zoneData = sczZones[(branchCount + i) % sczZones.length];
      const branchName = `${parent.name} ${zoneData.zone}`;
      
      const randCap = 100 + Math.floor(Math.random() * 200); // 100 to 300
      const machineCap = Math.floor(randCap * (0.3 + Math.random() * 0.3)); // 30% a 60% del aforo total

      const branch = await gymRepo.save(gymRepo.create({
        name:        branchName,
        description: `Sucursal ubicada en la zona ${zoneData.zone}`,
        parentId:    parent.id,
        maxCapacity: randCap,
        isActive: true,
        isOpen:   true,
      }));
      savedBranches.push(branch);

      await locRepo.save(locRepo.create({
        gymId:     branch.id,
        address:   zoneData.address,
        city:      'Santa Cruz de la Sierra',
        latitude:  zoneData.lat + (Math.random() * 0.005 - 0.0025), // Jitter
        longitude: zoneData.lng + (Math.random() * 0.005 - 0.0025),
      }));

      await infraRepo.save(infraRepo.create({
        gymId: branch.id,
        machineCapacity: machineCap,
      }));


      // --- Generar Horarios de Atención ---
      const days = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'];
      const schedules = days.map(day => {
        let opens = '06:00:00';
        let closes = '22:00:00';
        let isHol = false;

        if (day === 'SAB') {
          opens = '07:00:00';
          closes = '18:00:00';
        } else if (day === 'DOM') {
          opens = '08:00:00';
          closes = '13:00:00';
          // Algunas sucursales cierran los domingos
          if (branchCount % 3 === 0) {
            isHol = true;
          }
        }

        return schedRepo.create({
          gymId: branch.id,
          dayOfWeek: day,
          opensAt: opens,
          closesAt: closes,
          isHoliday: isHol
        });
      });
      await schedRepo.save(schedules);
    }
    branchCount += 3;
  }

  // La primera sucursal es la sede de referencia para los usuarios staff de prueba
  const firstBranch = savedBranches[0];
  console.log(`   Primera sucursal: id=${firstBranch.id} — "${firstBranch.name}"`);

  // ═══════════════════════════════════════════════════════════════════════════
  // PASO 4 — USUARIOS CLAVE con roles y gymId correctamente asignados
  //
  // Las sucursales ya existen → el FK en user_roles.gym_id es válido.
  // Para roles de staff, gymId = firstBranch.id → el JWT incluirá la sede.
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n[4/6] Creando usuarios clave...');
  const userRepo    = qr.manager.getRepository(User);
  const profileRepo = qr.manager.getRepository(UserProfile);
  const urRepo      = qr.manager.getRepository(UserRole);

  const passwordHash = await bcrypt.hash('Aaron123*', 10);

  type KeyUserDef = {
    email: string;
    firstName: string;
    lastName: string;
    roleName: string;
    gymId: number | null;
  };

  const keyUsers: KeyUserDef[] = [
    // Admins / sin sede
    { email: 'admin@gymsync.com',         firstName: 'Super',       lastName: 'Admin',         roleName: 'SUPER_ADMIN',          gymId: null           },
    // Gerente → asignado a MARCA (no sucursal) para que JWT emita brandId
    { email: 'gerente@gymsync.com',        firstName: 'Carlos',      lastName: 'Gerente',       roleName: 'GERENTE',              gymId: savedBrands[0].id },
    // Staff → asignado a sucursal
    { email: 'recepcion@gymsync.com',      firstName: 'Maria',       lastName: 'Recepcion',     roleName: 'RECEPCIONISTA',        gymId: firstBranch.id },
    { email: 'entrenador@gymsync.com',     firstName: 'Luis',        lastName: 'Entrenador',    roleName: 'ENTRENADOR',           gymId: firstBranch.id },
    { email: 'instructor@gymsync.com',     firstName: 'Sofia',       lastName: 'Instructora',   roleName: 'INSTRUCTOR',           gymId: firstBranch.id },
    { email: 'nutricionista@gymsync.com',  firstName: 'Ana',         lastName: 'Nutricionista', roleName: 'NUTRICIONISTA',        gymId: firstBranch.id },
    // Clientes (sin sede)
    { email: 'cliente@gymsync.com',        firstName: 'Juan',        lastName: 'Cliente',       roleName: 'USER',                 gymId: null           },
    { email: 'cliente2@gymsync.com',       firstName: 'Laura',       lastName: 'Clienta',       roleName: 'USER',                 gymId: null           },
  ];

  let adminUserId: number | null = null;

  for (const ku of keyUsers) {
    const user = await userRepo.save(userRepo.create({
      email: ku.email, passwordHash, isActive: true,
    }));

    await profileRepo.save(profileRepo.create({
      userId:    user.id,
      firstName: ku.firstName,
      lastName:  ku.lastName,
      gender:    'OTHER',
    }));

    if (adminUserId === null) adminUserId = user.id; // primer usuario = admin

    await urRepo.save(urRepo.create({
      userId:     user.id,
      roleId:     roleByName(ku.roleName).id,
      gymId:      ku.gymId ?? undefined,
      assignedBy: ku.roleName === 'SUPER_ADMIN' ? undefined : adminUserId,
    }));

    const gymLabel = ku.gymId ? ` (gym id=${ku.gymId} — ${firstBranch.name})` : '';
    console.log(`   ✓ ${ku.email.padEnd(32)} → ${ku.roleName}${gymLabel}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PASO 5 — 50 USUARIOS ALEATORIOS (Roles distribuidos)
  // 10 clientes (8 aquí + 2 clave), 2 super_admin (1 aquí + 1 clave), resto staff
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n[5/6] Creando 50 usuarios con roles aleatorios...');
  
  const firstNames = [
    'Carlos','Maria','Jose','Ana','Luis','Sofia','Jorge','Lucia','Miguel','Laura',
    'Pedro','Carmen','Raul','Elena','Fernando','Paula','Diego','Marta','Javier','Sara',
    'Andres','Beatriz','Alejandro','Isabel','Manuel','Cristina','Daniel','Teresa','David','Rosa',
    'Adrian','Julia','Mario','Patricia','Alberto','Alba','Victor','Silvia','Marcos','Natalia',
    'Oscar','Irene','Ruben','Lorena','Ivan','Angela','Gabriel','Belen','Hugo','Rocio',
  ];
  const lastNames = [
    'Gomez','Rodriguez','Fernandez','Lopez','Martinez','Sanchez','Perez','Martin','Garcia','Ruiz',
    'Diaz','Suarez','Romero','Alvarez','Torres','Navarro','Gutierrez','Molina','Blanco','Castro',
    'Ortiz','Rubio','Marin','Sanz','Iglesias','Vazquez','Ramos','Gil','Serrano','Mendez',
    'Cabrera','Medina','Rojas','Flores','Vargas','Rios','Castillo','Pena','Guzman','Leon',
    'Herrera','Cortes','Mora','Arias','Vega','Cruz','Mendoza','Soto','Campos','Delgado',
  ];

  const randomRoles = [
    ...Array(8).fill('USER'),
    ...Array(1).fill('SUPER_ADMIN')
  ];
  const staffRoleNames = ['GERENTE', 'RECEPCIONISTA', 'INSTRUCTOR', 'ENTRENADOR'];
  for (let i = 0; i < 41; i++) {
    randomRoles.push(staffRoleNames[i % staffRoleNames.length]);
  }
  // Mezclar roles
  randomRoles.sort(() => Math.random() - 0.5);

  for (let i = 0; i < 50; i++) {
    const fn    = firstNames[i];
    const ln    = lastNames[i];
    const email = `${fn.toLowerCase()}${ln.toLowerCase()}@gmail.com`;

    const user = await userRepo.save(userRepo.create({
      email, passwordHash, isActive: true,
    }));

    await profileRepo.save(profileRepo.create({
      userId:    user.id,
      firstName: fn,
      lastName:  ln,
      phone:     `+5917${Math.floor(1000000 + Math.random() * 9000000)}`,
      ci:        `${Math.floor(1000000 + Math.random() * 9000000)}`,
      gender:    i % 2 === 0 ? 'MALE' : 'FEMALE',
    }));

    const roleName = randomRoles[i];
    let assignedGymId: number | undefined = undefined;

    if (roleName === 'GERENTE') {
      assignedGymId = savedBrands[Math.floor(Math.random() * savedBrands.length)].id;
    } else if (roleName !== 'USER' && roleName !== 'SUPER_ADMIN') {
      assignedGymId = savedBranches[Math.floor(Math.random() * savedBranches.length)].id;
    }

    await urRepo.save(urRepo.create({
      userId:     user.id,
      roleId:     roleByName(roleName).id,
      gymId:      assignedGymId,
      assignedBy: adminUserId!,
    }));
  }
  // ═══════════════════════════════════════════════════════════════════════════
  // PASO 6 — ACTIVIDADES (80 actividades distribuidas en sucursales)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n[6/6] Creando 80 actividades/servicios y sus horarios...');
  const actRepo      = qr.manager.getRepository(GymActivity);
  const exerciseRepo = qr.manager.getRepository(ExerciseCatalog);
  const actSchedRepo = qr.manager.getRepository(GymActivitySchedule);

  // Obtener instructores para asignar a las clases guiadas (INSTRUCTOR + ENTRENADOR)
  const instructorRoleId = roleByName('INSTRUCTOR').id;
  const entrenadorRoleId = roleByName('ENTRENADOR').id;
  const instructors = await urRepo.find({
    where: [{ roleId: instructorRoleId }, { roleId: entrenadorRoleId }],
    relations: ['user']
  }).then(urs => urs.map(ur => ur.user).filter(Boolean));

  const serviceDefinitions = [
    { name: 'Musculación Libre', desc: 'Acceso a todas las máquinas de fuerza y peso libre. Entrena a tu ritmo.', isFreeAccess: true, duration: undefined },
    { name: 'Zona Cardio', desc: 'Acceso a cintas, elípticas, escaladoras y bicicletas estáticas.', isFreeAccess: true, duration: undefined },
    { name: 'Open Box CrossFit', desc: 'Uso libre del área de entrenamiento funcional y halterofilia.', isFreeAccess: true, duration: undefined },
    { name: 'Área de Estiramiento', desc: 'Espacio dedicado a elongación, movilidad y recuperación activa.', isFreeAccess: true, duration: undefined },
    { name: 'Zona Funcional Libre', desc: 'Acceso libre a pesas rusas, cajones, balones medicinales y sogas.', isFreeAccess: true, duration: undefined },
    { name: 'Natación Libre', desc: 'Acceso a la piscina olímpica para nado libre por carriles.', isFreeAccess: true, duration: undefined },
    
    { name: 'Zumba Masterclass', desc: 'Clase de baile fitness de alta intensidad con ritmos latinos y urbanos.', isFreeAccess: false, duration: 60 },
    { name: 'Yoga Inicial', desc: 'Clase de Hatha Yoga para principiantes. Mejora flexibilidad y reduce estrés.', isFreeAccess: false, duration: 60 },
    { name: 'Yoga Avanzado', desc: 'Vinyasa Flow intenso para practicantes experimentados.', isFreeAccess: false, duration: 90 },
    { name: 'Pilates Mat', desc: 'Pilates en colchoneta enfocado en el core, postura y control corporal.', isFreeAccess: false, duration: 45 },
    { name: 'Spinning (Indoor Cycling)', desc: 'Clase guiada en bicicleta estática con simulación de rutas y sprints.', isFreeAccess: false, duration: 45 },
    { name: 'CrossFit WOD', desc: 'Workout of the Day. Entrenamiento funcional de alta intensidad guiado por coach.', isFreeAccess: false, duration: 60 },
    { name: 'Boxeo Recreativo', desc: 'Técnicas de boxeo, golpeo al saco y acondicionamiento físico sin contacto.', isFreeAccess: false, duration: 60 },
    { name: 'TRX Suspensión', desc: 'Entrenamiento funcional utilizando tu propio peso corporal en cintas TRX.', isFreeAccess: false, duration: 45 },
    { name: 'Entrenamiento Funcional HIIT', desc: 'Intervalos de alta intensidad para quemar grasa y tonificar rápidamente.', isFreeAccess: false, duration: 30 },
    { name: 'Glúteos, Abdomen y Piernas (GAP)', desc: 'Clase localizada para fortalecer el tren inferior y core.', isFreeAccess: false, duration: 45 },
    { name: 'Body Pump', desc: 'Clase con barras y discos al ritmo de la música para trabajar todos los grupos musculares.', isFreeAccess: false, duration: 60 },
    { name: 'AquaGym', desc: 'Gimnasia acuática de bajo impacto, ideal para articulaciones.', isFreeAccess: false, duration: 45 },
    { name: 'Kickboxing', desc: 'Clase combinando patadas y golpes de puño para mejorar capacidad cardiovascular.', isFreeAccess: false, duration: 60 },
    { name: 'Danza Árabe', desc: 'Clase de danza oriental enfocada en el control y disociación corporal.', isFreeAccess: false, duration: 60 }
  ];

  const usedPerBranch = new Map<number, Set<string>>();
  for (let i = 0; i < 80; i++) {
    const branch = savedBranches[i % savedBranches.length];
    const def = serviceDefinitions[i % serviceDefinitions.length];

    if (!usedPerBranch.has(branch.id)) usedPerBranch.set(branch.id, new Set());
    const used = usedPerBranch.get(branch.id)!;
    if (used.has(def.name)) continue;
    used.add(def.name);

    const activity = await actRepo.save(actRepo.create({
      gymId:              branch.id,
      name:               def.name,
      description:        def.desc,
      defaultDurationMin: def.duration,
      isActive:           true,
      isFreeAccess:       def.isFreeAccess
    }));

    // Si NO es libre, requiere horarios (GymActivitySchedule)
    // REGLA: 4 horarios por actividad con días en nombre COMPLETO (DayOfWeek del frontend)
    if (!def.isFreeAccess && instructors.length > 0) {
      const schedulesToCreate: GymActivitySchedule[] = [];

      // Dos bloques horarios distintos por actividad (mañana y tarde)
      const duration = def.duration || 60;
      const slots = [
        { startHour: 8  + (i % 4) },  // turno mañana  08:00–12:00
        { startHour: 16 + (i % 4) },  // turno tarde   16:00–20:00
      ];

      // 4 días distintos usando nombre COMPLETO para que coincida con DayOfWeek del frontend
      const allDayGroups: string[][] = [
        ['LUNES', 'MIERCOLES', 'VIERNES', 'SABADO'],
        ['MARTES', 'JUEVES',   'SABADO',  'DOMINGO'],
      ];
      const days = allDayGroups[i % 2];

      let slotIdx = 0;
      for (const d of days) {
        const slot = slots[slotIdx % slots.length];
        slotIdx++;
        const startH = Math.min(slot.startHour, 19); // tope 19:00
        const endH   = Math.min(startH + Math.floor(duration / 60), 22);
        const endM   = duration % 60;
        const instructor = instructors[(i + slotIdx) % instructors.length];

        schedulesToCreate.push(actSchedRepo.create({
          gymActivityId: activity.id,
          instructorId:  instructor.id,
          dayOfWeek:     d,
          startTime:     `${String(startH).padStart(2, '0')}:00:00`,
          endTime:       `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00`,
          maxAttendees:  15 + (i % 10), // Cupos entre 15 y 24
          isRecurring:   true,
        }));
      }
      await actSchedRepo.save(schedulesToCreate);
    }
  }

  // ── Catálogo de ejercicios con imágenes de equipo ──────────────────────────
  const exercises: Partial<ExerciseCatalog>[] = [
    { name: 'Press de Banca Plano', muscleGroup: 'Pectorales',    category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Barra olímpica, banco plano',        youtubeVideoId: '48L0oQApm_0' , logType: 'WEIGHT_REPS' },
    { name: 'Press de Banca Inclinado', muscleGroup: 'Pectorales',    category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Barra olímpica, banco inclinado',    youtubeVideoId: 'TAH8RxOS0VI' , logType: 'WEIGHT_REPS' },
    { name: 'Aperturas con Mancuernas', muscleGroup: 'Pectorales',    category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'BASICO',     equipmentRequired: 'Mancuernas, banco plano',            youtubeVideoId: '48L0oQApm_0' , logType: 'WEIGHT_REPS' },
    { name: 'Fondos en Paralelas', muscleGroup: 'Pectorales',    category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Paralelas',                         youtubeVideoId: 'TAH8RxOS0VI' , logType: 'REPS_ONLY' },
    { name: 'Crossover en Polea', muscleGroup: 'Pectorales',    category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'BASICO',     equipmentRequired: 'Polea alta',                         youtubeVideoId: '48L0oQApm_0' , logType: 'WEIGHT_REPS' },
    { name: 'Push-ups (Flexiones)', muscleGroup: 'Pectorales',    category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'BASICO',     equipmentRequired: '',                                    youtubeVideoId: 'TAH8RxOS0VI' , logType: 'REPS_ONLY' },
    { name: 'Jalón al Pecho', muscleGroup: 'Dorsales',      category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'BASICO',     equipmentRequired: 'Polea alta',                         youtubeVideoId: 'tIoFoKz0aWs' , logType: 'WEIGHT_REPS' },
    { name: 'Remo con Barra', muscleGroup: 'Dorsales',      category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Barra',                               youtubeVideoId: 'tIoFoKz0aWs' , logType: 'WEIGHT_REPS' },
    { name: 'Remo con Mancuerna', muscleGroup: 'Dorsales',      category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'BASICO',     equipmentRequired: 'Mancuerna, banco',                    youtubeVideoId: 'tIoFoKz0aWs' , logType: 'WEIGHT_REPS' },
    { name: 'Dominadas (Pull-ups)', muscleGroup: 'Dorsales',      category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'AVANZADO',   equipmentRequired: 'Barra dominadas',                     youtubeVideoId: 'MPbRERVWkbg' , logType: 'REPS_ONLY' },
    { name: 'Remo en Polea Baja', muscleGroup: 'Dorsales',      category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'BASICO',     equipmentRequired: 'Polea baja',                         youtubeVideoId: 'tIoFoKz0aWs' , logType: 'WEIGHT_REPS' },
    { name: 'Pullover con Mancuerna', muscleGroup: 'Dorsales',      category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Mancuerna, banco',                    youtubeVideoId: 'tIoFoKz0aWs' , logType: 'WEIGHT_REPS' },
    { name: 'Press Militar con Barra', muscleGroup: 'Hombros',       category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Barra',                               youtubeVideoId: 'CpvyRFjbgow' , logType: 'WEIGHT_REPS' },
    { name: 'Press de Hombros con Mancuernas', muscleGroup: 'Hombros',       category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'BASICO',     equipmentRequired: 'Mancuernas',                         youtubeVideoId: 'IuR427toLXE' , logType: 'WEIGHT_REPS' },
    { name: 'Elevaciones Laterales', muscleGroup: 'Hombros',       category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'BASICO',     equipmentRequired: 'Mancuernas',                         youtubeVideoId: 'UEzs_TIAOnk' , logType: 'WEIGHT_REPS' },
    { name: 'Elevaciones Frontales', muscleGroup: 'Hombros',       category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'BASICO',     equipmentRequired: 'Mancuernas',                         youtubeVideoId: 'CpvyRFjbgow' , logType: 'WEIGHT_REPS' },
    { name: 'Vuelos Posteriores', muscleGroup: 'Hombros',       category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'BASICO',     equipmentRequired: 'Mancuernas',                         youtubeVideoId: 'IuR427toLXE' , logType: 'WEIGHT_REPS' },
    { name: 'Curl de Bíceps con Barra', muscleGroup: 'Bíceps',        category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'BASICO',     equipmentRequired: 'Barra',                               youtubeVideoId: 'LrXGP_Tda-A' , logType: 'WEIGHT_REPS' },
    { name: 'Curl con Mancuernas Alterno', muscleGroup: 'Bíceps',        category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'BASICO',     equipmentRequired: 'Mancuernas',                         youtubeVideoId: 'WrpQYs_n_Pw' , logType: 'WEIGHT_REPS' },
    { name: 'Curl en Polea Baja', muscleGroup: 'Bíceps',        category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'BASICO',     equipmentRequired: 'Polea baja',                         youtubeVideoId: 'Rr4UZ-xYfzg' , logType: 'WEIGHT_REPS' },
    { name: 'Curl Martillo', muscleGroup: 'Bíceps',        category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'BASICO',     equipmentRequired: 'Mancuernas',                         youtubeVideoId: 'LrXGP_Tda-A' , logType: 'WEIGHT_REPS' },
    { name: 'Curl Concentrado', muscleGroup: 'Bíceps',        category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'BASICO',     equipmentRequired: 'Mancuerna',                          youtubeVideoId: 'WrpQYs_n_Pw' , logType: 'WEIGHT_REPS' },
    { name: 'Press Francés', muscleGroup: 'Tríceps',       category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Barra EZ, banco',                    youtubeVideoId: 'emnTk9VixDA' , logType: 'WEIGHT_REPS' },
    { name: 'Extensiones en Polea Alta', muscleGroup: 'Tríceps',       category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'BASICO',     equipmentRequired: 'Polea alta',                         youtubeVideoId: 'Krfjkf98XUQ' , logType: 'WEIGHT_REPS' },
    { name: 'Extensiones con Mancuerna sobre la Cabeza', muscleGroup: 'Tríceps', category: 'FUERZA',  exerciseType: 'STRENGTH',  difficultyLevel: 'BASICO',     equipmentRequired: 'Mancuerna',                          youtubeVideoId: 'qY1UeoXn4sM' , logType: 'WEIGHT_REPS' },
    { name: 'Patada de Tríceps', muscleGroup: 'Tríceps',       category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'BASICO',     equipmentRequired: 'Mancuerna',                          youtubeVideoId: 'Krfjkf98XUQ' , logType: 'WEIGHT_REPS' },
    { name: 'Fondos para Tríceps', muscleGroup: 'Tríceps',       category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'BASICO',     equipmentRequired: 'Banco o silla',                      youtubeVideoId: 'emnTk9VixDA' , logType: 'REPS_ONLY' },
    { name: 'Sentadilla con Barra (Back Squat)', muscleGroup: 'Cuádriceps',    category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Barra, rack',                        youtubeVideoId: 'l3m4FnO1GQk' , logType: 'WEIGHT_REPS' },
    { name: 'Sentadilla Frontal (Front Squat)', muscleGroup: 'Cuádriceps',    category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'AVANZADO',   equipmentRequired: 'Barra, rack',                        youtubeVideoId: '7xeLHxobaWs' , logType: 'WEIGHT_REPS' },
    { name: 'Prensa de Piernas', muscleGroup: 'Cuádriceps',    category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'BASICO',     equipmentRequired: 'Máquina prensa',                     youtubeVideoId: 'l3m4FnO1GQk' , logType: 'WEIGHT_REPS' },
    { name: 'Zancadas (Lunges)', muscleGroup: 'Cuádriceps',    category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'BASICO',     equipmentRequired: 'Mancuernas o cuerpo',                youtubeVideoId: '7xeLHxobaWs' , logType: 'WEIGHT_REPS' },
    { name: 'Sentadilla Búlgara', muscleGroup: 'Cuádriceps',    category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Mancuernas, banco',                  youtubeVideoId: 'l3m4FnO1GQk' , logType: 'WEIGHT_REPS' },
    { name: 'Extensión de Cuádriceps', muscleGroup: 'Cuádriceps',    category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'BASICO',     equipmentRequired: 'Máquina de extensión',               youtubeVideoId: '7xeLHxobaWs' , logType: 'WEIGHT_REPS' },
    { name: 'Peso Muerto (Deadlift)', muscleGroup: 'Isquiotibiales',category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'AVANZADO',   equipmentRequired: 'Barra',                               youtubeVideoId: 'K2tRdc8_JBQ' , logType: 'WEIGHT_REPS' },
    { name: 'Peso Muerto Rumano', muscleGroup: 'Isquiotibiales',category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Barra o mancuernas',                 youtubeVideoId: '0XL4cZR2Ink' , logType: 'WEIGHT_REPS' },
    { name: 'Curl de Piernas (Máquina)', muscleGroup: 'Isquiotibiales',category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'BASICO',     equipmentRequired: 'Máquina curl',                       youtubeVideoId: 'K2tRdc8_JBQ' , logType: 'WEIGHT_REPS' },
    { name: 'Buenos Días (Good Mornings)', muscleGroup: 'Isquiotibiales',category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Barra',                               youtubeVideoId: 'i0B357H-1X0' , logType: 'WEIGHT_REPS' },
    { name: 'Elevación de Gemelos de Pie', muscleGroup: 'Gemelos',       category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'BASICO',     equipmentRequired: 'Máquina o libre',                    youtubeVideoId: 'K2tRdc8_JBQ' , logType: 'WEIGHT_REPS' },
    { name: 'Elevación de Gemelos Sentado', muscleGroup: 'Gemelos',       category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'BASICO',     equipmentRequired: 'Máquina de gemelos',                 youtubeVideoId: '0XL4cZR2Ink' , logType: 'WEIGHT_REPS' },
    { name: 'Crunch Abdominal', muscleGroup: 'Core',          category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'BASICO',     equipmentRequired: '',                                    youtubeVideoId: 'yH21VMyM-AQ' , logType: 'REPS_ONLY' },
    { name: 'Plancha (Plank)', muscleGroup: 'Core',          category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'BASICO',     equipmentRequired: '',                                    youtubeVideoId: '5GnLgqGIYOM' , logType: 'TIME_ONLY' },
    { name: 'Elevación de Piernas Colgado', muscleGroup: 'Core',          category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Barra dominadas',                    youtubeVideoId: 'yH21VMyM-AQ' , logType: 'REPS_ONLY' },
    { name: 'Russian Twist', muscleGroup: 'Core',          category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'BASICO',     equipmentRequired: 'Disco o pelota',                     youtubeVideoId: '5GnLgqGIYOM' , logType: 'WEIGHT_REPS' },
    { name: 'Ab Wheel (Rueda Abdominal)', muscleGroup: 'Core',          category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Rueda abdominal',                    youtubeVideoId: 'yH21VMyM-AQ' , logType: 'WEIGHT_REPS' },
    { name: 'Crunches en Polea', muscleGroup: 'Core',          category: 'FUERZA',    exerciseType: 'STRENGTH',  difficultyLevel: 'BASICO',     equipmentRequired: 'Polea alta',                         youtubeVideoId: '5GnLgqGIYOM' , logType: 'WEIGHT_REPS' },
    { name: 'Correr en Cinta', muscleGroup: 'Cardio',        category: 'CARDIO',    exerciseType: 'CARDIO',    difficultyLevel: 'BASICO',     equipmentRequired: 'Cinta de correr',                    youtubeVideoId: '558gGuArShk' , logType: 'TIME_DISTANCE' },
    { name: 'Bicicleta Estática', muscleGroup: 'Cardio',        category: 'CARDIO',    exerciseType: 'CARDIO',    difficultyLevel: 'BASICO',     equipmentRequired: 'Bicicleta estática',                 youtubeVideoId: 'isRKgI3OOPM' , logType: 'TIME_DISTANCE' },
    { name: 'Elíptica', muscleGroup: 'Cardio',        category: 'CARDIO',    exerciseType: 'CARDIO',    difficultyLevel: 'BASICO',     equipmentRequired: 'Máquina elíptica',                   youtubeVideoId: '558gGuArShk' , logType: 'TIME_DISTANCE' },
    { name: 'Remo en Máquina (Rowing)', muscleGroup: 'Cardio',        category: 'CARDIO',    exerciseType: 'CARDIO',    difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Máquina de remo',                    youtubeVideoId: 'tIoFoKz0aWs' , logType: 'TIME_DISTANCE' },
    { name: 'Caminata Rápida', muscleGroup: 'Cardio',        category: 'CARDIO',    exerciseType: 'CARDIO',    difficultyLevel: 'BASICO',     equipmentRequired: 'Cinta o exterior',                   youtubeVideoId: '558gGuArShk' , logType: 'TIME_DISTANCE' },
    { name: 'Caminata con Inclinación Progresiva', muscleGroup: 'Cardio',        category: 'CARDIO',    exerciseType: 'CARDIO',    difficultyLevel: 'BASICO',     equipmentRequired: 'Cinta de correr',                    youtubeVideoId: 'isRKgI3OOPM' , logType: 'TIME_DISTANCE' },
    { name: 'Sprint en Cinta', muscleGroup: 'Cardio',        category: 'CARDIO',    exerciseType: 'CARDIO',    difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Cinta de correr',                    youtubeVideoId: '558gGuArShk' , logType: 'TIME_DISTANCE' },
    { name: 'Cycling Intervals', muscleGroup: 'Cardio',        category: 'CARDIO',    exerciseType: 'CARDIO',    difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Bicicleta estática',                 youtubeVideoId: 'isRKgI3OOPM' , logType: 'TIME_DISTANCE' },
    { name: 'Burpees', muscleGroup: 'Funcional',     category: 'FUNCIONAL', exerciseType: 'FUNCTIONAL',difficultyLevel: 'INTERMEDIO', equipmentRequired: '',                                    youtubeVideoId: '558gGuArShk' , logType: 'REPS_ONLY' },
    { name: 'Box Jump (Salto al Cajón)', muscleGroup: 'Funcional',     category: 'FUNCIONAL', exerciseType: 'FUNCTIONAL',difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Cajón pliométrico',                  youtubeVideoId: 'isRKgI3OOPM' , logType: 'REPS_ONLY' },
    { name: 'Kettlebell Swing', muscleGroup: 'Funcional',     category: 'FUNCIONAL', exerciseType: 'FUNCTIONAL',difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Kettlebell',                         youtubeVideoId: '0XL4cZR2Ink' , logType: 'WEIGHT_REPS' },
    { name: 'Wall Ball', muscleGroup: 'Funcional',     category: 'FUNCIONAL', exerciseType: 'FUNCTIONAL',difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Balón medicinal, pared',             youtubeVideoId: '558gGuArShk' , logType: 'WEIGHT_REPS' },
    { name: 'Slam Ball', muscleGroup: 'Funcional',     category: 'FUNCIONAL', exerciseType: 'FUNCTIONAL',difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Slam ball',                          youtubeVideoId: 'isRKgI3OOPM' , logType: 'WEIGHT_REPS' },
    { name: 'Tire Flip (Volteo de Llanta)', muscleGroup: 'Funcional',     category: 'FUNCIONAL', exerciseType: 'FUNCTIONAL',difficultyLevel: 'AVANZADO',   equipmentRequired: 'Llanta',                               youtubeVideoId: 'K2tRdc8_JBQ' , logType: 'WEIGHT_REPS' },
    { name: 'Tabata Squat', muscleGroup: 'HIIT',          category: 'FUNCIONAL', exerciseType: 'HIIT',      difficultyLevel: 'INTERMEDIO', equipmentRequired: '',                                    youtubeVideoId: 'l3m4FnO1GQk' , logType: 'REPS_ONLY' },
    { name: 'Tabata Push-ups', muscleGroup: 'HIIT',          category: 'FUNCIONAL', exerciseType: 'HIIT',      difficultyLevel: 'INTERMEDIO', equipmentRequired: '',                                    youtubeVideoId: 'TAH8RxOS0VI' , logType: 'REPS_ONLY' },
    { name: 'Mountain Climbers', muscleGroup: 'HIIT',          category: 'FUNCIONAL', exerciseType: 'HIIT',      difficultyLevel: 'BASICO',     equipmentRequired: '',                                    youtubeVideoId: 'yH21VMyM-AQ' , logType: 'REPS_ONLY' },
    { name: 'Jump Rope (Saltar la Cuerda)', muscleGroup: 'HIIT',          category: 'FUNCIONAL', exerciseType: 'HIIT',      difficultyLevel: 'BASICO',     equipmentRequired: 'Cuerda de saltar',                   youtubeVideoId: 'isRKgI3OOPM' , logType: 'REPS_ONLY' },
    { name: 'Estiramiento de Cuádriceps', muscleGroup: 'Movilidad',     category: 'FUNCIONAL', exerciseType: 'MOBILITY',  difficultyLevel: 'BASICO',     equipmentRequired: '',                                    youtubeVideoId: 'l3m4FnO1GQk' , logType: 'REPS_ONLY' },
    { name: 'Hip Flexor Stretch', muscleGroup: 'Movilidad',     category: 'FUNCIONAL', exerciseType: 'MOBILITY',  difficultyLevel: 'BASICO',     equipmentRequired: '',                                    youtubeVideoId: '0XL4cZR2Ink' , logType: 'TIME_ONLY' },
    { name: "World's Greatest Stretch",            muscleGroup: 'Movilidad',     category: 'FUNCIONAL', exerciseType: 'MOBILITY',  difficultyLevel: 'INTERMEDIO', equipmentRequired: '',                                    youtubeVideoId: '5GnLgqGIYOM' },
    { name: 'Cat-Cow Stretch', muscleGroup: 'Movilidad',     category: 'FUNCIONAL', exerciseType: 'MOBILITY',  difficultyLevel: 'BASICO',     equipmentRequired: '',                                    youtubeVideoId: 'yH21VMyM-AQ' , logType: 'TIME_ONLY' },
    { name: 'Pigeon Pose', muscleGroup: 'Movilidad',     category: 'FUNCIONAL', exerciseType: 'MOBILITY',  difficultyLevel: 'BASICO',     equipmentRequired: '',                                    youtubeVideoId: '0XL4cZR2Ink' , logType: 'TIME_ONLY' },
    { name: 'Shoulder Stretch', muscleGroup: 'Movilidad',     category: 'FUNCIONAL', exerciseType: 'MOBILITY',  difficultyLevel: 'BASICO',     equipmentRequired: '',                                    youtubeVideoId: 'CpvyRFjbgow' , logType: 'TIME_ONLY' }
  ];

  for (const ex of exercises) {
    await exerciseRepo.save(exerciseRepo.create({ ...ex, isActive: true }));
  }

  // ── Resumen final ──────────────────────────────────────────────────────────
  await qr.release();
  await dataSource.destroy();

  console.log('\n✅ Seed completado exitosamente.');
  console.log('─'.repeat(60));
  console.log(`   Roles:       9  (IDs 1-9, sincronizados con el frontend)`);
  console.log(`   Marcas:      10 (IDs 1-10)`);
  console.log(`   Sucursales:  30 (IDs 11-40)`);
  console.log(`   Usuarios:    ${keyUsers.length + 50} (${keyUsers.length} clave + 50 aleatorios)`);
  console.log(`   Actividades: 50`);
  console.log(`   Ejercicios:  ${exercises.length}`);
  console.log('─'.repeat(60));
  console.log('\n📋 Credenciales de prueba (contraseña: Aaron123*)');
  console.log('─'.repeat(60));
  console.log('  admin@gymsync.com           → SUPER_ADMIN       (web)');
  console.log('  gerente@gymsync.com         → GERENTE           (web)');
  console.log('  recepcion@gymsync.com       → RECEPCIONISTA     (web)');
  console.log('  entrenador@gymsync.com      → ENTRENADOR        (móvil)');
  console.log('  instructor@gymsync.com      → INSTRUCTOR        (móvil)');
  console.log('  nutricionista@gymsync.com   → NUTRICIONISTA     (móvil)');
  console.log('  cliente@gymsync.com         → USER/CLIENTE      (móvil)');
  console.log('─'.repeat(60));

  process.exit(0);
}

runSeed().catch(err => {
  console.error('❌ Error en el seeder:', err);
  process.exit(1);
});
