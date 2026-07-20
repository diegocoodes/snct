import process from "node:process";
import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não foi configurada.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.DATABASE_SSL === "require"
      ? {
          rejectUnauthorized:
            process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false",
        }
      : undefined,
});

const client = await pool.connect();
try {
  await client.query("BEGIN");
  const expiredVisitors = await client.query(`
    DELETE FROM auth_users
    WHERE role = 'visitor'
      AND id IN (
        SELECT user_id FROM snct_profiles
        WHERE retention_expires_at <= now()
      )
    RETURNING id
  `);
  const staleUnverified = await client.query(`
    DELETE FROM auth_users
    WHERE "emailVerified" = false
      AND "createdAt" < now() - interval '48 hours'
    RETURNING id
  `);
  await client.query(`DELETE FROM auth_sessions WHERE "expiresAt" <= now()`);
  await client.query(
    `DELETE FROM auth_verifications WHERE "expiresAt" <= now()`,
  );
  await client.query(`DELETE FROM snct_rate_limits WHERE expires_at <= now()`);
  await client.query(`
    DELETE FROM snct_notice_documents
    WHERE notice_id IS NULL AND created_at < now() - interval '1 hour'
  `);
  await client.query(`
    DELETE FROM snct_audit_logs
    WHERE created_at < now() - interval '2 years'
  `);
  await client.query("COMMIT");
  console.log(
    `Limpeza concluída: ${expiredVisitors.rowCount} visitantes expirados e ${staleUnverified.rowCount} cadastros não verificados removidos.`,
  );
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}
