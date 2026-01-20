import { NextResponse } from "next/server";
import { initServer, db } from "../../../../lib/initServer";
import { getRedis } from "../../../../lib/Redis/redis";
import { getCurrentDateTime } from "../../../../utils/Variables/getDateTime.util";
import getHeartbeatRedisKey from "../../../../utils/Redis/getHeartbeatRedisKey";
import { REDIS_HEARTBEAT_TTL } from "../../../../utils/Redis/redisTTL";
import { HeartbeatResponseDTO } from "../../../../types/DTO/Heartbeat.DTO";

/**
 * @brief Health check endpoint to keep MySQL and Redis connections active
 *
 * @description
 * This endpoint performs basic connectivity checks to:
 * - Initialize server connections
 * - Ping MySQL database to keep connection alive
 * - Ping Redis to maintain active connection
 * - Prevent cloud services from going idle
 */
export async function GET(): Promise<NextResponse> {
  try {
    await initServer();
    const pool = db();
    const redis = getRedis();
    const now = getCurrentDateTime();
    await pool.query("SELECT 1");
    await pool.execute(`
            CREATE TABLE IF NOT EXISTS heartbeat (
                id INT PRIMARY KEY AUTO_INCREMENT,
                timestamp VARCHAR(30) DEFAULT NULL,
                service VARCHAR(50)
            )
        `);

    await pool.execute(
      "INSERT INTO heartbeat (service, timestamp) VALUES (?, ?)",
      ["health-check", now]
    );

    await pool.execute(`
            DELETE FROM heartbeat 
            WHERE id NOT IN (
                SELECT id FROM (
                    SELECT id FROM heartbeat 
                    ORDER BY timestamp DESC 
                    LIMIT 10
                ) AS latest
            )
        `);

    await redis.ping();
    await redis.set(getHeartbeatRedisKey(), new Date().toISOString(), {
      ex: REDIS_HEARTBEAT_TTL,
    });

    return NextResponse.json<HeartbeatResponseDTO>({
      success: true,
      message: "Heartbeat successful - MySQL and Redis connections active",
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("Heartbeat error:", error);

    return NextResponse.json<HeartbeatResponseDTO>(
      {
        success: false,
        message: "Heartbeat failed - connection issues detected",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
