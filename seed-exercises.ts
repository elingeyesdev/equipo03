import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

const appDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'gym_sync',
});

const exercises = [
  { name: 'Press de Banca', muscleGroup: 'Pecho', difficultyLevel: 'INTERMEDIO' },
  { name: 'Press Inclinado', muscleGroup: 'Pecho', difficultyLevel: 'INTERMEDIO' },
  { name: 'Aperturas con Mancuernas', muscleGroup: 'Pecho', difficultyLevel: 'PRINCIPIANTE' },
  { name: 'Fondos en Paralelas', muscleGroup: 'Pecho', difficultyLevel: 'INTERMEDIO' },
  { name: 'Sentadilla', muscleGroup: 'Pierna', difficultyLevel: 'INTERMEDIO' },
  { name: 'Prensa de Piernas', muscleGroup: 'Pierna', difficultyLevel: 'PRINCIPIANTE' },
  { name: 'Extensión de Cuádriceps', muscleGroup: 'Pierna', difficultyLevel: 'PRINCIPIANTE' },
  { name: 'Curl de Femoral', muscleGroup: 'Pierna', difficultyLevel: 'PRINCIPIANTE' },
  { name: 'Peso Muerto Rumano', muscleGroup: 'Pierna', difficultyLevel: 'INTERMEDIO' },
  { name: 'Dominadas', muscleGroup: 'Espalda', difficultyLevel: 'AVANZADO' },
  { name: 'Dominadas Asistidas', muscleGroup: 'Espalda', difficultyLevel: 'PRINCIPIANTE' },
  { name: 'Remo con Barra', muscleGroup: 'Espalda', difficultyLevel: 'INTERMEDIO' },
  { name: 'Jalón al Pecho', muscleGroup: 'Espalda', difficultyLevel: 'PRINCIPIANTE' },
  { name: 'Peso Muerto Convencional', muscleGroup: 'Espalda', difficultyLevel: 'AVANZADO' },
  { name: 'Press Militar', muscleGroup: 'Hombro', difficultyLevel: 'INTERMEDIO' },
  { name: 'Elevaciones Laterales', muscleGroup: 'Hombro', difficultyLevel: 'PRINCIPIANTE' },
  { name: 'Face Pull', muscleGroup: 'Hombro', difficultyLevel: 'PRINCIPIANTE' },
  { name: 'Curl de Bíceps', muscleGroup: 'Brazo', difficultyLevel: 'PRINCIPIANTE' },
  { name: 'Extensión de Tríceps', muscleGroup: 'Brazo', difficultyLevel: 'PRINCIPIANTE' },
  { name: 'Curl Martillo', muscleGroup: 'Brazo', difficultyLevel: 'PRINCIPIANTE' },
  { name: 'Cinta / Trotadora', muscleGroup: 'Cardio', difficultyLevel: 'PRINCIPIANTE' },
  { name: 'Bicicleta Estática', muscleGroup: 'Cardio', difficultyLevel: 'PRINCIPIANTE' },
  { name: 'Remo Ergómetro', muscleGroup: 'Cardio', difficultyLevel: 'PRINCIPIANTE' },
  { name: 'Elíptica', muscleGroup: 'Cardio', difficultyLevel: 'PRINCIPIANTE' },
  { name: 'Burpees', muscleGroup: 'HIIT', difficultyLevel: 'INTERMEDIO' },
  { name: 'Saltos al Cajón', muscleGroup: 'HIIT', difficultyLevel: 'INTERMEDIO' },
  { name: 'Kettlebell Swing', muscleGroup: 'HIIT', difficultyLevel: 'INTERMEDIO' },
  { name: 'Mountain Climbers', muscleGroup: 'HIIT', difficultyLevel: 'PRINCIPIANTE' },
  { name: 'Plancha', muscleGroup: 'Core', difficultyLevel: 'PRINCIPIANTE' },
  { name: 'Crunches', muscleGroup: 'Core', difficultyLevel: 'PRINCIPIANTE' },
  { name: 'Rueda Abdominal', muscleGroup: 'Core', difficultyLevel: 'AVANZADO' },
  { name: 'Russian Twist', muscleGroup: 'Core', difficultyLevel: 'INTERMEDIO' },
  { name: 'Fondos libres', muscleGroup: 'Fondos', difficultyLevel: 'INTERMEDIO' },
  { name: 'Fondos Asistidos', muscleGroup: 'Fondos', difficultyLevel: 'PRINCIPIANTE' },
];

async function run() {
  await appDataSource.initialize();
  for (const ex of exercises) {
    try {
      await appDataSource.query(
        `INSERT INTO exercise_catalog (name, muscle_group, difficulty_level) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING`,
        [ex.name, ex.muscleGroup, ex.difficultyLevel]
      );
    } catch (err) {
      console.error(err);
    }
  }
  console.log('Seeded exercises successfully');
  await appDataSource.destroy();
}
run().catch(console.error);
