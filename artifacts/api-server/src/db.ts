/**
 * Compatibility exports for API code that needs the shared database client.
 *
 * Database initialization belongs to @workspace/db so schema, driver, and
 * connection handling stay in one package. This module intentionally contains
 * no second driver implementation.
 */
export { db, pool } from "@workspace/db";

export const isDatabaseAvailable = Boolean(process.env.DATABASE_URL);