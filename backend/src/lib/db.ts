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

globalForDatabase.snctDatabasePool = db;

export type QueryResultRow = Record<string, unknown>;
export type DbClient = Pool | PoolConnection;

export function assertDatabaseConfigured() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL não foi configurada. Configure o MySQL antes de iniciar o portal.",
    );
  }
}

export function toMysqlPlaceholders(sql: string, values: unknown[] = []) {
  const withoutCasts = sql
    .replace(/::jsonb/gi, "")
    .replace(/::text\[\]/gi, "")
    .replace(/::text/gi, "")
    .replace(/::int/gi, "");

  const orderedValues: unknown[] = [];
  const converted = withoutCasts.replace(/\$(\d+)/g, (_match, group: string) => {
    const index = Number(group) - 1;
    orderedValues.push(values[index]);
    return "?";
  });

  return { sql: converted, values: orderedValues.length ? orderedValues : values };
}

async function runQuery<T>(
  target: DbClient,
  text: string,
  values: unknown[] = [],
) {
  const prepared = toMysqlPlaceholders(text, values);
  const [rows] = await target.query(
    prepared.sql,
    prepared.values as (string | number | boolean | Date | null | Buffer)[],
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
  const prepared = toMysqlPlaceholders(text, values);
  const [result] = await db.execute(
    prepared.sql,
    prepared.values as (string | number | boolean | Date | null | Buffer)[],
  );
  return result as ResultSetHeader;
}

export async function clientExecute(
  client: PoolConnection,
  text: string,
  values: unknown[] = [],
) {
  const prepared = toMysqlPlaceholders(text, values);
  const [result] = await client.execute(
    prepared.sql,
    prepared.values as (string | number | boolean | Date | null | Buffer)[],
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
