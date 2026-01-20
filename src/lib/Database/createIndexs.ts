/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Pool } from "mysql2/promise";
import { createIndexStatements, dropIndexStatements } from "./Index/Indexing";

/**
 * @brief Checks if a specific index exists in the current database schema.
 * @param {Pool} connection - A MySQL connection pool.
 * @param {string} tableName - The table to check for the index.
 * @param {string} indexName - The name of the index to check.
 * @returns {Promise<boolean>} True if the index exists, false otherwise.
 */
async function indexExists(
  connection: Pool,
  tableName: string,
  indexName: string
): Promise<boolean> {
  const [rows] = await connection.query(
    `SELECT COUNT(*) as count
     FROM information_schema.statistics
     WHERE table_schema = DATABASE()
       AND table_name = ?
       AND index_name = ?`,
    [tableName, indexName]
  );
  return (rows as any)[0].count > 0;
}

/**
 * @brief Logs all indexes in the current database schema that have recorded **zero usage**
 * according to MySQL's `performance_schema.table_io_waits_summary_by_index_usage`.
 *
 * - Skips the PRIMARY index.
 * - Requires `performance_schema` to be enabled in MySQL.
 */
async function logUnusedIndexes(connection: Pool) {
  console.log("[INDEX - CHECKING] Detecting unused indexes");

  try {
    const [unusedRows] = await connection.query(
      `
    SELECT 
      s.TABLE_NAME AS table_name,
      s.INDEX_NAME AS index_name,
      COALESCE(stat.COUNT_STAR, 0) AS usage_count
    FROM information_schema.statistics s
    LEFT JOIN performance_schema.table_io_waits_summary_by_index_usage stat
      ON stat.OBJECT_SCHEMA = s.TABLE_SCHEMA
      AND stat.OBJECT_NAME = s.TABLE_NAME
      AND stat.INDEX_NAME = s.INDEX_NAME
    WHERE s.TABLE_SCHEMA = DATABASE()
      AND s.INDEX_NAME != 'PRIMARY'
    ORDER BY s.TABLE_NAME, s.INDEX_NAME;
    `
    );

    const unusedIndexes = (unusedRows as any[]).filter(
      (row) => row.usage_count === 0
    );

    if (unusedIndexes.length > 0) {
      console.warn("[INDEX] Unused indexes detected:");
      unusedIndexes.forEach((row) => {
        console.warn(`  - ${row.table_name}.${row.index_name} → not used`);
      });
    } else {
      console.log("[INDEX] No unused indexes detected.");
    }
  } catch (err: any) {
    console.error(
      "[INDEX] Failed to detect unused indexes:",
      err.message || err
    );
  }
}

/**
 * @brief Ensures that database indexes are in the correct state based on environment mode.
 *
 * **Behavior:**
 * - In **development** (`isProduction = false`): Drops all known indexes from `dropIndexStatements`, then recreates them from `createIndexStatements`.
 * - In **production** (`isProduction = true`): Only creates missing indexes. Skips dropping any existing ones.
 * - Logs the result of each operation, including which indexes were created, skipped, or failed.
 * - After index creation, automatically scans for **unused indexes** and logs them.
 * @param {boolean} isProduction - If true, indexes are only created (not dropped); if false, all are dropped and recreated.
 */
export async function setupIndexes(connection: Pool, isProduction: boolean) {
  console.log("[INDEX] Handling indexes");

  if (!isProduction) {
    console.log("[INDEX] Dropping existing indexes");
    for (const dropStmt of dropIndexStatements) {
      try {
        await connection.query(dropStmt);
        console.log(`[INDEX - DROP] ⚠️ ${dropStmt}`);
      } catch (err: any) {
        console.warn(`[INDEX - DROP] ❌ [ ${dropStmt} ] :`, err.message || err);
      }
    }
  }

  console.log("[INDEX] Creating missing indexes");
  let createdCount = 0;
  let skippedCount = 0;

  for (const createStmt of createIndexStatements) {
    const match = createStmt.match(/CREATE INDEX (\w+) ON (\w+)/i);
    if (match) {
      const indexName = match[1];
      const tableName = match[2];

      if (await indexExists(connection, tableName, indexName)) {
        skippedCount++;
        console.log(
          `[INDEX - SKIP] Index ${indexName} already exists on ${tableName}.`
        );
        continue;
      }
    }

    try {
      await connection.query(createStmt);
      createdCount++;
      console.log(`[INDEX] ✅ ${createStmt}`);
    } catch (err: any) {
      console.warn(`[INDEX] ⚠️ [ ${createStmt} ] :`, err.message || err);
    }
  }

  if (isProduction && createdCount === 0 && skippedCount > 0) {
    console.log("[INDEX - SKIP] All indexes already exist in production.");
  }

  await logUnusedIndexes(connection);
}
