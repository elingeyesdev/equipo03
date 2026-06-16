// src/scripts/reset-exercises.ts
// Elimina ejercicios y datos dependientes para re-seedear en limpio.
// Ejecutar: npm run db:clean-exercises   →   luego: npm run db:seed
import { AppDataSource } from '../config/data-source.cli';

async function resetExercises() {
  console.log('🧹 Limpiando ejercicios y datos relacionados...');

  const dataSource = await AppDataSource.initialize();
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // Orden: de hijos a padres para respetar FKs
    await queryRunner.query('DELETE FROM workout_sets');
    await queryRunner.query('DELETE FROM workout_sessions');
    await queryRunner.query('DELETE FROM routine_exercises');
    await queryRunner.query('DELETE FROM exercise_catalog');

    // Reset sequences al inicio para que el seeder empiece desde 1
    const tables = ['workout_sets', 'workout_sessions', 'routine_exercises', 'exercise_catalog'];
    for (const t of tables) {
      await queryRunner.query(
        `SELECT setval(pg_get_serial_sequence('"${t}"', 'id'), 1, false)`,
      );
    }

    await queryRunner.commitTransaction();
    console.log('✅ Limpieza completa.');
    console.log('   → Ejecuta ahora: npm run db:seed');
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('❌ Error durante la limpieza:', error);
    process.exit(1);
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }
}

resetExercises();
