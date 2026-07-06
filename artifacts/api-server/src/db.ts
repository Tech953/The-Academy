import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../shared/schema';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.warn(
    '[DB] DATABASE_URL is not set. Using in-memory storage — ' +
    'player data (characters, saves, progress) will not persist across server restarts. ' +
    'Set DATABASE_URL to a PostgreSQL connection string to enable persistence.'
  );
}

export const db = DATABASE_URL
  ? drizzle(neon(DATABASE_URL), { schema })
  : null;

export const isDatabaseAvailable = !!DATABASE_URL;
