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
import { MachineInventory, MachineStatus, MachineCategory } from '../gyms/domain/machine-inventory.entity';

async function runSeed() {
  const dataSource = await AppDataSource.initialize();
  const qr = dataSource.createQueryRunner();
  await qr.connect();

  const phantomTables = [
    'gym_infrastructure', 'gym_location',
    'gym_activity_schedule', 'gym_activity', 'exercise_catalog',
  ];
  for (const t of phantomTables) {
    await qr.query(`DROP TABLE IF EXISTS "${t}" CASCADE;`);
  }

  const tables = [
    'trainer_plans', 'nutritional_appointments', 'staff_schedules', 'client_advisors',
    'role_permissions', 'user_roles',
    'workout_sets', 'workout_sessions',
    'reservations', 'check_ins', 'waitlist_entries', 'visits',
    'gym_activity_attendance', 'gym_activity_schedules', 'gym_activities',
    'machine_inventory', 'gym_schedules', 'gym_locations', 'gyms',
    'emergency_contacts', 'user_profiles', 'users',
    'permissions', 'roles', 'exercises',
    'routine_exercises', 'routines',
    'physical_metrics_history',
    'user_training', 'user_training_goals', 'user_training_preferences',
    'user_training_restrictions',
    'notification_templates', 'notifications', 'user_notification_preferences',
    'subscription_payments', 'user_subscriptions', 'subscription_plans',
    'system_settings',
  ];
  for (const t of tables) {
    try {
      await qr.query(`TRUNCATE TABLE "${t}" RESTART IDENTITY CASCADE;`);
    } catch {
      // Ignore
    }
  }

  const roleRepo = qr.manager.getRepository(Role);
  const rolesData = [
    { name: 'SUPER_ADMIN', hierarchyLevel: 10, description: 'Administrador Global', isSystemRole: true },
    { name: 'GERENTE', hierarchyLevel: 5, description: 'Gerente de Marca', isSystemRole: true },
    { name: 'RECEPCIONISTA', hierarchyLevel: 4, description: 'Recepcionista', isSystemRole: true },
    { name: 'ENTRENADOR', hierarchyLevel: 3, description: 'Entrenador Personal', isSystemRole: true },
    { name: 'NUTRICIONISTA', hierarchyLevel: 3, description: 'Nutricionista', isSystemRole: true },
    { name: 'INSTRUCTOR', hierarchyLevel: 2, description: 'Instructor', isSystemRole: true },
    { name: 'COORDINADOR', hierarchyLevel: 2, description: 'Coordinador de Sede', isSystemRole: false },
    { name: 'CLIENTE', hierarchyLevel: 1, description: 'Cliente', isSystemRole: true },
    { name: 'PERSONAL_DE_LIMPIEZA', hierarchyLevel: 1, description: 'Limpieza', isSystemRole: false },
  ];

  const savedRoles: Role[] = [];
  for (const r of rolesData) {
    savedRoles.push(await roleRepo.save(roleRepo.create(r)));
  }

  const roleByName = (name: string): Role => {
    const found = savedRoles.find(r => r.name === name);
    if (!found) throw new Error(`Role ${name} not found`);
    return found;
  };

  const gymRepo = qr.manager.getRepository(Gym);
  const locRepo = qr.manager.getRepository(GymLocation);
  const schedRepo = qr.manager.getRepository(GymSchedule);
  const machineRepo = qr.manager.getRepository(MachineInventory);

  const brandNames = ['Premier', 'Megatlon', 'Smart Fit', 'Reyes', 'Sport', 'Bio Center', 'Olimpia', 'Fit Bull', 'VIP', 'Body Masters'];
  const savedBrands: Gym[] = [];
  for (const bName of brandNames) {
    savedBrands.push(await gymRepo.save(gymRepo.create({
      name: bName, description: 'Cadena matriz',
      maxCapacity: 0, isActive: true, isOpen: true,
    })));
  }

  const savedBranches: Gym[] = [];
  const sczZones = [
    { zone: 'Equipetrol', address: 'Av. San Martin, 3er Anillo Interno', lat: -17.7667, lng: -63.1970 },
    { zone: 'Centro', address: 'Calle 24 de Septiembre 150', lat: -17.7833, lng: -63.1821 },
    { zone: 'Urubo', address: 'Av. Principal del Urubo', lat: -17.7512, lng: -63.2201 },
    { zone: 'Plan 3000', address: 'Rotonda del Plan 3000', lat: -17.8335, lng: -63.1415 },
    { zone: 'Villa 1ro de Mayo', address: 'Plaza Principal', lat: -17.8011, lng: -63.1366 },
    { zone: 'Santos Dumont', address: 'Av. Santos Dumont', lat: -17.8172, lng: -63.1855 },
    { zone: 'Banzer', address: 'Av. Banzer', lat: -17.7441, lng: -63.1702 },
    { zone: 'Doble Via La Guardia', address: 'Doble Via a La Guardia', lat: -17.8089, lng: -63.2081 },
    { zone: 'Mutualista', address: 'Av. Mutualista', lat: -17.7655, lng: -63.1598 },
    { zone: 'Las Palmas', address: 'Barrio Las Palmas', lat: -17.7951, lng: -63.2005 },
  ];

  const C = MachineCategory;
  const BASE_MACHINES = [
    { base: 'Cinta de Correr', brand: 'Precor', qty: 2, cat: C.CARDIO },
    { base: 'Bicicleta Estatica', brand: 'Life Fitness', qty: 2, cat: C.CARDIO },
    { base: 'Eliptica', brand: 'Technogym', qty: 1, cat: C.CARDIO },
    { base: 'Press de Banca', brand: 'Hammer Strength', qty: 1, cat: C.TREN_SUPERIOR },
    { base: 'Prensa de Piernas', brand: 'Cybex', qty: 1, cat: C.TREN_INFERIOR },
    { base: 'Polea Cruzada', brand: 'Technogym', qty: 1, cat: C.MULTIESTACION },
    { base: 'Smith Machine', brand: 'Precor', qty: 1, cat: C.MULTIESTACION },
    { base: 'Hack Squat', brand: 'Hammer Strength', qty: 1, cat: C.TREN_INFERIOR },
    { base: 'Remo Sentado', brand: 'Nautilus', qty: 1, cat: C.ESPALDA },
    { base: 'Lat Pulldown', brand: 'Matrix', qty: 1, cat: C.ESPALDA },
  ];
  const EXTRA_MACHINES = [
    { base: 'Extension de Cuadriceps', brand: 'Star Trac', qty: 1, cat: C.TREN_INFERIOR },
    { base: 'Curl de Piernas', brand: 'Cybex', qty: 1, cat: C.TREN_INFERIOR },
    { base: 'Pec Deck', brand: 'Life Fitness', qty: 1, cat: C.TREN_SUPERIOR },
    { base: 'Press Militar', brand: 'Cybex', qty: 1, cat: C.TREN_SUPERIOR },
    { base: 'Abductor Aductor', brand: 'Hoist', qty: 1, cat: C.TREN_INFERIOR },
  ];
  const UNIT_LABELS = ['A', 'B', 'C', 'D'];

  let branchIdx = 0;
  for (const parent of savedBrands) {
    for (let i = 0; i < 3; i++) {
      const zone = sczZones[(branchIdx + i) % sczZones.length];
      const branch = await gymRepo.save(gymRepo.create({
        name: `${parent.name} ${zone.zone}`,
        description: `Sucursal ${zone.zone}`,
        parentId: parent.id,
        maxCapacity: 100 + Math.floor(Math.random() * 200),
        isActive: true, isOpen: true,
      }));
      savedBranches.push(branch);

      await locRepo.save(locRepo.create({
        gymId: branch.id,
        address: zone.address,
        city: 'Santa Cruz',
        latitude: zone.lat + (Math.random() * 0.005 - 0.0025),
        longitude: zone.lng + (Math.random() * 0.005 - 0.0025),
      }));

      const extraCount = Math.floor(Math.random() * EXTRA_MACHINES.length);
      const allMachines = [...BASE_MACHINES, ...EXTRA_MACHINES.slice(0, extraCount)];
      const machineEntities: MachineInventory[] = [];
      for (const m of allMachines) {
        for (let u = 0; u < m.qty; u++) {
          const label = m.qty > 1 ? ` ${UNIT_LABELS[u]}` : '';
          const roll = Math.random();
          machineEntities.push(machineRepo.create({
            gymId: branch.id,
            name: `${m.base} ${m.brand}${label}`,
            status: roll < 0.80 ? MachineStatus.AVAILABLE : MachineStatus.MAINTENANCE,
            category: m.cat,
          }));
        }
      }
      await machineRepo.save(machineEntities);

      const daySchedules = ['LUN','MAR','MIE','JUE','VIE','SAB','DOM'].map(day => {
        let opens = '06:00:00', closes = '22:00:00', isHoliday = false;
        if (day === 'SAB') { opens = '07:00:00'; closes = '18:00:00'; }
        if (day === 'DOM') {
          opens = '08:00:00'; closes = '13:00:00';
          if (branchIdx % 3 === 0) isHoliday = true;
        }
        return schedRepo.create({ gymId: branch.id, dayOfWeek: day, opensAt: opens, closesAt: closes, isHoliday });
      });
      await schedRepo.save(daySchedules);
    }
    branchIdx += 3;
  }

  const userRepo = qr.manager.getRepository(User);
  const profileRepo = qr.manager.getRepository(UserProfile);
  const urRepo = qr.manager.getRepository(UserRole);

  const pwHash = await bcrypt.hash('Aaron123*', 10);

  const cleanString = (str: string) => {
    return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
  };

  const emailSet = new Set<string>();
  const generateEmail = (fn: string, ln: string) => {
    const baseEmail = `${cleanString(fn)}.${cleanString(ln)}@gmail.com`;
    let email = baseEmail;
    let counter = 1;
    while (emailSet.has(email)) {
      email = `${cleanString(fn)}.${cleanString(ln)}${counter}@gmail.com`;
      counter++;
    }
    emailSet.add(email);
    return email;
  };

  const FIRST_NAMES = [
    'Carlos','Maria','Jose','Ana','Luis','Sofia','Jorge','Lucia','Miguel','Laura',
    'Pedro','Carmen','Raul','Elena','Fernando','Paula','Diego','Marta','Javier','Sara',
    'Andres','Beatriz','Alejandro','Isabel','Manuel','Cristina','Daniel','Teresa','David','Rosa',
    'Adrian','Julia','Mario','Patricia','Alberto','Alba','Victor','Silvia','Marcos','Natalia',
    'Oscar','Irene','Ruben','Lorena','Ivan','Angela','Gabriel','Belen','Hugo','Rocio',
  ];
  const LAST_NAMES = [
    'Gomez','Rodriguez','Fernandez','Lopez','Martinez','Sanchez','Perez','Martin','Garcia','Ruiz',
    'Diaz','Suarez','Romero','Alvarez','Torres','Navarro','Gutierrez','Molina','Blanco','Castro',
    'Ortiz','Rubio','Marin','Sanz','Iglesias','Vazquez','Ramos','Gil','Serrano','Mendez',
    'Cabrera','Medina','Rojas','Flores','Vargas','Rios','Castillo','Pena','Guzman','Leon',
    'Herrera','Cortes','Mora','Arias','Vega','Cruz','Mendoza','Soto','Campos','Delgado',
  ];

  let ni = 0;
  const nextName = () => ({
    fn: FIRST_NAMES[ni % FIRST_NAMES.length],
    ln: LAST_NAMES[(ni++ * 7 + 3) % LAST_NAMES.length],
  });
  const randPhone = () => `+5917${Math.floor(1000000 + Math.random() * 9000000)}`;
  const randCI = () => `${Math.floor(1000000 + Math.random() * 9000000)}`;

  let adminUserId: number | null = null;
  const createUser = async (fn: string, ln: string, roleName: string, gymId: number | null, withPhone = false, explicitEmail?: string) => {
    const email = explicitEmail || generateEmail(fn, ln);
    const user = await userRepo.save(userRepo.create({ email, passwordHash: pwHash, isActive: true }));
    if (roleName === 'SUPER_ADMIN' && adminUserId === null) {
      adminUserId = user.id;
    }
    await profileRepo.save(profileRepo.create({
      userId: user.id, firstName: fn, lastName: ln,
      phone: withPhone ? randPhone() : undefined,
      ci: randCI(),
      gender: ni % 2 === 0 ? 'Masculino' : 'Femenino',
    }));
    await urRepo.save(urRepo.create({
      userId: user.id, roleId: roleByName(roleName).id,
      gymId: gymId ?? undefined, assignedBy: adminUserId ?? undefined,
    }));
    return user;
  };

  await createUser('Super', 'Admin', 'SUPER_ADMIN', null, false, 'admin@gymsync.com');

  for (let i = 0; i < savedBrands.length; i++) {
    const { fn, ln } = nextName();
    await createUser(fn, ln, 'GERENTE', savedBrands[i].id, true);
  }

  const gymInstructors = new Map<number, number[]>();

  for (let bi = 0; bi < savedBranches.length; bi++) {
    const b = savedBranches[bi];
    const { fn: rFn, ln: rLn } = nextName();
    await createUser(rFn, rLn, 'RECEPCIONISTA', b.id);

    for (let j = 0; j < 2; j++) {
      const { fn, ln } = nextName();
      await createUser(fn, ln, 'ENTRENADOR', b.id, true);
    }

    gymInstructors.set(b.id, []);
    for (let j = 0; j < 2; j++) {
      const { fn, ln } = nextName();
      const inst = await createUser(fn, ln, 'INSTRUCTOR', b.id, true);
      gymInstructors.get(b.id)!.push(inst.id);
    }
  }

  const CLIENT_COUNT = 45;
  for (let i = 0; i < CLIENT_COUNT; i++) {
    const branch = savedBranches[i % savedBranches.length];
    const { fn, ln } = nextName();
    await createUser(fn, ln, 'CLIENTE', branch.id);
  }

  const actRepo = qr.manager.getRepository(GymActivity);
  const exerciseRepo = qr.manager.getRepository(ExerciseCatalog);
  const actSchedRepo = qr.manager.getRepository(GymActivitySchedule);

  const FREE_SERVICES = [
    { name: 'Musculacion Libre', desc: 'Acceso libre a maquinas', isFreeAccess: true, duration: undefined },
    { name: 'Zona Cardio', desc: 'Acceso a cintas y elipticas', isFreeAccess: true, duration: undefined },
    { name: 'Open Box', desc: 'Uso libre funcional', isFreeAccess: true, duration: undefined },
    { name: 'Area de Estiramiento', desc: 'Elongacion y movilidad', isFreeAccess: true, duration: undefined },
  ];

  const SCHEDULED_SERVICES = [
    { name: 'Zumba', desc: 'Baile fitness', isFreeAccess: false, duration: 60 },
    { name: 'Yoga', desc: 'Yoga fluido', isFreeAccess: false, duration: 60 },
    { name: 'Pilates', desc: 'Pilates core', isFreeAccess: false, duration: 45 },
    { name: 'Spinning', desc: 'Bicicleta estatica', isFreeAccess: false, duration: 45 },
    { name: 'CrossFit', desc: 'Entrenamiento funcional', isFreeAccess: false, duration: 60 },
    { name: 'Body Pump', desc: 'Clase con barras', isFreeAccess: false, duration: 60 },
    { name: 'HIIT', desc: 'Intervalos alta intensidad', isFreeAccess: false, duration: 30 },
  ];

  const DAY_GROUPS = [
    ['LUNES', 'MIERCOLES', 'VIERNES'],
    ['MARTES', 'JUEVES', 'SABADO'],
  ];
  const START_HOURS = [7, 9, 14, 18];

  for (let bi = 0; bi < savedBranches.length; bi++) {
    const branch = savedBranches[bi];

    const freeSvc = FREE_SERVICES[Math.floor(Math.random() * FREE_SERVICES.length)];
    const schedSvc = SCHEDULED_SERVICES[Math.floor(Math.random() * SCHEDULED_SERVICES.length)];

    const actsToCreate = [freeSvc, schedSvc];
    
    const extraSchedCandidates = SCHEDULED_SERVICES.filter(s => s.name !== schedSvc.name);
    actsToCreate.push(extraSchedCandidates[Math.floor(Math.random() * extraSchedCandidates.length)]);

    const branchInstructors = gymInstructors.get(branch.id) ?? [];

    for (let si = 0; si < actsToCreate.length; si++) {
      const def = actsToCreate[si];

      const activity = await actRepo.save(actRepo.create({
        gymId: branch.id,
        name: def.name,
        description: def.desc,
        defaultDurationMin: def.duration,
        isActive: true,
        isFreeAccess: def.isFreeAccess,
      }));

      if (!def.isFreeAccess && branchInstructors.length > 0) {
        const duration = def.duration!;
        const days = DAY_GROUPS[si % DAY_GROUPS.length];
        const startHour = START_HOURS[si % START_HOURS.length];
        const endHour = startHour + Math.floor(duration / 60);
        const endMin = duration % 60;
        const instructorId = branchInstructors[si % branchInstructors.length];

        const scheds = days.map(day => actSchedRepo.create({
          gymActivityId: activity.id,
          instructorId: instructorId,
          dayOfWeek: day,
          startTime: `${String(startHour).padStart(2, '0')}:00:00`,
          endTime: `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}:00`,
          maxAttendees: 15,
          isRecurring: true,
        }));
        await actSchedRepo.save(scheds);
      }
    }
  }

  const exercises: Partial<ExerciseCatalog>[] = [
  // --- PECHO ---
  { name: 'Press de Banca Plano', muscleGroup: 'Pecho', category: 'FUERZA', exerciseType: 'STRENGTH', difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Barra', logType: 'WEIGHT_REPS', youtubeVideoId: 'RCxikBS5Qy8' },
  { name: 'Press Inclinado con Barra', muscleGroup: 'Pecho', category: 'HIPERTROFIA', exerciseType: 'STRENGTH', difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Barra', logType: 'WEIGHT_REPS', youtubeVideoId: 'RCxikBS5Qy8' },
  { name: 'Press Inclinado con Mancuernas', muscleGroup: 'Pecho', category: 'HIPERTROFIA', exerciseType: 'STRENGTH', difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Mancuernas', logType: 'WEIGHT_REPS', youtubeVideoId: 'RCxikBS5Qy8' },
  { name: 'Aperturas con Mancuernas', muscleGroup: 'Pecho', category: 'HIPERTROFIA', exerciseType: 'STRENGTH', difficultyLevel: 'PRINCIPIANTE', equipmentRequired: 'Mancuernas', logType: 'WEIGHT_REPS', youtubeVideoId: 'UgmYbrytasw' },
  { name: 'Aperturas en Máquina (Peck Deck)', muscleGroup: 'Pecho', category: 'HIPERTROFIA', exerciseType: 'STRENGTH', difficultyLevel: 'PRINCIPIANTE', equipmentRequired: 'Máquina', logType: 'WEIGHT_REPS', youtubeVideoId: 'UgmYbrytasw' },
  { name: 'Fondos en Paralelas (Pecho)', muscleGroup: 'Pecho', category: 'FUERZA', exerciseType: 'STRENGTH', difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Peso Corporal', logType: 'REPS_ONLY', youtubeVideoId: 'ZtONmh5a_fU' },
  { name: 'Flexiones de Brazo (Push-ups)', muscleGroup: 'Pecho', category: 'RESISTENCIA', exerciseType: 'STRENGTH', difficultyLevel: 'PRINCIPIANTE', equipmentRequired: 'Ninguno', logType: 'REPS_ONLY', youtubeVideoId: 'ZtONmh5a_fU' },
  { name: 'Press Declinado con Barra', muscleGroup: 'Pecho', category: 'HIPERTROFIA', exerciseType: 'STRENGTH', difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Barra', logType: 'WEIGHT_REPS', youtubeVideoId: 'RCxikBS5Qy8' },
  { name: 'Cruces en Polea Baja', muscleGroup: 'Pecho', category: 'HIPERTROFIA', exerciseType: 'STRENGTH', difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Polea', logType: 'WEIGHT_REPS', youtubeVideoId: 'UgmYbrytasw' },
  { name: 'Cruces en Polea Alta', muscleGroup: 'Pecho', category: 'HIPERTROFIA', exerciseType: 'STRENGTH', difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Polea', logType: 'WEIGHT_REPS', youtubeVideoId: 'UgmYbrytasw' },
  { name: 'Pullover con Mancuerna', muscleGroup: 'Pecho', category: 'HIPERTROFIA', exerciseType: 'STRENGTH', difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Mancuernas', logType: 'WEIGHT_REPS', youtubeVideoId: 'UgmYbrytasw' },

  // --- PIERNA (CUÁDRICEPS, ISQUIOS, GLÚTEO, PANTORRILLA) ---
  { name: 'Sentadilla Libre', muscleGroup: 'Pierna', category: 'FUERZA', exerciseType: 'STRENGTH', difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Barra', logType: 'WEIGHT_REPS', youtubeVideoId: 'oe3q0FMu6v4' },
  { name: 'Sentadilla Frontal', muscleGroup: 'Pierna', category: 'FUERZA', exerciseType: 'STRENGTH', difficultyLevel: 'AVANZADO', equipmentRequired: 'Barra', logType: 'WEIGHT_REPS', youtubeVideoId: 'oe3q0FMu6v4' },
  { name: 'Sentadilla en Máquina Smith', muscleGroup: 'Pierna', category: 'HIPERTROFIA', exerciseType: 'STRENGTH', difficultyLevel: 'PRINCIPIANTE', equipmentRequired: 'Máquina', logType: 'WEIGHT_REPS', youtubeVideoId: 'oe3q0FMu6v4' },
  { name: 'Prensa de Piernas 45°', muscleGroup: 'Pierna', category: 'HIPERTROFIA', exerciseType: 'STRENGTH', difficultyLevel: 'PRINCIPIANTE', equipmentRequired: 'Máquina', logType: 'WEIGHT_REPS', youtubeVideoId: 'oe3q0FMu6v4' },
  { name: 'Sentadilla Hack', muscleGroup: 'Pierna', category: 'HIPERTROFIA', exerciseType: 'STRENGTH', difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Máquina', logType: 'WEIGHT_REPS', youtubeVideoId: 'oe3q0FMu6v4' },
  { name: 'Extensión de Cuádriceps', muscleGroup: 'Pierna', category: 'HIPERTROFIA', exerciseType: 'STRENGTH', difficultyLevel: 'PRINCIPIANTE', equipmentRequired: 'Máquina', logType: 'WEIGHT_REPS', youtubeVideoId: 'oe3q0FMu6v4' },
  { name: 'Curl de Femoral Tumbado', muscleGroup: 'Pierna', category: 'HIPERTROFIA', exerciseType: 'STRENGTH', difficultyLevel: 'PRINCIPIANTE', equipmentRequired: 'Máquina', logType: 'WEIGHT_REPS', youtubeVideoId: '34bf7rl-95o' },
  { name: 'Curl de Femoral Sentado', muscleGroup: 'Pierna', category: 'HIPERTROFIA', exerciseType: 'STRENGTH', difficultyLevel: 'PRINCIPIANTE', equipmentRequired: 'Máquina', logType: 'WEIGHT_REPS', youtubeVideoId: '34bf7rl-95o' },
  { name: 'Peso Muerto Rumano con Barra', muscleGroup: 'Pierna', category: 'HIPERTROFIA', exerciseType: 'STRENGTH', difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Barra', logType: 'WEIGHT_REPS', youtubeVideoId: '34bf7rl-95o' },
  { name: 'Peso Muerto Rumano con Mancuernas', muscleGroup: 'Pierna', category: 'HIPERTROFIA', exerciseType: 'STRENGTH', difficultyLevel: 'PRINCIPIANTE', equipmentRequired: 'Mancuernas', logType: 'WEIGHT_REPS', youtubeVideoId: '34bf7rl-95o' },
  { name: 'Zancadas (Lunges) Estáticas', muscleGroup: 'Pierna', category: 'HIPERTROFIA', exerciseType: 'STRENGTH', difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Mancuernas', logType: 'WEIGHT_REPS', youtubeVideoId: 'oe3q0FMu6v4' },
  { name: 'Sentadilla Búlgara', muscleGroup: 'Pierna', category: 'HIPERTROFIA', exerciseType: 'STRENGTH', difficultyLevel: 'AVANZADO', equipmentRequired: 'Mancuernas', logType: 'WEIGHT_REPS', youtubeVideoId: 'oe3q0FMu6v4' },
  { name: 'Hip Thrust con Barra', muscleGroup: 'Pierna', category: 'FUERZA', exerciseType: 'STRENGTH', difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Barra', logType: 'WEIGHT_REPS', youtubeVideoId: '34bf7rl-95o' },
  { name: 'Hip Thrust en Máquina', muscleGroup: 'Pierna', category: 'HIPERTROFIA', exerciseType: 'STRENGTH', difficultyLevel: 'PRINCIPIANTE', equipmentRequired: 'Máquina', logType: 'WEIGHT_REPS', youtubeVideoId: '34bf7rl-95o' },
  { name: 'Abducción de Cadera en Máquina', muscleGroup: 'Pierna', category: 'HIPERTROFIA', exerciseType: 'STRENGTH', difficultyLevel: 'PRINCIPIANTE', equipmentRequired: 'Máquina', logType: 'WEIGHT_REPS', youtubeVideoId: 'oe3q0FMu6v4' },
  { name: 'Aducción de Cadera en Máquina', muscleGroup: 'Pierna', category: 'HIPERTROFIA', exerciseType: 'STRENGTH', difficultyLevel: 'PRINCIPIANTE', equipmentRequired: 'Máquina', logType: 'WEIGHT_REPS', youtubeVideoId: 'oe3q0FMu6v4' },
  { name: 'Elevación de Talones de Pie', muscleGroup: 'Pierna', category: 'HIPERTROFIA', exerciseType: 'STRENGTH', difficultyLevel: 'PRINCIPIANTE', equipmentRequired: 'Máquina', logType: 'WEIGHT_REPS', youtubeVideoId: 'oe3q0FMu6v4' },
  { name: 'Elevación de Talones Sentado', muscleGroup: 'Pierna', category: 'HIPERTROFIA', exerciseType: 'STRENGTH', difficultyLevel: 'PRINCIPIANTE', equipmentRequired: 'Máquina', logType: 'WEIGHT_REPS', youtubeVideoId: 'oe3q0FMu6v4' },

  // --- ESPALDA ---
  { name: 'Dominadas Libres (Pronas)', muscleGroup: 'Espalda', category: 'FUERZA', exerciseType: 'STRENGTH', difficultyLevel: 'AVANZADO', equipmentRequired: 'Peso Corporal', logType: 'REPS_ONLY', youtubeVideoId: '_9rGBwreteE' },
  { name: 'Dominadas Supinas (Chin-ups)', muscleGroup: 'Espalda', category: 'FUERZA', exerciseType: 'STRENGTH', difficultyLevel: 'AVANZADO', equipmentRequired: 'Peso Corporal', logType: 'REPS_ONLY', youtubeVideoId: '_9rGBwreteE' },
  { name: 'Dominadas Asistidas', muscleGroup: 'Espalda', category: 'HIPERTROFIA', exerciseType: 'STRENGTH', difficultyLevel: 'PRINCIPIANTE', equipmentRequired: 'Máquina', logType: 'WEIGHT_REPS', youtubeVideoId: '_9rGBwreteE' },
  { name: 'Jalón al Pecho Agarre Abierto', muscleGroup: 'Espalda', category: 'HIPERTROFIA', exerciseType: 'STRENGTH', difficultyLevel: 'PRINCIPIANTE', equipmentRequired: 'Polea', logType: 'WEIGHT_REPS', youtubeVideoId: 'trZQjegcRx0' },
  { name: 'Jalón al Pecho Agarre Cerrado', muscleGroup: 'Espalda', category: 'HIPERTROFIA', exerciseType: 'STRENGTH', difficultyLevel: 'PRINCIPIANTE', equipmentRequired: 'Polea', logType: 'WEIGHT_REPS', youtubeVideoId: 'trZQjegcRx0' },
  { name: 'Remo con Barra', muscleGroup: 'Espalda', category: 'FUERZA', exerciseType: 'STRENGTH', difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Barra', logType: 'WEIGHT_REPS', youtubeVideoId: '2J61UenaFRw' },
  { name: 'Remo en Punta (T-Bar)', muscleGroup: 'Espalda', category: 'HIPERTROFIA', exerciseType: 'STRENGTH', difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Barra', logType: 'WEIGHT_REPS', youtubeVideoId: '2J61UenaFRw' },
  { name: 'Peso Muerto Convencional', muscleGroup: 'Espalda', category: 'FUERZA', exerciseType: 'STRENGTH', difficultyLevel: 'AVANZADO', equipmentRequired: 'Barra', logType: 'WEIGHT_REPS', youtubeVideoId: '34bf7rl-95o' },
  { name: 'Remo Gironda (Sentado en Polea)', muscleGroup: 'Espalda', category: 'HIPERTROFIA', exerciseType: 'STRENGTH', difficultyLevel: 'PRINCIPIANTE', equipmentRequired: 'Polea', logType: 'WEIGHT_REPS', youtubeVideoId: '2J61UenaFRw' },
  { name: 'Remo con Mancuerna a 1 Mano', muscleGroup: 'Espalda', category: 'HIPERTROFIA', exerciseType: 'STRENGTH', difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Mancuernas', logType: 'WEIGHT_REPS', youtubeVideoId: '2J61UenaFRw' },
  { name: 'Remo en Máquina (Chest Supported)', muscleGroup: 'Espalda', category: 'HIPERTROFIA', exerciseType: 'STRENGTH', difficultyLevel: 'PRINCIPIANTE', equipmentRequired: 'Máquina', logType: 'WEIGHT_REPS', youtubeVideoId: '2J61UenaFRw' },
  { name: 'Pulldown con Brazo Recto', muscleGroup: 'Espalda', category: 'HIPERTROFIA', exerciseType: 'STRENGTH', difficultyLevel: 'PRINCIPIANTE', equipmentRequired: 'Polea', logType: 'WEIGHT_REPS', youtubeVideoId: 'trZQjegcRx0' },

  // --- HOMBRO ---
  { name: 'Press Militar con Barra', muscleGroup: 'Hombro', category: 'FUERZA', exerciseType: 'STRENGTH', difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Barra', logType: 'WEIGHT_REPS', youtubeVideoId: 'TtSxS9xKlO0' },
  { name: 'Press Militar con Mancuernas', muscleGroup: 'Hombro', category: 'HIPERTROFIA', exerciseType: 'STRENGTH', difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Mancuernas', logType: 'WEIGHT_REPS', youtubeVideoId: 'TtSxS9xKlO0' },
  { name: 'Press Arnold', muscleGroup: 'Hombro', category: 'HIPERTROFIA', exerciseType: 'STRENGTH', difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Mancuernas', logType: 'WEIGHT_REPS', youtubeVideoId: 'TtSxS9xKlO0' },
  { name: 'Elevaciones Laterales con Mancuernas', muscleGroup: 'Hombro', category: 'HIPERTROFIA', exerciseType: 'STRENGTH', difficultyLevel: 'PRINCIPIANTE', equipmentRequired: 'Mancuernas', logType: 'WEIGHT_REPS', youtubeVideoId: 'iV4XoV8cFMI' },
  { name: 'Elevaciones Laterales en Polea', muscleGroup: 'Hombro', category: 'HIPERTROFIA', exerciseType: 'STRENGTH', difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Polea', logType: 'WEIGHT_REPS', youtubeVideoId: 'iV4XoV8cFMI' },
  { name: 'Face Pull', muscleGroup: 'Hombro', category: 'HIPERTROFIA', exerciseType: 'STRENGTH', difficultyLevel: 'PRINCIPIANTE', equipmentRequired: 'Polea', logType: 'WEIGHT_REPS', youtubeVideoId: 'iV4XoV8cFMI' },
  { name: 'Elevaciones Frontales', muscleGroup: 'Hombro', category: 'HIPERTROFIA', exerciseType: 'STRENGTH', difficultyLevel: 'PRINCIPIANTE', equipmentRequired: 'Mancuernas', logType: 'WEIGHT_REPS', youtubeVideoId: 'iV4XoV8cFMI' },
  { name: 'Pájaros (Posteriores con Mancuerna)', muscleGroup: 'Hombro', category: 'HIPERTROFIA', exerciseType: 'STRENGTH', difficultyLevel: 'PRINCIPIANTE', equipmentRequired: 'Mancuernas', logType: 'WEIGHT_REPS', youtubeVideoId: 'iV4XoV8cFMI' },
  { name: 'Pájaros en Máquina (Peck Deck Inverso)', muscleGroup: 'Hombro', category: 'HIPERTROFIA', exerciseType: 'STRENGTH', difficultyLevel: 'PRINCIPIANTE', equipmentRequired: 'Máquina', logType: 'WEIGHT_REPS', youtubeVideoId: 'iV4XoV8cFMI' },
  { name: 'Encogimientos con Barra (Trapecios)', muscleGroup: 'Hombro', category: 'HIPERTROFIA', exerciseType: 'STRENGTH', difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Barra', logType: 'WEIGHT_REPS', youtubeVideoId: 'TtSxS9xKlO0' },
  { name: 'Encogimientos con Mancuernas', muscleGroup: 'Hombro', category: 'HIPERTROFIA', exerciseType: 'STRENGTH', difficultyLevel: 'PRINCIPIANTE', equipmentRequired: 'Mancuernas', logType: 'WEIGHT_REPS', youtubeVideoId: 'TtSxS9xKlO0' },

  // --- BRAZO (BÍCEPS / TRÍCEPS) ---
  { name: 'Curl de Bíceps con Barra Recta', muscleGroup: 'Brazo', category: 'HIPERTROFIA', exerciseType: 'STRENGTH', difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Barra', logType: 'WEIGHT_REPS', youtubeVideoId: 'UDblkPDopgQ' },
  { name: 'Curl de Bíceps con Barra EZ', muscleGroup: 'Brazo', category: 'HIPERTROFIA', exerciseType: 'STRENGTH', difficultyLevel: 'PRINCIPIANTE', equipmentRequired: 'Barra', logType: 'WEIGHT_REPS', youtubeVideoId: 'UDblkPDopgQ' },
  { name: 'Curl de Bíceps Alterno', muscleGroup: 'Brazo', category: 'HIPERTROFIA', exerciseType: 'STRENGTH', difficultyLevel: 'PRINCIPIANTE', equipmentRequired: 'Mancuernas', logType: 'WEIGHT_REPS', youtubeVideoId: 'UDblkPDopgQ' },
  { name: 'Curl Martillo', muscleGroup: 'Brazo', category: 'HIPERTROFIA', exerciseType: 'STRENGTH', difficultyLevel: 'PRINCIPIANTE', equipmentRequired: 'Mancuernas', logType: 'WEIGHT_REPS', youtubeVideoId: 'UDblkPDopgQ' },
  { name: 'Curl Predicador en Máquina', muscleGroup: 'Brazo', category: 'HIPERTROFIA', exerciseType: 'STRENGTH', difficultyLevel: 'PRINCIPIANTE', equipmentRequired: 'Máquina', logType: 'WEIGHT_REPS', youtubeVideoId: 'UDblkPDopgQ' },
  { name: 'Curl Araña (Spider Curl)', muscleGroup: 'Brazo', category: 'HIPERTROFIA', exerciseType: 'STRENGTH', difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Mancuernas', logType: 'WEIGHT_REPS', youtubeVideoId: 'UDblkPDopgQ' },
  { name: 'Extensión de Tríceps en Polea Alta', muscleGroup: 'Brazo', category: 'HIPERTROFIA', exerciseType: 'STRENGTH', difficultyLevel: 'PRINCIPIANTE', equipmentRequired: 'Polea', logType: 'WEIGHT_REPS', youtubeVideoId: '3v4Zc7iujIk' },
  { name: 'Extensión de Tríceps con Cuerda', muscleGroup: 'Brazo', category: 'HIPERTROFIA', exerciseType: 'STRENGTH', difficultyLevel: 'PRINCIPIANTE', equipmentRequired: 'Polea', logType: 'WEIGHT_REPS', youtubeVideoId: '3v4Zc7iujIk' },
  { name: 'Press Francés con Barra EZ', muscleGroup: 'Brazo', category: 'HIPERTROFIA', exerciseType: 'STRENGTH', difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Barra', logType: 'WEIGHT_REPS', youtubeVideoId: '3v4Zc7iujIk' },
  { name: 'Patada de Tríceps con Mancuerna', muscleGroup: 'Brazo', category: 'HIPERTROFIA', exerciseType: 'STRENGTH', difficultyLevel: 'PRINCIPIANTE', equipmentRequired: 'Mancuernas', logType: 'WEIGHT_REPS', youtubeVideoId: '3v4Zc7iujIk' },
  { name: 'Extensión Tras Nuca con Mancuerna', muscleGroup: 'Brazo', category: 'HIPERTROFIA', exerciseType: 'STRENGTH', difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Mancuernas', logType: 'WEIGHT_REPS', youtubeVideoId: '3v4Zc7iujIk' },

  // --- CARDIO ---
  { name: 'Cinta / Trotadora', muscleGroup: 'Cardio', category: 'RESISTENCIA', exerciseType: 'CARDIO', difficultyLevel: 'PRINCIPIANTE', equipmentRequired: 'Máquina Cardio', logType: 'TIME_DISTANCE', youtubeVideoId: 'nUM5Ix8v0W8' },
  { name: 'Bicicleta Estática', muscleGroup: 'Cardio', category: 'RESISTENCIA', exerciseType: 'CARDIO', difficultyLevel: 'PRINCIPIANTE', equipmentRequired: 'Máquina Cardio', logType: 'TIME_DISTANCE', youtubeVideoId: 'nUM5Ix8v0W8' },
  { name: 'Bicicleta de Spinning', muscleGroup: 'Cardio', category: 'RESISTENCIA', exerciseType: 'CARDIO', difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Máquina Cardio', logType: 'TIME_DISTANCE', youtubeVideoId: 'nUM5Ix8v0W8' },
  { name: 'Remo Ergómetro', muscleGroup: 'Cardio', category: 'RESISTENCIA', exerciseType: 'CARDIO', difficultyLevel: 'PRINCIPIANTE', equipmentRequired: 'Máquina Cardio', logType: 'TIME_DISTANCE', youtubeVideoId: 'nUM5Ix8v0W8' },
  { name: 'Elíptica', muscleGroup: 'Cardio', category: 'RESISTENCIA', exerciseType: 'CARDIO', difficultyLevel: 'PRINCIPIANTE', equipmentRequired: 'Máquina Cardio', logType: 'TIME_DISTANCE', youtubeVideoId: 'nUM5Ix8v0W8' },
  { name: 'Escaladora (Stairmaster)', muscleGroup: 'Cardio', category: 'RESISTENCIA', exerciseType: 'CARDIO', difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Máquina Cardio', logType: 'TIME_ONLY', youtubeVideoId: 'nUM5Ix8v0W8' },
  { name: 'Salto a la Comba', muscleGroup: 'Cardio', category: 'RESISTENCIA', exerciseType: 'CARDIO', difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Comba', logType: 'TIME_ONLY', youtubeVideoId: 'nUM5Ix8v0W8' },

  // --- HIIT, CORE Y FUNCIONAL ---
  { name: 'Burpees', muscleGroup: 'HIIT', category: 'RESISTENCIA', exerciseType: 'CARDIO', difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Peso Corporal', logType: 'REPS_ONLY', youtubeVideoId: 'EdeBTHMFLKY' },
  { name: 'Saltos al Cajón (Box Jumps)', muscleGroup: 'HIIT', category: 'POTENCIA', exerciseType: 'STRENGTH', difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Cajón', logType: 'REPS_ONLY', youtubeVideoId: 'H5VYU6t_w9o' },
  { name: 'Kettlebell Swing', muscleGroup: 'HIIT', category: 'POTENCIA', exerciseType: 'STRENGTH', difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Kettlebell', logType: 'WEIGHT_REPS', youtubeVideoId: '8tTKm-3wX5s' },
  { name: 'Mountain Climbers', muscleGroup: 'HIIT', category: 'RESISTENCIA', exerciseType: 'CARDIO', difficultyLevel: 'PRINCIPIANTE', equipmentRequired: 'Peso Corporal', logType: 'TIME_ONLY', youtubeVideoId: 'EdeBTHMFLKY' },
  { name: 'Jumping Jacks', muscleGroup: 'HIIT', category: 'RESISTENCIA', exerciseType: 'CARDIO', difficultyLevel: 'PRINCIPIANTE', equipmentRequired: 'Peso Corporal', logType: 'TIME_ONLY', youtubeVideoId: 'EdeBTHMFLKY' },
  { name: 'Battle Ropes', muscleGroup: 'HIIT', category: 'POTENCIA', exerciseType: 'STRENGTH', difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Cuerdas', logType: 'TIME_ONLY', youtubeVideoId: 'EdeBTHMFLKY' },
  { name: 'Plancha Abdominal (Plank)', muscleGroup: 'Core', category: 'RESISTENCIA', exerciseType: 'STRENGTH', difficultyLevel: 'PRINCIPIANTE', equipmentRequired: 'Peso Corporal', logType: 'TIME_ONLY', youtubeVideoId: 'WXGBYjIOcN4' },
  { name: 'Plancha Lateral', muscleGroup: 'Core', category: 'RESISTENCIA', exerciseType: 'STRENGTH', difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Peso Corporal', logType: 'TIME_ONLY', youtubeVideoId: 'WXGBYjIOcN4' },
  { name: 'Crunches (Encogimientos)', muscleGroup: 'Core', category: 'HIPERTROFIA', exerciseType: 'STRENGTH', difficultyLevel: 'PRINCIPIANTE', equipmentRequired: 'Peso Corporal', logType: 'REPS_ONLY', youtubeVideoId: 'EdeBTHMFLKY' },
  { name: 'Crunches en Polea Alta', muscleGroup: 'Core', category: 'HIPERTROFIA', exerciseType: 'STRENGTH', difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Polea', logType: 'WEIGHT_REPS', youtubeVideoId: 'EdeBTHMFLKY' },
  { name: 'Rueda Abdominal (Ab Wheel)', muscleGroup: 'Core', category: 'FUERZA', exerciseType: 'STRENGTH', difficultyLevel: 'AVANZADO', equipmentRequired: 'Rueda Abdominal', logType: 'REPS_ONLY', youtubeVideoId: 'WXGBYjIOcN4' },
  { name: 'Russian Twist (Giros Rusos)', muscleGroup: 'Core', category: 'RESISTENCIA', exerciseType: 'STRENGTH', difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Disco', logType: 'REPS_ONLY', youtubeVideoId: 'u0-X63Fq7LU' },
  { name: 'Elevación de Piernas Tumbado', muscleGroup: 'Core', category: 'HIPERTROFIA', exerciseType: 'STRENGTH', difficultyLevel: 'PRINCIPIANTE', equipmentRequired: 'Peso Corporal', logType: 'REPS_ONLY', youtubeVideoId: 'u0-X63Fq7LU' },
  { name: 'Woodchoppers en Polea', muscleGroup: 'Core', category: 'FUERZA', exerciseType: 'STRENGTH', difficultyLevel: 'INTERMEDIO', equipmentRequired: 'Polea', logType: 'WEIGHT_REPS', youtubeVideoId: 'u0-X63Fq7LU' },
  { name: 'Estiramiento Gato-Camello', muscleGroup: 'Core', category: 'FLEXIBILIDAD', exerciseType: 'FLEXIBILITY', difficultyLevel: 'PRINCIPIANTE', equipmentRequired: 'Ninguno', logType: 'TIME_ONLY', youtubeVideoId: 'WXGBYjIOcN4' }
];
  for (const ex of exercises) {
    await exerciseRepo.save(exerciseRepo.create({ ...ex, isActive: true }));
  }

  const [machineCount] = await qr.query(`SELECT COUNT(*)::int AS cnt FROM machine_inventory`);
  const [userCount] = await qr.query(`SELECT COUNT(*)::int AS cnt FROM users`);
  const [actCount] = await qr.query(`SELECT COUNT(*)::int AS cnt FROM gym_activities`);
  const [schedCount] = await qr.query(`SELECT COUNT(*)::int AS cnt FROM gym_activity_schedules`);
  const duplicates: any[] = await qr.query(`
    SELECT a.gym_id, a.name, COUNT(*) AS dupes
    FROM gym_activities a
    GROUP BY a.gym_id, a.name
    HAVING COUNT(*) > 1
  `);

  const instructorsAssigned = await qr.query(`
    SELECT DISTINCT u.email, ur.gym_id as instr_gym_id, a.gym_id as act_gym_id
    FROM gym_activity_schedules gas
    JOIN users u ON u.id = gas.instructor_id
    JOIN user_roles ur ON ur.user_id = u.id
    JOIN gym_activities a ON a.id = gas.gym_activity_id
    WHERE ur.gym_id != a.gym_id
  `);

  const invalidMachineStatus = await qr.query(`
    SELECT status, count(*) FROM machine_inventory
    WHERE status NOT IN ('AVAILABLE', 'MAINTENANCE')
    GROUP BY status
  `);

  await qr.release();
  await dataSource.destroy();

  console.log('Seeder completed successfully');
  console.log(`Machines: ${machineCount.cnt}`);
  console.log(`Users: ${userCount.cnt}`);
  console.log(`Activities: ${actCount.cnt}`);
  console.log(`Schedules: ${schedCount.cnt}`);

  if (duplicates.length > 0) {
    console.error('Errors: Duplicates found!', duplicates);
  } else {
    console.log('Validation passed: No duplicate activities per branch');
  }

  if (instructorsAssigned.length > 0) {
    console.error('Errors: Instructors assigned to schedules in different branch!', instructorsAssigned);
  } else {
    console.log('Validation passed: All scheduled services have an instructor from the same branch');
  }

  if (invalidMachineStatus.length > 0) {
    console.error('Errors: Invalid machine status found!', invalidMachineStatus);
  } else {
    console.log('Validation passed: All machines have valid states (AVAILABLE or MAINTENANCE)');
  }

  process.exit(0);
}

runSeed().catch(err => {
  console.error(err);
  process.exit(1);
});
