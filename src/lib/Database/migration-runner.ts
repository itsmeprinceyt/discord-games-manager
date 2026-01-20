/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from "fs";
import path from "path";
import type { Pool, PoolConnection } from "mysql2/promise";
import { setupIndexes } from "./createIndexs";
import MIGRATIONS_TABLE_SQL from "./Queries/migration.queries";
import { getProduction } from "../../utils/Variables/getProduction.util";
import { getCurrentDateTime } from "../../utils/Variables/getDateTime.util";

/**
 * @brief Executes pending database migrations and ensures indexing is set up.
 *
 * Process:
 * 1. Ensures the `migrations` tracking table exists.
 * 2. Reads all `.sql` files from the `Migrations` directory (sorted in ascending order).
 * 3. Skips any migrations already recorded in the `migrations` table.
 * 4. Applies new migration SQL files in order and logs their application.
 * 5. Calls `setupIndexes` to create or drop indexes based on environment and schema needs.
 *
 * Notes:
 * - The `Migrations` directory will be created if it does not exist.
 * - Migration files must have a `.sql` extension and contain valid SQL statements.
 * - In production, `setupIndexes` will only create missing indexes; in development, it may drop and recreate them.
 */
export async function runMigrations(pool: Pool) {
  const migrationsDir = path.join(
    process.cwd(),
    "src",
    "lib",
    "Database",
    "Migrations"
  );

  if (!fs.existsSync(migrationsDir)) {
    console.warn(
      `[MIGRATION] Directory not found : ${migrationsDir} — creating it`
    );
    fs.mkdirSync(migrationsDir, { recursive: true });
  }

  const conn: PoolConnection = await pool.getConnection();

  try {
    await conn.query(MIGRATIONS_TABLE_SQL);

    const [rows] = await conn.query("SELECT filename FROM migrations");
    const applied = new Set((rows as any[]).map((r) => r.filename));

    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.toLowerCase().endsWith(".sql"))
      .sort();

    for (const file of files) {
      if (applied.has(file)) continue;

      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
      console.log(`[MIGRATION] Applying : ${file}...`);
      await conn.query(sql);
      const now = getCurrentDateTime();
      await conn.query(
        "INSERT INTO migrations (filename, applied_at) VALUES (?, ?)",
        [file, now]
      );
      console.log(`[MIGRATION] Applied : ${file}`);
    }

    console.log(`[MIGRATION] ✅ All migrations processed.`);

    const isProduction: boolean = getProduction();
    await setupIndexes(pool, isProduction);
  } finally {
    conn.release();
  }
}
