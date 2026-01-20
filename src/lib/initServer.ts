import { initializeDatabase } from "./Database/init";
import { getDbPool } from "./Database/init";
import { getProduction } from "../utils/Variables/getProduction.util";

let initializedPromise: Promise<void> | null = null;

/**
 * @brief Initializes the server by setting up the database connection and running any necessary migrations.
 * - Ensures that initialization is only performed **once** per application lifecycle.
 * - Stores the initialization promise so concurrent calls will wait for the same process.
 */
export async function initServer() {
  if (!initializedPromise) {
    initializedPromise = (async () => {
      await initializeDatabase();
      const isProduction: boolean = getProduction();
      console.log("[READY] ✅ Database initialized");
      console.log(
        `[ENVIRONMENT] ${isProduction ? "✅ Production" : "👩‍💻 Development"}`
      );
    })();
  }
  return initializedPromise;
}

/**
 * @brief Retrieves the current database connection pool.
 * - Assumes `initServer()` has been called before use, so the pool is already initialized.
 * - Provides a reusable connection pool for queries throughout the application.
 */
export function db() {
  return getDbPool();
}
