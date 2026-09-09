/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { initServer, db } from "../../../lib/initServer";
import { getRedis } from "../../../lib/Redis/redis";
import getPublicStatsRedisKey from "../../../utils/Redis/getPublicStatsRedisKey";
import { PUBLIC_STATS_TTL } from "../../../utils/Redis/redisTTL";

export async function GET() {
  try {
    const redis = getRedis();
    const cacheKey = getPublicStatsRedisKey();

    const cached = await redis.get<any>(cacheKey);
    if (cached) {
      return NextResponse.json({ success: true, data: cached });
    }

    await initServer();
    const pool = db();

    const [totalUsers] = await pool.execute<any[]>(
      "SELECT COUNT(*) as count FROM users",
    );

    const responseData = {
      total_users: totalUsers[0].count,
    };

    await redis.set(cacheKey, responseData, { ex: PUBLIC_STATS_TTL });

    return NextResponse.json({ success: true, data: responseData });
  } catch (error: unknown) {
    console.error("Public stats error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
