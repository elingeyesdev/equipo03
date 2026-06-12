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
  const res = await appDataSource.query(`
    SELECT conname, conrelid::regclass AS table_name, a.attname AS column_name, 
           confrelid::regclass AS foreign_table_name, af.attname AS foreign_column_name 
    FROM pg_attribute af, pg_attribute a, pg_constraint 
    JOIN pg_class ON conrelid = pg_class.oid 
    WHERE conname = 'FK_9a3b700413f3f5c26ee17daabd1' 
      AND confrelid = af.attrelid AND confkey[1] = af.attnum 
      AND conrelid = a.attrelid AND conkey[1] = a.attnum;
  `);
  console.log(res);
  await appDataSource.destroy();
}
run().catch(console.error);
