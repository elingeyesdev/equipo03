const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: '12345',
  database: 'bdd_gym_sync',
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL database successfully.');

    const tables = ['roles', 'gyms', 'users'];
    for (const table of tables) {
      console.log(`Fixing sequence for table: ${table}...`);
      const query = `SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE(max(id), 1)) FROM ${table};`;
      const res = await client.query(query);
      console.log(`Successfully set sequence for ${table} to:`, res.rows[0].setval);
    }
  } catch (err) {
    console.error('Error fixing sequences:', err);
  } finally {
    await client.end();
  }
}

run();
