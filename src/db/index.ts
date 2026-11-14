import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const isDbConfigured = Boolean(databaseUrl);

export const pool = databaseUrl
  ? (globalForDb.__arenaNextJsPostgresqlPool ??
      new Pool({
        connectionString: databaseUrl,
      }))
  : (globalForDb.__arenaNextJsPostgresqlPool ??
      new Pool({
        connectionString: "postgres://dummy:dummy@127.0.0.1:5432/dummy",
      }));

if (process.env.NODE_ENV !== "production" && databaseUrl) {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);
