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

async function run() {
  await appDataSource.initialize();
  const res = await appDataSource.query(`SELECT id, name FROM exercise_catalog;`);
  console.log(res);
  await appDataSource.destroy();
}
run().catch(console.error);
