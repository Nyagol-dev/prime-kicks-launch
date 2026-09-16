// postgres.js connection pool — server-side only.
// Import only in .server.ts files or inside server functions.
import postgres from 'postgres';

const DATABASE_URL = process.env['DATABASE_URL'];

if (!DATABASE_URL) {
  throw new Error('Missing DATABASE_URL environment variable');
}

// Single connection pool for the entire process.
// postgres() is lazy — it doesn't open connections until the first query.
const sql = postgres(DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  ssl: process.env['DATABASE_SSL'] === 'false' ? false : { rejectUnauthorized: false },
});

export default sql;
