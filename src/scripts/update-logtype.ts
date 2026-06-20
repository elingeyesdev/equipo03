import { AppDataSource } from '../config/data-source.cli';

async function updateDB() {
  const ds = await AppDataSource.initialize(); 
  await ds.query(`UPDATE exercises SET log_type = 'TIME_DISTANCE' WHERE category = 'CARDIO'`);
  await ds.query(`UPDATE exercises SET log_type = 'REPS_ONLY' WHERE name IN ('Push-ups (Flexiones)', 'Dominadas (Pull-ups)', 'Elevación de Piernas Colgado', 'Crunch Abdominal', 'Plancha (Plank)')`);
  console.log("DB updated successfully");
  await ds.destroy();
}

updateDB().catch(console.error);
