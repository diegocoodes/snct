import process from "node:process";
import mysql from "mysql2/promise";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não foi configurada.");
}

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  connectionLimit: 5,
});

const connection = await pool.getConnection();
try {
  await connection.beginTransaction();

  const [expiredVisitors] = await connection.query(
    `
    DELETE FROM auth_users
    WHERE role = 'visitor'
      AND id IN (
        SELECT user_id FROM (
          SELECT user_id FROM snct_profiles
          WHERE retention_expires_at <= NOW(3)
        ) AS expired
      )
  `,
  );

  const [staleUnverified] = await connection.query(
    `
    DELETE FROM auth_users
    WHERE \`emailVerified\` = false
      AND \`createdAt\` < DATE_SUB(NOW(3), INTERVAL 48 HOUR)
  `,
  );

  await connection.query(`DELETE FROM auth_sessions WHERE \`expiresAt\` <= NOW(3)`);
  await connection.query(
    `DELETE FROM auth_verifications WHERE \`expiresAt\` <= NOW(3)`,
  );
  await connection.query(`DELETE FROM snct_rate_limits WHERE expires_at <= NOW(3)`);
  await connection.query(`
    DELETE FROM snct_notice_documents
    WHERE notice_id IS NULL AND created_at < DATE_SUB(NOW(3), INTERVAL 1 HOUR)
  `);
  await connection.query(`
    DELETE FROM snct_audit_logs
    WHERE created_at < DATE_SUB(NOW(3), INTERVAL 2 YEAR)
  `);
  await connection.commit();

  const expiredCount =
    typeof expiredVisitors === "object" &&
    expiredVisitors &&
    "affectedRows" in expiredVisitors
      ? Number(expiredVisitors.affectedRows)
      : 0;
  const staleCount =
    typeof staleUnverified === "object" &&
    staleUnverified &&
    "affectedRows" in staleUnverified
      ? Number(staleUnverified.affectedRows)
      : 0;

  console.log(
    `Limpeza concluída: ${expiredCount} visitantes expirados e ${staleCount} cadastros não verificados removidos.`,
  );
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
  await pool.end();
}
