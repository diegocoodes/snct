import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL não foi configurada.");
}

const pool = new Pool({
  connectionString,
  ssl:
    process.env.DATABASE_SSL === "require"
      ? {
          rejectUnauthorized:
            process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false",
        }
      : undefined,
});

const migrationsDirectory = path.join(process.cwd(), "db", "migrations");
const client = await pool.connect();

try {
  await client.query("SELECT pg_advisory_lock(736282026)");
  await client.query(`
    CREATE TABLE IF NOT EXISTS snct_migrations (
      filename text PRIMARY KEY,
      checksum text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  const files = (await readdir(migrationsDirectory))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const filename of files) {
    const sql = await readFile(
      path.join(migrationsDirectory, filename),
      "utf8",
    );
    const checksum = createHash("sha256").update(sql).digest("hex");
    const existing = await client.query(
      "SELECT checksum FROM snct_migrations WHERE filename = $1",
      [filename],
    );

    if (existing.rows[0]) {
      if (existing.rows[0].checksum !== checksum) {
        throw new Error(`A migração já aplicada foi alterada: ${filename}`);
      }
      console.log(`ignorada ${filename}`);
      continue;
    }

    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query(
        "INSERT INTO snct_migrations (filename, checksum) VALUES ($1, $2)",
        [filename, checksum],
      );
      await client.query("COMMIT");
      console.log(`aplicada ${filename}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }
} finally {
  await client.query("SELECT pg_advisory_unlock(736282026)").catch(() => {});
  client.release();
  await pool.end();
}
