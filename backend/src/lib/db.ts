import {
  createPool,
  type Pool,
  type PoolConnection,
  type ResultSetHeader,
  type RowDataPacket,
} from "mysql2/promise";

const globalForDatabase = globalThis as typeof globalThis & {
  snctDatabasePool?: Pool;
};

function createDatabasePool() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL não foi configurada.");
  }

  return createPool({
    uri: url,
    connectionLimit: Number(process.env.SNCT_DATABASE_POOL_SIZE ?? 10),
    waitForConnections: true,
  });
}

export const db = globalForDatabase.snctDatabasePool ?? createDatabasePool();

if (process.env.NODE_ENV !== "production") {
  globalForDatabase.snctDatabasePool = db;
}

export type QueryResultRow = Record<string, unknown>;
export type DbClient = Pool | PoolConnection;

export function assertDatabaseConfigured() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL não foi configurada. Configure o MySQL antes de iniciar o portal.",
    );
  }
}

export function toMysqlPlaceholders(sql: string) {
  return sql
    .replace(/::jsonb/gi, "")
    .replace(/::text\[\]/gi, "")
    .replace(/::text/gi, "")
    .replace(/::int/gi, "")
    .replace(/\$\d+/g, "?");
}

async function runQuery<T>(
  target: DbClient,
  text: string,
  values: unknown[] = [],
) {
  const [rows] = await target.query(
    toMysqlPlaceholders(text),
    values as (string | number | boolean | Date | null | Buffer)[],
  );
  const list = Array.isArray(rows) ? (rows as RowDataPacket[]) : [];
  return {
    rows: list as T[],
    rowCount: list.length,
  };
}

export async function query<T = QueryResultRow>(
  text: string,
  values: unknown[] = [],
) {
  assertDatabaseConfigured();
  return runQuery<T>(db, text, values);
}

export async function clientQuery<T = QueryResultRow>(
  client: PoolConnection,
  text: string,
  values: unknown[] = [],
) {
  return runQuery<T>(client, text, values);
}

export async function execute(text: string, values: unknown[] = []) {
  assertDatabaseConfigured();
  const [result] = await db.execute(
    toMysqlPlaceholders(text),
    values as (string | number | boolean | Date | null | Buffer)[],
  );
  return result as ResultSetHeader;
}

export async function clientExecute(
  client: PoolConnection,
  text: string,
  values: unknown[] = [],
) {
  const [result] = await client.execute(
    toMysqlPlaceholders(text),
    values as (string | number | boolean | Date | null | Buffer)[],
  );
  return result as ResultSetHeader;
}

export async function transaction<T>(
  operation: (client: PoolConnection) => Promise<T>,
) {
  assertDatabaseConfigured();
  const client = await db.getConnection();
  try {
    await client.beginTransaction();
    const result = await operation(client);
    await client.commit();
    return result;
  } catch (error) {
    await client.rollback();
    throw error;
  } finally {
    client.release();
  }
}
