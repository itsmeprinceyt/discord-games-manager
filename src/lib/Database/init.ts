import { ensureDatabaseExists, createPool } from "./dbconnection";
import { runMigrations } from "./migration-runner";

let poolInstance: ReturnType<typeof createPool> | null = null;

/**
 * @brief Initializes the database connection and runs any pending migrations.
 *
 * - Ensures the target database exists (creates it if missing).
 * - Runs all migrations to bring the schema up to date.
 * - Caches the pool instance so initialization runs only once per process.
 */
export const initializeDatabase = async () => {
  if (poolInstance) return poolInstance;

  await ensureDatabaseExists();
  const pool = createPool();
  await runMigrations(pool);

  poolInstance = pool;
  return poolInstance;
};

/**
 * @brief Retrieves the active MySQL connection pool.
 * - Throws an error if `initializeDatabase` has not been called yet.
 * - To be used for modules that need database access without reinitializing it.
 */
export const getDbPool = () => {
  if (!poolInstance) throw new Error("[ERROR] Database not initialized yet.");
  return poolInstance;
};
