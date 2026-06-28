import { AppDataSource } from '../config/data-source.cli';

async function run() {
  const dataSource = await AppDataSource.initialize();

  const orphanCount: { count: string }[] = await dataSource.query(`
    SELECT COUNT(*) AS count
    FROM gym_activity_schedules
    WHERE gym_activity_id IN (
      SELECT id FROM gym_activities WHERE is_active = false
    )
  `);
  const total = Number(orphanCount[0]?.count ?? 0);
  console.log(`[cleanup] Horarios huerfanos detectados: ${total}`);

  if (total === 0) {
    console.log('[cleanup] Nada que limpiar — la base de datos ya esta en estado consistente.');
    await dataSource.destroy();
    return;
  }

  // Eliminar asistencias de los horarios huerfanos primero (integridad referencial)
  const attResult = await dataSource.query(`
    DELETE FROM gym_activity_attendance
    WHERE gym_activity_schedule_id IN (
      SELECT id FROM gym_activity_schedules
      WHERE gym_activity_id IN (
        SELECT id FROM gym_activities WHERE is_active = false
      )
    )
  `);
  console.log(`[cleanup] Asistencias eliminadas: ${attResult[1] ?? 'n/a'}`);

  // Eliminar los horarios huerfanos
  const schedResult = await dataSource.query(`
    DELETE FROM gym_activity_schedules
    WHERE gym_activity_id IN (
      SELECT id FROM gym_activities WHERE is_active = false
    )
  `);
  console.log(`[cleanup] Horarios huerfanos eliminados: ${schedResult[1] ?? 'n/a'}`);

  // Verificacion post-ejecucion
  const remaining: { count: string }[] = await dataSource.query(`
    SELECT COUNT(*) AS count
    FROM gym_activity_schedules
    WHERE gym_activity_id IN (
      SELECT id FROM gym_activities WHERE is_active = false
    )
  `);
  const leftover = Number(remaining[0]?.count ?? 0);
  if (leftover === 0) {
    console.log('[cleanup] CONFIRMADO: base de datos en estado consistente — cero horarios huerfanos.');
  } else {
    console.error(`[cleanup] ERROR: quedan ${leftover} horarios huerfanos. Revisa permisos o constraints.`);
    process.exitCode = 1;
  }

  await dataSource.destroy();
}

run().catch((err) => {
  console.error('[cleanup] Error fatal:', err);
  process.exit(1);
});
