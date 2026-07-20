import "server-only";

import { Pool, type PoolClient, type QueryResultRow } from "pg";

const globalForDatabase = globalThis as typeof globalThis & {
  snctDatabasePool?: Pool;
};

function createPool() {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    max: Number(process.env.SNCT_DATABASE_POOL_SIZE ?? 10),
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
    ssl:
      process.env.DATABASE_SSL === "require"
        ? {
            rejectUnauthorized:
              process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false",
          }
        : undefined,
  });
}

export const db = globalForDatabase.snctDatabasePool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalForDatabase.snctDatabasePool = db;
}

export function assertDatabaseConfigured() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL não foi configurada. Execute as migrações PostgreSQL antes de iniciar o portal.",
    );
  }
}

export async function query<T extends QueryResultRow>(
  text: string,
  values: unknown[] = [],
) {
  assertDatabaseConfigured();
  return db.query<T>(text, values);
}

export async function transaction<T>(
  operation: (client: PoolClient) => Promise<T>,
) {
  assertDatabaseConfigured();
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const result = await operation(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
