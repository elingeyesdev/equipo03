/**
 * GYMSYNC — Script de Reset de Base de Datos
 * ─────────────────────────────────────────────
 * Ejecuta: npx ts-node src/scripts/reset-db.ts
 *
 * Hace DROP SCHEMA CASCADE y recrea el schema público.
 * Después de ejecutar esto, inicia NestJS normalmente y
 * TypeORM (synchronize: true) creará las 33 tablas limpias.
 */
import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function resetDatabase() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '12345',
    database: process.env.DB_DATABASE || 'bdd_gym_sync',
  });

  try {
    await client.connect();
    console.log('✅ Conectado a PostgreSQL');

    console.log('🗑️  Ejecutando DROP SCHEMA public CASCADE...');
    await client.query('DROP SCHEMA public CASCADE;');

    console.log('🔨 Recreando schema public...');
    await client.query('CREATE SCHEMA public;');
    await client.query('GRANT ALL ON SCHEMA public TO postgres;');
    await client.query('GRANT ALL ON SCHEMA public TO public;');

    console.log(`
  ╔══════════════════════════════════════════════════════╗
  ║  ✅  Base de datos reseteada exitosamente            ║
  ║──────────────────────────────────────────────────────║
  ║  Todas las tablas anteriores fueron eliminadas.      ║
  ║  Ahora ejecuta: npm run start:dev                   ║
  ║  TypeORM creará las 33 tablas nuevas automáticamente ║
  ╚══════════════════════════════════════════════════════╝
    `);
  } catch (error) {
    console.error('❌ Error al resetear la base de datos:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

resetDatabase();
