import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import mysql from "mysql2/promise";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL não foi configurada.");
}

const url = new URL(databaseUrl);
const databaseName = url.pathname.replace(/^\//, "") || "snct";

const rootPool = mysql.createPool({
  host: url.hostname || "127.0.0.1",
  port: Number(url.port || 3306),
  user: decodeURIComponent(url.username || "root"),
  password: decodeURIComponent(url.password || ""),
  multipleStatements: false,
});

await rootPool.query(
  `CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
);
await rootPool.end();

const pool = mysql.createPool({
  uri: databaseUrl,
  connectionLimit: 5,
  multipleStatements: true,
});

const connection = await pool.getConnection();
const migrationsDirectory = path.join(process.cwd(), "db", "migrations");

try {
  await connection.query("SELECT GET_LOCK('snct-migrate', 30)");
  await connection.query(`
    CREATE TABLE IF NOT EXISTS snct_migrations (
      filename VARCHAR(255) PRIMARY KEY,
      checksum VARCHAR(128) NOT NULL,
      applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
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
    const [existingRows] = await connection.query(
      "SELECT checksum FROM snct_migrations WHERE filename = ?",
      [filename],
    );
    const existing = Array.isArray(existingRows) ? existingRows[0] : null;

    if (existing) {
      if (existing.checksum !== checksum) {
        throw new Error(`A migração já aplicada foi alterada: ${filename}`);
      }
      console.log(`ignorada ${filename}`);
      continue;
    }

    await connection.beginTransaction();
    try {
      await connection.query(sql);
      await connection.query(
        "INSERT INTO snct_migrations (filename, checksum) VALUES (?, ?)",
        [filename, checksum],
      );
      await connection.commit();
      console.log(`aplicada ${filename}`);
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  }
} finally {
  await connection.query("SELECT RELEASE_LOCK('snct-migrate')").catch(() => {});
  connection.release();
  await pool.end();
}
