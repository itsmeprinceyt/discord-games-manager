/* eslint-disable @typescript-eslint/no-explicit-any */

import mysql from "mysql2/promise";
import { getProduction } from "../../utils/Variables/getProduction.util";

const isProduction: boolean = getProduction();

export const dbName = isProduction
  ? process.env.PROD_DB_NAME!
  : process.env.LOCAL_DB_NAME!;
const dbHost = isProduction
  ? process.env.PROD_DB_HOST!
  : process.env.LOCAL_DB_HOST!;
const dbUser = isProduction
  ? process.env.PROD_DB_USER!
  : process.env.LOCAL_DB_USER!;
const dbPass = isProduction
  ? process.env.PROD_DB_PASS!
  : process.env.LOCAL_DB_PASS!;

const dbPort = isProduction
  ? process.env.PROD_DB_PORT
    ? parseInt(process.env.PROD_DB_PORT)
    : 3306
  : process.env.LOCAL_DB_PORT
  ? parseInt(process.env.LOCAL_DB_PORT)
  : 3306;

/**
 * @brief Ensures the target database exists in the MySQL server.
 *
 * - Connects to the MySQL server without specifying a database.
 * - Checks if the database (`dbName`) exists.
 * - Creates the database if it does not exist.
 * - Logs whether the database was created or already present.
 * - Terminate the application if the MySQL connection fails.
 */
export async function ensureDatabaseExists() {
  try {
    const connection = await mysql.createConnection({
      host: dbHost,
      user: dbUser,
      password: dbPass,
      port: dbPort,
    });

    const [rows] = await connection.query(`SHOW DATABASES LIKE ?`, [dbName]);

    if ((rows as any[]).length === 0) {
      await connection.query(`CREATE DATABASE \`${dbName}\``);
      console.log(`[READY] ✅ Database Created : '${dbName}'`);
    } else {
      console.log(`[READY] ✅ Database Already Exists : '${dbName}'`);
    }

    await connection.end();
  } catch (err) {
    console.error(`[FAILED] Failed to connect to MySQL :`, err);
    process.exit(1);
  }
}

/**
 * @brief Creates and returns a MySQL connection pool for executing queries.
 * - Uses the correct credentials depending on whether the app is in **production** or **dev** mode.
 * - Configured with:
 *   - `waitForConnections: true` (queue new connections until one is available)
 *   - `connectionLimit: 10` (max simultaneous connections)
 *   - `queueLimit: 0` (no limit on queued connections)
 *   - `multipleStatements: true` (allow multiple SQL statements per query) for migrations
 *   - Terminate the application if the MySQL connection fails.
 */
export function createPool() {
  try {
    return mysql.createPool({
      host: dbHost,
      user: dbUser,
      password: dbPass,
      database: dbName,
      port: dbPort,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      multipleStatements: true,
    });
  } catch (err: unknown) {
    console.error(`[FAILED] Connection to database failed : `, err);
    process.exit(1);
  }
}
